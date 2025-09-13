# Summer Vacation Planning App - Claude Code Guide

This file provides guidance to Claude Code when working on the project.

## Project Overview

Summer vacation planning application with cartoon-style UI and gamification features. Students plan activities, track completion, and earn points redeemable for rewards. Parents monitor progress and manage children's activities.

**Tech Stack**: React 18 + TypeScript + Tailwind CSS / Node.js + Express + MongoDB

## Development Commands

### Frontend (React + TypeScript + Tailwind CSS)
```bash
cd frontend
npm start                             # Development server (port 3000)
npm run build                         # Production build
npm test                              # Jest unit tests
npm test -- --coverage               # Tests with coverage
npm test ComponentName                # Specific test file
```

### Backend (Node.js + Express + TypeScript + MongoDB)
```bash
cd backend
npm run dev                           # Development server (port 5000)
npm run build                         # Build TypeScript
npm start                             # Production server
npm run create-indexes                # Create MongoDB indexes
npm run db:optimize                   # Optimize database
```

### Testing Strategy
**Use `.claude/agents/test-case-designer.md` for comprehensive test planning**

```bash
# Simplified unit tests (RECOMMENDED)
cd frontend && npm test -- --testPathPatterns="\.simple\." --watchAll=false
cd backend && npm test -- --testPathPatterns="\.simple\."

# Standard unit tests
npm test                              # All tests
npm test -- --coverage               # With coverage

# E2E Testing (Playwright)
npx playwright test                   # All E2E tests headlessly
/run-playwright file=frontend/tests/<specName>.ts  # Single spec
```

**Playwright MCP Rules (MUST FOLLOW):**
- Data return limit: Only "OK"/"FAIL"/short strings, no DOM/arrays/objects
- Selector priority: `getByTestId` > `getByRole` > locator (avoid `page.evaluate`)
- Silent mode: Default `silent=true` unless detailed output required
- Session isolation: Independent user data directory per terminal

### Dependencies Installation
```bash
cd frontend && npm install
cd backend && npm install
```

## Code Architecture

### Frontend Structure (`frontend/src/`)
- **Components**: Reusable UI with Tailwind CSS (TaskCard, PointsDisplay, EvidenceModal)
- **Pages**: Main app pages (Login, Dashboard, Tasks, Records)
- **Services**: API communication and Firebase integration
- **Types**: TypeScript interfaces (shared with backend)
- **Contexts**: React contexts for state management (AuthContext)

### Backend Structure (`backend/src/`)
- **Controllers**: HTTP request handlers (mongoAuthController, taskController)
- **Middleware**: Authentication (JWT), validation, error handling
- **Routes**: API endpoint definitions
- **Services**: Business logic (recommendation service)
- **Utils**: JWT handling, default tasks

### Key Components
- **Authentication**: JWT-based with MongoDB, student/parent roles
- **Task Management**: CRUD operations for tasks and daily planning
- **Points System**: Gamification with earning/redemption mechanics
- **Media Upload**: Evidence files with review/approval process
- **Database**: MongoDB with optimized indexes

## Database Schema (MongoDB)
- **users**: Profiles with roles (student/parent), points, parent-child relationships
- **tasks**: Templates with categories, difficulty, point values, evidence requirements
- **daily_tasks**: Task instances with completion status, evidence, notes
- **redemptions**: Point redemption requests with approval workflow
- **activity_logs**: User activity tracking and analytics

**Key Data Models**:
- User roles: 'student' | 'parent'
- Task categories: exercise, reading, chores, learning, creativity, other
- Task status: planned, in_progress, completed, skipped
- Redemption status: pending, approved, rejected

## Environment Setup
- **Frontend**: Copy `.env.example` → `.env.local` (API endpoints, Firebase config)
- **Backend**: Copy `.env.example` → `.env` (MongoDB URI, JWT secret, file upload settings)

## Deployment Pre-flight Checklist 🚀

**CRITICAL**: Execute before any production deployment

### Step 1: Local Git Status Verification
```bash
git status                            # Must be: "nothing to commit, working tree clean"
git log --oneline -5                  # Verify intended changes in recent commits
```

### Step 2: Code Synchronization (Dual Push)
```bash
git push origin master                # GitHub (primary)
git push gitee master                 # Gitee (deployment source)
```

### Step 3: Pre-deployment Validation
```bash
git status                            # Must show: "Your branch is up to date with 'origin/master'"
git diff HEAD                         # Expected: No output (no differences)
```

### Step 4: Deployment Readiness Confirmation
- ✅ All code changes committed
- ✅ Working tree clean
- ✅ Latest commits pushed to BOTH repositories
- ✅ Local branch synced with remote master
- ✅ No merge conflicts

**⚠️ RULE: If ANY checklist item fails, STOP and resolve before proceeding**

## Deployment

### Aliyun DevOps Deployer
Use `.claude/agents/aliyun-devops-deployer.md` to deploy to Alibaba Cloud (47.120.74.212).

**Process**: After Pre-flight Checklist → Trigger deployer agent → Automated deployment:
1. Verify code synchronization
2. Pull latest changes 
3. Install dependencies (frontend + backend)
4. Run production builds
5. Restart PM2-managed services

**Infrastructure**: Backend (PM2) + Frontend (Nginx static files)

### Four-Step Development Workflow
**1. MODIFY → 2. COMMIT → 3. PUSH → 4. DEPLOY**

Never skip or reorder these steps:
```bash
# 1. MODIFY: Local development + testing
# 2. COMMIT: git add + commit with descriptive message  
# 3. PUSH: git push origin master && git push gitee master
# 4. DEPLOY: Execute Pre-flight Checklist → aliyun-devops-deployer
```

## Critical Experience & Lessons Learned

### React Version Compatibility (Case Study: 2025-08-28)
**Problem**: React 19→18 downgrade not committed before deployment → unresponsive buttons
**Root Cause**: Event system incompatibility in React 19.1.0
**Solution**: Always test event handlers after React upgrades; use stable versions (18.x)

### High-Risk Change Indicators
- 🔴 Major framework upgrades (React 18→19, Node 16→18)
- 🔴 Event system changes (onClick, onSubmit handlers)  
- 🔴 Authentication system modifications
- 🔴 Database schema changes
- 🔴 API endpoint restructuring

**For high-risk changes**: Use staging environment + extended testing periods

### Common Failure Patterns
| **Type** | **Prevention** | **Detection** | **Recovery** |
|----------|----------------|---------------|--------------|
| Code Sync Issues | Pre-flight Checklist | Git status comparison | Recommit + redeploy |
| Framework Issues | Staged upgrades + testing | Browser console errors | Version rollback |
| Build Cache | Clean builds | Timestamp verification | Cache clearing |


## Development Best Practices

### Git Worktree Parallel Development
```bash
git worktree add ../<repo-name>-<feature-code> -b feature/<feature-code> origin/master
```
- Use independent feature branches per worktree
- Merge only one feature branch at a time
- Sync other worktrees after merges (`git fetch` + `git rebase origin/master`)
- Watch for port conflicts (3000/5000)

### Development Record Management
**MANDATORY**: Append to `.logs/dev-notes.md` before commits:
```markdown
### [YYYY-MM-DD HH:mm] - [COMMIT/ISSUE/DECISION/INSIGHT]
- **Context**: What was being worked on
- **Key Actions**: Files changed, problems solved
- **Lessons Learned**: Critical insights, gotchas, best practices
- **Impact**: Files affected, future considerations
- **Status**: ✅ Complete / ⚠️ Needs follow-up / ❌ Blocked
```

### Framework Upgrade Protocol
1. Create backup branch
2. Upgrade patch versions first
3. Extensive testing (especially event handlers)
4. Staged deployment
5. Monitor 24-48 hours before production

## Spec Workflow Integration

For structured development, use the **Spec Workflow** system in `.claude/`:
- **Templates**: Requirements → Design → Tasks → Test Plan
- **Checklists**: Frontend/Backend/Security/Performance DoD validation
- **Guards**: File allowlists to constrain AI modifications
- **Agents**: Specialized agents for testing, deployment, code refinement

**Workflow**: Requirements → Design → Tasks → Implementation → Review → Verify

---

**Key Files**:
- `.claude/workflows/spec-workflow.md` - Structured development process
- `.claude/agents/test-case-designer.md` - Comprehensive testing strategy
- `.claude/agents/aliyun-devops-deployer.md` - Production deployment automation

## Claude Code Sub-Agent Guidelines

> Think carefully and implement the most concise solution that changes as little code as possible.

### Context Optimization with Sub-Agents

#### 1. File Analysis
Always use the file-analyzer sub-agent when asked to read files. This agent extracts and summarizes critical information from files, particularly log files and verbose outputs, providing concise summaries while dramatically reducing context usage.

#### 2. Code Analysis
Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow. This agent provides concise, actionable summaries while preserving essential information.

#### 3. Test Execution
Always use the test-runner sub-agent to run tests and analyze results. This ensures:
- Full test output capture for debugging
- Clean main conversation focus
- Optimized context usage
- Proper issue surfacing
- No approval dialog interruptions

## Development Philosophy

### Error Handling Strategy
- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)  
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing Approach
- Always use the test-runner agent to execute tests
- Do not use mock services for anything ever
- Do not move on to the next test until the current test is complete
- If test fails, check test structure before refactoring codebase
- Tests must be verbose for debugging purposes

## Code Quality Standards

### Communication Style
- Criticism is welcome - point out errors or better approaches
- Reference relevant standards or conventions when applicable
- Be skeptical and ask clarifying questions when in doubt
- Be concise - short summaries preferred over extended breakdowns
- No flattery or compliments unless specifically requested

### ABSOLUTE RULES

**Implementation Standards:**
- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION with "//This is simplified..." comments
- NO CODE DUPLICATION - reuse existing functions and constants
- NO DEAD CODE - either use or delete completely
- IMPLEMENT TESTS FOR EVERY FUNCTION
- NO CHEATER TESTS - tests must be accurate and reveal flaws

**Code Organization:**
- NO INCONSISTENT NAMING - follow existing codebase patterns
- NO OVER-ENGINEERING - avoid unnecessary abstractions when simple functions work
- NO MIXED CONCERNS - proper separation of validation, API, database, UI logic
- NO RESOURCE LEAKS - close connections, clear timeouts, remove listeners

---

# 🎯 业务逻辑设计框架

> 家庭学习成长助手 - 核心业务逻辑与设计原则

## 1. 积分与激励系统设计

### 🎯 积分设置的心理学基础
基于**自我决定理论**和**游戏化设计原理**：

```javascript
// 积分价值体系
const pointSystem = {
  basic: { range: "10-30分", purpose: "日常习惯，培养持续性" },
  medium: { range: "50-100分", purpose: "学习挑战，主要激励" },
  advanced: { range: "150-300分", purpose: "突破项目，成就感爆发" }
};

// 时间投入效率递减原理
const timeEfficiency = {
  "15min": "30分 (2.0分/分钟)",
  "30min": "50分 (1.67分/分钟)", 
  "60min": "80分 (1.33分/分钟)" // 激励长时间专注但效率递减
};
```

### 🏆 成就与积分的层级关系

```javascript
const achievementSystem = {
  frequency: "连续X天 → 解锁特殊技能",
  accumulation: "总积分达到X → 解锁新分类",
  quality: "高难度完成 → 获得稀有奖励", 
  exploration: "尝试新领域 → 开启隐藏功能"
};

// 积分转换率设计
const rewardConversion = {
  daily: "100积分 = 小礼品",
  weekly: "500积分 = 中等奖励",
  monthly: "2000积分 = 大型奖励",
  milestone: "5000积分 = 特殊体验"
};
```

## 2. 技能分类的教育学框架

### 📚 基于布鲁姆分类学的技能树

```javascript
const skillTree = {
  L1_Foundation: {
    color: "green",
    level: "基础技能（记忆&理解）",
    categories: [
      "数学基础：四则运算、分数、几何基础",
      "语言基础：拼音、识字、基础语法",
      "英语入门：字母、音标、常用词汇", 
      "科学启蒙：观察记录、基础实验"
    ]
  },
  L2_Application: {
    color: "blue", 
    level: "应用技能（应用&分析）",
    categories: [
      "数学应用：应用题解决、数据分析",
      "阅读理解：文章分析、逻辑推理",
      "英语交流：对话练习、写作表达",
      "科学探索：假设验证、现象解释"
    ]
  },
  L3_Innovation: {
    color: "purple",
    level: "创新技能（评估&创造）", 
    categories: [
      "项目管理：计划制定、执行跟踪",
      "创意表达：艺术创作、故事编写",
      "批判思维：观点评估、论证分析",
      "解决方案：问题设计、创新方案"
    ]
  }
};
```

### 🎯 技能解锁的渐进式设计

```javascript
const unlockCriteria = {
  prerequisite: "前置技能完成度 ≥ 80%",
  points: "相关类别积分达标",
  time: "学习时长要求",
  project: "至少完成1个相关项目",
  
  example: {
    skill: "进阶数学",
    requirements: [
      "数学基础达到80%完成度",
      "累积数学类积分 ≥ 1000分",
      "学习时长 ≥ 30天",
      "完成至少1个数学项目"
    ]
  }
};
```

## 3. UI设计方法论：HEART框架 + 用户旅程

### 🧭 HEART指标体系

```javascript
const heartMetrics = {
  H_Happiness: "成就解锁动画、积分获得反馈、进度可视化",
  E_Engagement: "每日打卡率、平均会话时长、功能使用深度", 
  A_Adoption: "新功能发现率、技能树探索率、奖励兑换率",
  R_Retention: "7日留存、习惯养成率、长期目标完成率",
  T_TaskSuccess: "任务完成率、学习目标达成率、技能提升速度"
};
```

### 🗺️ 用户旅程映射

```javascript
const userJourney = {
  coreFlow: "启动应用 → 查看今日状态 → 选择任务 → 执行学习 → 获得反馈 → 查看进展 → 设定明日目标",
  
  navigationLogic: {
    "🏠 家庭主页": "Hub - 中心枢纽",
    "📅 今日任务": "Action - 行动页面 → 🎯 任务执行页",
    "🔥 习惯打卡": "Habit - 习惯页面 → 📊 习惯详情页", 
    "🎁 奖励中心": "Reward - 奖励页面 → 🛒 兑换确认页",
    "🏅 成就收集": "Achievement - 成就页面 → 🎊 成就详情页",
    "🌟 技能成长": "Skill - 技能页面 → 📚 学习路径页"
  }
};
```

## 4. 关键业务规则设计

### ⚡ 动机维持机制

```javascript
const motivationCurve = {
  beginner: { 
    level: "1-3", 
    strategy: "高频小奖励",
    rewardFreq: "high", 
    difficulty: "low" 
  },
  growing: { 
    level: "4-8", 
    strategy: "中频中奖励",
    rewardFreq: "medium", 
    difficulty: "medium" 
  },
  expert: { 
    level: "9+", 
    strategy: "低频大奖励",
    rewardFreq: "low", 
    difficulty: "high" 
  }
};

// 健康机制防止过度使用
const healthyLimits = {
  dailyMaxTasks: 8,           // 防止过度执行
  mandatoryBreaks: true,      // 强制休息时间  
  weeklyReflection: true,     // 每周反思总结
  parentalControls: true      // 家长监护功能
};
```

### 🎮 游戏化平衡原则

```javascript
const gamificationPrinciples = {
  challengeBalance: "任务难度 = 当前技能水平 × (1.1-1.3)", // 略高于当前能力
  rewardBalance: "70%即时奖励 + 30%延迟奖励", // 保持动机与培养耐心
  motivationHierarchy: "技能提升感 > 积分获得感 > 物质奖励", // 逐步内化动机  
  socialBalance: "个人成长 + 家庭分享 + 偶尔竞争" // 平衡个体与社交需求
};
```

## 5. 开发实施策略

### 🔄 三阶段迭代优化

```javascript
const developmentPhases = {
  Phase1: {
    duration: "2周",
    focus: "核心循环验证",
    deliverables: [
      "基础积分-任务-奖励循环",
      "核心页面跳转逻辑", 
      "用户行为数据收集"
    ]
  },
  Phase2: {
    duration: "4周", 
    focus: "深度功能完善",
    deliverables: [
      "技能树复杂交互",
      "成就系统完整实现",
      "个性化推荐算法"
    ]
  },
  Phase3: {
    duration: "2周",
    focus: "体验优化打磨", 
    deliverables: [
      "动画细节完善",
      "用户反馈整合",
      "性能优化调整"
    ]
  }
};
```

### 🎯 Phase 1 核心验证目标

```javascript
const phase1Goals = {
  coreLoop: "验证 积分获取 → 任务完成 → 奖励兑换 基础循环",
  navigation: "确保 6个核心页面 流畅跳转和状态管理",
  dataCollection: "实现 用户行为埋点 和基础分析能力",
  userFlow: "测试 完整用户旅程 的可用性和满意度"
};
```

---

## 🎯 当前开发重点

**Phase 1 执行中** - 核心循环验证 (预计2周)
- ✅ 界面简化和导航优化已完成
- 🔄 正在验证积分-任务-奖励循环
- ⏳ 待完善页面跳转逻辑
- ⏳ 待实现用户行为数据收集