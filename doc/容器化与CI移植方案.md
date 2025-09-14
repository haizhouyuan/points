# points 项目容器化与 CI 移植方案（参考 storyapp）

本文为将 storyapp 的容器化部署与 CI 流水线体系迁移至当前 points 仓库的深度方案，确保两套应用可在同一台服务器共存且不冲突，并显著提升构建、测试与部署效率。

## 1. 概述与目标
- 目标：为 points 引入与 storyapp 一致的容器化与 CI 规范，实现本地/CI/生产一致的构建运行环境，确保与 storyapp 共存不冲突。
- 产出：Dockerfile、docker-compose（基座 + dev/ci）、Nginx 静态站配置、GitHub Actions CI、Makefile、.env.example。

## 2. 现状体检
### 2.1 points（当前仓库）
- 框架：Vite + React（SWC），`vite.config.ts`：别名 `@`→`src`，dev 端口 `3000`，构建产出 `build/`。
- package.json：`dev`、`build` 脚本，暂无 Docker/compose/CI。

### 2.2 storyapp（参考项目）
- Monorepo（backend + frontend + shared）。
- 容器化：多阶段 Dockerfile；Compose 基座 + dev/ci/ghcr override；Nginx 反向代理与 SPA 路由；健康检查。
- CI：GitHub Actions 分层（单测 + Docker Compose E2E + 汇总/日志）。

## 3. 可复用的关键模式
- 多阶段构建（builder → runtime），分离依赖与运行期镜像。
- docker compose 基座 + 环境 override（dev/ci），服务命名与健康检查规范统一。
- Nginx 提供静态站 + SPA 回退；安全头与 gzip 优化。
- CI 分层：快速构建 + 容器 smoke/E2E；artifact 上传；失败时日志收集。
- .env 参数化端口/镜像 tag，避免硬编码；Makefile 封装常用命令。

## 4. 与 storyapp 共存的无冲突策略
- 容器/网络命名：使用 `points-` 前缀（如 `points-web`、`points-net`）。
- 生产端口：points 默认对外 `8081:80`（Nginx 静态站）；storyapp 保留 80/5000。
- 开发端口：points dev 使用 `3100:3000`（Vite），避免与本地/他服务冲突。
- 网络隔离：`points-net` 与 `storyapp-net`。如需统一反代，可将 Nginx 加入两者网络或引入网关。

## 5. 落地改造清单（一次性 PR）
1) 新增 Dockerfile（多阶段：Node 构建 + Nginx 运行）。
2) 新增 docker-compose 三件套：
   - `docker-compose.yml`（生产基座，service=`web`、健康检查、`WEB_PORT` 参数化）。
   - `docker-compose.dev.yml`（Node18 + 源码挂载 + Vite dev）。
   - `docker-compose.ci.yml`（CI 轻量容器 smoke）。
3) 新增 Nginx 配置（`nginx/nginx.conf`、`nginx/conf.d/points.conf`）。
4) 新增 GitHub Actions（`ci.yml`：build + docker-smoke）。
5) 新增 `.env.example`、`Makefile`。
6) 可选：在 storyapp 的 Nginx 中加 `/points` 路由统一反代。

## 6. 文件示例（推荐落地内容）
> 以下为建议的最小可用示例，可直接复制到仓库对应路径。

### 6.1 Dockerfile（根目录）
```dockerfile
# 多阶段：构建静态产物 + Nginx 提供静态服务
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV CI=true
# 可选：使用国内源
# RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/points.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build ./
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 6.2 Nginx 配置
`nginx/nginx.conf`
```nginx
user  nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
  worker_connections 1024;
  use epoll;
  multi_accept on;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
  access_log /var/log/nginx/access.log main;
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  client_max_body_size 50m;

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_comp_level 6;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss image/svg+xml;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  include /etc/nginx/conf.d/*.conf;
}
```

`nginx/conf.d/points.conf`
```nginx
server {
  listen 80;
  server_name localhost _;
  server_tokens off;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location = /nginx-health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
  }
}
```

### 6.3 docker-compose（生产基座）
`docker-compose.yml`
```yaml
name: points

networks:
  points-net:
    driver: bridge

services:
  web:
    container_name: points-web
    build: .
    image: points:${APP_TAG:-latest}
    restart: unless-stopped
    ports:
      - "${WEB_PORT:-8081}:80"
    networks:
      - points-net
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 10
```

### 6.4 docker-compose（开发环境 override）
`docker-compose.dev.yml`
```yaml
services:
  web:
    image: node:18-alpine
    container_name: points-dev
    working_dir: /app
    command: sh -c "
      npm config set fund false &&
      npm install &&
      npm run dev
    "
    environment:
      - NODE_ENV=development
      - VITE_DEV_SERVER_HOST=0.0.0.0
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3100:3000"
    restart: unless-stopped
    networks:
      - points-net
```

### 6.5 docker-compose（CI 环境）
`docker-compose.ci.yml`
```yaml
name: points
services:
  web:
    build: .
    container_name: points-ci
    ports:
      - "5003:80"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 20s
```

### 6.6 GitHub Actions（CI）
`.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

env:
  NODE_VERSION: '20.x'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build/
          retention-days: 7

  docker-smoke:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - name: Build & up
        run: docker compose -f docker-compose.ci.yml up -d --build
      - name: Wait & probe
        run: |
          timeout 60 bash -c '
            until curl -fsS http://localhost:5003 >/dev/null; do
              echo "Waiting web..."
              sleep 3
            done
          '
          curl -fsS http://localhost:5003 | head -n 5
      - name: Cleanup
        if: always()
        run: docker compose -f docker-compose.ci.yml down -v
```

### 6.7 Makefile
```makefile
.PHONY: dev build up up-dev down logs

dev:
	 docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

build:
	 docker compose build

up:
	 docker compose up -d --build

up-dev:
	 docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:
	 docker compose down -v

logs:
	 docker compose logs -f
```

### 6.8 .env.example
```env
# 可按需覆盖
WEB_PORT=8081
```

## 7. 统一反代（可选增强）
如需用 storyapp 的 Nginx 统一对外：
- 让 storyapp 的 nginx 容器加入 `points-net`（或让 points-web 加入 `storyapp-net`）。
- 在 `/mnt/d/storyapp/nginx/conf.d/` 增加（示例）：
```nginx
location /points/ {
  proxy_pass http://points-web;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```
- 若使用子路径 `/points` 发布，需在 points 的 `vite.config.ts` 设置 `base: '/points/'`，防止静态资源 404。

## 8. 验证步骤
### 8.1 本地
1) `npm ci && npm run build`
2) `docker build -t points:local . && docker run -p 8081:80 points:local`
3) 访问 `http://localhost:8081`
4) `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` → dev 访问 `http://localhost:3100`

### 8.2 服务器
1) `docker compose up -d --build`
2) 访问 `http://<server>:8081`
3) 如采用统一反代，按第 7 章更新 storyapp Nginx 并重启 nginx 容器。

## 9. CI/CD 说明与扩展
- 当前 CI：安装 → 构建 → 容器 smoke。适合前端静态站快速验证。
- 可选扩展：
  - 引入 Vitest + RTL：`test`/`test:run` 脚本；在 `build` 前执行。
  - Playwright E2E：对 `http://localhost:5003` 做关键路径检查。
  - GHCR 发布：新增 `publish-image` job，推送 `ghcr.io/<owner>/points:${{ github.sha }}`。

## 10. 风险与注意事项
- 子路径发布需 `base` 配置，否则出现资源 404。
- 端口冲突：points 使用 `8081/3100`；storyapp 使用 `80/5000/5001/5002`。
- 构建时不要提交任何密钥；前端运行时变量使用 `VITE_` 前缀并在构建阶段注入。

## 11. 实施计划（1–2 天）
- 第 1 天：落地 Dockerfile、nginx、compose 三件套；完成本地与服务器验证；提交 PR。
- 第 2 天：落地 GitHub Actions（build + smoke）；可选接入 GHCR 发布与基础 E2E；提交二次 PR。

---
如需我直接按本文档在仓库中创建这些文件并完成初版验证，请确认，我将基于此方案一次性提交变更。

