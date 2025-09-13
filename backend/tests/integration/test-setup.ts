import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { EventBus } from '@shared/events/event-bus';
import { APIGateway } from '@gateway/api-gateway';
import { User } from '@modules/auth/models/user.model';
import { Family } from '@modules/auth/models/family.model';
import jwt from 'jsonwebtoken';

export class TestEnvironment {
  public app: express.Application;
  public mongoServer: MongoMemoryServer;
  public apiGateway: APIGateway;
  public eventBus: EventBus;
  public testFamilyId: string;
  public testParentId: string;
  public testChildId: string;
  public parentToken: string;
  public childToken: string;

  constructor() {
    this.app = express();
    this.eventBus = new EventBus();
    this.apiGateway = new APIGateway(this.eventBus);
  }

  async setup(): Promise<void> {
    // Start in-memory MongoDB
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB');

    // Setup Express app
    this.app.use(express.json());
    this.app.use('/api/v1', this.apiGateway.getRouter());

    // Create test data
    await this.createTestData();
  }

  async teardown(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
    
    console.log('Test environment cleaned up');
  }

  private async createTestData(): Promise<void> {
    // Create test family
    const family = new Family({
      name: 'Test Family',
      description: 'Test family for integration tests',
      settings: {
        timezone: 'Asia/Shanghai',
        currency: 'CNY',
        pointsSystem: {
          enabled: true,
          defaultReward: 10
        }
      },
      members: [],
      inviteCode: 'TEST123',
      isActive: true
    });
    await family.save();
    this.testFamilyId = family._id.toString();

    // Create test parent user
    const parentUser = new User({
      email: 'parent@test.com',
      password: 'password123', // This should be hashed in real implementation
      name: 'Test Parent',
      role: 'parent',
      familyId: this.testFamilyId,
      dateOfBirth: new Date('1980-01-01'),
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        notifications: { email: true, push: true }
      },
      profile: {
        avatar: '',
        bio: 'Test parent user'
      },
      isActive: true,
      isEmailVerified: true
    });
    await parentUser.save();
    this.testParentId = parentUser._id.toString();

    // Create test child user
    const childUser = new User({
      email: 'child@test.com',
      password: 'password123',
      name: 'Test Child',
      role: 'child',
      familyId: this.testFamilyId,
      dateOfBirth: new Date('2010-01-01'),
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        notifications: { email: true, push: true }
      },
      profile: {
        avatar: '',
        bio: 'Test child user'
      },
      isActive: true,
      isEmailVerified: true
    });
    await childUser.save();
    this.testChildId = childUser._id.toString();

    // Update family members
    family.members = [this.testParentId, this.testChildId];
    await family.save();

    // Generate JWT tokens
    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    
    this.parentToken = jwt.sign({
      userId: this.testParentId,
      familyId: this.testFamilyId,
      role: 'parent',
      email: 'parent@test.com'
    }, JWT_SECRET, { expiresIn: '1h' });

    this.childToken = jwt.sign({
      userId: this.testChildId,
      familyId: this.testFamilyId,
      role: 'child',
      email: 'child@test.com'
    }, JWT_SECRET, { expiresIn: '1h' });

    console.log('Test data created successfully');
  }

  // Helper methods for making authenticated requests
  public request() {
    return request(this.app);
  }

  public authenticatedRequest(userType: 'parent' | 'child' = 'parent') {
    const token = userType === 'parent' ? this.parentToken : this.childToken;
    return request(this.app).set('Authorization', `Bearer ${token}`);
  }

  public async createTestTask(overrides: any = {}): Promise<any> {
    const taskData = {
      title: 'Test Task',
      description: 'A test task for integration testing',
      category: 'exercise',
      difficulty: 'medium',
      estimatedDuration: 30,
      points: {
        base: 20,
        bonus: 5
      },
      requirements: {
        evidenceRequired: false,
        parentApproval: false
      },
      isActive: true,
      ...overrides
    };

    const response = await this.authenticatedRequest('parent')
      .post('/api/v1/tasks/templates')
      .send(taskData)
      .expect(201);

    return response.body.data;
  }

  public async scheduleTestTask(taskTemplateId: string, overrides: any = {}): Promise<any> {
    const scheduleData = {
      taskTemplateId,
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: 'Scheduled for testing',
      ...overrides
    };

    const response = await this.authenticatedRequest('child')
      .post('/api/v1/tasks/schedule')
      .send(scheduleData)
      .expect(201);

    return response.body.data;
  }

  public async completeTestTask(scheduledTaskId: string, overrides: any = {}): Promise<any> {
    const completionData = {
      notes: 'Completed during testing',
      evidenceUrls: [],
      ...overrides
    };

    const response = await this.authenticatedRequest('child')
      .patch(`/api/v1/tasks/scheduled/${scheduledTaskId}/complete`)
      .send(completionData)
      .expect(200);

    return response.body.data;
  }

  public async waitForEvent(eventName: string, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Event ${eventName} not received within ${timeout}ms`));
      }, timeout);

      this.eventBus.once(eventName, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  public async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}