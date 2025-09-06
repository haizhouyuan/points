# Requirements（需求说明）— <feature-name>

## 背景与目标
- 背景：
- 目标（可度量）：（如：审批入口 100% 可达；移动端切换 ≤ 200ms）

## 范围（In Scope / Out of Scope）
- In Scope：
- Out of Scope：

## 用户故事 / 场景
- 作为【谁】，我想要【什么】，以便【价值】
- 关键场景清单：……

## 非功能性需求（NFR）
- 性能预算（前端首屏/交互延时；后端接口 RT、QPS）
- 安全（鉴权/权限/速率限制/日志脱敏）
- 可访问性（键盘操作、ARIA、对比度）
- 兼容性（移动/桌面/浏览器）
- 可观测性（关键日志、指标、追踪）

## 约束与假设
- 技术约束：React 18 + Tailwind；Express + TS + MongoDB
- 数据约束：接口契约、幂等、错误码
- 部署约束：Aliyun DevOps 管线（参考仓库 `aliyun-devops-deployer.md`）

## 依赖与风险
- 依赖：
- 风险与应对：