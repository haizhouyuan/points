# 数据模型设计文档

## MongoDB集合设计

### 1. users - 用户信息

```javascript
{
  _id: ObjectId("..."),
  email: "student@example.com",
  passwordHash: "$2b$10$...",
  name: "小明",
  avatar: "https://...",
  role: "student", // "student" | "parent"
  familyId: ObjectId("..."),
  
  // 游戏化档案
  gameProfile: {
    level: 5,
    xp: 1250,
    nextLevelXP: 2500,
    totalPoints: 2800,
    dailyGoal: 100,
    dailyXP: 75,
    lastDailyReset: ISODate("2024-01-15T00:00:00Z"),
    
    // 生命值系统
    lives: {
      current: 3,
      max: 5,
      lastUsed: ISODate("2024-01-15T10:30:00Z"),
      restoreTime: ISODate("2024-01-15T11:00:00Z") // 下次自然恢复时间
    },
    
    // 连击记录
    streaks: {
      exercise: {
        count: 7,
        lastUpdate: ISODate("2024-01-15T00:00:00Z"),
        bestStreak: 15,
        restoredToday: false
      },
      reading: {
        count: 3,
        lastUpdate: ISODate("2024-01-14T00:00:00Z"),
        bestStreak: 21,
        restoredToday: false
      },
      chores: {
        count: 0,
        lastUpdate: ISODate("2024-01-10T00:00:00Z"),
        bestStreak: 8,
        restoredToday: false
      }
    }
  },
  
  // 通知设置
  notificationSettings: {
    push: true,
    email: false,
    sound: true,
    quietHours: {
      enabled: true,
      start: "22:00",
      end: "08:00"
    },
    types: {
      achievement: true,
      social: true,
      task: true,
      system: true,
      reminder: true,
      family: true
    }
  },
  
  // 个性化头像配置
  avatarConfig: {
    body: "default",
    hair: "short_black",
    clothes: "school_uniform",
    accessories: ["glasses", "badge_honor"],
    background: "study_room",
    unlocked: ["hair_long_brown", "clothes_casual"]
  },
  
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T12:00:00Z"),
  lastLogin: ISODate("2024-01-15T08:00:00Z")
}
```

### 2. families - 家庭信息

```javascript
{
  _id: ObjectId("..."),
  name: "张家",
  inviteCode: "ABC123", // 6位邀请码
  settings: {
    taskApprovalRequired: true, // 任务完成需要家长审批
    pointsRedemptionApprovalRequired: true,
    dailyTaskLimit: 10,
    weeklyPointsLimit: 1000
  },
  
  // 家庭挑战
  currentChallenge: {
    id: ObjectId("..."),
    name: "本周阅读挑战",
    description: "家庭成员合计阅读10本书",
    target: 10,
    current: 7,
    startDate: ISODate("2024-01-14T00:00:00Z"),
    endDate: ISODate("2024-01-21T00:00:00Z"),
    participants: [ObjectId("user1"), ObjectId("user2")],
    rewards: {
      points: 200,
      badge: "family_reader"
    }
  },
  
  createdBy: ObjectId("..."), // 创建者(家长)
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T00:00:00Z")
}
```

### 3. points_ledger - 积分账本（核心）

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  familyId: ObjectId("..."), // 家庭隔离
  
  // 积分变更信息
  amount: 50, // 正数为收入，负数为支出
  type: "task_completion", // "task_completion" | "achievement_reward" | "daily_bonus" | "redemption" | "skill_unlock"
  
  // 关联信息
  sourceId: ObjectId("..."), // 关联的任务/成就/兑换ID
  sourceType: "scheduled_task", // "scheduled_task" | "achievement" | "redemption"
  
  // 账本核心：余额快照
  balanceBefore: 200,
  balanceAfter: 250,
  
  // 审计信息
  metadata: {
    taskName: "完成数学作业",
    category: "learning",
    difficulty: 3,
    approvedBy: ObjectId("parent_id"), // 如需家长审批
    approvedAt: ISODate("2024-01-15T10:00:00Z")
  },
  
  // 幂等性保护
  idempotencyKey: "task_complete_64f2c8e1_20240115", // 唯一键防重复
  
  createdAt: ISODate("2024-01-15T09:30:00Z"),
  
  // 用于统计查询的预计算字段
  date: ISODate("2024-01-15T00:00:00Z"), // 按日期分组
  week: "2024-W03", // 按周分组
  month: "2024-01" // 按月分组
}
```

### 4. task_templates - 任务模板

```javascript
{
  _id: ObjectId("..."),
  familyId: ObjectId("..."), // 家庭隔离
  
  name: "完成数学作业",
  description: "完成今日数学课后习题，包括计算题和应用题",
  category: "learning", // "exercise" | "reading" | "chores" | "learning" | "creativity" | "other"
  difficulty: 3, // 1-5级难度
  
  // 奖励设置
  pointsReward: 50,
  xpReward: 30,
  
  // 任务属性
  estimatedMinutes: 60,
  requiresEvidence: true, // 是否需要证据
  evidenceTypes: ["photo", "text"], // 支持的证据类型
  
  // 技能关联
  skillCategories: ["math", "problem_solving"],
  
  tags: ["homework", "math", "daily"],
  
  // 重复设置
  recurrence: {
    type: "daily", // "once" | "daily" | "weekly" | "custom"
    daysOfWeek: [1, 2, 3, 4, 5], // 周一到周五
    endDate: ISODate("2024-06-30T00:00:00Z")
  },
  
  isActive: true,
  createdBy: ObjectId("..."), // 创建者
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T00:00:00Z")
}
```

### 5. scheduled_tasks - 任务排期

```javascript
{
  _id: ObjectId("..."),
  templateId: ObjectId("..."),
  userId: ObjectId("..."),
  familyId: ObjectId("..."), // 家庭隔离
  
  // 排期信息
  scheduledAt: ISODate("2024-01-15T14:00:00Z"),
  estimatedDuration: 60, // 预计用时(分钟)
  
  // 状态跟踪
  status: "completed", // "planned" | "in_progress" | "completed" | "skipped" | "expired"
  startedAt: ISODate("2024-01-15T14:05:00Z"),
  completedAt: ISODate("2024-01-15T15:20:00Z"),
  actualDuration: 75, // 实际用时
  
  // 证据信息
  evidence: {
    type: "photo_and_text",
    fileIds: [ObjectId("file1"), ObjectId("file2")],
    notes: "已完成所有练习题，遇到一道应用题需要查阅资料",
    submittedAt: ISODate("2024-01-15T15:20:00Z")
  },
  
  // 审批流程（如需要）
  approval: {
    required: true,
    status: "approved", // "pending" | "approved" | "rejected"
    reviewedBy: ObjectId("parent_id"),
    reviewedAt: ISODate("2024-01-15T16:00:00Z"),
    reviewNotes: "完成质量很好，继续保持"
  },
  
  // 奖励发放记录
  rewards: {
    pointsEarned: 50,
    xpEarned: 30,
    bonusMultiplier: 1.2, // 连击奖励倍率
    distributedAt: ISODate("2024-01-15T16:00:00Z"),
    ledgerEntryId: ObjectId("...") // 关联的积分账本记录
  },
  
  notes: "今天状态不错，比平时完成得快",
  
  // 协作任务相关（可选）
  collaboration: {
    isCollaborative: false,
    teamId: ObjectId("..."),
    contributionPercentage: 100
  },
  
  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T16:00:00Z"),
  
  // TTL索引支持 - 30天后自动删除已完成任务
  expiresAt: ISODate("2024-02-14T16:00:00Z")
}
```

### 6. achievements - 成就定义

```javascript
{
  _id: ObjectId("..."),
  
  name: "数学小能手",
  description: "连续7天完成数学作业",
  icon: "math_star",
  category: "milestone", // "milestone" | "streak" | "social" | "skill" | "special"
  rarity: "rare", // "common" | "rare" | "epic" | "legendary"
  
  // 解锁条件
  criteria: {
    type: "streak",
    category: "learning",
    subcategory: "math",
    target: 7,
    timeframe: "consecutive_days"
  },
  
  // 奖励配置
  rewards: {
    points: 100,
    xp: 50,
    badge: "math_master",
    avatarItem: "accessory_calculator"
  },
  
  // 统计信息
  unlockedCount: 245, // 解锁次数
  claimedCount: 200, // 领取次数
  
  isActive: true,
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

### 7. user_achievements - 用户成就状态

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  achievementId: ObjectId("..."),
  familyId: ObjectId("..."),
  
  status: "claimed", // "locked" | "unlocked" | "claimed"
  
  // 解锁信息
  unlockedAt: ISODate("2024-01-15T15:20:00Z"),
  progress: {
    current: 7,
    target: 7,
    percentage: 100
  },
  
  // 领取信息
  claimedAt: ISODate("2024-01-15T16:00:00Z"),
  rewardsDistributed: {
    points: 100,
    xp: 50,
    ledgerEntryId: ObjectId("...")
  },
  
  createdAt: ISODate("2024-01-08T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T16:00:00Z")
}
```

### 8. skills - 技能树定义

```javascript
{
  _id: ObjectId("..."),
  
  name: "时间管理大师",
  description: "学会合理安排时间，提高学习效率",
  category: "life_skills", // "academic" | "life_skills" | "creativity" | "social" | "physical"
  icon: "clock_mastery",
  
  // 技能等级
  maxLevel: 5,
  xpPerLevel: [100, 250, 500, 1000, 2000],
  
  // 解锁条件
  prerequisites: [ObjectId("basic_planning_skill")],
  unlockCost: {
    points: 200,
    level: 10 // 用户等级要求
  },
  
  // 每级技能任务
  levelTasks: [
    {
      level: 1,
      tasks: ["制定每日学习计划", "按时完成作业"],
      xpReward: 50
    },
    {
      level: 2,
      tasks: ["制定周计划", "使用番茄工作法"],
      xpReward: 100
    }
  ],
  
  // 技能效果
  effects: {
    type: "task_efficiency", // 技能效果类型
    bonus: 0.1 // 10% 任务完成速度提升
  },
  
  isActive: true,
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

### 9. user_skills - 用户技能进度

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  skillId: ObjectId("..."),
  familyId: ObjectId("..."),
  
  // 技能状态
  isUnlocked: true,
  currentLevel: 2,
  currentXP: 150,
  nextLevelXP: 250,
  
  // 任务完成进度
  levelProgress: {
    level: 2,
    completedTasks: ["制定周计划"],
    pendingTasks: ["使用番茄工作法"],
    canLevelUp: false
  },
  
  unlockedAt: ISODate("2024-01-10T00:00:00Z"),
  lastLevelUpAt: ISODate("2024-01-12T00:00:00Z"),
  
  createdAt: ISODate("2024-01-10T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T00:00:00Z")
}
```

### 10. social_posts - 社交动态

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  familyId: ObjectId("..."), // 家庭范围可见
  
  content: "今天完成了数学作业，感觉很有成就感！",
  type: "task_completion", // "task_completion" | "achievement" | "general" | "challenge_progress"
  
  // 关联内容
  relatedTo: {
    type: "scheduled_task",
    id: ObjectId("..."),
    metadata: {
      taskName: "完成数学作业",
      pointsEarned: 50
    }
  },
  
  // 媒体文件
  attachments: [
    {
      type: "image",
      fileId: ObjectId("..."),
      thumbnail: "https://..."
    }
  ],
  
  // 互动统计
  likes: {
    count: 8,
    users: [ObjectId("user1"), ObjectId("user2")]
  },
  comments: {
    count: 3,
    latest: {
      userId: ObjectId("parent"),
      content: "做得很好！",
      createdAt: ISODate("2024-01-15T16:30:00Z")
    }
  },
  
  // 可见性设置
  visibility: "family", // "family" | "public"
  
  createdAt: ISODate("2024-01-15T16:00:00Z"),
  updatedAt: ISODate("2024-01-15T16:30:00Z"),
  
  // TTL - 90天后自动删除
  expiresAt: ISODate("2024-04-15T16:00:00Z")
}
```

### 11. rewards - 奖励商店

```javascript
{
  _id: ObjectId("..."),
  familyId: ObjectId("..."), // 每个家庭可以自定义奖励
  
  name: "额外30分钟游戏时间",
  description: "可以延长今天的游戏时间30分钟",
  category: "time_privilege", // "physical_item" | "time_privilege" | "activity_choice" | "special_treat"
  
  // 价格与库存
  pointsCost: 100,
  stock: {
    type: "unlimited", // "unlimited" | "limited" | "daily"
    remaining: null,
    dailyLimit: 1 // 每天最多兑换1次
  },
  
  // 兑换限制
  restrictions: {
    minLevel: 5, // 最低等级要求
    maxPerWeek: 3, // 每周最多兑换次数
    parentApprovalRequired: true // 需要家长审批
  },
  
  icon: "game_controller",
  image: "https://...",
  
  isActive: true,
  createdBy: ObjectId("parent_id"),
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T00:00:00Z")
}
```

### 12. redemptions - 兑换申请

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  rewardId: ObjectId("..."),
  familyId: ObjectId("..."),
  
  // 兑换信息
  pointsCost: 100,
  status: "approved", // "pending" | "approved" | "rejected" | "fulfilled"
  
  // 审批流程
  approval: {
    reviewedBy: ObjectId("parent_id"),
    reviewedAt: ISODate("2024-01-15T18:00:00Z"),
    reviewNotes: "今天表现很好，同意兑换"
  },
  
  // 履行记录
  fulfillment: {
    fulfilledBy: ObjectId("parent_id"),
    fulfilledAt: ISODate("2024-01-15T19:00:00Z"),
    fulfillmentNotes: "已经给予额外游戏时间"
  },
  
  // 积分结算
  pointsTransaction: {
    ledgerEntryId: ObjectId("..."), // 关联的积分账本记录
    processedAt: ISODate("2024-01-15T18:00:00Z")
  },
  
  requestNotes: "完成了本周所有任务，希望能兑换游戏时间",
  idempotencyKey: "redemption_reward123_20240115",
  
  createdAt: ISODate("2024-01-15T17:00:00Z"),
  updatedAt: ISODate("2024-01-15T19:00:00Z"),
  
  // TTL - 60天后自动删除已履行的兑换记录
  expiresAt: ISODate("2024-03-16T19:00:00Z")
}
```

### 13. notifications - 通知消息

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  familyId: ObjectId("..."),
  
  // 通知内容
  type: "achievement", // "achievement" | "social" | "task" | "system" | "reminder" | "family"
  title: "🎉 恭喜解锁新成就！",
  content: "你获得了"数学小能手"成就，获得100积分奖励！",
  
  // 关联数据
  relatedTo: {
    type: "achievement",
    id: ObjectId("..."),
    metadata: {
      achievementName: "数学小能手",
      pointsRewarded: 100
    }
  },
  
  // 状态管理
  isRead: false,
  readAt: null,
  priority: "normal", // "low" | "normal" | "high" | "urgent"
  
  // 展示设置
  icon: "trophy",
  color: "gold",
  actionButton: {
    text: "查看成就",
    action: "navigate",
    target: "/achievements"
  },
  
  createdAt: ISODate("2024-01-15T16:00:00Z"),
  
  // TTL - 30天后自动删除已读通知
  expiresAt: ISODate("2024-02-14T16:00:00Z")
}
```

### 14. files - 文件管理

```javascript
{
  _id: ObjectId("..."),
  
  // 文件信息
  filename: "20240115_math_homework_evidence.jpg",
  originalName: "数学作业完成照片.jpg",
  mimeType: "image/jpeg",
  size: 245760, // 字节
  hash: "sha256:abc123...", // 文件hash，用于去重
  
  // 存储信息
  storage: {
    type: "local", // "local" | "s3" | "minio"
    path: "/uploads/2024/01/15/abc123.jpg",
    url: "/api/v1/files/64f2c8e1/view",
    thumbnail: "/api/v1/files/64f2c8e1/thumbnail" // 缩略图
  },
  
  // 关联信息
  uploadedBy: ObjectId("..."),
  familyId: ObjectId("..."), // 家庭隔离
  relatedTo: "task", // "task" | "avatar" | "social" | "achievement"
  relatedId: ObjectId("..."), // 关联的任务ID
  
  // 访问控制
  access: {
    type: "family", // "private" | "family" | "public"
    allowedUsers: [ObjectId("...")], // 特定用户访问权限
  },
  
  // 文件分析结果（可选）
  analysis: {
    isImage: true,
    dimensions: { width: 1920, height: 1080 },
    hasText: true, // OCR检测结果
    safetyCheck: "passed" // 内容安全检查
  },
  
  createdAt: ISODate("2024-01-15T15:20:00Z"),
  
  // TTL - 未关联的文件7天后自动删除
  expiresAt: ISODate("2024-01-22T15:20:00Z")
}
```

### 15. collab_tasks - 协作任务

```javascript
{
  _id: ObjectId("..."),
  familyId: ObjectId("..."),
  
  title: "家庭大扫除",
  description: "全家一起进行春节前大扫除，分工合作完成各个区域的清洁工作",
  category: "chores",
  
  // 协作设置
  maxParticipants: 4,
  currentParticipants: 3,
  participants: [
    {
      userId: ObjectId("..."),
      role: "leader", // "leader" | "member"
      joinedAt: ISODate("2024-01-14T10:00:00Z"),
      progress: 75,
      tasks: ["客厅清洁", "厨房整理"],
      completedTasks: ["客厅清洁"]
    }
  ],
  
  // 任务进度
  progress: {
    current: 225, // 总进度点
    target: 300,
    percentage: 75
  },
  
  // 里程碑设置
  milestones: [
    {
      target: 25,
      reward: { points: 50, xp: 30 },
      achieved: true,
      achievedAt: ISODate("2024-01-14T15:00:00Z")
    },
    {
      target: 50,
      reward: { points: 100, xp: 60 },
      achieved: true,
      achievedAt: ISODate("2024-01-15T10:00:00Z")
    }
  ],
  
  // 奖励分配
  rewards: {
    completion: { points: 200, xp: 150 },
    distribution: "equal", // "equal" | "proportional"
  },
  
  status: "active", // "open" | "active" | "completed" | "cancelled"
  startDate: ISODate("2024-01-14T00:00:00Z"),
  endDate: ISODate("2024-01-16T23:59:59Z"),
  
  createdBy: ObjectId("parent_id"),
  createdAt: ISODate("2024-01-14T09:00:00Z"),
  updatedAt: ISODate("2024-01-15T16:00:00Z")
}
```

## 索引策略设计

### 查询优化索引

```javascript
// 用户相关查询
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ familyId: 1 });
db.users.createIndex({ familyId: 1, role: 1 });

// 积分账本查询优化
db.points_ledger.createIndex({ userId: 1, createdAt: -1 });
db.points_ledger.createIndex({ familyId: 1, date: -1 });
db.points_ledger.createIndex({ userId: 1, type: 1, createdAt: -1 });
db.points_ledger.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });

// 任务查询优化
db.scheduled_tasks.createIndex({ userId: 1, scheduledAt: -1 });
db.scheduled_tasks.createIndex({ familyId: 1, status: 1, scheduledAt: -1 });
db.scheduled_tasks.createIndex({ userId: 1, status: 1 });
db.scheduled_tasks.createIndex({ templateId: 1, createdAt: -1 });

// 成就查询优化
db.user_achievements.createIndex({ userId: 1, status: 1 });
db.user_achievements.createIndex({ userId: 1, achievementId: 1 }, { unique: true });
db.user_achievements.createIndex({ familyId: 1, status: 1, unlockedAt: -1 });

// 社交功能优化
db.social_posts.createIndex({ familyId: 1, createdAt: -1 });
db.social_posts.createIndex({ userId: 1, createdAt: -1 });
db.social_posts.createIndex({ familyId: 1, type: 1, createdAt: -1 });

// 通知查询优化
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, type: 1, isRead: 1 });

// 文件管理优化
db.files.createIndex({ uploadedBy: 1, createdAt: -1 });
db.files.createIndex({ familyId: 1, relatedTo: 1, relatedId: 1 });
db.files.createIndex({ hash: 1 }); // 去重检查
```

### TTL索引（自动清理）

```javascript
// 过期任务清理 - 完成后30天删除
db.scheduled_tasks.createIndex(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }
);

// 过期通知清理 - 已读后30天删除
db.notifications.createIndex(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }
);

// 临时文件清理 - 未关联文件7天删除
db.files.createIndex(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }
);

// 社交动态清理 - 90天后自动删除
db.social_posts.createIndex(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }
);
```

### 复合索引（复杂查询优化）

```javascript
// 家庭排行榜查询
db.points_ledger.createIndex({
  familyId: 1,
  week: 1,
  userId: 1
});

// 任务完成统计
db.scheduled_tasks.createIndex({
  userId: 1,
  status: 1,
  completedAt: -1
});

// 成就解锁统计
db.user_achievements.createIndex({
  familyId: 1,
  status: 1,
  unlockedAt: -1
});

// 协作任务参与者查询
db.collab_tasks.createIndex({
  familyId: 1,
  status: 1,
  "participants.userId": 1
});
```

## 数据一致性策略

### 1. 积分账本ACID保证

```javascript
// 使用MongoDB事务确保积分变更的原子性
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    // 1. 创建积分账本记录
    await pointsLedger.insertOne({
      userId,
      amount: pointsEarned,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + pointsEarned,
      // ... 其他字段
    }, { session });
    
    // 2. 更新用户积分缓存
    await users.updateOne(
      { _id: userId },
      { $inc: { "gameProfile.totalPoints": pointsEarned } },
      { session }
    );
    
    // 3. 更新任务状态
    await scheduledTasks.updateOne(
      { _id: taskId },
      { $set: { status: "completed", rewards: { pointsEarned } } },
      { session }
    );
  });
} finally {
  await session.endSession();
}
```

### 2. 连击更新策略

```javascript
// 每日连击检查与更新
async function updateDailyStreaks(userId) {
  const today = new Date().toISOString().split('T')[0];
  const user = await db.users.findOne({ _id: userId });
  
  for (const [category, streak] of Object.entries(user.gameProfile.streaks)) {
    const lastUpdateDate = streak.lastUpdate.toISOString().split('T')[0];
    const daysDiff = Math.floor((new Date(today) - new Date(lastUpdateDate)) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // 连续，增加连击
      streak.count += 1;
      streak.lastUpdate = new Date(today);
    } else if (daysDiff > 1) {
      // 中断，重置连击
      streak.count = 0;
      streak.lastUpdate = new Date(today);
    }
    // daysDiff === 0: 今天已更新，无需处理
  }
  
  await db.users.updateOne(
    { _id: userId },
    { $set: { "gameProfile.streaks": user.gameProfile.streaks } }
  );
}
```

### 3. 缓存一致性

```javascript
// 用户余额缓存策略
class PointsService {
  async getBalance(userId) {
    // 1. 尝试从缓存获取
    let balance = await redis.get(`balance:${userId}`);
    if (balance !== null) return parseInt(balance);
    
    // 2. 从积分账本计算实时余额
    const result = await db.points_ledger.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $group: { _id: null, balance: { $sum: "$amount" } } }
    ]);
    
    balance = result[0]?.balance || 0;
    
    // 3. 更新缓存（5分钟过期）
    await redis.setex(`balance:${userId}`, 300, balance);
    
    return balance;
  }
}
```

## 家庭权限隔离策略

### 1. 数据访问控制

```javascript
// 中间件：家庭数据隔离
function familyIsolationMiddleware(req, res, next) {
  const user = req.user;
  const resourceFamilyId = req.params.familyId || req.body.familyId;
  
  // 检查用户是否有权限访问该家庭数据
  if (resourceFamilyId && user.familyId.toString() !== resourceFamilyId) {
    return res.status(403).json({
      code: 'AUTHORIZATION_FAILED',
      message: '无权访问其他家庭数据'
    });
  }
  
  // 自动添加家庭过滤条件
  req.familyFilter = { familyId: user.familyId };
  next();
}
```

### 2. 查询自动过滤

```javascript
// 仓储层自动添加家庭过滤
class MongoTaskRepository {
  async findScheduledTasks(query, user) {
    return await db.scheduled_tasks.find({
      ...query,
      familyId: user.familyId // 自动添加家庭过滤
    }).toArray();
  }
}
```

## 性能优化策略

### 1. 聚合预计算

```javascript
// 定时任务：预计算每日统计
async function precomputeDailyStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 计算每个家庭的排行榜
  const leaderboards = await db.points_ledger.aggregate([
    {
      $match: {
        createdAt: { $gte: today },
        amount: { $gt: 0 } // 只统计收入
      }
    },
    {
      $group: {
        _id: { familyId: "$familyId", userId: "$userId" },
        dailyPoints: { $sum: "$amount" },
        taskCount: { $sum: 1 }
      }
    },
    {
      $sort: { dailyPoints: -1 }
    }
  ]);
  
  // 将结果存储到Redis缓存
  for (const family of groupBy(leaderboards, 'familyId')) {
    await redis.setex(
      `leaderboard:${family.familyId}:${today.toISOString().split('T')[0]}`,
      86400, // 24小时
      JSON.stringify(family.members)
    );
  }
}
```

### 2. 读写分离

```javascript
// 写操作使用主库，读操作使用从库
const readDB = mongoose.connection.useDb('summer_vacation_read');
const writeDB = mongoose.connection.useDb('summer_vacation_write');

class TaskService {
  async createTask(data) {
    return await writeDB.scheduledTasks.create(data);
  }
  
  async findTasks(query) {
    return await readDB.scheduledTasks.find(query);
  }
}
```

这个数据模型设计确保了：
- **数据完整性**：通过事务保证关键操作的ACID特性
- **查询性能**：合理的索引策略支持高频查询
- **自动清理**：TTL索引自动清理过期数据
- **安全隔离**：家庭级别的数据隔离
- **可扩展性**：支持未来功能扩展和数据量增长