# Summer Vacation Planning Backend

暑假规划应用后端服务 - 基于Node.js + TypeScript + MongoDB的模块化单体架构

## 🚀 项目概述

这是一个完整的暑假规划应用后端系统，支持：
- 🔐 JWT认证授权系统
- 💰 事件驱动的积分账本系统
- 📋 任务管理与排期系统
- 🎮 游戏化机制（等级、成就、连击）
- 👨‍👩‍👧‍👦 家庭协作与社交互动
- 📊 数据分析与智能推荐
- 🔄 实时通信（SSE + WebSocket）

## 📋 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Cache**: Redis
- **Testing**: Jest
- **Process Manager**: PM2
- **Architecture**: 模块化单体

## 🏗️ 项目结构

```
backend/
├── src/
│   ├── modules/           # 业务模块
│   │   ├── auth/         # 认证授权模块
│   │   ├── points/       # 积分系统模块
│   │   ├── tasks/        # 任务管理模块
│   │   ├── gamification/ # 游戏化模块
│   │   ├── social/       # 社交互动模块
│   │   └── analytics/    # 数据分析模块
│   ├── shared/           # 共享基础设施
│   │   ├── database/     # 数据库连接
│   │   ├── cache/        # 缓存管理
│   │   ├── events/       # 事件总线
│   │   ├── middleware/   # 中间件
│   │   └── utils/        # 工具函数
│   ├── gateway/          # API网关
│   └── main.ts          # 应用入口
├── tests/               # 测试文件
├── docs/               # 文档
├── scripts/            # 脚本文件
└── deploy.sh          # 部署脚本
```

## 🛠️ 安装与运行

### 环境要求

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis >= 6.0 (可选)
- npm >= 8.0.0

### 快速开始

```bash
# 1. 克隆项目
git clone <repository-url>
cd backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量

# 4. 运行测试
npm test

# 5. 构建项目
npm run build

# 6. 启动开发服务器
npm run dev

# 7. 启动生产服务器
npm start
```

### 环境变量配置

关键环境变量说明：

```bash
# 服务器配置
NODE_ENV=development
PORT=5000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/summer_vacation
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
```

## 📚 API文档

### 核心端点概览

- **认证系统**: `/api/v1/auth/*`
- **积分系统**: `/api/v1/points/*`
- **任务管理**: `/api/v1/tasks/*`
- **游戏化功能**: `/api/v1/gamification/*`
- **社交互动**: `/api/v1/social/*`
- **数据分析**: `/api/v1/analytics/*`

### API规范特性

- ✅ 统一的错误响应格式
- ✅ 请求/响应ID追踪
- ✅ 分页支持（cursor-based）
- ✅ 幂等性保护
- ✅ 家庭数据隔离
- ✅ 限流与安全防护

### 示例API调用

```bash
# 用户注册
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "小明",
    "role": "student",
    "inviteCode": "ABC123"
  }'

# 获取积分余额
curl -X GET http://localhost:5000/api/v1/points/balance \
  -H "Authorization: Bearer <access_token>"

# 创建任务
curl -X POST http://localhost:5000/api/v1/tasks/templates \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "完成数学作业",
    "description": "完成今日数学课后习题",
    "category": "learning",
    "difficulty": 3,
    "pointsReward": 50
  }'
```

## 🧪 测试

### 测试策略

项目包含多层次的测试：

```bash
# 运行所有测试
npm test

# 运行基础功能测试
npm test -- --config jest.config.simple.js

# 生成覆盖率报告
npm test -- --coverage

# 运行特定测试文件
npm test auth.service.test.ts
```

### 测试覆盖范围

- ✅ 单元测试：核心业务逻辑
- ✅ 集成测试：模块间协作
- ✅ 功能测试：API端点验证
- ✅ 性能测试：响应时间和并发
- ✅ 安全测试：认证和权限

## 🚀 部署

### 使用部署脚本

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署
./deploy.sh

# 部署后清理
./deploy.sh --cleanup
```

### 手动部署步骤

```bash
# 1. 安装生产依赖
npm ci --production

# 2. 构建项目
npm run build

# 3. 配置PM2
pm2 start ecosystem.config.js

# 4. 保存PM2配置
pm2 save

# 5. 检查服务状态
pm2 status
```

### Docker部署（可选）

```dockerfile
# Dockerfile 示例
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 📊 监控和日志

### 应用监控

```bash
# 查看PM2状态
pm2 status

# 查看应用日志
pm2 logs summer-vacation-api

# 查看实时监控
pm2 monit

# 重启应用
pm2 restart summer-vacation-api
```

### 健康检查

```bash
# 健康检查端点
curl http://localhost:5000/health

# 响应示例
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🔧 开发指南

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 采用模块化架构
- 保持测试覆盖率 > 80%

### 添加新模块

1. 在 `src/modules/` 下创建新模块目录
2. 实现 `models/`, `services/`, `controllers/`, `routes/`
3. 在 `gateway/api-gateway.ts` 中注册路由
4. 编写对应的测试用例

### Git工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/new-feature

# 创建Pull Request进行代码审查
```

## 🛡️ 安全特性

- 🔐 JWT令牌认证
- 🏠 家庭数据隔离
- 🚫 请求频率限制
- ✋ 幂等性保护
- 📝 审计日志记录
- 🔒 输入数据验证
- 🛠️ SQL注入防护

## 📈 性能优化

- ⚡ Redis缓存系统
- 📊 MongoDB索引优化
- 🔄 连接池管理
- 📦 响应数据压缩
- ⏱️ 请求超时控制
- 🎯 查询性能监控

## 🐛 问题排查

### 常见问题

**1. 数据库连接失败**
```bash
# 检查MongoDB服务
sudo systemctl status mongod

# 测试连接
mongo <connection-string>
```

**2. 应用启动失败**
```bash
# 查看详细错误日志
pm2 logs summer-vacation-api --lines 100

# 检查端口占用
netstat -tulpn | grep :5000
```

**3. 测试运行失败**
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 运行简化测试
npm test -- --config jest.config.simple.js
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 获取帮助

- 📧 **技术支持**: support@summervacation.app
- 📖 **文档中心**: [docs.summervacation.app](https://docs.summervacation.app)
- 🐛 **问题报告**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **社区讨论**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Summer Vacation Planning Team** ❤️ **Happy Coding!**