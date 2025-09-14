# GitHub 仓库配置指南

本文档描述了为 Points 项目配置 GitHub 仓库设置和 Secrets 的步骤。

## 📋 必需的 GitHub Secrets

### 仓库级别 Secrets

在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 中添加以下 Secrets：

#### 1. GITHUB_TOKEN
- **用途**: GitHub Container Registry 登录和推送镜像
- **值**: 自动提供，无需手动设置
- **权限**: `packages:write`, `contents:read`

### Environment Secrets

在 `Settings -> Environments` 中创建 `production` 环境，并添加以下 Secrets：

#### 1. PROD_HOST
- **用途**: 生产服务器 IP 地址或域名
- **示例**: `47.120.74.212` 或 `your-server.com`

#### 2. PROD_USER
- **用途**: 生产服务器 SSH 用户名
- **示例**: `ubuntu`, `root`, `deploy`

#### 3. PROD_SSH_KEY
- **用途**: 生产服务器 SSH 私钥
- **格式**: 完整的 SSH 私钥内容（包括 `-----BEGIN` 和 `-----END` 行）
- **生成方法**:
  ```bash
  # 在本地生成 SSH 密钥对
  ssh-keygen -t rsa -b 4096 -C "github-actions@points-deploy"
  
  # 将公钥添加到服务器的 ~/.ssh/authorized_keys
  ssh-copy-id -i ~/.ssh/id_rsa.pub user@server
  
  # 复制私钥内容到 GitHub Secret
  cat ~/.ssh/id_rsa
  ```

#### 4. GHCR_PAT (可选)
- **用途**: GitHub Container Registry 个人访问令牌（如需要额外权限）
- **生成**: `GitHub Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens`
- **权限**: `packages:read`, `packages:write`

## 🔐 GitHub 仓库设置

### 1. 基本设置

在 `Settings -> General` 中：

- ✅ **Allow merge commits**: 启用
- ✅ **Allow squash merging**: 启用  
- ✅ **Allow rebase merging**: 启用
- ✅ **Automatically delete head branches**: 启用

### 2. 分支保护规则

在 `Settings -> Branches` 中为 `main` 分支添加保护规则：

- ✅ **Require a pull request before merging**
  - ✅ Require approvals (1)
  - ✅ Dismiss stale reviews when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - 添加状态检查：`build-and-test`
- ✅ **Require branches to be up to date before merging**
- ✅ **Include administrators**

### 3. Actions 权限

在 `Settings -> Actions -> General` 中：

- **Actions permissions**: `Allow all actions and reusable workflows`
- **Workflow permissions**: `Read and write permissions`
- ✅ **Allow GitHub Actions to create and approve pull requests**

### 4. Pages 设置（可选）

如果需要 GitHub Pages 部署：

在 `Settings -> Pages` 中：
- **Source**: `GitHub Actions`
- 可以配置自定义域名

## 🌍 Environment 配置

### 创建 Production Environment

1. 进入 `Settings -> Environments`
2. 点击 `New environment`
3. 名称设为 `production`
4. 配置保护规则：
   - ✅ **Required reviewers**: 添加项目维护者
   - ✅ **Wait timer**: 设置为 0 分钟
   - **Deployment branches**: `Selected branches` -> 添加 `main`

### 添加 Environment Secrets

在创建的 `production` 环境中添加上述提到的服务器相关 Secrets。

## 🚀 验证配置

### 1. 检查 Workflow 权限

确保 GitHub Actions 有足够权限：

```yaml
# 在 workflow 文件中验证权限
permissions:
  contents: read
  packages: write
  security-events: write  # 用于 Trivy 扫描结果
```

### 2. 测试 SSH 连接

可以创建一个测试 workflow 验证 SSH 连接：

```yaml
name: Test SSH Connection

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Test SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            echo "SSH connection successful!"
            whoami
            docker --version
```

### 3. 验证镜像推送权限

推送代码到主分支后，检查：
1. Docker 镜像是否成功推送到 GHCR
2. 在 `Packages` 标签页查看镜像

## 🔍 常见问题

### 1. Docker 推送失败

**错误**: `denied: permission_denied`

**解决方案**:
- 确保 GHCR 包权限设置正确
- 检查 `GITHUB_TOKEN` 权限
- 验证镜像名称格式正确

### 2. SSH 连接失败

**错误**: `Permission denied (publickey)`

**解决方案**:
- 验证 SSH 私钥格式正确（包含头尾行）
- 确保公钥已添加到服务器 `authorized_keys`
- 检查服务器 SSH 配置

### 3. Environment 无法访问

**错误**: `Environment protection rules not satisfied`

**解决方案**:
- 检查分支保护规则设置
- 确保 workflow 在正确的分支运行
- 验证 Environment 的部署分支配置

## 📚 相关链接

- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments 文档](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Container Registry 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [SSH 密钥生成指南](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

## ✅ 配置检查清单

- [ ] 仓库基本设置已配置
- [ ] 分支保护规则已设置
- [ ] Actions 权限已启用
- [ ] `production` 环境已创建
- [ ] 所有必需的 Secrets 已添加
- [ ] SSH 连接测试通过
- [ ] Docker 镜像推送测试通过
- [ ] CI/CD 工作流运行正常

完成以上配置后，Points 项目的 CI/CD 流程就可以正常工作了。