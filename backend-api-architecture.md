# 暑期规划应用后端API架构设计

## 1. API设计规范

### 1.1 统一API前缀
所有API端点使用 `/api/v1` 前缀，确保版本化管理。

### 1.2 统一错误响应格式
```typescript
interface ApiError {
  code: string;           // 错误代码，如 "INSUFFICIENT_POINTS"
  message: string;        // 用户友好的错误消息
  details?: any;          // 详细错误信息（可选）
  requestId: string;      // 请求追踪ID
}
```

### 1.3 统一分页格式
```typescript
interface PaginationQuery {
  limit?: number;         // 默认20，最大100
  cursor?: string;        // 游标分页
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasNext: boolean;
    nextCursor?: string;
    total?: number;       // 仅在可高效计算时提供
  };
}
```

### 1.4 幂等性支持
所有写操作（POST/PUT/DELETE）支持 `Idempotency-Key` 请求头，确保重复请求的安全性。

### 1.5 并发控制
关键资源操作支持 `If-Match` / `ETag` 头进行乐观锁控制。

## 2. 积分账本化设计

### 2.1 积分事件类型
```typescript
enum PointsEventType {
  TASK_COMPLETION = 'task_completion',
  MILESTONE_REWARD = 'milestone_reward', 
  DAILY_REWARD = 'daily_reward',
  REDEMPTION = 'redemption',
  ADMIN_ADJUSTMENT = 'admin_adjustment'
}
```

### 2.2 积分账本记录
```typescript
interface PointsLedgerEntry {
  id: string;
  userId: string;
  amount: number;          // 正数为获得，负数为消费
  eventType: PointsEventType;
  eventId: string;         // 关联事件ID（任务ID、成就ID等）
  balanceBefore: number;   // 变更前余额
  balanceAfter: number;    // 变更后余额
  metadata: Record<string, any>; // 额外元数据
  createdAt: Date;
  familyId: string;        // 家庭隔离
}
```

## 3. 完整API端点设计

### 3.1 认证授权与家庭管理

#### 认证相关
```
POST   /api/v1/auth/register               # 用户注册
POST   /api/v1/auth/login                  # 用户登录
POST   /api/v1/auth/logout                 # 用户登出
POST   /api/v1/auth/refresh-token          # 刷新访问令牌
POST   /api/v1/auth/forgot-password        # 忘记密码
POST   /api/v1/auth/reset-password         # 重置密码
POST   /api/v1/auth/verify-email           # 邮箱验证
```

#### 家庭管理
```
POST   /api/v1/families                    # 创建家庭
GET    /api/v1/families/{familyId}         # 获取家庭信息
PUT    /api/v1/families/{familyId}         # 更新家庭信息
DELETE /api/v1/families/{familyId}         # 删除家庭
GET    /api/v1/families/{familyId}/members # 获取家庭成员
POST   /api/v1/families/{familyId}/members # 邀请家庭成员
DELETE /api/v1/families/{familyId}/members/{userId} # 移除成员
GET    /api/v1/families/{familyId}/leaderboard?period=week|month&includeGrowth=true # 排行榜
POST   /api/v1/families/join/{inviteCode}  # 通过邀请码加入家庭
```

#### 用户管理
```
GET    /api/v1/users/profile               # 获取用户信息
PUT    /api/v1/users/profile               # 更新用户信息
PUT    /api/v1/users/password              # 修改密码
DELETE /api/v1/users/account               # 删除账户
```

### 3.2 积分账本系统

#### 积分查询（只读）
```
GET    /api/v1/points/balance              # 获取当前积分余额
GET    /api/v1/points/ledger?type=&cursor=&limit= # 获取积分账本历史
GET    /api/v1/points/summary?period=week|month   # 积分获得统计
```

**注意：** 删除所有直接操作积分的写接口，积分变动通过事件驱动自动生成

### 3.3 任务管理系统

#### 任务模板管理
```
GET    /api/v1/task-templates?q=&category=&difficulty= # 搜索任务模板
POST   /api/v1/task-templates               # 创建任务模板
GET    /api/v1/task-templates/{id}          # 获取模板详情
PUT    /api/v1/task-templates/{id}          # 更新任务模板
DELETE /api/v1/task-templates/{id}          # 删除任务模板
```

#### 任务排期管理
```
GET    /api/v1/scheduled-tasks?from=&to=&userId= # 获取任务排期
POST   /api/v1/scheduled-tasks               # 创建任务排期
GET    /api/v1/scheduled-tasks/{id}          # 获取排期详情
PATCH  /api/v1/scheduled-tasks/{id}          # 更新任务排期
DELETE /api/v1/scheduled-tasks/{id}          # 删除任务排期 (新增)
```

#### 快速任务操作
```
POST   /api/v1/tasks/quick-create-and-schedule # 原子化快速创建并排期 (新增)
POST   /api/v1/scheduled-tasks/{id}/complete   # 完成任务
POST   /api/v1/scheduled-tasks/{id}/skip       # 跳过任务
POST   /api/v1/scheduled-tasks/{id}/evidence   # 提交证据
```

#### 任务历史
```
GET    /api/v1/tasks/history?userId=&cursor=&status= # 任务完成历史
GET    /api/v1/tasks/statistics?userId=&period=     # 任务完成统计
```

### 3.4 文件上传与证据管理

#### 文件管理 (新增完整支持)
```
POST   /api/v1/files                        # 文件上传 (新增)
GET    /api/v1/files/{fileId}               # 获取文件信息
GET    /api/v1/files/{fileId}/download      # 下载文件
DELETE /api/v1/files/{fileId}               # 删除文件
GET    /api/v1/files?taskId=&cursor=&limit= # 获取关联文件列表
POST   /api/v1/files/{fileId}/review        # 家长审核证据
```

#### 文件上传预签名（支持大文件）
```
POST   /api/v1/files/upload-url             # 获取预签名上传URL
POST   /api/v1/files/upload-complete        # 通知上传完成
```

### 3.5 游戏化系统

#### 经验值与等级系统
```
GET    /api/v1/xp/profile                   # 获取经验值档案
GET    /api/v1/xp/daily-goal               # 获取每日经验值目标
PUT    /api/v1/xp/daily-goal               # 设置每日目标
POST   /api/v1/xp/daily-reward/claim       # 领取每日奖励
```

#### 生命值系统
```
GET    /api/v1/lives                       # 获取生命值状态
POST   /api/v1/lives/buy/{packageId}       # 购买生命值套餐
POST   /api/v1/lives/restore-by-ad         # 观看广告恢复生命值
```

#### 连击系统 (语义化修正)
```
GET    /api/v1/streaks?categories=          # 获取连击统计 (修正)
POST   /api/v1/streaks/{category}/restore   # 修复连击 (修正)  
POST   /api/v1/streaks/{category}/milestones/{n}/claim # 领取里程碑奖励
```

#### 成就系统 (移除手动解锁)
```
GET    /api/v1/achievements?user=me&status=&category= # 获取成就列表
POST   /api/v1/achievements/{id}/claim      # 领取成就奖励
GET    /api/v1/achievements/progress        # 获取成就进度
```

#### 技能树系统
```
GET    /api/v1/skills                       # 获取技能模板
GET    /api/v1/user-skills                  # 获取用户技能进度
POST   /api/v1/skills/{skillId}/unlock      # 解锁技能
POST   /api/v1/skills/{skillId}/tasks/{taskId}/start   # 开始技能任务
POST   /api/v1/skills/{skillId}/tasks/{taskId}/complete # 完成技能任务
```

### 3.6 社交互动系统

#### 社交动态 (修正子资源路径)
```
GET    /api/v1/social/posts?familyId=&cursor=&limit= # 获取动态列表
POST   /api/v1/social/posts                 # 发布动态
GET    /api/v1/social/posts/{postId}        # 获取动态详情
PUT    /api/v1/social/posts/{postId}        # 编辑动态
DELETE /api/v1/social/posts/{postId}        # 删除动态
POST   /api/v1/social/posts/{postId}/like   # 点赞动态
DELETE /api/v1/social/posts/{postId}/like   # 取消点赞
GET    /api/v1/social/posts/{postId}/comments # 获取评论列表
POST   /api/v1/social/posts/{postId}/comments # 发表评论 (修正)
```

#### 鼓励系统
```
GET    /api/v1/social/encouragements?cursor= # 获取鼓励列表
POST   /api/v1/social/encouragements        # 发送鼓励
POST   /api/v1/social/encouragements/{id}/read # 标记已读
```

#### 协作任务
```
GET    /api/v1/collab-tasks?status=active|completed&familyId= # 获取协作任务
POST   /api/v1/collab-tasks                 # 创建协作任务
GET    /api/v1/collab-tasks/{id}            # 获取协作任务详情
POST   /api/v1/collab-tasks/{id}/join       # 加入协作任务
POST   /api/v1/collab-tasks/{id}/progress   # 更新个人进度
POST   /api/v1/collab-tasks/{id}/complete   # 完成协作任务
```

#### 家庭挑战
```
GET    /api/v1/family-challenges?status=upcoming|active|completed # 获取家庭挑战
POST   /api/v1/family-challenges            # 创建家庭挑战
GET    /api/v1/family-challenges/{id}       # 获取挑战详情
POST   /api/v1/family-challenges/{id}/join  # 参加挑战
```

### 3.7 奖励商店与审批流程

#### 奖励商店
```
GET    /api/v1/rewards?category=&available=&cursor= # 浏览奖励商店
GET    /api/v1/rewards/{rewardId}           # 获取奖励详情
POST   /api/v1/rewards                      # 创建奖励（家长）
PUT    /api/v1/rewards/{rewardId}           # 编辑奖励（家长）
DELETE /api/v1/rewards/{rewardId}           # 删除奖励（家长）
```

#### 兑换管理
```
POST   /api/v1/rewards/{rewardId}/redeem    # 申请兑换奖励
GET    /api/v1/redemptions?status=pending|approved|fulfilled&cursor= # 获取兑换申请
GET    /api/v1/redemptions/{id}             # 获取兑换详情
POST   /api/v1/redemptions/{id}/approve     # 审批通过（家长）
POST   /api/v1/redemptions/{id}/reject      # 审批拒绝（家长）
POST   /api/v1/redemptions/{id}/fulfill     # 标记已发放（家长）
```

### 3.8 通知系统

#### 通知管理
```
GET    /api/v1/notifications?type=&isRead=&cursor= # 获取通知列表
GET    /api/v1/notifications/unread-count   # 获取未读数量
POST   /api/v1/notifications/{id}/read      # 标记单条已读
POST   /api/v1/notifications/mark-all-read  # 标记全部已读
DELETE /api/v1/notifications/{id}           # 删除通知
```

#### 通知设置 (新增)
```
GET    /api/v1/notification-settings        # 获取通知设置 (新增)
PUT    /api/v1/notification-settings        # 更新通知设置 (新增)
```

### 3.9 智能推荐系统

#### 任务推荐
```
GET    /api/v1/recommendations?availableTime=&level=&preferences= # 获取推荐任务
POST   /api/v1/recommendations/{id}/accept  # 接受推荐
POST   /api/v1/recommendations/{id}/reject  # 拒绝推荐
POST   /api/v1/recommendations/{id}/feedback # 推荐反馈
```

### 3.10 个性化头像系统

#### 头像配置
```
GET    /api/v1/avatars/config               # 获取头像配置
POST   /api/v1/avatars/config               # 保存头像配置
GET    /api/v1/avatars/items?category=&rarity=&unlocked= # 获取头像道具
POST   /api/v1/avatars/items/{id}/unlock    # 解锁头像道具
```

### 3.11 数据分析与统计 (统一命名风格)

#### 分析面板
```
GET    /api/v1/analytics/overview?period=week|month|year&userId= # 总览统计
GET    /api/v1/analytics/time?from=&to=&granularity=day|week # 时间序列分析 (修正)
GET    /api/v1/analytics/categories/performance?userId=&period= # 分类表现分析
GET    /api/v1/analytics/skills/assessment?userId= # 技能评估
GET    /api/v1/analytics/predictions?userId=&horizon=weeks # 预测分析
```

## 4. 实时通信系统

### 4.1 SSE事件设计（单向推送）

#### 通知类事件
```typescript
// 通知相关
'notification.created': {
  notificationId: string;
  type: 'achievement' | 'social' | 'task' | 'system' | 'reminder' | 'family';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

'notification.batch_update': {
  unreadCount: number;
  latestNotifications: Notification[];
}

// 积分相关
'points.balance_changed': {
  userId: string;
  oldBalance: number;
  newBalance: number;
  change: number;
  eventType: PointsEventType;
  eventId: string;
}

// 排行榜相关
'leaderboard.rank_changed': {
  userId: string;
  familyId: string;
  oldRank: number;
  newRank: number;
  period: 'week' | 'month';
}

// 成就相关
'achievement.unlocked': {
  userId: string;
  achievementId: string;
  achievementName: string;
  category: string;
  points: number;
}

// 兑换状态
'redemption.status_changed': {
  redemptionId: string;
  oldStatus: string;
  newStatus: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  message?: string;
}
```

#### SSE端点
```
GET    /api/v1/events/stream                # SSE事件流
```

### 4.2 WebSocket事件设计（双向互动）

#### 协作互动事件
```typescript
// 协作任务
'collab_task.progress_updated': {
  taskId: string;
  userId: string;
  username: string;
  progress: number;
  totalProgress: number;
}

'collab_task.member_joined': {
  taskId: string;
  userId: string;
  username: string;
  memberCount: number;
}

// 社交互动
'social.post.created': {
  postId: string;
  familyId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
}

'social.post.liked': {
  postId: string;
  userId: string;
  username: string;
  likeCount: number;
}

// 家庭在线状态
'family.member.online': {
  userId: string;
  username: string;
  status: 'online' | 'offline';
  lastSeen?: Date;
}

// 挑战排行榜
'family.challenge.leaderboard_updated': {
  challengeId: string;
  leaderboard: Array<{
    userId: string;
    username: string;
    score: number;
    rank: number;
  }>;
}
```

#### WebSocket端点
```
WS     /api/v1/ws                           # WebSocket连接
```

### 4.3 事件权限控制
- **家庭隔离**：事件只推送给同家庭成员
- **用户权限**：根据用户角色过滤敏感事件
- **订阅管理**：用户可选择订阅的事件类型

## 5. 数据库设计

### 5.1 积分账本表
```sql
-- MongoDB Collection: points_ledger
{
  _id: ObjectId,
  userId: ObjectId,
  familyId: ObjectId,
  amount: Number,
  eventType: String,
  eventId: String,
  balanceBefore: Number,
  balanceAfter: Number,
  metadata: Object,
  createdAt: Date,
  // 索引: [userId, createdAt], [familyId, eventType]
}
```

### 5.2 用户余额缓存表
```sql
-- MongoDB Collection: user_balances
{
  _id: ObjectId,
  userId: ObjectId,
  familyId: ObjectId,
  currentBalance: Number,
  lastUpdated: Date,
  version: Number, // 乐观锁版本号
  // 索引: [userId], [familyId]
}
```

### 5.3 文件存储表
```sql
-- MongoDB Collection: files
{
  _id: ObjectId,
  fileName: String,
  originalName: String,
  mimeType: String,
  fileSize: Number,
  uploaderId: ObjectId,
  familyId: ObjectId,
  associatedType: String, // 'task_evidence', 'avatar', 'social_post'
  associatedId: ObjectId,
  storageUrl: String,
  createdAt: Date,
  expiresAt: Date, // TTL字段
  // 索引: [uploaderId], [associatedType, associatedId], [expiresAt]
}
```

### 5.4 通知设置表
```sql
-- MongoDB Collection: notification_settings
{
  _id: ObjectId,
  userId: ObjectId,
  familyId: ObjectId,
  settings: {
    sound: Boolean,
    push: Boolean,
    email: Boolean,
    doNotDisturb: {
      enabled: Boolean,
      startTime: String, // "22:00"
      endTime: String    // "07:00"
    },
    categories: {
      achievement: Boolean,
      social: Boolean,
      task: Boolean,
      system: Boolean,
      reminder: Boolean,
      family: Boolean
    }
  },
  updatedAt: Date
}
```

## 6. 安全设计

### 6.1 JWT Token结构
```typescript
interface JWTPayload {
  userId: string;
  familyId: string;
  role: 'student' | 'parent';
  permissions: string[];
  iat: number;
  exp: number;
}
```

### 6.2 权限中间件
```typescript
// 家庭隔离中间件
function familyIsolation(req, res, next) {
  const userFamilyId = req.user.familyId;
  const requestedFamilyId = req.params.familyId || req.query.familyId;
  
  if (requestedFamilyId && requestedFamilyId !== userFamilyId) {
    return res.status(403).json({
      code: 'FAMILY_ACCESS_DENIED',
      message: '无权访问其他家庭数据',
      requestId: req.requestId
    });
  }
  
  next();
}

// 角色权限中间件
function requireRole(roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: '权限不足',
        requestId: req.requestId
      });
    }
    next();
  };
}
```

### 6.3 幂等性中间件
```typescript
interface IdempotencyRecord {
  key: string;
  userId: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: any;
  createdAt: Date;
}

function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) return next();

  // 查询是否已存在相同的幂等性记录
  // 如果存在，直接返回之前的响应
  // 如果不存在，继续处理并保存结果
}
```

## 7. 错误处理设计

### 7.1 错误码定义
```typescript
enum ErrorCode {
  // 认证相关
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 权限相关
  FAMILY_ACCESS_DENIED = 'FAMILY_ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 业务相关
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  TASK_ALREADY_COMPLETED = 'TASK_ALREADY_COMPLETED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  LIVES_EXHAUSTED = 'LIVES_EXHAUSTED',
  
  // 系统相关
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### 7.2 全局错误处理中间件
```typescript
function errorHandler(err, req, res, next) {
  const error: ApiError = {
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || '服务器内部错误',
    details: err.details,
    requestId: req.requestId
  };

  // 记录错误日志
  logger.error('API Error', {
    requestId: req.requestId,
    userId: req.user?.userId,
    method: req.method,
    path: req.path,
    error: err
  });

  res.status(err.statusCode || 500).json(error);
}
```

## 8. 性能优化策略

### 8.1 缓存策略
```typescript
// Redis缓存键设计
const CACHE_KEYS = {
  USER_BALANCE: (userId: string) => `balance:${userId}`,
  FAMILY_LEADERBOARD: (familyId: string, period: string) => `leaderboard:${familyId}:${period}`,
  ACHIEVEMENTS: (userId: string) => `achievements:${userId}`,
  TASK_TEMPLATES: (category: string) => `templates:${category}`,
  NOTIFICATION_COUNT: (userId: string) => `notifications:count:${userId}`
};

// 缓存过期时间
const CACHE_TTL = {
  USER_BALANCE: 300,      // 5分钟
  LEADERBOARD: 3600,      // 1小时
  ACHIEVEMENTS: 1800,     // 30分钟
  TASK_TEMPLATES: 86400,  // 24小时
  NOTIFICATION_COUNT: 60  // 1分钟
};
```

### 8.2 数据库索引策略
```javascript
// MongoDB索引设计
db.points_ledger.createIndex({ userId: 1, createdAt: -1 });
db.points_ledger.createIndex({ familyId: 1, eventType: 1 });
db.points_ledger.createIndex({ eventType: 1, eventId: 1 });

db.scheduled_tasks.createIndex({ userId: 1, date: 1 });
db.scheduled_tasks.createIndex({ familyId: 1, status: 1 });

db.files.createIndex({ uploaderId: 1, createdAt: -1 });
db.files.createIndex({ associatedType: 1, associatedId: 1 });
db.files.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL索引
```

## 9. 部署与监控

### 9.1 Docker配置
```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY config/ ./config/

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/main.js"]
```

### 9.2 健康检查端点
```
GET    /health                              # 健康状态检查
GET    /metrics                             # Prometheus监控指标
```

### 9.3 日志格式
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  requestId?: string;
  userId?: string;
  familyId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  message: string;
  metadata?: any;
}
```

## 10. 开发工具与文档

### 10.1 OpenAPI 3.1 规范
完整的API文档将通过OpenAPI 3.1规范定义，包含：
- 所有端点的详细说明
- 请求/响应schema定义
- 错误码文档
- 认证流程说明
- 示例代码

### 10.2 SDK生成
基于OpenAPI规范自动生成：
- TypeScript SDK（前端使用）
- Postman Collection（测试使用）
- 接口测试用例

### 10.3 文档站点
使用Swagger UI部署交互式API文档：
```
GET    /api-docs                            # Swagger UI界面
GET    /api-docs.json                       # OpenAPI JSON规范
```

## 总结

这个API架构设计完全满足您的核心要求：

1. **统一规范**：/api/v1前缀、标准化错误格式、游标分页
2. **积分账本化**：事件驱动的积分系统，删除所有直接操作积分的接口
3. **关键端点补充**：快速创建排期、文件上传、通知设置等
4. **语义化命名**：明确的资源标识，避免含糊的/:id路径
5. **实时通信**：清晰的SSE+WebSocket事件定义
6. **幂等性支持**：所有写操作支持Idempotency-Key

该设计涵盖约100个端点，支持所有17个前端组件的数据需求，确保系统的安全性、性能和可维护性。