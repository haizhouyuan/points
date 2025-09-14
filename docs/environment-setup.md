# 环境配置文档

本项目使用 Vite + React 构建，并通过环境变量控制运行参数。建议在开发与部署前完成以下配置。

## 准备 `.env`

1. 复制模板：

```bash
cp .env.example .env
```

2. 根据需要修改以下变量：

- `NODE_ENV`：运行环境，建议本地为 `production` 或 `development`。
- `APP_PORT`：容器/服务映射端口，默认 `5002`（避免与 StoryApp 使用的 5001 冲突）。
- `APP_TAG`：Docker 镜像标签（如使用 GHCR 镜像部署，默认 `sha-latest`）。

可选（Vite 前端运行时配置，需以 `VITE_` 前缀）：

- `VITE_API_URL`：后端 API 地址，例如 `http://localhost:5000`。
- `VITE_API_TIMEOUT`：请求超时时间，单位毫秒。

## 运行与预览

- 开发模式：`npm run dev`（默认端口 3000）
- 生产构建：`npm run build`
- 本地预览：`npm run preview`

如需自定义预览端口，可执行：

```bash
npx vite preview --port 3000
```

## 安全建议

- 不要在仓库中提交实际生产机密（Token/私钥/主机信息）。
- 仅提交 `.env.example` 模板；真实 `.env` 保存在本地或安全的密钥管理中。

