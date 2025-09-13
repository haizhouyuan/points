# Phase 2.2 + 2.4 统一合并 PR

## 概要
- Phase 2.2 学习分析仪表板（AI 洞察 + 自研 SVG 图表 + 指标分析）
- Phase 2.4 高级学习路径规划（带依赖图的个性化路径 + 执行器 + 适应性调整）
- 本 PR 覆盖此前两个 PR，并合并了所有稳定性修复与类型/导入规范调整。

## 主要改动
- 学习分析
  - `analytics.service.ts`：除零/NaN 边界防护
  - `LearningAnalyticsChart.tsx`：响应式 + aria/title
  - `LearningAnalyticsDashboard.tsx`：props 传递修正
- 学习路径
  - `learning-path.service.ts`：按权重的优先队列拓扑排序，保证依赖与优先级；时间/数值健壮性
  - `LearningPathPlanner/Executor.tsx`：中文类别匹配、强类型 PathProgress
- 智能推荐/行为分析
  - 新增 `TaskLite`、`UserLite` 轻量类型，统一导入 `@/services/types`
- 测试
  - `src/__tests__/analytics.service.test.ts`
  - `src/__tests__/learning-path.service.test.ts`
  - Vitest 仅包含前端测试（排除 backend/**），确保测试可运行

## 风险与回滚
- 范围清晰：仅前端服务与组件；出现问题可整 PR 回滚
- 依赖不兼容风险低：版本收紧为兼容范围（motion/clsx/tailwind-merge）

## 验证指南
- 本地：
  - `npm i`
  - `npm run test:run`（所有测试通过）
  - `npm run dev`，验证“学习分析”与“学习路径规划”页签
- 重点检查：
  - 分析图表渲染与洞察行动
  - 路径节点顺序遵从前置条件；完成节点后进度与解锁逻辑
  - 适应性弹窗展示但不阻断流程

## 关联/取代
- 取代：Phase 2.2 的原 PR；Phase 2.4 的原 PR
- 合并后建议清理旧 PR，避免重复评审

