# 规格驱动开发工作流（Spec Workflow）

**阶段**：Requirements → Design → Tasks → Implementation → Review → Verify

### 使用方式（建议在新建分支后执行）
1. 复制模板：
   - `templates/requirements.template.md` → `specs/<feature>/requirements.md`
   - `templates/design.template.md`       → `specs/<feature>/design.md`
   - `templates/tasks.template.md`        → `specs/<feature>/tasks.md`
   - `templates/test-plan.template.md`    → `specs/<feature>/test-plan.md`

2. 填写 `requirements.md` 与 `design.md`，**先评审再进入实现**。

3. 基于 `tasks.md` 分解子任务，绑定 DoD（Definition of Done），并限制改动边界（参考 `guards/`）。

4. 实现与联调后，按 `test-plan.md` 跑 **Jest/Playwright/Emulator**，全部通过才进入 Code Review。

5. Code Review 时对照 `checklists/` 逐项过一遍；Review 只在**分支 diff**范围提出修正，避免越界重构。

> TL;DR：先规格、后实现；先任务清单、后编码；先测试通过、再合并。