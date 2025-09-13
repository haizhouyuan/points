# Points 项目部署指南

本文档提供 Points 项目的完整部署流程，包括本地测试、CI/CD 流程和生产部署。

## 🚀 部署概览

Points 项目采用现代化的容器化部署方式：
- **容器化**: Docker + Nginx
- **镜像仓库**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions
- **部署目标**: 支持任何 Docker 环境

## 📋 部署前检查清单

### 环境要求

- [ ] Docker 20.10+
- [ ] Docker Compose 2.0+
- [ ] Node.js 18+ (本地开发)
- [ ] Git 2.30+

### 必备配置

- [ ] GitHub 仓库 Secrets 已配置
- [ ] 生产环境服务器已准备
- [ ] SSH 密钥已配置
- [ ] Docker Registry 权限已设置

## 🔄 CI/CD 流程详解

### 1. 开发流程

```mermaid
graph LR
    A[本地开发] --> B[创建 PR]
    B --> C[CI 检查]
    C --> D[代码审查]
    D --> E[合并到 main]
    E --> F[自动构建镜像]
    F --> G[手动部署]
```

### 2. 自动化检查 (CI)

**触发条件**: Pull Request 到 main/master 分支

**检查内容**:
- 依赖安装 (`npm ci`)
- 代码构建 (`npm run build`)
- 构建产物验证

**Workflow 文件**: `.github/workflows/ci.yml`

### 3. 镜像构建 (CD)

**触发条件**: 推送到 main/master 分支或创建 Release

**执行流程**:
1. 多阶段 Docker 构建
2. 推送到 GHCR
3. 安全漏洞扫描
4. 容器健康检查

**镜像标签**:
- `sha-latest`: 最新构建
- `sha-<commit>`: 特定提交
- `v<version>`: 发布版本

**Workflow 文件**: `.github/workflows/docker-build-push.yml`

### 4. 生产部署

**触发方式**: 手动触发 (workflow_dispatch)

**部署流程**:
1. SSH 连接到生产服务器
2. 登录 GHCR 拉取镜像
3. 停止旧容器
4. 启动新容器
5. 健康检查验证
6. 清理旧镜像

**Workflow 文件**: `.github/workflows/deploy-prod.yml`

## 🏗️ 本地开发部署

### 标准开发环境

```bash
# 克隆项目
git clone https://github.com/haizhouyuan/points.git
cd points

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

### 容器化开发环境

```bash
# 使用开发模式 Compose (支持热更新)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 或者单独构建测试
docker build -t points:dev .
docker run -d --name points-dev -p 3000:80 points:dev
```

## 🐳 生产环境部署

### 方式一：使用预构建镜像 (推荐)

```bash
# 拉取最新镜像
docker pull ghcr.io/haizhouyuan/points:sha-latest

# 运行容器
docker run -d \
  --name points-app \
  --restart unless-stopped \
  -p 5001:80 \
  ghcr.io/haizhouyuan/points:sha-latest

# 验证部署
curl http://localhost:5001
```

### 方式二：使用 Docker Compose

```bash
# 1. 创建环境配置
cp .env.example .env

# 2. 修改环境变量 (可选)
vim .env

# 3. 启动服务
docker compose up -d

# 4. 查看状态
docker compose ps
docker compose logs points-app
```

### 方式三：本地构建部署

```bash
# 构建镜像
docker build -t points:local .

# 运行容器
docker run -d \
  --name points-local \
  --restart unless-stopped \
  -p 5001:80 \
  points:local
```

## 🔧 高级部署配置

### Nginx 反向代理配置

如果需要通过域名访问，配置 Nginx 反向代理：

```nginx
# /etc/nginx/sites-available/points
server {
    listen 80;
    server_name points.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Swarm 集群部署

```yaml
# docker-stack.yml
version: "3.8"

services:
  points:
    image: ghcr.io/haizhouyuan/points:sha-latest
    ports:
      - "5001:80"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - points-net

networks:
  points-net:
    driver: overlay
```

```bash
# 部署到 Swarm
docker stack deploy -c docker-stack.yml points-stack
```

### Kubernetes 部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: points-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: points
  template:
    metadata:
      labels:
        app: points
    spec:
      containers:
      - name: points
        image: ghcr.io/haizhouyuan/points:sha-latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: points-service
spec:
  selector:
    app: points
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

```bash
# 部署到 Kubernetes
kubectl apply -f k8s-deployment.yaml
```

## 🔍 部署验证

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

APP_URL="http://localhost:5001"
TIMEOUT=30

echo "🔍 开始健康检查..."

# 检查容器状态
if ! docker ps | grep -q "points-app"; then
    echo "❌ 容器未运行"
    exit 1
fi

# 检查 HTTP 响应
if curl -f -s --max-time $TIMEOUT "$APP_URL" > /dev/null; then
    echo "✅ 健康检查通过"
    echo "📊 应用状态:"
    curl -s "$APP_URL" | head -1
    echo "🌐 访问地址: $APP_URL"
else
    echo "❌ 健康检查失败"
    echo "📋 容器日志:"
    docker logs points-app --tail 10
    exit 1
fi
```

### 性能监控

```bash
# 资源使用情况
docker stats points-app --no-stream

# 详细信息
docker inspect points-app | jq '.State'

# 网络测试
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5001
```

## 🚨 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 查看详细日志
docker logs points-app

# 检查容器配置
docker inspect points-app

# 重启容器
docker restart points-app
```

#### 2. 端口冲突

```bash
# 查看端口占用
netstat -tlnp | grep :5001

# 使用其他端口
docker run -d --name points-app -p 5002:80 points:latest
```

#### 3. 镜像拉取失败

```bash
# 检查网络连接
docker pull hello-world

# 手动登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 重新拉取
docker pull ghcr.io/haizhouyuan/points:sha-latest
```

#### 4. 权限问题

```bash
# 检查 Docker 权限
docker run --rm -it alpine whoami

# 重建镜像 (如果有本地修改)
docker build --no-cache -t points:latest .
```

### 日志分析

```bash
# 实时查看日志
docker logs -f points-app

# 导出日志
docker logs points-app > points-app.log

# 分析访问日志
docker exec points-app cat /var/log/nginx/access.log | tail -100
```

## 📊 监控与维护

### 定期维护任务

```bash
#!/bin/bash
# maintenance.sh

echo "🧹 开始系统维护..."

# 更新镜像
docker pull ghcr.io/haizhouyuan/points:sha-latest

# 清理无用镜像
docker image prune -f

# 清理无用容器
docker container prune -f

# 检查磁盘使用
df -h

echo "✅ 维护完成"
```

### 自动更新脚本

```bash
#!/bin/bash
# auto-update.sh

NEW_TAG=${1:-sha-latest}
CONTAINER_NAME="points-app"
IMAGE_NAME="ghcr.io/haizhouyuan/points"

echo "🚀 开始自动更新到版本: $NEW_TAG"

# 拉取新镜像
docker pull $IMAGE_NAME:$NEW_TAG

# 优雅停止旧容器
docker stop $CONTAINER_NAME

# 删除旧容器
docker rm $CONTAINER_NAME

# 启动新容器
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p 5001:80 \
  $IMAGE_NAME:$NEW_TAG

# 健康检查
sleep 10
if curl -f http://localhost:5001; then
    echo "✅ 更新成功"
else
    echo "❌ 更新失败，检查日志"
    docker logs $CONTAINER_NAME
fi
```

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [容器安全最佳实践](https://docs.docker.com/engine/security/)

## 🎯 下一步

完成部署后，建议：

1. 配置监控和告警
2. 设置自动备份
3. 制定灾难恢复计划
4. 优化性能和安全配置
5. 建立运维文档和流程

---

如有部署问题，请参考 [GitHub Issues](https://github.com/haizhouyuan/points/issues) 或查阅相关文档。