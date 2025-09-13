import { TestEnvironment } from '../test-setup';

describe('End-to-End Workflow Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  }, 30000);

  afterAll(async () => {
    await testEnv.teardown();
  }, 10000);

  describe('Complete User Journey', () => {
    it('should complete a full user journey from task creation to reward', async () => {
      // 1. Parent creates a task template
      const taskTemplate = await testEnv.createTestTask({
        title: 'Daily Math Practice',
        description: 'Complete 30 minutes of math exercises',
        category: 'learning',
        difficulty: 'medium',
        estimatedDuration: 30,
        points: { base: 25, bonus: 10 },
        requirements: {
          evidenceRequired: true,
          parentApproval: false
        }
      });

      expect(taskTemplate.title).toBe('Daily Math Practice');
      expect(taskTemplate.points.base).toBe(25);

      // 2. Child schedules the task
      const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id, {
        notes: 'Planning to do this after breakfast'
      });

      expect(scheduledTask.status).toBe('planned');
      expect(scheduledTask.assignedTo).toBe(testEnv.testChildId);

      // 3. Child starts the task
      const startResponse = await testEnv.authenticatedRequest('child')
        .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/start`)
        .expect(200);

      expect(startResponse.body.data.status).toBe('in_progress');
      expect(startResponse.body.data.startedAt).toBeDefined();

      // 4. Get initial points balance
      const initialPointsResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/points/balance')
        .expect(200);

      const initialPoints = initialPointsResponse.body.data.balance;

      // 5. Get initial gamification state
      const initialLevelsResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/gamification/levels')
        .expect(200);

      const initialLevel = initialLevelsResponse.body.data.overall.level;
      const initialXP = initialLevelsResponse.body.data.overall.currentXP;

      // 6. Child completes the task with evidence
      const completionData = {
        notes: 'Completed all algebra exercises and practice problems',
        evidenceUrls: ['http://example.com/math-work.jpg']
      };

      // Listen for events
      const pointsPromise = testEnv.waitForEvent('points.earned');
      const gamificationPromise = testEnv.waitForEvent('gamification.xp_gained');

      const completionResponse = await testEnv.authenticatedRequest('child')
        .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
        .send(completionData)
        .expect(200);

      expect(completionResponse.body.data.status).toBe('completed');
      expect(completionResponse.body.data.completedAt).toBeDefined();

      // 7. Verify events were triggered
      const [pointsEvent, gamificationEvent] = await Promise.all([
        pointsPromise,
        gamificationPromise.catch(() => null) // May not fire if no XP gain
      ]);

      expect(pointsEvent.userId).toBe(testEnv.testChildId);
      expect(pointsEvent.amount).toBeGreaterThan(0);

      // 8. Check points balance increased
      await testEnv.delay(1000); // Allow for event processing

      const finalPointsResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/points/balance')
        .expect(200);

      const finalPoints = finalPointsResponse.body.data.balance;
      expect(finalPoints).toBeGreaterThan(initialPoints);

      // 9. Check gamification updates
      const finalLevelsResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/gamification/levels')
        .expect(200);

      const finalLevel = finalLevelsResponse.body.data.overall.level;
      const finalXP = finalLevelsResponse.body.data.overall.currentXP;

      expect(finalXP).toBeGreaterThanOrEqual(initialXP);

      // 10. Verify social post was created automatically
      const socialResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/social/feed?types=task_completion&limit=1')
        .expect(200);

      const taskCompletionPosts = socialResponse.body.data.posts;
      expect(taskCompletionPosts.length).toBeGreaterThan(0);
      
      const latestPost = taskCompletionPosts[0];
      expect(latestPost.type).toBe('task_completion');
      expect(latestPost.userId).toBe(testEnv.testChildId);

      // 11. Parent reviews family progress
      const familyStatsResponse = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/analytics/family')
        .expect(200);

      expect(familyStatsResponse.body.success).toBe(true);
      expect(familyStatsResponse.body.data).toBeDefined();

      // 12. Check task progress analytics
      const progressResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/tasks/progress')
        .expect(200);

      expect(progressResponse.body.data.completed).toBeGreaterThan(0);
      expect(progressResponse.body.data.totalScheduled).toBeGreaterThan(0);
    });

    it('should handle challenge participation workflow', async () => {
      // 1. Parent creates a family challenge
      const challengeData = {
        title: 'Learning Marathon',
        description: 'Complete 3 learning tasks this week for bonus rewards!',
        type: 'family',
        requirements: {
          taskCategories: ['learning'],
          minTasks: 3,
          targetDays: 7
        },
        rewards: {
          pointsPerMember: 150,
          badgeCode: 'learning_champion',
          specialReward: 'Choose next weekend activity'
        },
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const challengeResponse = await testEnv.authenticatedRequest('parent')
        .post('/api/v1/social/challenges')
        .send(challengeData)
        .expect(201);

      const createdChallenge = challengeResponse.body.data;
      expect(createdChallenge.title).toBe(challengeData.title);

      // 2. Child joins the challenge
      const joinResponse = await testEnv.authenticatedRequest('child')
        .post(`/api/v1/social/challenges/${createdChallenge._id}/join`)
        .expect(200);

      expect(joinResponse.body.data.participants).toContainEqual(
        expect.objectContaining({ userId: testEnv.testChildId })
      );

      // 3. Parent also joins
      await testEnv.authenticatedRequest('parent')
        .post(`/api/v1/social/challenges/${createdChallenge._id}/join`)
        .expect(200);

      // 4. Complete learning tasks to progress in challenge
      const learningTasks = await Promise.all([
        testEnv.createTestTask({ title: 'Reading Comprehension', category: 'learning' }),
        testEnv.createTestTask({ title: 'Science Quiz', category: 'learning' }),
        testEnv.createTestTask({ title: 'History Research', category: 'learning' })
      ]);

      for (const task of learningTasks) {
        const scheduled = await testEnv.scheduleTestTask(task._id);
        await testEnv.completeTestTask(scheduled._id, {
          notes: `Completed ${task.title} for challenge`
        });
        
        // Small delay between tasks
        await testEnv.delay(1000);
      }

      // 5. Wait for challenge progress processing
      await testEnv.delay(3000);

      // 6. Check challenge progress
      const progressResponse = await testEnv.authenticatedRequest('child')
        .get(`/api/v1/social/challenges/${createdChallenge._id}`)
        .expect(200);

      const childParticipant = progressResponse.body.data.participants
        .find((p: any) => p.userId === testEnv.testChildId);

      expect(childParticipant).toBeDefined();
      expect(childParticipant.progress.tasksCompleted).toBeGreaterThanOrEqual(3);

      // 7. Verify social interactions around challenge
      const challengeFeedResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/social/feed')
        .expect(200);

      // Should contain posts about task completions and possibly challenge progress
      expect(challengeFeedResponse.body.data.posts.length).toBeGreaterThan(0);
    });

    it('should handle points redemption workflow', async () => {
      // 1. Ensure user has sufficient points by completing high-value tasks
      const highValueTasks = await Promise.all([
        testEnv.createTestTask({ 
          title: 'Big Exercise Session', 
          category: 'exercise',
          difficulty: 'hard',
          points: { base: 50, bonus: 20 }
        }),
        testEnv.createTestTask({ 
          title: 'Complex Project', 
          category: 'creativity',
          difficulty: 'hard',
          points: { base: 60, bonus: 25 }
        })
      ]);

      for (const task of highValueTasks) {
        const scheduled = await testEnv.scheduleTestTask(task._id);
        await testEnv.completeTestTask(scheduled._id);
        await testEnv.delay(500);
      }

      // Wait for points processing
      await testEnv.delay(2000);

      // 2. Check points balance
      const balanceResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/points/balance')
        .expect(200);

      const currentBalance = balanceResponse.body.data.balance;
      expect(currentBalance).toBeGreaterThan(100); // Should have enough points

      // 3. Get points transaction history
      const historyResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/points/history')
        .expect(200);

      expect(historyResponse.body.success).toBe(true);
      expect(historyResponse.body.data.transactions).toBeInstanceOf(Array);
      expect(historyResponse.body.data.transactions.length).toBeGreaterThan(0);

      // Verify we have earned point transactions
      const earnedTransactions = historyResponse.body.data.transactions
        .filter((t: any) => t.type === 'earned');
      expect(earnedTransactions.length).toBeGreaterThan(0);

      // 4. Test points transfer (parent to child)
      const transferData = {
        toUserId: testEnv.testChildId,
        amount: 50,
        reason: 'Bonus for excellent work',
        requiresApproval: false
      };

      const transferResponse = await testEnv.authenticatedRequest('parent')
        .post('/api/v1/points/transfer')
        .send(transferData)
        .expect(200);

      expect(transferResponse.body.success).toBe(true);

      // 5. Verify points were transferred
      await testEnv.delay(1000);

      const newBalanceResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/points/balance')
        .expect(200);

      const newBalance = newBalanceResponse.body.data.balance;
      expect(newBalance).toBe(currentBalance + 50);
    });

    it('should handle comprehensive analytics workflow', async () => {
      // 1. Get user activity analytics
      const userActivityResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/analytics/user-activity')
        .expect(200);

      expect(userActivityResponse.body.success).toBe(true);
      expect(userActivityResponse.body.data).toBeDefined();

      // 2. Get family analytics (parent only)
      const familyAnalyticsResponse = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/analytics/family')
        .expect(200);

      expect(familyAnalyticsResponse.body.success).toBe(true);
      expect(familyAnalyticsResponse.body.data).toBeDefined();

      // 3. Get progress trends
      const trendsResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/analytics/progress-trends')
        .expect(200);

      expect(trendsResponse.body.success).toBe(true);
      expect(trendsResponse.body.data).toBeDefined();

      // 4. Test different time periods
      const weeklyResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/analytics/user-activity?period=week&granularity=day')
        .expect(200);

      expect(weeklyResponse.body.success).toBe(true);

      const monthlyResponse = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/analytics/family?period=month')
        .expect(200);

      expect(monthlyResponse.body.success).toBe(true);
    });

    it('should handle file upload and evidence workflow', async () => {
      // 1. Create a task that requires evidence
      const evidenceTask = await testEnv.createTestTask({
        title: 'Art Project with Photo',
        description: 'Create an artwork and upload a photo as evidence',
        category: 'creativity',
        requirements: {
          evidenceRequired: true,
          parentApproval: false
        }
      });

      // 2. Schedule and start the task
      const scheduled = await testEnv.scheduleTestTask(evidenceTask._id);
      
      await testEnv.authenticatedRequest('child')
        .patch(`/api/v1/tasks/scheduled/${scheduled._id}/start`)
        .expect(200);

      // 3. Simulate file upload (using mock data since we don't have actual file handling)
      // In a real test, we would upload actual files
      const mockEvidenceUrls = [
        'http://example.com/evidence1.jpg',
        'http://example.com/evidence2.jpg'
      ];

      // 4. Complete task with evidence URLs
      const completionResponse = await testEnv.authenticatedRequest('child')
        .patch(`/api/v1/tasks/scheduled/${scheduled._id}/complete`)
        .send({
          notes: 'Completed art project - uploaded photos of final artwork',
          evidenceUrls: mockEvidenceUrls
        })
        .expect(200);

      expect(completionResponse.body.data.evidenceUrls).toEqual(mockEvidenceUrls);

      // 5. Verify the evidence is associated with the completed task
      const taskDetailsResponse = await testEnv.authenticatedRequest('child')
        .get(`/api/v1/tasks/scheduled/${scheduled._id}`)
        .expect(200);

      expect(taskDetailsResponse.body.data.evidenceUrls).toEqual(mockEvidenceUrls);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent task completions properly', async () => {
      // Create multiple tasks
      const tasks = await Promise.all([
        testEnv.createTestTask({ title: 'Concurrent Task 1', category: 'exercise' }),
        testEnv.createTestTask({ title: 'Concurrent Task 2', category: 'learning' }),
        testEnv.createTestTask({ title: 'Concurrent Task 3', category: 'chores' })
      ]);

      // Schedule all tasks
      const scheduledTasks = await Promise.all(
        tasks.map(task => testEnv.scheduleTestTask(task._id))
      );

      // Start all tasks
      await Promise.all(
        scheduledTasks.map(scheduled =>
          testEnv.authenticatedRequest('child')
            .patch(`/api/v1/tasks/scheduled/${scheduled._id}/start`)
            .expect(200)
        )
      );

      // Complete all tasks simultaneously
      const completionPromises = scheduledTasks.map(scheduled =>
        testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduled._id}/complete`)
          .send({ notes: `Completed ${scheduled.title}` })
          .expect(200)
      );

      const completionResults = await Promise.all(completionPromises);

      // Verify all tasks were completed successfully
      completionResults.forEach(result => {
        expect(result.body.success).toBe(true);
        expect(result.body.data.status).toBe('completed');
      });

      // Wait for all event processing
      await testEnv.delay(3000);

      // Verify points and gamification were updated correctly
      const finalBalanceResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/points/balance')
        .expect(200);

      expect(finalBalanceResponse.body.data.balance).toBeGreaterThan(0);
    });

    it('should handle family member interactions correctly', async () => {
      // 1. Parent creates task for child
      const parentTask = await testEnv.createTestTask({
        title: 'Parent Assigned Task',
        description: 'Task created by parent for child'
      });

      // 2. Child schedules and completes the task
      const scheduled = await testEnv.scheduleTestTask(parentTask._id);
      await testEnv.completeTestTask(scheduled._id);

      // 3. Parent views family progress
      const familyProgressResponse = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/tasks/stats')
        .expect(200);

      expect(familyProgressResponse.body.success).toBe(true);
      expect(familyProgressResponse.body.data.memberStats).toBeInstanceOf(Array);

      // 4. Parent reacts to child's social posts
      const childPostsResponse = await testEnv.authenticatedRequest('parent')
        .get('/api/v1/social/feed')
        .expect(200);

      const childPosts = childPostsResponse.body.data.posts
        .filter((post: any) => post.userId === testEnv.testChildId);

      if (childPosts.length > 0) {
        const postToReactTo = childPosts[0];
        
        const reactionResponse = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${postToReactTo._id}/react`)
          .send({ reactionType: 'celebrate' })
          .expect(200);

        expect(reactionResponse.body.success).toBe(true);
      }

      // 5. Parent comments on child's posts
      if (childPosts.length > 0) {
        const postToCommentOn = childPosts[0];

        const commentResponse = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${postToCommentOn._id}/comments`)
          .send({
            content: {
              text: 'Great job! I\'m proud of your progress! 🎉',
              mentions: [testEnv.testChildId]
            }
          })
          .expect(201);

        expect(commentResponse.body.success).toBe(true);
      }
    });

    it('should maintain data consistency across all systems', async () => {
      // Get initial state
      const initialState = await Promise.all([
        testEnv.authenticatedRequest('child').get('/api/v1/points/balance').expect(200),
        testEnv.authenticatedRequest('child').get('/api/v1/gamification/levels').expect(200),
        testEnv.authenticatedRequest('child').get('/api/v1/gamification/streaks').expect(200),
        testEnv.authenticatedRequest('child').get('/api/v1/tasks/progress').expect(200)
      ]);

      const [initialPoints, initialLevels, initialStreaks, initialProgress] = initialState;

      // Perform a complex operation that touches multiple systems
      const complexTask = await testEnv.createTestTask({
        title: 'Complex Multi-System Task',
        category: 'learning',
        difficulty: 'hard',
        points: { base: 75, bonus: 25 }
      });

      const scheduled = await testEnv.scheduleTestTask(complexTask._id);
      await testEnv.completeTestTask(scheduled._id);

      // Wait for all systems to process
      await testEnv.delay(3000);

      // Verify all systems were updated consistently
      const finalState = await Promise.all([
        testEnv.authenticatedRequest('child').get('/api/v1/points/balance').expect(200),
        testEnv.authenticatedRequest('child').get('/api/v1/gamification/levels').expect(200),
        testEnv.authenticatedRequest('child').get('/api/v1/gamification/streaks').expect(200),
        testEnv.authenticatedRequest('child').get('/api/v1/tasks/progress').expect(200)
      ]);

      const [finalPoints, finalLevels, finalStreaks, finalProgress] = finalState;

      // Points should have increased
      expect(finalPoints.body.data.balance).toBeGreaterThan(initialPoints.body.data.balance);

      // XP should have increased
      expect(finalLevels.body.data.overall.currentXP).toBeGreaterThanOrEqual(
        initialLevels.body.data.overall.currentXP
      );

      // Task completion count should have increased
      expect(finalProgress.body.data.completed).toBeGreaterThan(initialProgress.body.data.completed);

      // Streaks should be maintained or improved
      const learningStreakBefore = initialStreaks.body.data.active
        .find((s: any) => s.category === 'learning');
      const learningStreakAfter = finalStreaks.body.data.active
        .find((s: any) => s.category === 'learning');

      if (learningStreakBefore && learningStreakAfter) {
        expect(learningStreakAfter.currentStreak).toBeGreaterThanOrEqual(
          learningStreakBefore.currentStreak
        );
      }
    });
  });
});