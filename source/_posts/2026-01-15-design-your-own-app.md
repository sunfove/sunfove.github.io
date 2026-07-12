---
title: 将 Python 仿真工具部署并嵌入个人博客
date: 2026-01-15 12:00:00
tags: [Streamlit, github, APP]
categories: [APP]
mathjax: true
---

# 🚀 实战指南：将 Python 仿真工具部署并嵌入个人博客

本教程将指导你如何利用 **Streamlit Cloud** 免费托管 Python 应用，并通过 `iframe` 将其集成到 **Hexo** 或 **Halo** 博客文章中。

## 📋 准备工作

在开始之前，请确保你拥有以下条件：
* 一个 **GitHub** 账号。
* 本地已编写好的 Streamlit 代码（例如 `app.py`）。
* 一个现有的 Hexo 或 Halo 博客。

---

## 第一阶段：准备项目文件

Streamlit Cloud 需要从你的 GitHub 仓库读取代码，因此我们需要规范化文件结构。

### 1. 准备代码文件 (`app.py`)
确保你的主程序文件命名为 `app.py`（或其他 `.py` 文件名），并确保在本地运行无误。

### 2. 创建依赖文件 (`requirements.txt`)
在 `app.py` 同级目录下，创建一个名为 `requirements.txt` 的文本文件。**文件名必须完全一致（全小写、复数）**。
在文件中列出项目用到的所有第三方库，例如：

```text
streamlit
numpy
matplotlib
```

### 3. 上传至 GitHub
1.  登录 [GitHub](https://github.com/)，点击右上角 **+** 号 -> **New repository**。
2.  **Repository name**：填写项目名称（例如 `optical-lab`）。
3.  **Visibility**：选择 **Public**（公开），这对免费部署至关重要。
4.  点击 **Create repository**。
5.  在跳转页面中，点击 **uploading an existing file**。
6.  将 `app.py` 和 `requirements.txt` 拖入上传区域，点击 **Commit changes**。

---

## 第二阶段：部署到 Streamlit Cloud

我们将使用 Streamlit 官方提供的免费云服务来托管你的应用。

1.  访问 [Streamlit Cloud 官网](https://streamlit.io/cloud) 并点击 **Sign up**。
2.  选择 **Continue with GitHub** 进行登录授权。
3.  进入控制台后，点击右上角的 **New app**。
4.  填写部署表单：
    * **Repository**：在下拉菜单中选择刚才创建的仓库（如 `yourname/optical-lab`）。
    * **Branch**：通常默认为 `main` 或 `master`。
    * **Main file path**：选择你的主程序文件 `app.py`。
5.  点击 **Deploy!** 按钮。

> **☕ 等待部署**：
> 系统会自动安装 Python 环境和 `requirements.txt` 中的依赖。首次部署通常需要 2-5 分钟。当看到应用界面出现时，即表示部署成功。

**关键步骤**：复制浏览器地址栏中的 URL（例如 `https://optical-lab-xxxx.streamlit.app`），这是你的专属工具链接。

---

## 第三阶段：嵌入博客 (Hexo / Halo)

最后一步是将云端应用“镶嵌”到你的博客文章中。

### 1. 编辑 Markdown 文章
打开你的 Hexo 或 Halo 博客后台，新建或编辑一篇文章。

### 2. 插入嵌入代码
在文章的合适位置，直接粘贴以下 HTML 代码。请务必将 `src` 替换为你第二阶段获取的真实链接：

```html
<iframe 
    src="[https://你的工具链接.streamlit.app?embed=true](https://你的工具链接.streamlit.app?embed=true)" 
    height="850" 
    width="100%" 
    style="border:none; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>
```

### 参数详解：
* `?embed=true`：**必填**。隐藏 Streamlit 顶部的汉堡菜单和红条，让界面更干净。
* `height="850"`：根据你的应用内容长度调整高度。
* `style="..."`：添加圆角和阴影，使嵌入框更美观，符合现代博客设计风格。

---

## 常见问题排查 (Troubleshooting)

| 问题现象 | 可能原因 | 解决方案 |
| :--- | :--- | :--- |
| **ModuleNotFoundError** | 缺少依赖描述文件 | 检查 GitHub 仓库根目录是否有 `requirements.txt`。 |
| **一直显示 "In the oven"** | 正在安装依赖或网络延迟 | 如果超过 10 分钟，点击右下角 "Manage app" 查看 Logs 报错。 |
| **Error: Image not found** | 本地图片路径错误 | 云端无法读取本地路径。请将图片也上传到 GitHub，并使用相对路径读取。 |

---

🎉 **恭喜！** 你现在已经拥有了一个可交互的在线仿真实验室，快去分享吧！