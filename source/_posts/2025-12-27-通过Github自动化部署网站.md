---
title: 解放双手！使用 GitHub Actions 自动部署 Hexo 到阿里云服务器
date: 2025-12-27 15:30:00
categories: 技术教程
tags:
  - Hexo
  - CI/CD
  - GitHub Actions
  - 自动化部署
---

以前写博客的流程比较繁琐：写完文章 -> 本地运行 `hexo g` 生成网页 -> 手动上传到服务器（或者在服务器拉取）。

今天折腾了一下 **GitHub Actions**，实现了全自动化部署 (CI/CD)。配置完成后，只需在本地执行 `git push`，GitHub 的服务器就会自动帮我们完成环境搭建、静态页面生成、以及上传到阿里云服务器的全过程。

## 🛠️ 准备工作

* **本地环境**：已安装 Hexo 博客源码。
* **代码仓库**：博客源码已托管在 GitHub（建议设为私有仓库）。
* **云服务器**：一台已配置好 Nginx 的阿里云服务器。

---

## 第一步：生成部署专用的 SSH 密钥

为了安全起见，不使用本地电脑原本的 SSH Key，而是生成一对专门用于“GitHub 机器人登录阿里云”的密钥。

在本地终端执行：

```bash
# 生成密钥，文件名为 hexo_deploy_key，不要设置密码
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f hexo_deploy_key
```

此时会生成两个文件：
* `hexo_deploy_key`：私钥（给 GitHub 用）
* `hexo_deploy_key.pub`：公钥（给阿里云用）

---

## 第二步：配置阿里云服务器

我们需要将刚才生成的**公钥**添加到服务器的白名单中，允许 GitHub 拿着私钥来登录。

1.  登录阿里云服务器。
2.  编辑授权文件：
    ```bash
    nano ~/.ssh/authorized_keys
    ```
3.  打开本地的 `hexo_deploy_key.pub` 文件，复制所有内容。
4.  将其粘贴到服务器 `authorized_keys` 文件中（另起一行）。
5.  保存并退出。

---

## 第三步：配置 GitHub 仓库 Secrets

我们需要将**私钥**和**服务器信息**存放在 GitHub 仓库的 Secrets 中，供自动化脚本读取。

1.  打开博客源码的 GitHub 仓库页面。
2.  点击 **Settings** -> **Secrets and variables** -> **Actions**。
3.  点击 **New repository secret**，依次添加以下三个变量（名称需完全一致）：

| 变量名 (Name) | 值 (Secret) | 说明 |
| :--- | :--- | :--- |
| **HEXO_DEPLOY_PRI** | `hexo_deploy_key` 私钥文件的全部内容 | **包含**开头和结尾的 `-----` |
| **HEXO_SERVER_IP** | 你的服务器公网 IP | 例如 `47.100.xx.xx` |
| **HEXO_SERVER_USER** | 登录用户名 | 通常是 `root` |

---

## 第四步：编写自动化脚本 (Workflow)

在博客根目录下，创建文件路径：`.github/workflows/deploy.yml`。
复制以下内容填入文件中：

```yaml
name: Hexo Auto Deploy

on:
  push:
    branches:
      - master  # ⚠️ 注意：检查你的分支名是 master 还是 main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    # 1. 检出代码
    - name: Checkout
      uses: actions/checkout@v4
      with:
        submodules: true

    # 2. 安装 Node.js 环境
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20' 

    # 3. 缓存 NPM 依赖 (加速构建)
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: ~/.npm
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-node-

    # 4. 安装依赖
    - name: Install dependencies
      run: npm install

    # 5. 生成静态文件
    - name: Build Hexo
      run: |
        npx hexo clean
        npx hexo generate

    # 6. 部署到服务器
    - name: Deploy to Server
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.HEXO_DEPLOY_PRI }}
        ARGS: "-rlgoDzvc -i"
        SOURCE: "public/"
        REMOTE_HOST: ${{ secrets.HEXO_SERVER_IP }}
        REMOTE_USER: ${{ secrets.HEXO_SERVER_USER }}
        TARGET: "/var/www/html" # ⚠️ 必须修改为你 Nginx 配置的网站根目录
        EXCLUDE: "/node_modules/"
```

> **注意**：请务必检查 YAML 文件中的 `TARGET` 字段，确保它指向你 Nginx 配置的实际网站根目录。

---

## 第五步：推送与测试

最后，配置 `.gitignore` 忽略 `public/` 和 `node_modules/` 文件夹，然后提交代码：

```bash
git add .
git commit -m "feat: 开启自动化部署"
git push
```

推送成功后，点击 GitHub 仓库顶部的 **Actions** 标签，查看任务运行状态。当 **Hexo Auto Deploy** 变绿时，部署即完成！

## 总结

以后的写作流程：
1.  `hexo new "文章名"`
2.  写作
3.  `git push`

再也不用担心换电脑后的环境配置问题了！🚀