import { TestEnvironment } from '../test-setup';

describe('Tasks API Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  }, 30000);

  afterAll(async () => {
    await testEnv.teardown();
  }, 10000);

  describe('Task Template Management', () => {
    let createdTaskId: string;

    describe('POST /api/v1/tasks/templates', () => {
      it('should create a task template successfully (parent)', async () => {
        const taskData = {
          title: 'Morning Exercise',
          description: 'Do 20 minutes of exercise in the morning',
          category: 'exercise',
          difficulty: 'medium',
          estimatedDuration: 20,
          points: {
            base: 15,
            bonus: 5
          },
          requirements: {
            evidenceRequired: true,
            parentApproval: false
          },
          tags: ['morning', 'health'],
          isActive: true
        };

        const response = await testEnv.authenticatedRequest('parent')
          .post('/api/v1/tasks/templates')
          .send(taskData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(taskData.title);
        expect(response.body.data.category).toBe(taskData.category);
        expect(response.body.data.difficulty).toBe(taskData.difficulty);
        expect(response.body.data.points.base).toBe(taskData.points.base);

        createdTaskId = response.body.data._id;
      });

      it('should reject task creation by child user', async () => {
        const taskData = {
          title: 'Child Task',
          description: 'This should not be allowed',
          category: 'learning'
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/tasks/templates')
          .send(taskData)
          .expect(403);
      });

      it('should reject task creation with invalid data', async () => {
        const taskData = {
          title: '', // Empty title should be invalid
          description: 'Valid description',
          category: 'exercise'
        };

        await testEnv.authenticatedRequest('parent')
          .post('/api/v1/tasks/templates')
          .send(taskData)
          .expect(400);
      });
    });

    describe('GET /api/v1/tasks/templates', () => {
      it('should get all task templates for family', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .get('/api/v1/tasks/templates')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.templates).toBeInstanceOf(Array);
        expect(response.body.data.templates.length).toBeGreaterThan(0);
      });

      it('should filter templates by category', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .get('/api/v1/tasks/templates?category=exercise')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.templates.every(
          (task: any) => task.category === 'exercise'
        )).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .get('/api/v1/tasks/templates?limit=1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.templates.length).toBeLessThanOrEqual(1);
        expect(response.body.data.pagination).toBeDefined();
      });
    });

    describe('PUT /api/v1/tasks/templates/:id', () => {
      it('should update task template successfully', async () => {
        const updateData = {
          title: 'Updated Morning Exercise',
          difficulty: 'hard',
          points: {
            base: 25,
            bonus: 10
          }
        };

        const response = await testEnv.authenticatedRequest('parent')
          .put(`/api/v1/tasks/templates/${createdTaskId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.difficulty).toBe(updateData.difficulty);
        expect(response.body.data.points.base).toBe(updateData.points.base);
      });

      it('should reject update by child user', async () => {
        const updateData = {
          title: 'Unauthorized Update'
        };

        await testEnv.authenticatedRequest('child')
          .put(`/api/v1/tasks/templates/${createdTaskId}`)
          .send(updateData)
          .expect(403);
      });
    });
  });

  describe('Task Scheduling and Completion', () => {
    let taskTemplate: any;
    let scheduledTask: any;

    beforeAll(async () => {
      // Create a task template for scheduling tests
      taskTemplate = await testEnv.createTestTask({
        title: 'Reading Practice',
        category: 'learning',
        difficulty: 'easy',
        points: { base: 10, bonus: 2 }
      });
    });

    describe('POST /api/v1/tasks/schedule', () => {
      it('should schedule a task successfully', async () => {
        const scheduleData = {
          taskTemplateId: taskTemplate._id,
          scheduledDate: new Date().toISOString().split('T')[0],
          notes: 'Scheduled for today'
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/tasks/schedule')
          .send(scheduleData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.taskTemplateId).toBe(taskTemplate._id);
        expect(response.body.data.status).toBe('planned');
        expect(response.body.data.assignedTo).toBe(testEnv.testChildId);

        scheduledTask = response.body.data;
      });

      it('should reject scheduling non-existent task', async () => {
        const scheduleData = {
          taskTemplateId: '507f1f77bcf86cd799439011', // Non-existent ID
          scheduledDate: new Date().toISOString().split('T')[0]
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/tasks/schedule')
          .send(scheduleData)
          .expect(404);
      });

      it('should reject scheduling in the past', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        const scheduleData = {
          taskTemplateId: taskTemplate._id,
          scheduledDate: pastDate.toISOString().split('T')[0]
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/tasks/schedule')
          .send(scheduleData)
          .expect(400);
      });
    });

    describe('GET /api/v1/tasks/scheduled', () => {
      it('should get scheduled tasks for user', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/tasks/scheduled')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tasks).toBeInstanceOf(Array);
        expect(response.body.data.tasks.length).toBeGreaterThan(0);
      });

      it('should filter scheduled tasks by status', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/tasks/scheduled?status=planned')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tasks.every(
          (task: any) => task.status === 'planned'
        )).toBe(true);
      });

      it('should filter scheduled tasks by date', async () => {
        const today = new Date().toISOString().split('T')[0];
        const response = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/tasks/scheduled?date=${today}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tasks.every(
          (task: any) => task.scheduledDate.startsWith(today)
        )).toBe(true);
      });
    });

    describe('PATCH /api/v1/tasks/scheduled/:id/start', () => {
      it('should start a scheduled task', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/start`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('in_progress');
        expect(response.body.data.startedAt).toBeDefined();

        scheduledTask = response.body.data;
      });

      it('should reject starting non-existent task', async () => {
        await testEnv.authenticatedRequest('child')
          .patch('/api/v1/tasks/scheduled/507f1f77bcf86cd799439011/start')
          .expect(404);
      });
    });

    describe('PATCH /api/v1/tasks/scheduled/:id/complete', () => {
      it('should complete a task and trigger points/gamification events', async () => {
        const completionData = {
          notes: 'Task completed successfully',
          evidenceUrls: ['http://example.com/evidence.jpg']
        };

        // Listen for events
        const pointsPromise = testEnv.waitForEvent('points.earned');
        const taskPromise = testEnv.waitForEvent('task.completed');

        const response = await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
          .send(completionData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('completed');
        expect(response.body.data.completedAt).toBeDefined();
        expect(response.body.data.notes).toBe(completionData.notes);

        // Verify events were emitted
        const [pointsEvent, taskEvent] = await Promise.all([pointsPromise, taskPromise]);
        
        expect(pointsEvent.userId).toBe(testEnv.testChildId);
        expect(pointsEvent.amount).toBeGreaterThan(0);
        expect(taskEvent.taskId).toBe(scheduledTask._id);
      });

      it('should reject completing already completed task', async () => {
        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
          .send({ notes: 'Already completed' })
          .expect(400);
      });
    });

    describe('PATCH /api/v1/tasks/scheduled/:id/skip', () => {
      it('should skip a planned task', async () => {
        // Create another task to skip
        const newScheduledTask = await testEnv.scheduleTestTask(taskTemplate._id, {
          scheduledDate: new Date().toISOString().split('T')[0]
        });

        const skipData = {
          reason: 'Not feeling well today'
        };

        const response = await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${newScheduledTask._id}/skip`)
          .send(skipData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('skipped');
        expect(response.body.data.skipReason).toBe(skipData.reason);
      });
    });
  });

  describe('Task Analytics and Progress', () => {
    describe('GET /api/v1/tasks/progress', () => {
      it('should get task completion progress for user', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/tasks/progress')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalScheduled).toBeGreaterThan(0);
        expect(response.body.data.completed).toBeGreaterThan(0);
        expect(response.body.data.completionRate).toBeGreaterThanOrEqual(0);
        expect(response.body.data.categoryBreakdown).toBeDefined();
      });

      it('should get progress for specific date range', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date();

        const response = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/tasks/progress?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalScheduled).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /api/v1/tasks/stats', () => {
      it('should get task statistics for family (parent only)', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .get('/api/v1/tasks/stats')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.familyStats).toBeDefined();
        expect(response.body.data.memberStats).toBeInstanceOf(Array);
      });

      it('should reject stats request from child user', async () => {
        await testEnv.authenticatedRequest('child')
          .get('/api/v1/tasks/stats')
          .expect(403);
      });
    });
  });

  describe('Quick Task Operations', () => {
    describe('POST /api/v1/tasks/quick-create-and-schedule', () => {
      it('should quickly create and schedule a task in one operation', async () => {
        const quickTaskData = {
          title: 'Quick Study Session',
          description: 'Study math for 30 minutes',
          category: 'learning',
          difficulty: 'medium',
          estimatedDuration: 30,
          scheduledDate: new Date().toISOString().split('T')[0],
          notes: 'Created quickly for urgent study'
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/tasks/quick-create-and-schedule')
          .send(quickTaskData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.template).toBeDefined();
        expect(response.body.data.scheduledTask).toBeDefined();
        expect(response.body.data.template.title).toBe(quickTaskData.title);
        expect(response.body.data.scheduledTask.status).toBe('planned');
      });

      it('should validate quick task data properly', async () => {
        const invalidTaskData = {
          title: '', // Empty title
          category: 'invalid_category',
          scheduledDate: 'invalid_date'
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/tasks/quick-create-and-schedule')
          .send(invalidTaskData)
          .expect(400);
      });
    });
  });

  describe('Task Recommendations', () => {
    describe('GET /api/v1/tasks/recommendations', () => {
      it('should get personalized task recommendations', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/tasks/recommendations')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.recommendations).toBeInstanceOf(Array);
      });

      it('should filter recommendations by category', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/tasks/recommendations?category=exercise')
          .expect(200);

        expect(response.body.success).toBe(true);
        // Recommendations should either be empty or contain only exercise tasks
        const recommendations = response.body.data.recommendations;
        if (recommendations.length > 0) {
          expect(recommendations.every(
            (task: any) => task.category === 'exercise'
          )).toBe(true);
        }
      });
    });
  });
});