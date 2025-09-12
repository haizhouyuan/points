import { TestEnvironment } from '../test-setup';

describe('Authentication API Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  }, 30000);

  afterAll(async () => {
    await testEnv.teardown();
  }, 10000);

  describe('POST /api/v1/auth/register', () => {
    it('should register a new family and parent user successfully', async () => {
      const registrationData = {
        email: 'newparent@test.com',
        password: 'password123',
        name: 'New Parent',
        familyName: 'New Test Family',
        role: 'parent',
        dateOfBirth: '1985-06-15'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(registrationData.email);
      expect(response.body.data.user.role).toBe('parent');
      expect(response.body.data.family.name).toBe(registrationData.familyName);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should register a child user with invite code', async () => {
      const registrationData = {
        email: 'newchild@test.com',
        password: 'password123',
        name: 'New Child',
        role: 'child',
        dateOfBirth: '2012-03-20',
        inviteCode: 'TEST123'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('child');
      expect(response.body.data.user.familyId).toBe(testEnv.testFamilyId);
    });

    it('should reject registration with invalid email', async () => {
      const registrationData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'parent'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should reject duplicate email registration', async () => {
      const registrationData = {
        email: 'parent@test.com', // Already exists
        password: 'password123',
        name: 'Duplicate User',
        role: 'parent'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'parent@test.com',
        password: 'password123'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'parent@test.com',
        password: 'wrongpassword'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await testEnv.request()
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/auth/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('parent@test.com');
      expect(response.body.data.role).toBe('parent');
      expect(response.body.data.familyId).toBe(testEnv.testFamilyId);
    });

    it('should reject request without token', async () => {
      const response = await testEnv.request()
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await testEnv.request()
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Parent Name',
        profile: {
          bio: 'Updated bio for testing'
        },
        preferences: {
          theme: 'dark'
        }
      };

      const response = await testEnv.authenticatedRequest('parent')
        .patch('/api/v1/auth/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.profile.bio).toBe(updateData.profile.bio);
      expect(response.body.data.preferences.theme).toBe(updateData.preferences.theme);
    });

    it('should reject profile update with invalid data', async () => {
      const updateData = {
        email: 'newemail@test.com' // Email should not be updatable
      };

      const response = await testEnv.authenticatedRequest('parent')
        .patch('/api/v1/auth/profile')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/family', () => {
    it('should get family information', async () => {
      const response = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/auth/family')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Family');
      expect(response.body.data.members).toHaveLength(2);
    });

    it('should include family members with proper data', async () => {
      const response = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/auth/family')
        .expect(200);

      const members = response.body.data.members;
      expect(members.some((m: any) => m.role === 'parent')).toBe(true);
      expect(members.some((m: any) => m.role === 'child')).toBe(true);
      expect(members.every((m: any) => m.password === undefined)).toBe(true);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await testEnv.authenticatedRequest('parent')
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logout');
    });
  });

  describe('Password Change Flow', () => {
    it('should change password successfully', async () => {
      const changeData = {
        currentPassword: 'password123',
        newPassword: 'newpassword456'
      };

      const response = await testEnv.authenticatedRequest('parent')
        .patch('/api/v1/auth/change-password')
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await testEnv.request()
        .post('/api/v1/auth/login')
        .send({
          email: 'parent@test.com',
          password: 'newpassword456'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const changeData = {
        currentPassword: 'wrongcurrent',
        newPassword: 'newpassword789'
      };

      const response = await testEnv.authenticatedRequest('parent')
        .patch('/api/v1/auth/change-password')
        .send(changeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});