# Phase 2.2 修复与增强完成报告

分支: `phase2-advanced-gamification`

本次在前一轮代码评审基础上，按照“完全以上任务”的要求完成以下修复与增强，并已推送到 PR 分支。

## 变更总览

- 学习分析仪表板
  - 在 `src/App.tsx` 正确传入 `<LearningAnalyticsDashboard />` 所需 props，`tasksCompleted` 由 `ActivityTracker` 动态统计。
- 稳定性与边界
  - `src/services/analytics.service.ts`：
    - 为 `calculateImprovementRate`、`analyzeHourlyPerformance` 增加分母为 0/极小值时的健壮性防护，避免 NaN/Infinity。
- 可视化（响应式 + 无障碍）
  - `src/components/LearningAnalyticsChart.tsx`：
    - Charts 使用容器宽度自适应渲染；
    - 为各 `svg` 增加 `role="img"` 与 `aria-label`，并补充 `<title>` 提升可达性。
- 依赖与导入规范
  - 全面将 `sonner@2.0.3` 导入改为标准 `sonner` 导入（保持 package.json 锁版本）；
  - 移除 Vite 对 `sonner@2.0.3` 的 alias；
  - 将 `motion`、`clsx`、`tailwind-merge` 的 `*` 版本收紧为明确 semver：
    - motion `^11.11.9`
    - clsx `^2.1.1`
    - tailwind-merge `^2.5.2`
- 路径规范
  - 将分析相关组件对服务的导入统一为 `@/services/analytics.service`：
    - `src/components/LearningAnalyticsDashboard.tsx`
    - `src/components/LearningInsightsPanel.tsx`
- 测试补充（Vitest）
  - 新增 `src/__tests__/analytics.service.test.ts`，覆盖：
    - 无会话时默认指标返回；
    - 零均值一致性指数不产生 NaN/Infinity；
    - 提升趋势边界逻辑（早期均值≈0，近期有显著信号）；
    - 无数据生成洞察不抛异常。

## 关键提交

- e8c78062 fix(phase2.2): App props 修复 + analytics 安全防护（第一批）
- 1601cd8d docs: 在评审报告中新增“已提交修复/待确认问题”
- fd674ed9 chore(phase2.2): 响应式图表 + 无障碍；sonner 导入标准化；依赖版本收紧；Vitest 覆盖；`@/services` 路径统一

## 验证方式

- 开发启动：`npm run dev`
  - 打开“学习分析”页签，确认图表随容器宽度自适应展示，无控制台报错。
- 单测运行：
  - 交互式：`npm run test`
  - 一次性：`npm run test:run`
- 构建：`npm run build`（如遇 npm/rollup 可选依赖问题，按提示清理 lock 与 node_modules 后重装）

## 影响面与兼容性

- UI 层变更不影响外部 API；`LearningAnalyticsChart` 增加 aria/title 不影响现有调用；
- `sonner` 导入标准化保持与现有组件行为一致；
- 依赖版本收紧为向后兼容的 semver 范围；
- 测试新增仅在本地/CI 生效，不影响运行时。

## 后续建议

- 若将来接入真实学习数据，建议：
  - 将昂贵统计迁移至 Web Worker 或后端；
  - 对计算结果增加 memo（按 userId + timeRange 缓存）；
  - 将阈值（例如 5% 趋势阈值、epsilon）抽离为配置。
- 进一步统一内部导入为 `@/…`，避免层级相对路径。

---

如需我继续：
- 为图表加 ResizeObserver 的细粒度重绘与 E2E 无障碍快照；
- 扩充 2–3 条关于 `generateLearningInsights` 的断言覆盖；
请告知优先级。

