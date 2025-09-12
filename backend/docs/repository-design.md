# 仓储抽象层设计文档

## 设计原则

1. **数据库无关性**：抽象接口不绑定具体数据库技术
2. **事件驱动**：支持领域事件发布，实现账本化积分系统
3. **事务安全**：支持跨仓储的事务操作
4. **可扩展性**：支持MongoDB/PostgreSQL灵活切换

## 核心仓储接口设计

### 1. 积分账本仓储

```typescript
interface PointsLedgerRepository {
  // 创建积分事务
  createTransaction(tx: PointsTransaction): Promise<void>;
  
  // 获取用户余额
  getBalance(userId: string): Promise<number>;
  
  // 获取交易历史
  getHistory(userId: string, options: {
    type?: 'earned' | 'spent';
    cursor?: string;
    limit?: number;
  }): Promise<{
    transactions: PointsTransaction[];
    cursor?: string;
  }>;
  
  // 获取积分统计
  getSummary(userId: string, period: 'week' | 'month'): Promise<PointsSummary>;
}

interface PointsTransaction {
  id: string;
  userId: string;
  amount: number; // 正数为收入，负数为支出
  type: 'task_completion' | 'achievement_reward' | 'daily_bonus' | 'redemption' | 'skill_unlock';
  sourceId?: string; // 关联的任务/成就/兑换ID
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  idempotencyKey?: string;
}
```

### 2. 任务管理仓储

```typescript
interface TaskRepository {
  // 任务模板管理
  createTemplate(template: TaskTemplate): Promise<TaskTemplate>;
  getTemplate(id: string): Promise<TaskTemplate | null>;
  findTemplates(query: TaskTemplateQuery): Promise<TaskTemplate[]>;
  updateTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // 任务排期管理
  scheduleTask(schedule: ScheduledTask): Promise<ScheduledTask>;
  getScheduledTask(id: string): Promise<ScheduledTask | null>;
  findScheduledTasks(query: ScheduledTaskQuery): Promise<ScheduledTask[]>;
  updateScheduledTask(id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask>;
  deleteScheduledTask(id: string): Promise<void>;
  
  // 快速创建排期（原子操作）
  quickCreateAndSchedule(data: QuickCreateData): Promise<{
    template: TaskTemplate;
    schedule: ScheduledTask;
  }>;
  
  // 任务完成
  completeTask(taskId: string, evidence?: TaskEvidence): Promise<void>;
  
  // 任务统计
  getTaskStatistics(userId: string, period: 'week' | 'month'): Promise<TaskStatistics>;
}

interface TaskTemplate {
  id: string;
  familyId: string;
  name: string;
  description: string;
  category: 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
  difficulty: 1 | 2 | 3 | 4 | 5;
  pointsReward: number;
  xpReward: number;
  estimatedMinutes: number;
  requiresEvidence: boolean;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduledTask {
  id: string;
  templateId: string;
  userId: string;
  familyId: string;
  scheduledAt: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  evidence?: TaskEvidence;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. 用户与家庭仓储

```typescript
interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  
  // 家庭相关查询
  findFamilyMembers(familyId: string): Promise<User[]>;
  getFamilyLeaderboard(familyId: string, period: 'week' | 'month'): Promise<LeaderboardEntry[]>;
}

interface FamilyRepository {
  create(family: Family): Promise<Family>;
  findById(id: string): Promise<Family | null>;
  update(id: string, updates: Partial<Family>): Promise<Family>;
  addMember(familyId: string, userId: string): Promise<void>;
  removeMember(familyId: string, userId: string): Promise<void>;
}
```

### 4. 游戏化系统仓储

```typescript
interface GameificationRepository {
  // 经验值与等级
  updateUserXP(userId: string, xpGain: number): Promise<UserGameProfile>;
  getUserGameProfile(userId: string): Promise<UserGameProfile>;
  
  // 成就系统
  findAchievements(query: AchievementQuery): Promise<Achievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;
  claimAchievement(userId: string, achievementId: string): Promise<void>;
  
  // 连击系统
  updateStreak(userId: string, category: string): Promise<StreakRecord>;
  getStreaks(userId: string, categories?: string[]): Promise<StreakRecord[]>;
  restoreStreak(userId: string, category: string): Promise<void>;
  
  // 技能树系统
  getUserSkills(userId: string): Promise<UserSkill[]>;
  unlockSkill(userId: string, skillId: string, cost: number): Promise<void>;
}
```

### 5. 社交互动仓储

```typescript
interface SocialRepository {
  // 社交动态
  createPost(post: SocialPost): Promise<SocialPost>;
  findPosts(query: SocialPostQuery): Promise<SocialPost[]>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  
  // 评论系统
  addComment(comment: Comment): Promise<Comment>;
  getComments(postId: string, cursor?: string): Promise<Comment[]>;
  
  // 鼓励系统
  sendEncouragement(encouragement: Encouragement): Promise<Encouragement>;
  getEncouragements(userId: string, cursor?: string): Promise<Encouragement[]>;
  
  // 协作任务
  createCollabTask(task: CollabTask): Promise<CollabTask>;
  joinCollabTask(taskId: string, userId: string): Promise<void>;
  updateCollabProgress(taskId: string, userId: string, progress: number): Promise<void>;
}
```

### 6. 文件管理仓储

```typescript
interface FileRepository {
  uploadFile(file: FileUpload): Promise<FileRecord>;
  getFile(id: string): Promise<FileRecord | null>;
  deleteFile(id: string): Promise<void>;
  findFiles(query: FileQuery): Promise<FileRecord[]>;
  
  // TTL清理
  cleanExpiredFiles(): Promise<number>;
}

interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  relatedTo?: 'task' | 'avatar' | 'social';
  relatedId?: string;
  url: string;
  expiresAt?: Date;
  createdAt: Date;
}
```

### 7. 通知系统仓储

```typescript
interface NotificationRepository {
  create(notification: Notification): Promise<Notification>;
  findByUser(userId: string, query: NotificationQuery): Promise<Notification[]>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(notificationId: string, userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  
  // 批量操作
  createBatch(notifications: Notification[]): Promise<void>;
  cleanExpiredNotifications(): Promise<number>;
}
```

## 事件总线接口

```typescript
interface EventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler<any>): void;
}

interface DomainEvent<T = any> {
  id: string;
  type: string;
  payload: T;
  userId?: string;
  familyId?: string;
  timestamp: Date;
  version: number;
}

// 核心领域事件定义
type TaskCompletedEvent = DomainEvent<{
  taskId: string;
  userId: string;
  pointsEarned: number;
  xpEarned: number;
  category: string;
}>;

type StreakUpdatedEvent = DomainEvent<{
  userId: string;
  category: string;
  newCount: number;
  milestoneReached?: number;
}>;

type AchievementUnlockedEvent = DomainEvent<{
  userId: string;
  achievementId: string;
  pointsRewarded: number;
}>;
```

## 数据库技术选型对比

### MongoDB方案优势
```typescript
class MongoTaskRepository implements TaskRepository {
  private collection: Collection<TaskTemplate>;
  
  async quickCreateAndSchedule(data: QuickCreateData) {
    const session = this.client.startSession();
    try {
      await session.withTransaction(async () => {
        const template = await this.createTemplate(data.template);
        const schedule = await this.scheduleTask({
          ...data.schedule,
          templateId: template.id
        });
        return { template, schedule };
      });
    } finally {
      await session.endSession();
    }
  }
  
  // 利用MongoDB聚合管道优势
  async getTaskStatistics(userId: string, period: string) {
    return await this.collection.aggregate([
      { $match: { userId, createdAt: { $gte: periodStart } } },
      { $group: { 
        _id: '$category', 
        completed: { $sum: 1 },
        totalPoints: { $sum: '$pointsEarned' }
      }}
    ]).toArray();
  }
}
```

### PostgreSQL方案优势
```typescript
class PostgresTaskRepository implements TaskRepository {
  async quickCreateAndSchedule(data: QuickCreateData) {
    return await this.db.transaction(async (tx) => {
      const template = await tx.taskTemplates.create(data.template);
      const schedule = await tx.scheduledTasks.create({
        ...data.schedule,
        templateId: template.id
      });
      return { template, schedule };
    });
  }
  
  // 利用PostgreSQL复杂查询优势
  async getFamilyAnalytics(familyId: string) {
    return await this.db.query(`
      WITH daily_stats AS (
        SELECT user_id, DATE(completed_at) as date, 
               COUNT(*) as tasks_completed,
               SUM(points_earned) as points_earned
        FROM scheduled_tasks 
        WHERE family_id = $1 AND status = 'completed'
        GROUP BY user_id, DATE(completed_at)
      )
      SELECT u.name, ds.date, ds.tasks_completed, ds.points_earned,
             ROW_NUMBER() OVER (PARTITION BY ds.date ORDER BY ds.points_earned DESC) as rank
      FROM daily_stats ds
      JOIN users u ON ds.user_id = u.id
      ORDER BY ds.date DESC, ds.points_earned DESC
    `, [familyId]);
  }
}
```

## 推荐技术方案

基于项目特点，推荐使用 **MongoDB** 作为主数据库：

### 选择理由
1. **灵活Schema**：游戏化数据结构变化频繁
2. **聚合能力**：统计分析功能强大
3. **TTL支持**：自动清理过期文件和通知
4. **横向扩展**：支持未来用户量增长
5. **JSON原生**：与Node.js/TypeScript完美集成

### 关键集合设计

```javascript
// users 集合
{
  _id: ObjectId,
  email: "user@example.com",
  name: "张三",
  role: "student", // "student" | "parent"
  familyId: ObjectId,
  gameProfile: {
    level: 5,
    xp: 1250,
    totalPoints: 2800,
    dailyGoal: 100,
    streaks: {
      exercise: { count: 7, lastUpdate: ISODate },
      reading: { count: 3, lastUpdate: ISODate }
    }
  },
  createdAt: ISODate,
  updatedAt: ISODate
}

// points_ledger 集合（账本化核心）
{
  _id: ObjectId,
  userId: ObjectId,
  amount: 50, // 正数收入，负数支出
  type: "task_completion",
  sourceId: ObjectId, // 关联的任务ID
  balanceBefore: 200,
  balanceAfter: 250,
  metadata: {
    taskName: "完成数学作业",
    category: "learning"
  },
  createdAt: ISODate,
  idempotencyKey: "unique-key-123"
}

// scheduled_tasks 集合
{
  _id: ObjectId,
  templateId: ObjectId,
  userId: ObjectId,
  familyId: ObjectId,
  scheduledAt: ISODate,
  status: "completed",
  evidence: {
    fileIds: [ObjectId],
    notes: "已完成所有练习题"
  },
  completedAt: ISODate,
  createdAt: ISODate,
  // TTL索引支持
  expiresAt: ISODate
}
```

### 索引策略

```javascript
// 高频查询索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ familyId: 1 });

db.points_ledger.createIndex({ userId: 1, createdAt: -1 });
db.points_ledger.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });

db.scheduled_tasks.createIndex({ userId: 1, scheduledAt: -1 });
db.scheduled_tasks.createIndex({ familyId: 1, status: 1 });
db.scheduled_tasks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 复合索引优化聚合查询
db.scheduled_tasks.createIndex({ 
  familyId: 1, 
  status: 1, 
  completedAt: -1 
});
```

## 下一步工作

1. 实现仓储接口的MongoDB具体实现
2. 搭建事件总线系统
3. 设计统一中间件体系
4. 实现模块化单体架构