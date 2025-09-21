# StoryApp CI/CD 移植调研报告

## 1. 背景与目标
- 对比 `github.com/haizhouyuan/storyapp`（下称 StoryApp）与当前项目 Points 的 CI/CD 能力，判断是否可以直接复用。
- 评估迁移成本：流水线作业、容器编排、部署方式、敏感配置。
- 给出在同一台阿里云服务器上同时托管 StoryApp 与 Points 的资源管理建议。

## 2. StoryApp 现有 CI/CD 关键组件
- **CI 主流程**（`.github/workflows/ci.yml`）：
  - `unit-tests`：基于 Node 20，安装 npm workspaces 依赖，分别构建 `shared`、`backend`、`frontend`，依赖 MongoDB 服务并执行后端测试。
  - `e2e-tests`：使用 `docker-compose.ci.yml` 启动 Mongo + 应用容器，写入 `.env`，等待健康检查后执行 Playwright 端到端测试，并上传报告。
  - `test-summary`：整理上游作业的结果，写入 `GITHUB_STEP_SUMMARY`。
- **Docker 构建推送**（`.github/workflows/docker-build-push.yml`）：
  - Buildx 多架构构建、Trivy 漏洞扫描（生成 SARIF 并上传 Security tab）、SBOM 打包、推送至 GHCR。
- **部署工作流**：
  - `deploy-prod.yml`：手动触发，准备 `.env`，SSH 登录远程主机（`/root/projects/storyapp`），通过 `docker compose -f docker-compose.yml -f docker-compose.ghcr.yml` 构建完整栈（Mongo + Node + 可选 Nginx），完成后做健康检查、可选生产 Playwright 验证。
  - `deploy-staging.yml`：在 CI 成功后或手动触发时，动态生成 `.env.staging` 与分支隔离容器，部署至 `storyapp` 网络与 Mongo 实例，回传日志并在 PR 评论部署状态。
- **Compose 基础设施**：
  - `docker-compose.yml` 定义 Mongo、应用、Nginx，以及日志/上传卷。
  - `docker-compose.ci.yml` 针对测试环境提供 Mongo + app 服务。

## 3. Points 项目现状对比
- **包结构**：单一前端 Vite 应用（`package.json` 无 npm workspace，脚本仅涉及 `vite build` / `vitest`）。
- **CI/CD**：现有工作流 `ci.yml` 仅执行依赖安装、可选 lint/typecheck、构建、Docker Buildx 推送及镜像验证。无数据库服务、无端到端测试。
- **部署**：`deploy-prod.yml` 通过 `appleboy/ssh-action` 拉取 GHCR 前端镜像，运行 `points-app` 容器（80 → 5002）。无 `.env`，仅静态文件服务。
- **Compose**：`docker-compose.yml` 只有前端容器；`docker-compose.ci.yml` 用于本地/CI 构建校验，不涉及数据库。

## 4. 直接移植的障碍
| 模块 | StoryApp 需求 | Points 现状 | 影响 |
| --- | --- | --- | --- |
| npm workspace 命令 | `npm run -w backend …` 等 | 单包，无相关脚本 | 直接执行会报错；需大量脚本调整或删除 |
| MongoDB 服务 | CI / Compose / 部署均默认存在 | 前端静态站点，无后端 | 会引入无用服务并增加维护负担；健康检查会失败 |
| `.env` 配置 | 包含 API Key、Mongo 凭据、后端端口 | 无后端变量 | 生成 `.env` 没有对应消费者，徒增管理成本 |
| Playwright 测试 | 依赖端到端用例、脚本、数据播种 | 尚未配置 E2E，用例缺失 | 需重写测试或禁用相关步骤，否则作业失败 |
| 部署目录结构 | 假定服务器 `/root/projects/storyapp`，docker compose 多文件 | Points 镜像直接拉起 | 必须重写部署脚本；强行沿用可能覆盖现有容器 |

结论：StoryApp 流水线是“全栈应用 + 数据库”模板，Points 是“纯前端静态站点”；原样移植将导致 CI/CD 作业普遍失败并增加冗余服务，不建议直接整套复制。

## 5. 建议的迁移策略
1. **选择性复用通用能力**
   - 保留 StoryApp 中成熟的 Buildx 多架构 & Trivy/SBOM 步骤，用于加强镜像安全性。
   - 借鉴 Playwright 作业结构，在 Points 将来补充端到端测试时复用（目前可留空或置为可选）。
   - 若需要多环境部署，可参考 `deploy-staging.yml` 的 PR 预览流程，但改成构建纯前端镜像，剔除 Mongo/Nginx。
2. **梳理差异化脚本**
   - 将 `npm run lint`、`npm run test`、`npm run build` 作为主要 CI 步骤，去掉 `npm run -w …` 命令。
   - 若暂不引入 Playwright，须将相关作业设为 `if: always()` + `continue-on-error: true` 或直接移除。
3. **部署脚本定制化**
   - 继续沿用 Points 当前 `deploy-prod.yml` 中的简洁 SSH + `docker run` 流程。
   - 如需 Compose 管理多个容器，可提取 StoryApp 的 `APP_TAG` 遍历逻辑，但保持 Points 专用的端口 / 镜像命名。

## 6. 阿里云服务器资源协同方案
- **服务划分**
  - StoryApp：MongoDB、Node 应用（5000）、可选 Nginx（80/443）；数据卷 `mongo_data`、`app_logs`、`app_uploads`。
  - Points：Nginx 静态站（5002）。
  - 建议使用宿主层 Nginx/Caddy 反向代理统一出口，按域名路由至 StoryApp / Points，集中处理 HTTPS。
- **目录与部署约定**
  - `/root/projects/storyapp`：保留原 Compose 栈及 env 文件。
  - `/root/projects/points`：仅存储 `.env`（可选）、部署脚本、`docker-compose.yml`，容器命名 `points-app`。
  - 明确分离数据卷（StoryApp 的 `mongo_data` 与 Points 构建产物互不共享）。
- **端口与网络**
  - StoryApp 使用内部 `storyapp-net`；Points 使用 `points-net`。
  - 避免端口冲突：StoryApp 暴露 5000/80，Points 暴露 5002。通过代理将外部 80/443 转发到内部端口。
- **资源限制**
  - 为 StoryApp 的 Mongo、应用容器设置 CPU/内存限制（`deploy.resources` 或 `mem_limit`），防止数据库抢占资源。
  - Points 容器以静态服务为主，可设置较低的 `cpu_shares` 与 512MB 左右 `mem_limit`。
  - 定期清理未使用镜像与卷，防止磁盘占满。
- **监控与备份**
  - 统一部署 `node_exporter` / `cadvisor`，接入阿里云监控或自建 Prometheus。
  - StoryApp 的 Mongo 数据卷建立自动备份策略（快照或 `mongodump`），Points 的静态镜像可依赖 GHCR 备份。
- **安全与凭据**
  - 使用独立的 `.env`：StoryApp 保存 API Key、Mongo 凭据；Points 只在必要时配置公共变量。
  - 划分 SSH 账号或使用不同的部署 key，限制脚本访问彼此项目的数据。
  - 若两项目共享 GHCR PAT，应限制权限（仅读写所需仓库）。

## 7. 结论
- StoryApp 的 CI/CD 体系面向全栈应用；Points 属于纯前端项目，直接移植不可行。
- 推荐以“通用能力拆分 + 逐步增强”方式迁移，保留现有 Points 流水线的轻量流程，按需吸收 StoryApp 的安全扫描与部署规范。
- 在阿里云上部署两套应用时，通过端口规划、反向代理、资源限制与凭据隔离，可在同一服务器上安全稳定运行。
