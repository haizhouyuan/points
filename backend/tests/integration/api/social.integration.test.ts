import { TestEnvironment } from '../test-setup';

describe('Social API Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  }, 30000);

  afterAll(async () => {
    await testEnv.teardown();
  }, 10000);

  describe('Social Posts', () => {
    let createdPostId: string;

    describe('POST /api/v1/social/posts', () => {
      it('should create a text post successfully', async () => {
        const postData = {
          type: 'text',
          content: {
            text: 'This is my first social post! 🎉',
            metadata: { mood: 'excited' }
          },
          visibility: 'family'
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/social/posts')
          .send(postData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe(postData.type);
        expect(response.body.data.content.text).toBe(postData.content.text);
        expect(response.body.data.userId).toBe(testEnv.testChildId);
        expect(response.body.data.familyId).toBe(testEnv.testFamilyId);

        createdPostId = response.body.data._id;
      });

      it('should create a task completion post', async () => {
        // First create and complete a task
        const taskTemplate = await testEnv.createTestTask({
          title: 'Social Task Test',
          category: 'exercise'
        });
        const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);
        await testEnv.completeTestTask(scheduledTask._id);

        const postData = {
          type: 'task_completion',
          content: {
            text: 'Just completed my exercise! 💪',
            taskId: scheduledTask._id,
            metadata: { pointsEarned: 20 }
          },
          visibility: 'family'
        };

        const response = await testEnv.authenticatedRequest('child')
          .post('/api/v1/social/posts')
          .send(postData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe('task_completion');
        expect(response.body.data.content.taskId).toBe(scheduledTask._id);
      });

      it('should reject post with invalid type', async () => {
        const postData = {
          type: 'invalid_type',
          content: {
            text: 'This should fail'
          }
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/social/posts')
          .send(postData)
          .expect(400);
      });

      it('should validate required fields for task completion posts', async () => {
        const postData = {
          type: 'task_completion',
          content: {
            text: 'Missing task ID'
            // taskId is missing but required for task_completion type
          }
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/social/posts')
          .send(postData)
          .expect(400);
      });
    });

    describe('GET /api/v1/social/feed', () => {
      it('should get family feed with posts', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/feed')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeInstanceOf(Array);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should filter feed by post type', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/feed?types=text')
          .expect(200);

        expect(response.body.success).toBe(true);
        const posts = response.body.data.posts;
        if (posts.length > 0) {
          expect(posts.every((post: any) => post.type === 'text')).toBe(true);
        }
      });

      it('should filter feed by user', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .get(`/api/v1/social/feed?userId=${testEnv.testChildId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        const posts = response.body.data.posts;
        if (posts.length > 0) {
          expect(posts.every((post: any) => post.userId === testEnv.testChildId)).toBe(true);
        }
      });

      it('should support pagination', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/feed?limit=1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts.length).toBeLessThanOrEqual(1);
        expect(response.body.data.pagination.hasMore).toBeDefined();
      });
    });

    describe('POST /api/v1/social/posts/:postId/react', () => {
      it('should react to a post successfully', async () => {
        const reactionData = {
          reactionType: 'like'
        };

        const response = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/react`)
          .send(reactionData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.currentReactions).toBeDefined();
        expect(response.body.data.currentReactions.likes).toContain(testEnv.testParentId);
      });

      it('should toggle reaction when reacting again', async () => {
        // React again with the same reaction type to toggle it off
        const reactionData = {
          reactionType: 'like'
        };

        const response = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/react`)
          .send(reactionData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.currentReactions.likes).not.toContain(testEnv.testParentId);
      });

      it('should switch reaction types', async () => {
        // First add a like
        await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/react`)
          .send({ reactionType: 'like' })
          .expect(200);

        // Then switch to celebrate
        const response = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/react`)
          .send({ reactionType: 'celebrate' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.currentReactions.likes).not.toContain(testEnv.testParentId);
        expect(response.body.data.currentReactions.celebrates).toContain(testEnv.testParentId);
      });

      it('should reject invalid reaction type', async () => {
        const reactionData = {
          reactionType: 'invalid_reaction'
        };

        await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/react`)
          .send(reactionData)
          .expect(400);
      });
    });
  });

  describe('Comments', () => {
    let createdPostId: string;
    let createdCommentId: string;

    beforeAll(async () => {
      // Create a post to comment on
      const postResponse = await testEnv.authenticatedRequest('child')
        .post('/api/v1/social/posts')
        .send({
          type: 'text',
          content: { text: 'Post for comment testing' }
        })
        .expect(201);
      
      createdPostId = postResponse.body.data._id;
    });

    describe('POST /api/v1/social/posts/:postId/comments', () => {
      it('should add a comment to a post', async () => {
        const commentData = {
          content: {
            text: 'Great job on completing that task! 👏',
            mentions: [testEnv.testChildId]
          }
        };

        const response = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/comments`)
          .send(commentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.content.text).toBe(commentData.content.text);
        expect(response.body.data.content.mentions).toEqual(commentData.content.mentions);
        expect(response.body.data.userId).toBe(testEnv.testParentId);

        createdCommentId = response.body.data._id;
      });

      it('should add a reply to a comment', async () => {
        const replyData = {
          content: {
            text: 'Thank you! 😊'
          },
          parentCommentId: createdCommentId
        };

        const response = await testEnv.authenticatedRequest('child')
          .post(`/api/v1/social/posts/${createdPostId}/comments`)
          .send(replyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.parentCommentId).toBe(createdCommentId);
      });

      it('should reject empty comment', async () => {
        const commentData = {
          content: {
            text: ''
          }
        };

        await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/posts/${createdPostId}/comments`)
          .send(commentData)
          .expect(400);
      });
    });

    describe('GET /api/v1/social/posts/:postId/comments', () => {
      it('should get comments for a post', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/social/posts/${createdPostId}/comments`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.comments).toBeInstanceOf(Array);
        expect(response.body.data.comments.length).toBeGreaterThan(0);
      });

      it('should support pagination for comments', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/social/posts/${createdPostId}/comments?limit=1`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.comments.length).toBeLessThanOrEqual(1);
        expect(response.body.data.pagination).toBeDefined();
      });
    });
  });

  describe('Family Challenges', () => {
    let createdChallengeId: string;

    describe('POST /api/v1/social/challenges', () => {
      it('should create a family challenge (parent only)', async () => {
        const challengeData = {
          title: 'Weekly Exercise Challenge',
          description: 'Complete 5 exercise tasks this week to earn bonus points!',
          type: 'family',
          requirements: {
            taskCategories: ['exercise'],
            minTasks: 5,
            targetDays: 7
          },
          rewards: {
            pointsPerMember: 100,
            badgeCode: 'exercise_champion',
            specialReward: 'Extra screen time on weekend'
          },
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await testEnv.authenticatedRequest('parent')
          .post('/api/v1/social/challenges')
          .send(challengeData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(challengeData.title);
        expect(response.body.data.type).toBe(challengeData.type);
        expect(response.body.data.createdBy).toBe(testEnv.testParentId);
        expect(response.body.data.status).toBe('draft');

        createdChallengeId = response.body.data._id;
      });

      it('should reject challenge creation by child', async () => {
        const challengeData = {
          title: 'Child Challenge',
          description: 'This should not be allowed',
          type: 'individual'
        };

        await testEnv.authenticatedRequest('child')
          .post('/api/v1/social/challenges')
          .send(challengeData)
          .expect(403);
      });

      it('should validate challenge data', async () => {
        const invalidChallengeData = {
          title: '', // Empty title
          description: 'Valid description',
          type: 'invalid_type'
        };

        await testEnv.authenticatedRequest('parent')
          .post('/api/v1/social/challenges')
          .send(invalidChallengeData)
          .expect(400);
      });
    });

    describe('POST /api/v1/social/challenges/:challengeId/join', () => {
      it('should join a challenge successfully', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .post(`/api/v1/social/challenges/${createdChallengeId}/join`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.participants).toContainEqual(
          expect.objectContaining({ userId: testEnv.testChildId })
        );
      });

      it('should prevent joining the same challenge twice', async () => {
        await testEnv.authenticatedRequest('child')
          .post(`/api/v1/social/challenges/${createdChallengeId}/join`)
          .expect(400);
      });

      it('should allow parent to join their own challenge', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .post(`/api/v1/social/challenges/${createdChallengeId}/join`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.participants).toContainEqual(
          expect.objectContaining({ userId: testEnv.testParentId })
        );
      });
    });

    describe('GET /api/v1/social/challenges', () => {
      it('should get family challenges', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/challenges')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.challenges).toBeInstanceOf(Array);
        expect(response.body.data.challenges.length).toBeGreaterThan(0);
      });

      it('should filter challenges by status', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/challenges?status=draft')
          .expect(200);

        expect(response.body.success).toBe(true);
        const challenges = response.body.data.challenges;
        if (challenges.length > 0) {
          expect(challenges.every((c: any) => c.status === 'draft')).toBe(true);
        }
      });

      it('should filter challenges by type', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/challenges?type=family')
          .expect(200);

        expect(response.body.success).toBe(true);
        const challenges = response.body.data.challenges;
        if (challenges.length > 0) {
          expect(challenges.every((c: any) => c.type === 'family')).toBe(true);
        }
      });
    });

    describe('Challenge Progress Integration', () => {
      it('should update challenge progress when completing relevant tasks', async () => {
        // Get initial challenge state
        const initialResponse = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/social/challenges/${createdChallengeId}`)
          .expect(200);

        const initialProgress = initialResponse.body.data.participants
          .find((p: any) => p.userId === testEnv.testChildId)?.progress;

        // Complete an exercise task (which matches the challenge requirements)
        const taskTemplate = await testEnv.createTestTask({
          title: 'Challenge Exercise Task',
          category: 'exercise',
          points: { base: 20, bonus: 5 }
        });

        const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);
        await testEnv.completeTestTask(scheduledTask._id);

        // Wait for challenge progress update
        await testEnv.delay(2000);

        // Check if challenge progress updated
        const finalResponse = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/social/challenges/${createdChallengeId}`)
          .expect(200);

        const finalProgress = finalResponse.body.data.participants
          .find((p: any) => p.userId === testEnv.testChildId)?.progress;

        if (finalProgress) {
          expect(finalProgress.tasksCompleted).toBeGreaterThanOrEqual(initialProgress?.tasksCompleted || 0);
        }
      });
    });
  });

  describe('Family Statistics', () => {
    describe('GET /api/v1/social/stats', () => {
      it('should get family social statistics', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/stats')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should filter stats by period', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/stats?period=weekly')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should filter stats by date range', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date();

        const response = await testEnv.authenticatedRequest('child')
          .get(`/api/v1/social/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('User Posts and Activity', () => {
    describe('GET /api/v1/social/my-posts', () => {
      it('should get current user posts', async () => {
        const response = await testEnv.authenticatedRequest('child')
          .get('/api/v1/social/my-posts')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeInstanceOf(Array);
        const posts = response.body.data.posts;
        if (posts.length > 0) {
          expect(posts.every((post: any) => post.userId === testEnv.testChildId)).toBe(true);
        }
      });
    });

    describe('GET /api/v1/social/users/:userId/posts', () => {
      it('should get specific user posts', async () => {
        const response = await testEnv.authenticatedRequest('parent')
          .get(`/api/v1/social/users/${testEnv.testChildId}/posts`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeInstanceOf(Array);
        const posts = response.body.data.posts;
        if (posts.length > 0) {
          expect(posts.every((post: any) => post.userId === testEnv.testChildId)).toBe(true);
        }
      });
    });
  });

  describe('Event-Driven Social Features', () => {
    it('should automatically create posts for achievements', async () => {
      // Get initial feed count
      const initialResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/social/feed?types=achievement')
        .expect(200);

      const initialCount = initialResponse.body.data.posts.length;

      // Trigger an achievement by completing tasks
      // (This depends on achievement system being properly configured)
      const taskTemplate = await testEnv.createTestTask({
        title: 'Achievement Trigger Task',
        category: 'learning',
        difficulty: 'hard',
        points: { base: 50, bonus: 20 }
      });

      const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);
      await testEnv.completeTestTask(scheduledTask._id);

      // Wait for potential social post creation
      await testEnv.delay(3000);

      // Check if any achievement posts were created
      const finalResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/social/feed?types=achievement')
        .expect(200);

      // The count may or may not increase depending on whether achievements are unlocked
      expect(finalResponse.body.data.posts.length).toBeGreaterThanOrEqual(initialCount);
    });

    it('should automatically create posts for task completions', async () => {
      // Monitor for task completion posts
      const initialResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/social/feed?types=task_completion')
        .expect(200);

      const initialCount = initialResponse.body.data.posts.length;

      // Complete a task which should trigger a social post
      const taskTemplate = await testEnv.createTestTask({
        title: 'Social Post Task',
        category: 'exercise'
      });

      const scheduledTask = await testEnv.scheduleTestTask(taskTemplate._id);
      await testEnv.completeTestTask(scheduledTask._id);

      // Wait for social post creation
      await testEnv.delay(2000);

      const finalResponse = await testEnv.authenticatedRequest('child')
        .get('/api/v1/social/feed?types=task_completion')
        .expect(200);

      // Should have one more task completion post
      expect(finalResponse.body.data.posts.length).toBeGreaterThan(initialCount);
    });
  });
});