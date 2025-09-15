import { apiClient } from './api-client';
import { LoginRequest, LoginResponse, RegisterRequest, User } from './types';

export class AuthService {
  private currentUser: User | null = null;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    // Store token and user info
    apiClient.setToken(response.token);
    this.currentUser = response.user;
    this.storeUserData(response.user);
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<{ message: string; user: User }> {
    return apiClient.post('/auth/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.warn('Server logout failed, proceeding with local logout');
    } finally {
      // Clear local storage
      apiClient.clearToken();
      this.currentUser = null;
      this.clearUserData();
    }
  }

  async getCurrentUser(): Promise<User> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get user from server if we have a token
    if (apiClient.getToken()) {
      try {
        const user = await apiClient.get<User>('/auth/me');
        this.currentUser = user;
        this.storeUserData(user);
        return user;
      } catch (error) {
        // Token might be invalid, clear it
        this.logout();
        throw error;
      }
    }

    throw new Error('No authenticated user');
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    apiClient.setToken(response.token);
    return response.token;
  }

  async updateProfile(updates: Partial<User['profile']>): Promise<User> {
    const user = await apiClient.put<User>('/auth/profile', { profile: updates });
    this.currentUser = user;
    this.storeUserData(user);
    return user;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
  }

  async createInviteCode(): Promise<{ inviteCode: string; expiresAt: string }> {
    return apiClient.post('/auth/invite-code');
  }

  async getInviteCodes(): Promise<Array<{ code: string; expiresAt: string; isUsed: boolean }>> {
    return apiClient.get('/auth/invite-codes');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return apiClient.getToken() !== null;
  }

  // Check user role
  isParent(): boolean {
    return this.currentUser?.role === 'parent';
  }

  isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  // Get current user synchronously (returns cached data)
  getCurrentUserSync(): User | null {
    if (!this.currentUser) {
      this.loadUserDataFromStorage();
    }
    return this.currentUser;
  }

  // Get user's family ID
  getFamilyId(): string | null {
    const user = this.getCurrentUserSync();
    return user?.familyId || null;
  }

  private storeUserData(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  private clearUserData(): void {
    localStorage.removeItem('user_data');
  }

  private loadUserDataFromStorage(): void {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.warn('Failed to load user data from storage:', error);
      this.clearUserData();
    }
  }
}

// Export singleton instance
export const authService = new AuthService();