这是基于仓库实际组件逐一核对后，给你的“对比修订版”。我按业务域给出：保留/修正/新增/删除，并标注关键理由，确保与前端真实需 
求完全对齐。

总体结论

- 主要问题：数据库选择为假设（文中称来自 Guidelines.md，但该文件未规定 DB）；多处 /:id 语义不清；积分应以“流水账本”驱动而非“直接
加分”接口；缺失与前端强绑定的端点（如快速创建排期、通知设置、头像、协作任务等）。
- 统一规范建议：前缀  /api/v1；分页 limit+cursor；错误 {code,message,details,requestId}；写操作支持 Idempotency-Key；时间范围统 
一 from/to（RFC3339 + 用户时区）。

认证与家庭

- 保留:
    - POST /api/v1/auth/register|login|logout|refresh-token
    - GET /api/v1/families/{id}/members
- 修正:
    - 排行榜需带周期和“周增长”字段：GET /api/v1/families/{id}/leaderboard?period=week|month
    - 移除权限探测端点：GET /api/permissions/user/:id（授权由JWT+策略在后端判定）
- 新增: 无
- 删除: POST /api/permissions/validate

任务模板与排期（TaskLibrary/TaskPlanning/TaskCalendar/IntegratedCalendar）

- 保留:
    - GET /api/v1/task-templates?q=&category=&difficulty=，POST /api/v1/task-templates
- 修正:
    - 统一按时间区间取排期：GET /api/v1/scheduled-tasks?from=&to=（替代 /calendar/tasks/:year/:month）
- 新增:
    - POST /api/v1/scheduled-tasks（创建排期）
    - PATCH /api/v1/scheduled-tasks/{id}（更新）/ DELETE /api/v1/scheduled-tasks/{id}（移除）
    - 快速创建并排期：POST /api/v1/tasks/quick-create-and-schedule（IntegratedCalendar 快速创建）
- 删除:
    - GET /api/task-templates/recommended（推荐应走独立推荐域，见下文）

任务执行与历史（TaskPlanning/TaskHistory）

- 保留:
    - POST /api/v1/scheduled-tasks/{id}/complete，POST /api/v1/scheduled-tasks/{id}/uncomplete
    - GET /api/v1/tasks/logs?userId=&cursor=
- 修正: 完成任务应联动“积分流水”（后端内部完成，不暴露“加分API”）
- 新增: 无
- 删除: 无

积分、经验、每日目标、生命、连击、成就（ExperienceSystem/LifeSystem/StreakSystem/HabitTracker/AchievementSystem/PointsHeader）  

- 保留:
    - GET /api/v1/points/balance，GET /api/v1/points/ledger?type=&cursor=
    - GET /api/v1/xp/profile
- 修正:
    - 每日目标：GET/PUT /api/v1/xp/daily-goal；领取：POST /api/v1/xp/daily-reward/claim
    - 生命系统统一资源名：GET /api/v1/lives；购买：POST /api/v1/lives/buy{packageId}；广告恢复：POST /api/v1/lives/restore-by-ad    - 连击改为按类别：GET /api/v1/streaks?categories=；修复：POST /api/v1/streaks/{category}/restore；里程碑领取：POST /api/v1/ 
streaks/{category}/milestones/{n}/claim
    - 成就仅需查询与领奖：GET /api/v1/achievements?user=me，POST /api/v1/achievements/{id}/claim
- 新增:
    - GET /api/v1/habits/overview（HabitTracker 聚合视图）
- 删除:
    - POST /api/achievements/:id/unlock（解锁由后端规则自动判定，不建议前端触发）
    - POST /api/users/:id/points/add，POST /api/experience/:id/add（以“账本”事件驱动代替）

技能树（SkillTree）

- 保留: 解锁/完成任务能力
- 修正:
    - 区分模板与用户进度：
    - `GET /api/v1/skills`（模板）
    - `GET /api/v1/user-skills`（用户进度）
    - `POST /api/v1/skills/{id}/unlock`（扣积分）
    - `POST /api/v1/skills/{id}/tasks/{taskId}/start|complete`
- 新增: 无
- 删除:
    - GET /api/skills/:id（语义含糊；按资源拆分上两者）

通知（NotificationCenter）

- 保留:
    - GET /api/v1/notifications?type=&isRead=&cursor=
    - GET /api/v1/notifications/unread-count
    - POST /api/v1/notifications/{id}/read，POST /api/v1/notifications/mark-all-read
    - DELETE /api/v1/notifications/{id}
- 修正:
    - 补充通知设置：GET/PUT /api/v1/notification-settings（含 sound/push/email/quietHours）
    - 实时通道：保留 SSE/WS，但需枚举事件（当前文档宣称23个事件但未列出）
- 新增: 无
- 删除: 无

社交与鼓励（SocialInteraction）

- 保留:
    - 帖子：GET /api/v1/social/posts?familyId=&cursor=，POST /api/v1/social/posts
    - 点赞/取消：POST /api/v1/social/posts/{id}/like|unlike
    - 评论：POST /api/v1/social/posts/{id}/comments
    - 鼓励：GET /api/v1/social/encouragements，POST /api/v1/social/encouragements，POST /api/v1/social/encouragements/{id}/read 
- 修正:
    - 统一分页为 cursor；全链路限流/防刷
- 新增: 无
- 删除: 无

家庭协作与挑战（FamilyCollaboration）— 原文缺失，需补齐

- 新增（组件已体现协作任务/挑战流转）:
    - 协作任务：
    - `GET /api/v1/collab-tasks?status=active|completed`
    - `POST /api/v1/collab-tasks`（创建，默认把创建者设为 leader）
    - `POST /api/v1/collab-tasks/{id}/join`，`POST /api/v1/collab-tasks/{id}/progress`（上报进度）
    - `POST /api/v1/collab-tasks/{id}/complete`
- 家庭挑战：
    - `GET /api/v1/family-challenges?status=upcoming|active|completed`
    - `POST /api/v1/family-challenges`（创建）
    - `POST /api/v1/family-challenges/{id}/join`
- 修正: 返回结构需包含 participants、milestones、leaderboard 等前端字段

奖励商店与家长审批（RewardCard/ParentDashboard）— 原文覆盖不全

- 新增:
    - 奖励目录：GET /api/v1/rewards?category=&available=
    - 发起兑换：POST /api/v1/rewards/{id}/redeem
    - 审批列表：GET /api/v1/redemptions?status=pending|approved|fulfilled
    - 审批动作：POST /api/v1/redemptions/{id}/approve|reject|fulfill
- 修正: 审批通过/发放需写入 points/ledger（扣分）

数据分析与智能推荐（AnalyticsDashboard/SmartRecommendations）

- 保留:
    - GET /api/v1/analytics/overview?period=week|month|year
    - GET /api/v1/analytics/time|categories|skills|habits|predictions
- 修正:
    - 推荐独立域（不要混入模板库）：
    - `GET /api/v1/recommendations?availableTime=&level=&preferences=…`
    - `POST /api/v1/recommendations/{id}/accept|reject`，`POST /api/v1/recommendations/{id}/feedback`
- 新增: 无
- 删除:
    - GET /api/task-templates/recommended

个性化头像（PersonalizedAvatar）— 原文未落接口

- 新增:
    - 当前头像：GET /api/v1/avatars/config，保存：POST /api/v1/avatars/config
    - 道具目录：GET /api/v1/avatars/items?category=&rarity=&unlocked=
    - 解锁道具（扣积分/验等级/验成就）：POST /api/v1/avatars/items/{id}/unlock

统一规范与命名修正

- 前缀与版本：所有端点统一  /api/v1
- 资源命名：复数资源名（lives, streaks, skills, notifications）；避免意义不明的 /:id，改为有语义的 /{category} 或 query
- 账本化结算：所有积分变动由后端事件写入 points/ledger，前端不直调“加分”接口
- 实时事件：建议显式列出 SSE/WS 事件（如 notifications.created, social.post.created, redemption.status.changed 等）