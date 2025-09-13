#!/bin/bash

# Summer Vacation Planning Backend - 部署脚本
# 用于自动化部署到生产环境

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Summer Vacation Planning Backend..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="summer-vacation-backend"
NODE_VERSION="18"
PM2_APP_NAME="summer-vacation-api"
BACKUP_DIR="/var/backups/summer-vacation"
LOG_DIR="/var/log/summer-vacation"

# 检查函数
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: $1 未安装${NC}"
        exit 1
    fi
}

# 打印状态函数
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤1: 环境检查
print_status "检查部署环境..."
check_command "node"
check_command "npm"
check_command "pm2"
check_command "mongo"
check_command "redis-server"

# 检查Node.js版本
NODE_CURRENT=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
    print_error "Node.js 版本过低，需要 >= $NODE_VERSION，当前版本: $(node -v)"
    exit 1
fi

print_success "环境检查通过"

# 步骤2: 备份当前版本（如果存在）
if pm2 list | grep -q "$PM2_APP_NAME"; then
    print_status "备份当前运行版本..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 停止应用
    pm2 stop "$PM2_APP_NAME" || true
    
    # 备份文件
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=dist . || true
    
    print_success "已备份到: $BACKUP_FILE"
fi

# 步骤3: 安装依赖
print_status "安装项目依赖..."
npm ci --production=false
print_success "依赖安装完成"

# 步骤4: 运行测试
print_status "运行测试套件..."
npm test -- --config jest.config.simple.js
if [ $? -ne 0 ]; then
    print_error "测试失败，停止部署"
    exit 1
fi
print_success "所有测试通过"

# 步骤5: 构建项目
print_status "构建 TypeScript 项目..."
npm run build
print_success "构建完成"

# 步骤6: 设置环境变量
print_status "配置环境变量..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "已复制 .env.example 到 .env，请确保配置正确"
    else
        print_error "缺少环境配置文件"
        exit 1
    fi
fi

# 检查必需的环境变量
source .env
required_vars=("NODE_ENV" "PORT" "MONGODB_URI" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "缺少必需的环境变量: $var"
        exit 1
    fi
done

print_success "环境变量配置检查通过"

# 步骤7: 数据库连接测试
print_status "测试数据库连接..."

# 测试MongoDB连接
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { 
  serverSelectionTimeoutMS: 5000 
}).then(() => {
  console.log('MongoDB 连接成功');
  process.exit(0);
}).catch((err) => {
  console.error('MongoDB 连接失败:', err.message);
  process.exit(1);
});
"

# 测试Redis连接（如果配置了）
if [ ! -z "$REDIS_HOST" ]; then
    redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping > /dev/null
    if [ $? -eq 0 ]; then
        print_success "Redis 连接成功"
    else
        print_warning "Redis 连接失败，但将继续部署"
    fi
fi

# 步骤8: 创建日志目录
print_status "设置日志目录..."
sudo mkdir -p "$LOG_DIR"
sudo chown -R $USER:$USER "$LOG_DIR"
print_success "日志目录准备完成"

# 步骤9: PM2 配置
print_status "配置 PM2 应用..."

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 5000,
    max_restarts: 5,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    merge_logs: true,
    autorestart: true
  }]
};
EOF

print_success "PM2 配置文件创建完成"

# 步骤10: 启动应用
print_status "启动应用服务..."

# 删除旧的PM2进程（如果存在）
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true

# 启动新的应用实例
pm2 start ecosystem.config.js
pm2 save

print_success "应用启动完成"

# 步骤11: 健康检查
print_status "执行健康检查..."
sleep 10  # 等待应用完全启动

# 检查应用状态
HEALTH_URL="http://localhost:${PORT:-5000}/health"
for i in {1..5}; do
    if curl -s "$HEALTH_URL" > /dev/null; then
        print_success "健康检查通过"
        break
    else
        if [ $i -eq 5 ]; then
            print_error "健康检查失败，请查看日志"
            pm2 logs "$PM2_APP_NAME" --lines 50
            exit 1
        else
            print_status "等待应用启动... ($i/5)"
            sleep 5
        fi
    fi
done

# 步骤12: 显示部署信息
print_success "部署成功完成！"
echo ""
echo "📊 部署信息:"
echo "  应用名称: $PM2_APP_NAME"
echo "  运行端口: ${PORT:-5000}"
echo "  健康检查: $HEALTH_URL"
echo "  日志目录: $LOG_DIR"
echo "  PM2 状态: pm2 status"
echo "  查看日志: pm2 logs $PM2_APP_NAME"
echo ""

# 显示PM2状态
pm2 status

echo ""
print_success "🎉 Summer Vacation Planning Backend 部署完成！"

# 步骤13: 清理（可选）
if [ "$1" = "--cleanup" ]; then
    print_status "清理临时文件..."
    npm run build:clean 2>/dev/null || true
    print_success "清理完成"
fi

exit 0