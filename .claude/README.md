# .claude 目录说明

本目录用于在 Claude Code / SuperClaude / Spec Workflow 下规范地驱动开发。

## 你已有文件（保留现状）
- `claude.md`: 你已经定制好的项目上下文与运行规则；**不要覆盖**。
- `aliyun-devops-deployer.md`: 阿里云 DevOps 部署说明；**不要覆盖**。

## 新增内容
- `workflows/`: 规格驱动与快速修复流程说明。
- `templates/`: 四份规格模板（需求、设计、任务、测试计划）。
- `checklists/`: 前端/后端/云函数/安全/性能/可访问性清单，做 DoD 判定。
- `guards/`: 受控改动白名单，限制 AI 自动重构的越界范围。
- `superclaude/`: 人格预设与命令集合，约束 AI 的角色与行动。

> 建议：在 PR 模板中强制附上对应的规格链接与 DoD 勾选记录。