# 回滚机制文档

## 版本标记

- **v2.1.9-stable**: 重构前最后稳定版本
- **v2.2.0-major-refactor**: Phase 2.2+2.4 重大重构版本

## 回滚方案

### 快速回滚 (紧急情况)

```bash
# 执行 Git 回滚脚本
chmod +x scripts/rollback/git-rollback.sh
./scripts/rollback/git-rollback.sh
```

### 手动回滚步骤

1. **Git 版本回滚**
```bash
git checkout phase2-advanced-gamification
git reset --hard v2.1.9-stable
git push origin phase2-advanced-gamification --force-with-lease
```

2. **数据库回滚** (如需要)
```bash
# 执行数据库回滚脚本
mongo < scripts/rollback/v2.2.0-rollback.sql
```

3. **配置文件恢复**
```bash
# 从备份恢复配置
cp backups/config/.env.v2.1.9 .env
cp backups/config/backend-package.json.v2.1.9 backend/package.json
cp backups/config/vite.config.ts.v2.1.9 vite.config.ts
```

## 分支保护

- **stable/v2.1.x**: 稳定版本保护分支
- 可用于创建热修复分支

## 监控指标

回滚触发条件：
- API 错误率 > 5%
- 用户会话错误 > 10 errors/hour
- 数据库连接失败 > 3 次
- 前端加载时间 > 5 秒

## 备份文件位置

- 配置文件: `backups/config/`
- 回滚脚本: `scripts/rollback/`

## 注意事项

⚠️ **重要提醒**:
1. 任何回滚操作前先创建当前状态备份
2. 数据库回滚前必须先备份当前数据
3. 生产环境回滚需要先在测试环境验证
4. 回滚后需要验证核心功能正常运作

## 联系方式

如遇回滚问题，请及时联系开发团队。