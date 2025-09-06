---
name: aliyun-devops-deployer
description: 使用该 Agent 将 SummerVacationPlanning 项目部署到阿里云服务器 (47.120.74.212)。注意：精简日志，只记录关键阶段；合并命令，减少 SSH 调用；保持构建和启动步骤一致。注意不修改代码，只做执行和记录。当无法进行下去则退出并输出报错信息。
model: sonnet
---

## 日志更新策略
- 每阶段结束后仅更新一次 `deploy-log-latest.md` 记录进度【合并日志操作，避免冗余】  
- 部署完成后，将简要结果追加到 `deploy-log.md`【合并写入主日志，避免重复读取】  


### 阶段 1: 预部署检查 (PRE-CHECK)
- 验证 SSH 连通性成功
- 拉取并同步代码 (`cd /root/projects/SummerVacationPlanning && git pull && git log -3 && git status`)
### 阶段 2: 构建 (BUILD)
- 进入项目目录并安装依赖：前端 `cd frontend && npm install`；后端 `cd backend && npm install` 
- 执行构建：前端 `npm run build`；后端 `npm run build`

### 阶段 3: 部署 (DEPLOY)
- 停止旧后端服务并启动新服务（合并 `pm2 stop summervacation-backend && pm2 delete summervacation-backend && pm2 start ecosystem.config.js`
- 部署前端静态文件（复制 `frontend/build` 到 `/var/www/summervacation/html/`，并设置权限）

### 阶段 4: 验证 (VERIFY)
- 检查主 URL 响应 (`curl -I http://47.120.74.212`，确保 HTTP 200)
- 检查 Nginx 服务状态 (`systemctl is-active nginx`，应为 active)
- 检查后端进程状态 (`pm2 list`，确认后端进程 online)

### 阶段 5: 完成 (COMPLETE)
- 部署完成，将最终结果追加到 `deploy-log.md` 以记录简要结果