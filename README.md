# Points - 游戏化界面设计优化 2.0

Points 是一个游戏化界面设计优化项目，提供现代化的前端用户界面。本项目现已支持容器化部署和完整的 CI/CD 流程。

Original project: https://www.figma.com/design/KWRRq9FTWJ48Z3JaHRjtye/%E6%B8%B8%E6%88%8F%E5%8C%96%E7%95%8C%E9%9D%A2%E8%AE%BE%E8%AE%A1%E4%BC%98%E5%8C%96-2.0

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 容器化部署

#### 使用 Docker

```bash
# 构建镜像
docker build -t points:latest .

# 运行容器
docker run -d --name points-app -p 5002:80 points:latest

# 访问应用
open http://localhost:5002
```

#### 使用 Docker Compose

```bash
# 生产环境
docker compose up -d

# 开发环境（热更新）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 🏗️ 项目架构

- **前端框架**: React 18 + Vite + TypeScript
- **UI 组件**: Radix UI + Tailwind CSS
- **构建工具**: Vite 6.3.5
- **容器化**: Docker + Nginx
- **CI/CD**: GitHub Actions

## 📦 Docker 镜像

项目镜像托管在 GitHub Container Registry (GHCR):

```bash
# 拉取最新镜像
docker pull ghcr.io/haizhouyuan/points:sha-latest

# 运行镜像
docker run -d -p 5002:80 ghcr.io/haizhouyuan/points:sha-latest
```

### 镜像标签说明

- `sha-latest`: 最新构建版本
- `sha-<commit>`: 特定提交版本
- `v<version>`: 发布版本标签

## 🔧 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

主要配置项：
- `APP_PORT`: 应用端口（默认：5002，避免与StoryApp端口5001冲突）
- `NODE_ENV`: 运行环境
- `APP_TAG`: Docker 镜像标签

## 🖥️ 服务器资源分配 (47.120.74.212)

### 端口分配表
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

### 资源使用情况
- **内存占用**: 2.1MB (系统0.11%)
- **CPU使用**: 0.00% (空闲状态)
- **镜像大小**: 43.5MB (多阶段构建优化)
- **运行状态**: 生产环境稳定运行 ✅

## 🚀 CI/CD 流程

### 持续集成 (CI)

- **触发条件**: Pull Request 到 main/master
- **检查项目**: 
  - 代码构建验证
  - 依赖安装测试
  - 构建产物检查

### 持续部署 (CD)

- **镜像构建**: 推送到主分支时自动构建并推送 Docker 镜像
- **安全扫描**: 使用 Trivy 进行容器安全扫描
- **生产部署**: 手动触发部署流程到生产环境

### GitHub Actions 工作流

- `.github/workflows/ci.yml` - Pull Request 质量检查
- `.github/workflows/docker-build-push.yml` - Docker 镜像构建与推送
- `.github/workflows/deploy-prod.yml` - 生产环境部署

## 🔒 安全特性

- 非 root 用户运行容器
- 容器安全扫描
- 环境变量管理
- GitHub Secrets 保护

## 📋 开发指南

### 本地开发环境

```bash
# 安装依赖
npm ci

# 启动开发服务器（端口 3000）
npm run dev
```

### 容器化开发

```bash
# 使用开发模式 Compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 访问开发服务器
open http://localhost:3000
```

## 🔍 故障排除

### 容器启动失败

```bash
# 查看容器日志
docker logs points-app

# 检查容器状态
docker ps -a
```

### 构建问题

```bash
# 清理 Docker 缓存
docker builder prune

# 重新构建
docker build --no-cache -t points:latest .
```

## 📚 相关文档

- [部署指南](./docs/deployment-guide.md)
- [CI/CD 配置说明](./docs/github-setup.md)
- [环境配置文档](./docs/environment-setup.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
