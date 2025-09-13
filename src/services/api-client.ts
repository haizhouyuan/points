import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

class ApiClient {
  private axios: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors(): void {
    // Request interceptor - simplified for personal use
    this.axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      }
    );

    // Response interceptor - basic error handling
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any): void {
    let message = 'Something went wrong';

    if (error.response?.status === 401) {
      this.clearToken();
      message = 'Please login again';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (!error.response) {
      message = 'Check your internet connection';
    }

    toast.error(message);
  }

  private loadTokenFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.token = token;
    }
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  public getToken(): string | null {
    return this.token;
  }

  // Generic request method
  public async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.request<ApiResponse<T>>(config);
    return response.data.data;
  }

  // Convenience methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  // Upload method for file uploads
  public async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };