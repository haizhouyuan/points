# Points Project - Claude Code Guide

> Think carefully and implement the most concise solution that changes as little code as possible.

## Project Overview

Points (游戏化界面设计优化 2.0) is a modern gamified interface optimization project built with React 18 + Vite + TypeScript, featuring containerized deployment and complete CI/CD pipeline integration.

**Tech Stack**: React 18 + Vite + TypeScript + Tailwind CSS + Docker + GitHub Actions

## Server Infrastructure (47.120.74.212)

### Port Allocation
```
服务器端口分配:
├── 系统服务
│   ├── Nginx: 80/443 (已占用)
│   └── SSH: 22 (已占用)
├── StoryApp 项目 (5001-5010)
│   ├── Backend: 5001 (已占用)
│   └── MongoDB: 27017 (已占用)
├── Points 项目 (5002)
│   └── Frontend: 5002 (已占用) ✅
├── 项目2: 5011-5020 (可用)
├── 项目3: 5021-5030 (可用)
├── 项目4: 5031-5040 (可用)
└── 项目5: 5041-5050 (可用)
```

### Resource Usage
- **Points Container**: 2.1MB memory (0.11%), CPU 0.00%
- **Docker Image**: 43.5MB (optimized multi-stage build)
- **Status**: Stable production deployment ✅

## Development Commands

### Local Development
```bash
npm install                    # Install dependencies
npm run dev                    # Development server (port 3000)
npm run build                  # Production build
npm run preview                # Preview production build
```

### Containerized Development
```bash
# Production mode
docker compose up -d

# Development mode (hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Build and run locally
docker build -t points:latest .
docker run -d -p 5002:80 points:latest
```

## Enhanced CI/CD Workflows (2025 Upgrade)

### Complete Pipeline Integration
- **ci.yml**: 完整CI/CD流水线 (质量检查 + Docker构建 + 容器验证)
- **pr-auto-review.yml**: Claude自动代码评审系统
- **auto-fix.yml**: `/fix` 命令自动修复代码问题
- **deploy-staging.yml**: PR成功后自动部署到测试环境
- **deploy-prod.yml**: 手动触发生产环境部署

### Multi-Stage CI Pipeline
1. **Quality Check**: 构建验证 + 代码质量检查 + 类型检查
2. **Docker Build**: 多平台镜像构建 + GHCR推送 (仅主分支)
3. **Container Validation**: GHCR镜像验证 + 健康检查
4. **Pipeline Summary**: 结果汇总和报告生成

### Advanced Features
- **Auto Review**: PR自动评审 (Claude Code powered)
- **Auto Fix**: `/fix` 评论触发自动修复 (ESLint/Prettier/TypeScript)
- **Staging Deploy**: CI成功后自动部署测试环境
- **Container Registry**: GitHub Container Registry 集成
- **Health Checks**: 完善的容器健康监控

### Docker Configurations
```bash
# CI环境测试
docker-compose.ci.yml          # CI流水线专用配置

# GHCR镜像验证  
docker-compose.ghcr.yml        # 生产镜像验证环境

# 生产环境
docker-compose.yml             # 标准生产配置
```

### Production Deployment
```bash
# Via GitHub Actions (Recommended)
- Manual trigger: deploy-prod.yml workflow
- Target: production environment
- Port: 5002 (避免与StoryApp冲突)

# Manual deployment
docker pull ghcr.io/haizhouyuan/points:sha-latest
docker run -d --name points-app -p 5002:80 ghcr.io/haizhouyuan/points:sha-latest
```

## Known Issues & Solutions

### External Access (需要解决)
**Problem**: 47.120.74.212:5002外网无法访问  
**Cause**: 阿里云安全组未开放5002端口  
**Solution**: 在阿里云控制台配置安全组规则

### Port Conflicts (已解决)
**Problem**: 端口5001被StoryApp占用  
**Solution**: Points项目统一使用5002端口

### Container Permissions (已解决)
**Problem**: Nginx非root用户权限问题  
**Solution**: 自定义nginx.conf配置可写目录

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### 1. Always use the file-analyzer sub-agent when asked to read files.
The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

## Philosophy

### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.


## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION : check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles
