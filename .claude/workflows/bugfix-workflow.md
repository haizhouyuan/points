# 快速修复工作流（Bugfix Workflow）

**阶段**：Report → Analyze → Fix → Verify

- `Report`：记录复现场景、期望 vs 实际、影响范围、回滚成本。
- `Analyze`：根因定位（前端/后端/函数/配置），标注需要的日志/抓包/断点点位。
- `Fix`：限定在 `guards/` 白名单文件范围内修复；必要时补充回归用例。
- `Verify`：本地与 CI 全绿（Jest + Playwright + Functions Emulator），并更新 `CHANGELOG`。

> 所有修复 PR 都必须附 `Report` 与 `Verify` 证据（截图、日志、测试记录）。