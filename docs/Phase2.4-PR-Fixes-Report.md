# Phase 2.4 高级学习路径规划系统 — 代码评审与修复报告

分支: `phase2-advanced-gamification`
提交: `1aa655b9`（基础实现） + 本次修复提交

## 修复与增强概览

- 类型与导入
  - 新增轻量类型：`TaskLite`、`UserLite` 于 `src/services/types.ts`，用于推荐与行为分析模块。
  - 统一导入：
    - `src/services/recommendation.service.ts` → 使用 `@/services/types` 的 `TaskLite`/`UserLite`。
    - `src/services/behavior-analysis.service.ts` → 使用 `@/services/types` 的 `TaskLite`/`UserLite`。
    - `src/components/SmartRecommendations.tsx` → 统一改为 `@/services/...` + `TaskLite`/`UserLite`。

- 拓扑顺序与权重排序
  - `src/services/learning-path.service.ts`：将 `optimizePathForUser` 末尾的简单按权重排序，替换为“基于权重的优先队列拓扑排序”以保留节点依赖顺序：
    - 新增 `prioritizedTopologicalOrder`，在入度为 0 的候选集中优先选择 `adaptiveWeight` 更高的节点。

- 边界与健壮性
  - `learning-path.service.ts`：
    - `calculateConsistency` 在均值趋近 0 时直接返回缺省值，避免 NaN/Infinity。
    - `calculateRetentionRate` 在 `firstAvg` 近 0 时跳过该分支，防止除零。
    - `calculateMaxAvailableTime` 返回非负周数（历史目标日期不会导致负时长）。
    - 新增 `PathProgress` 类型，并将 `getPathProgress` 返回类型声明为 `PathProgress | null`。
  - `behavior-analysis.service.ts`：
    - `predictCompletionRate` 在样本不足时返回合理缺省，并对分母为 0 的半区间进行防护。

- 规划器/执行器与可用性
  - `src/components/LearningPathPlanner.tsx`：
    - 统一导入别名为 `@/services/...`。
    - 将技能选项 `SKILL_OPTIONS` 的 id 改为中文（“数学/英语/阅读/科学/艺术/编程”），与节点库语言一致，提升命中率。
  - `src/components/LearningPathExecutor.tsx`：
    - 统一导入别名；将 `pathProgress` 的 `any` 替换为强类型 `PathProgress | null`。

## 提交记录（本次）

- 变更分散在多个文件；提交统一推送到 `phase2-advanced-gamification`。

## 验证建议

- 规划流转：
  - 在“学习分析 → 学习路径规划”，选择“数学/英语”等技能 → 生成推荐 → 选择路径 → 进入执行页面。
  - 验证节点顺序：所有节点满足其 `prerequisiteNodes`，无“未满足前置却被提前”的情况。
- 执行与进度：
  - 完成当前节点后，验证整体进度与下个节点解锁逻辑正确；`onPathComplete` 在 100% 时触发。
- 边界：
  - 设置一个已过期的 `timeConstraint`，路径将按 0 周可用时长裁剪。
  - 行为分析数据缺失（sessions 数量少/为 0）时不报错，返回合理缺省。

## 后续建议

- 将路径与进度缓存至 localStorage（userId+pathId）或后端，避免刷新丢失。
- 将适应性调整触发逻辑改为基于真实指标阈值而非随机概率。
- 为 `prioritizedTopologicalOrder` 与 `filterRelevantNodes` 增加单测，覆盖：依赖环/权重冲突/时间约束裁剪。

---

如需我继续补充 Vitest 用例或将更多相对导入改为 `@/…`，请告知优先级。

