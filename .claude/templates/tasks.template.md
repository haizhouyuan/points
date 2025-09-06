# Tasks（任务拆解）— <feature-name>

## WBS
- 1) 需求与设计评审（Reviewer：@）
- 2) 前端实现（限定文件：见 `guards/file-allowlist.frontend.txt`）
- 3) 后端实现（限定文件：见 `guards/file-allowlist.backend.txt`）
- 4) 云函数/配置（如涉及）
- 5) 测试用例（Jest / Playwright / Emulator）
- 6) 文档与变更记录
- 7) 预发布验证与监控看板

## 每个任务的 DoD（Definition of Done）
- 代码通过 ESLint/TypeScript 编译，无严重告警
- 单元测试（Jest）与端到端测试（Playwright）全绿，新增用例覆盖变更路径
- 接口契约与错误码对齐 `design.md`
- 无障碍/性能/安全清单已勾选（见 `checklists/`）
- 关键日志/指标/追踪已落地
- PR 描述附：规格链接 + 截图/日志 + 测试输出摘要