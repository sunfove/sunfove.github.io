---
title: 上帝视角：彻底搞懂坐标变换与旋转矩阵 (从 2D 到 齐次坐标)
date: 2026-01-16 10:00:00
tags: [线性代数, 计算机图形学, 机器人学, 旋转矩阵, 欧拉角, 四元数, 齐次坐标]
categories: [数学与算法]
mathjax: true
excerpt: 为什么旋转矩阵长那个样？为什么 3D 旋转会遇到万向节死锁？为什么图形学里非要用 4x4 的矩阵？本文从极坐标推导开始，深入浅出地讲解坐标变换的核心原理，涵盖欧拉角、四元数及齐次坐标的魔力。
---

在自动驾驶、机器人控制和 3D 游戏开发中，我们最常遇到的问题就是：“**我的车/手/摄像机现在在哪里？头朝向哪里？**”

解决这个问题的数学工具就是**坐标变换**。
虽然现成的库（如 TF2, glm, Eigen）能帮我们一键计算，但如果不理解底层的数学原理，一旦遇到“万向节死锁”或者“坐标系定义冲突”，你就会陷入无尽的 Debug 地狱。

本文将从最简单的 2D 旋转出发，带你推导整个坐标变换体系。

[Image of 3D coordinate system with roll pitch yaw axes]

---

## 01. 一切的起点：2D 旋转

### 1.1 极坐标推导法
假设在 2D 平面上有一个点 $P$，它的坐标是 $(x, y)$。
我们想让它绕原点逆时针旋转 $\theta$ 角，变成点 $P'$，坐标为 $(x', y')$。

我们可以引入**极坐标**来辅助推导：
设点 $P$ 到原点的距离为 $r$，与 X 轴的夹角为 $\phi$。

[Image of 2D rotation on unit circle polar coordinates]

则初始状态为：
$$x = r \cos\phi$$
$$y = r \sin\phi$$

旋转后，距离 $r$ 不变，角度变成了 $\phi + \theta$。
新的坐标 $x'$ 为：
$$x' = r \cos(\phi + \theta)$$

利用三角恒等式 $\cos(A+B) = \cos A \cos B - \sin A \sin B$ 展开：
$$x' = r (\cos\phi \cos\theta - \sin\phi \sin\theta)$$
将 $x, y$ 代入，得到：
$$x' = x \cos\theta - y \sin\theta$$

同理，推导 $y'$：
$$y' = r \sin(\phi + \theta) = r (\sin\phi \cos\theta + \cos\phi \sin\theta)$$
$$y' = y \cos\theta + x \sin\theta$$

### 1.2 矩阵形式
将上面的方程组写成矩阵乘法的形式：

$$
\begin{bmatrix}
x' \\
y'
\end{bmatrix}
=
\begin{bmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
$$

中间这个 $2 \times 2$ 的矩阵，就是**2D 旋转矩阵 $R(\theta)$**。

---

## 02. 主动旋转 vs 被动旋转 (最大的坑)

在看论文或代码时，你常会发现旋转矩阵的符号好像反了（正弦项的负号位置不同）。这通常是因为混淆了**主动旋转**和**被动旋转**。

[Image of active vs passive rotation transformation]

1.  **主动旋转 (Active transformation)**：
    * **点动，坐标轴不动**。
    * 比如：把一个苹果在桌子上转 90 度。
    * **公式**：就是我们上面推导的那个。
2.  **被动旋转 (Passive transformation)**：
    * **坐标轴动，点不动**。
    * 比如：苹果不动，你自己歪着头看苹果（你的视野坐标系转了）。
    * **公式**：相当于主动旋转了 $-\theta$。矩阵是主动旋转矩阵的**转置 (Transpose)**（也是逆矩阵）。

$$R_{passive} = R_{active}^T = \begin{bmatrix} \cos\theta & \sin\theta \\ -\sin\theta & \cos\theta \end{bmatrix}$$

**本文默认采用主动旋转。**

---

## 03. 进阶：3D 旋转

3D 旋转比 2D 复杂得多，因为旋转轴多了。

### 3.1 基础旋转矩阵
绕 X、Y、Z 轴旋转的矩阵分别是 $R_x(\alpha), R_y(\beta), R_z(\gamma)$。
记忆口诀：**绕谁转，谁的坐标就不变（对应的行和列是 1 和 0）**。

* **绕 Z 轴**（其实就是 2D 旋转扩展到 3D）：
    $$
    R_z(\gamma) = \begin{bmatrix}
    \cos\gamma & -\sin\gamma & 0 \\
    \sin\gamma & \cos\gamma & 0 \\
    0 & 0 & 1
    \end{bmatrix}
    $$
* **绕 X 轴**：
    $$
    R_x(\alpha) = \begin{bmatrix}
    1 & 0 & 0 \\
    0 & \cos\alpha & -\sin\alpha \\
    0 & \sin\alpha & \cos\alpha
    \end{bmatrix}
    $$
* **绕 Y 轴**（注意正弦项的符号位置，因为 $z \times x = y$）：
    $$
    R_y(\beta) = \begin{bmatrix}
    \cos\beta & 0 & \sin\beta \\
    0 & 1 & 0 \\
    -\sin