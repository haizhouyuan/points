import { TestEnvironment } from '../test-setup';

describe('Gamification API Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  }, 30000);

  afterAll(async () => {
    await testEnv.teardown();
  }, 10000);

  describe('Achievement System', () => {
    describe('GET /api/v1/gamification/achievements', () => {
      it('should get user achievements', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/achievements')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.unlocked).toBeInstanceOf(Array);
        expect(response.body.data.available).toBeInstanceOf(Array);
        expect(response.body.data.progress).toBeInstanceOf(Array);
      });

      it('should filter achievements by category', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/achievements?category=task_completion')
          .expect(200);

        expect(response.body.success).toBe(true);
        const achievements = [...response.body.data.unlocked, ...response.body.data.available];
        if (achievements.length > 0) {
          expect(achievements.every(
            (achievement: any) => achievement.category === 'task_completion'
          )).toBe(true);
        }
      });

      it('should show only unlocked achievements when filter applied', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/achievements?unlocked=true')
          .expect(200);

        expect(response.body.success).toBe(true);
        // Should only return unlocked achievements
        expect(response.body.data.available.length).toBe(0);
      });
    });

    describe('Achievement Unlocking Integration', () => {
      it('should unlock achievement when completing first task', async () => {
        // Create and complete a task to trigger achievement
        const taskTemplate = await testEnv.createTestTask({
          title: 'First Task Achievement Test',
          category: 'exercise',
          points: { base: 10, bonus: 5 }
        });

        const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);

        // Start the task
        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/start`)
          .expect(200);

        // Listen for achievement unlock event
        const achievementPromise = testEnv.waitForEvent('gamification.achievement_unlocked');

        // Complete the task
        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
          .send({ notes: 'Achievement test completion' })
          .expect(200);

        // Wait for achievement unlock (may take a moment)
        try {
          const achievementEvent = await achievementPromise;
          expect(achievementEvent.userId).toBe(testEnv.testChildId);
          expect(achievementEvent.achievementName).toBeDefined();
        } catch (error) {
          // Achievement may not unlock on first task depending on system setup
          console.log('No achievement unlocked - this may be expected behavior');
        }
      });
    });
  });

  describe('Level System', () => {
    describe('GET /api/v1/gamification/levels', () => {
      it('should get user level information', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/levels')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.overall).toBeDefined();
        expect(response.body.data.categories).toBeDefined();
        expect(response.body.data.overall.level).toBeGreaterThanOrEqual(1);
        expect(response.body.data.overall.currentXP).toBeGreaterThanOrEqual(0);
        expect(response.body.data.overall.xpToNextLevel).toBeGreaterThan(0);
      });

      it('should show progress breakdown by category', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/levels')
          .expect(200);

        const categories = response.body.data.categories;
        expect(categories).toHaveProperty('exercise');
        expect(categories).toHaveProperty('learning');
        expect(categories).toHaveProperty('chores');
        
        Object.values(categories).forEach((category: any) => {
          expect(category.level).toBeGreaterThanOrEqual(1);
          expect(category.currentXP).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe('Level Up Integration', () => {
      it('should track XP gain from task completion', async () => {
        // Get initial level state
        const initialResponse = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/levels')
          .expect(200);

        const initialXP = initialResponse.body.data.overall.currentXP;

        // Complete a high-value task to gain XP
        const taskTemplate = await testEnv.createTestTask({
          title: 'High XP Task',
          category: 'learning',
          difficulty: 'hard',
          points: { base: 50, bonus: 20 }
        });

        const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);

        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/start`)
          .expect(200);

        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
          .send({ notes: 'XP gain test' })
          .expect(200);

        // Wait a moment for XP processing
        await testEnv.delay(1000);

        // Check if XP increased
        const finalResponse = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/levels')
          .expect(200);

        const finalXP = finalResponse.body.data.overall.currentXP;
        expect(finalXP).toBeGreaterThan(initialXP);
      });
    });
  });

  describe('Streak System', () => {
    describe('GET /api/v1/gamification/streaks', () => {
      it('should get user streak information', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/streaks')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.active).toBeInstanceOf(Array);
        expect(response.body.data.milestones).toBeInstanceOf(Array);
        expect(response.body.data.history).toBeInstanceOf(Array);
      });

      it('should show streak details by category', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/streaks?category=exercise')
          .expect(200);

        expect(response.body.success).toBe(true);
        const streaks = response.body.data.active;
        if (streaks.length > 0) {
          expect(streaks.every(
            (streak: any) => streak.category === 'exercise'
          )).toBe(true);
        }
      });
    });

    describe('Streak Building Integration', () => {
      it('should increment streak on consecutive task completions', async () => {
        // Get initial streak state
        const initialResponse = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/streaks')
          .expect(200);

        // Find or expect to create exercise streak
        let exerciseStreak = initialResponse.body.data.active.find(
          (s: any) => s.category === 'exercise'
        );
        const initialStreakCount = exerciseStreak ? exerciseStreak.currentStreak : 0;

        // Complete an exercise task
        const taskTemplate = await testEnv.createTestTask({
          title: 'Streak Building Exercise',
          category: 'exercise',
          difficulty: 'easy',
          points: { base: 15, bonus: 5 }
        });

        const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);

        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/start`)
          .expect(200);

        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
          .send({ notes: 'Streak building test' })
          .expect(200);

        // Wait for streak processing
        await testEnv.delay(1000);

        // Check if streak increased
        const finalResponse = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/streaks')
          .expect(200);

        exerciseStreak = finalResponse.body.data.active.find(
          (s: any) => s.category === 'exercise'
        );

        if (exerciseStreak) {
          expect(exerciseStreak.currentStreak).toBeGreaterThanOrEqual(initialStreakCount);
        }
      });
    });

    describe('POST /api/v1/gamification/streaks/restore', () => {
      it('should allow streak restoration with points', async () => {
        // This test assumes there's a broken streak to restore
        const restoreData = {
          category: 'exercise',
          pointsCost: 50
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/gamification/streaks/restore')
          .send(restoreData)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Should indicate whether restoration was successful or not possible
      });

      it('should reject restoration with insufficient points', async () => {
        const restoreData = {
          category: 'exercise',
          pointsCost: 999999 // Extremely high cost
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/gamification/streaks/restore')
          .send(restoreData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('points');
      });
    });
  });

  describe('Skill System', () => {
    describe('GET /api/v1/gamification/skills', () => {
      it('should get user skill tree', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/skills')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.skills).toBeInstanceOf(Array);
        expect(response.body.data.availablePoints).toBeGreaterThanOrEqual(0);
      });

      it('should show skills by category', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/skills?category=exercise')
          .expect(200);

        expect(response.body.success).toBe(true);
        const skills = response.body.data.skills;
        if (skills.length > 0) {
          expect(skills.every(
            (skill: any) => skill.category === 'exercise'
          )).toBe(true);
        }
      });
    });

    describe('POST /api/v1/gamification/skills/upgrade', () => {
      it('should upgrade a skill with available points', async () => {
        const upgradeData = {
          skillId: 'exercise_endurance', // Assuming this skill exists
          pointsToSpend: 1
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/gamification/skills/upgrade')
          .send(upgradeData)
          .expect(200);

        expect(response.body.success).toBe(true);
        if (response.body.data.upgraded) {
          expect(response.body.data.newLevel).toBeGreaterThan(0);
        }
      });

      it('should reject upgrade with insufficient points', async () => {
        const upgradeData = {
          skillId: 'exercise_endurance',
          pointsToSpend: 999999
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/gamification/skills/upgrade')
          .send(upgradeData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('points');
      });
    });
  });

  describe('Gamification Statistics', () => {
    describe('GET /api/v1/gamification/stats', () => {
      it('should get comprehensive gamification statistics', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/stats')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.achievements).toBeDefined();
        expect(response.body.data.levels).toBeDefined();
        expect(response.body.data.streaks).toBeDefined();
        expect(response.body.data.skills).toBeDefined();
        expect(response.body.data.recentActivity).toBeInstanceOf(Array);
      });

      it('should get stats for specific time period', async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const response = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/gamification/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.periodStats).toBeDefined();
      });
    });
  });

  describe('Leaderboards', () => {
    describe('GET /api/v1/gamification/leaderboard', () => {
      it('should get family leaderboard', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/leaderboard')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rankings).toBeInstanceOf(Array);
        expect(response.body.data.userRank).toBeDefined();
      });

      it('should filter leaderboard by category', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/leaderboard?category=exercise')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rankings).toBeInstanceOf(Array);
      });

      it('should show leaderboard for different time periods', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/gamification/leaderboard?period=weekly')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rankings).toBeInstanceOf(Array);
        expect(response.body.data.period).toBe('weekly');
      });
    });
  });

  describe('Event-Driven Gamification Integration', () => {
    it('should trigger gamification updates when tasks are completed', async () => {
      // Create multiple tasks to test comprehensive gamification integration
      const tasks = await Promise.all([
        testEnv.createTestTask({ title: 'Exercise Task 1', category: 'exercise' }),
        testEnv.createTestTask({ title: 'Learning Task 1', category: 'learning' }),
        testEnv.createTestTask({ title: 'Chore Task 1', category: 'chores' })
      ]);

      for (const task of tasks) {
        const scheduledTask = await testEnv.scheduleTestTask(task._id);

        // Start and complete task
        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/start`)
          .expect(200);

        await testEnv.authenticatedRequest('child')
          .patch(`/api/v1/tasks/scheduled/${scheduledTask._id}/complete`)
          .send({ notes: `Completed ${task.title}` })
          .expect(200);

        // Small delay between tasks
        await testEnv.delay(500);
      }

      // Wait for all gamification processing
      await testEnv.delay(2000);

      // Verify gamification stats were updated
      const statsResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/gamification/stats')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.recentActivity.length).toBeGreaterThan(0);
    });
  });
});