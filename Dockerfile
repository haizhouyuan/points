# 基于 Node.js 18 构建阶段，安装依赖并编译前端
FROM node:18-alpine AS builder
WORKDIR /app

# 将 package.json 和 lock 文件拷贝进来安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 拷贝源代码并构建
COPY . .
RUN npm run build

# 使用 Nginx 轻量级镜像作为运行阶段
FROM nginx:1.23-alpine

# 拷贝前端构建产物到 Nginx 默认静态目录
COPY --from=builder /app/build /usr/share/nginx/html

# 创建简化的 nginx 配置，支持非root用户运行
RUN adduser -D -H -u 1001 points && \
    mkdir -p /tmp/nginx /var/log/nginx /tmp/nginx-cache && \
    chown -R points:points /usr/share/nginx/html /tmp/nginx /var/log/nginx /tmp/nginx-cache && \
    chmod -R 755 /usr/share/nginx/html

# 创建自定义 nginx 配置
COPY <<EOF /etc/nginx/nginx.conf
worker_processes auto;
pid /tmp/nginx/nginx.pid;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    access_log /var/log/nginx/access.log;
    
    sendfile on;
    keepalive_timeout 65;
    
    # 使用可写的临时目录
    client_body_temp_path /tmp/nginx-cache/client_temp;
    proxy_temp_path /tmp/nginx-cache/proxy_temp;
    fastcgi_temp_path /tmp/nginx-cache/fastcgi_temp;
    uwsgi_temp_path /tmp/nginx-cache/uwsgi_temp;
    scgi_temp_path /tmp/nginx-cache/scgi_temp;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files \$uri \$uri/ /index.html;
        }
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# 暴露80端口（Nginx 默认监听端口）
EXPOSE 80

# 切换到非特权用户
USER points

# 采用 Nginx 前台运行模式
CMD ["nginx", "-g", "daemon off;"]