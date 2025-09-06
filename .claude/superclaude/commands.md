# SuperClaude Commands（推荐）

## 规划与设计
/design --architect
- 基于 `requirements.md` 生成 `design.md` 草案（页面结构/组件 API/接口契约/日志与指标）
/plan --frontend
- 结合 `design.md` 生成前端任务清单（绑定 Playwright 场景）

## 实现（限定边界）
/build --frontend --files-from ".claude/guards/file-allowlist.frontend.txt"
/build --backend  --files-from ".claude/guards/file-allowlist.backend.txt"

## 测试与验证
/test --qa --jest       "聚焦本分支改动模块"
/test --qa --playwright "关键用户路径场景"

## 代码质量
/review --refactor --frontend
/review --refactor --backend
- 仅就本分支 diff 范围提出建议，避免越界重构

## 发布前检查
/audit --security
/optimize --performance
/document --update "变更点/已知限制/回滚方案"