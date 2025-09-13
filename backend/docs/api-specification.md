# Summer Vacation Planning API Specification v1.0

## API架构设计

### 基础规范

#### 统一前缀
所有API端点使用统一前缀：`/api/v1`

#### 错误响应格式
```json
{
  "code": "VALIDATION_ERROR",
  "message": "验证失败",
  "details": {
    "field": "email",
    "reason": "格式无效"
  },
  "requestId": "uuid-string"
}
```

#### 分页格式
```json
{
  "data": [...],
  "pagination": {
    "cursor": "next-page-token",
    "limit": 20,
    "hasMore": true
  }
}
```

#### 幂等性支持
所有写操作支持 `Idempotency-Key` 请求头，确保相同key的重复请求返回相同结果。

## 核心业务域API设计

### 1. 认证授权与家庭管理

#### 认证端点
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh-token
GET  /api/v1/auth/profile
PUT  /api/v1/auth/profile
```

#### 家庭管理
```
POST /api/v1/families
GET  /api/v1/families/{familyId}/members
POST /api/v1/families/{familyId}/invite
POST /api/v1/families/invitations/{token}/accept
GET  /api/v1/families/{familyId}/leaderboard?period=week|month&includeGrowth=true
```

### 2. 积分账本系统（事件驱动）

#### 账本查询（无直接加分接口）
```
GET /api/v1/points/balance
GET /api/v1/points/ledger?type=earned|spent&cursor=&limit=
GET /api/v1/points/summary?period=week|month
```

### 3. 任务管理系统

#### 任务模板
```
GET  /api/v1/task-templates?q=&category=&difficulty=&cursor=&limit=
POST /api/v1/task-templates
GET  /api/v1/task-templates/{id}
PUT  /api/v1/task-templates/{id}
DELETE /api/v1/task-templates/{id}
```

#### 任务排期
```
GET  /api/v1/scheduled-tasks?from=&to=&userId=&status=&cursor=&limit=
POST /api/v1/scheduled-tasks
GET  /api/v1/scheduled-tasks/{id}
PATCH /api/v1/scheduled-tasks/{id}
DELETE /api/v1/scheduled-tasks/{id}
```

#### 快速创建排期（原子操作）
```
POST /api/v1/tasks/quick-create-and-schedule
```

#### 任务完成
```
POST /api/v1/scheduled-tasks/{id}/complete
POST /api/v1/scheduled-tasks/{id}/submit-evidence
GET  /api/v1/scheduled-tasks/{id}/evidence
```

#### 任务历史
```
GET /api/v1/tasks/logs?userId=&cursor=&limit=
GET /api/v1/tasks/statistics?userId=&period=week|month
```

### 4. 文件管理系统

```
POST /api/v1/files
GET  /api/v1/files/{id}
GET  /api/v1/files/{id}/metadata
DELETE /api/v1/files/{id}
GET  /api/v1/files?relatedTo=task|avatar&relatedId=&cursor=&limit=
```

### 5. 游戏化系统

#### 经验值与等级
```
GET /api/v1/xp/profile
GET /api/v1/xp/daily-goal
PUT /api/v1/xp/daily-goal
POST /api/v1/xp/daily-reward/claim
```

#### 生命值系统
```
GET /api/v1/lives/status
POST /api/v1/lives/buy/{packageId}
POST /api/v1/lives/restore-by-ad
GET /api/v1/lives/packages
```

#### 连击系统（语义化修正）
```
GET /api/v1/streaks?categories=exercise,reading,chores
GET /api/v1/streaks/{category}
POST /api/v1/streaks/{category}/restore
GET /api/v1/streaks/{category}/milestones
POST /api/v1/streaks/{category}/milestones/{milestone}/claim
```

#### 成就系统（规则引擎自动触发）
```
GET /api/v1/achievements?userId=me&status=locked|unlocked|claimed&category=
GET /api/v1/achievements/{id}
POST /api/v1/achievements/{id}/claim
```

#### 技能树系统
```
GET /api/v1/skills/templates
GET /api/v1/user-skills?userId=me
POST /api/v1/skills/{skillId}/unlock
GET /api/v1/skills/{skillId}/tasks
POST /api/v1/skills/{skillId}/tasks/{taskId}/start
POST /api/v1/skills/{skillId}/tasks/{taskId}/complete
```

### 6. 社交互动系统

#### 社交动态（修正评论路径）
```
GET /api/v1/social/posts?familyId=&cursor=&limit=
POST /api/v1/social/posts
GET /api/v1/social/posts/{id}
POST /api/v1/social/posts/{id}/like
DELETE /api/v1/social/posts/{id}/like
POST /api/v1/social/posts/{id}/comments
GET /api/v1/social/posts/{id}/comments?cursor=&limit=
```

#### 鼓励系统
```
GET /api/v1/social/encouragements?cursor=&limit=
POST /api/v1/social/encouragements
POST /api/v1/social/encouragements/{id}/read
```

#### 协作任务
```
GET /api/v1/collab-tasks?status=active|completed&familyId=&cursor=&limit=
POST /api/v1/collab-tasks
POST /api/v1/collab-tasks/{id}/join
POST /api/v1/collab-tasks/{id}/leave
PATCH /api/v1/collab-tasks/{id}/progress
POST /api/v1/collab-tasks/{id}/complete
```

#### 家庭挑战
```
GET /api/v1/family-challenges?status=upcoming|active|completed&cursor=&limit=
POST /api/v1/family-challenges
POST /api/v1/family-challenges/{id}/join
GET /api/v1/family-challenges/{id}/leaderboard
```

### 7. 奖励商店与审批系统

#### 奖励商店
```
GET /api/v1/rewards?category=&available=true&cursor=&limit=
GET /api/v1/rewards/{id}
POST /api/v1/rewards/{id}/redeem
```

#### 兑换审批
```
GET /api/v1/redemptions?status=pending|approved|rejected|fulfilled&userId=&cursor=&limit=
GET /api/v1/redemptions/{id}
POST /api/v1/redemptions/{id}/approve
POST /api/v1/redemptions/{id}/reject
POST /api/v1/redemptions/{id}/fulfill
```

### 8. 通知系统

#### 通知管理
```
GET /api/v1/notifications?type=&isRead=&cursor=&limit=
GET /api/v1/notifications/{id}
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/{id}
GET /api/v1/notifications/unread-count
```

#### 通知设置（新增）
```
GET /api/v1/notification-settings
PUT /api/v1/notification-settings
```

### 9. 数据分析系统（统一命名风格）

```
GET /api/v1/analytics/overview?period=week|month|year&userId=
GET /api/v1/analytics/time?from=&to=&granularity=day|week&userId=
GET /api/v1/analytics/categories/performance?userId=&period=
GET /api/v1/analytics/skills/assessment?userId=
GET /api/v1/analytics/predictions?userId=&horizon=weeks
```

### 10. 智能推荐系统

```
GET /api/v1/recommendations?availableTime=&level=&preferences=&limit=
POST /api/v1/recommendations/{id}/accept
POST /api/v1/recommendations/{id}/reject
POST /api/v1/recommendations/{id}/feedback
```

### 11. 个性化头像系统

```
GET /api/v1/avatars/config
POST /api/v1/avatars/config
GET /api/v1/avatars/items?category=&rarity=&unlocked=&cursor=&limit=
POST /api/v1/avatars/items/{id}/unlock
```

### 12. 实时通信系统

#### SSE端点
```
GET /api/v1/events/stream
```

## 实时事件定义

### SSE事件（单向推送）
```javascript
// 通知类事件
'notification.created'          // 新通知创建
'notification.batch_update'     // 批量通知状态更新
'points.balance_changed'        // 积分余额变更
'leaderboard.rank_changed'      // 排行榜排名变化
'achievement.unlocked'          // 成就解锁
'level.up'                      // 等级提升
'redemption.status_changed'     // 兑换状态变更
'daily_goal.completed'          // 每日目标完成
'streak.milestone_reached'      // 连击里程碑达成
```

### WebSocket事件（双向互动）
```javascript
// 协作互动事件
'collab_task.progress_updated'          // 协作任务进度更新
'collab_task.member_joined'             // 协作任务新成员加入
'collab_task.member_left'               // 协作任务成员离开
'social.post.created'                   // 新社交动态发布
'social.post.liked'                     // 社交动态被点赞
'social.comment.created'                // 新评论发布
'family.member.online'                  // 家庭成员上线
'family.member.offline'                 // 家庭成员下线
'family.challenge.leaderboard_updated'  // 家庭挑战排行榜更新
'encouragement.received'                // 收到鼓励
'chat.message'                          // 实时聊天消息
```

## 并发控制设计

### ETag版本控制
```javascript
// 请求头
If-Match: "version-hash"

// 响应头
ETag: "new-version-hash"
```

### 幂等性控制
```javascript
// 请求头
Idempotency-Key: "unique-request-id"

// 响应头（重复请求）
Idempotent-Replayed: true
```

## 错误码定义

```javascript
const ERROR_CODES = {
  // 通用错误
  'VALIDATION_ERROR': '请求参数验证失败',
  'AUTHENTICATION_REQUIRED': '需要身份验证',
  'AUTHORIZATION_FAILED': '权限不足',
  'RESOURCE_NOT_FOUND': '资源未找到',
  'CONFLICT': '资源冲突',
  'RATE_LIMITED': '请求频率超限',
  
  // 业务错误
  'INSUFFICIENT_POINTS': '积分不足',
  'INSUFFICIENT_LIVES': '生命值不足',
  'TASK_ALREADY_COMPLETED': '任务已完成',
  'ACHIEVEMENT_ALREADY_CLAIMED': '成就已领取',
  'FAMILY_PERMISSION_REQUIRED': '需要家长权限',
  'TIME_SLOT_CONFLICT': '时间段冲突',
  'FILE_SIZE_EXCEEDED': '文件大小超限',
  'STREAK_ALREADY_RESTORED': '连击已修复过',
  'DAILY_REWARD_ALREADY_CLAIMED': '每日奖励已领取'
}
```

## 安全策略

1. **JWT认证**：所有端点（除登录注册）需要有效JWT token
2. **家庭隔离**：用户只能访问所属家庭的数据
3. **角色权限**：家长拥有审批权限，孩子受到操作限制
4. **防刷策略**：关键操作（点赞、评论）有频率限制
5. **幂等保护**：写操作支持幂等性，防止重复提交
6. **文件安全**：上传文件类型白名单，大小限制，病毒扫描

## API端点总计

约100个端点，覆盖所有业务功能，支持前端17个组件的完整数据交互需求。

## 下一步工作

1. 使用code-analyzer验证API与前端组件对齐
2. 设计数据库架构与仓储抽象层
3. 实现模块化单体架构
4. 开发各业务模块