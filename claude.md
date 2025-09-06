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