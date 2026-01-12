---
title: 波导理论(上)：金属波导的本征模、边界条件与贝塞尔函数详解
date: 2026-01-12 12:00:00
tags: [电磁场理论, 麦克斯韦方程, 矩形波导, 圆波导, 贝塞尔函数, 截止波长]
categories: 射频与微波
mathjax: true
excerpt: 从麦克斯韦方程组出发，严格推导矩形波导和圆波导中的场分布。为何矩形波导用正弦函数，而圆波导需要贝塞尔函数？TE与TM模的本质区别是什么？本文提供硬核的数学推导与物理阐释。
---

在微波频段，传输线（如双绞线）的辐射损耗变得不可接受，我们必须使用封闭的金属管道——波导。
本质上，求解波导模式就是求解**亥姆霍兹方程 (Helmholtz Equation)** 在特定**边界条件 (Boundary Conditions)** 下的本征值问题。

---

## 1. 通用波动方程的推导

假设电磁波沿 $z$ 轴传播，形式为 $e^{-\gamma z}$（对于无损耗波导，$\gamma = j\beta$）。
麦克斯韦方程组在源自由区域 ($\rho=0, J=0$) 可以化简为横向场 ($E_x, E_y, H_x, H_y$) 与纵向场 ($E_z, H_z$) 的关系。

所有的横向场都可以用纵向场表示：
$$
\begin{align}
H_x &= \frac{j}{k_c^2} (\omega \epsilon \frac{\partial E_z}{\partial y} - \beta \frac{\partial H_z}{\partial x}) \\
H_y &= \frac{-j}{k_c^2} (\omega \epsilon \frac{\partial E_z}{\partial x} + \beta \frac{\partial H_z}{\partial y})
\end{align}
$$
其中 $k_c^2 = k^2 - \beta^2$ 为**截止波数 (Cutoff Wavenumber)**。

这奠定了波导理论的基石：**我们只需要解出 $E_z$ 和 $H_z$，其他所有场分量就都解出来了。**

* **TEM 模**：$E_z = H_z = 0$。只有在多导体系统（如同轴线）中存在。
* **TE 模**：$E_z = 0, H_z \neq 0$。
* **TM 模**：$E_z \neq 0, H_z = 0$。

---

## 2. 矩形波导 (Rectangular Waveguide)

设波导宽为 $a$，高为 $b$ ($a > b$)。

### 2.1 TE 模求解 ($H_z$)
我们需要解标量亥姆霍兹方程：
$$(\frac{\partial^2}{\partial x^2} + \frac{\partial^2}{\partial y^2} + k_c^2) h_z(x,y) = 0$$

使用**分离变量法** $h_z(x,y) = X(x)Y(y)$，代入通解并应用金属壁的边界条件（法向磁场为0，切向电场为0）：
$$
\frac{\partial H_z}{\partial x} \bigg|_{x=0, a} = 0, \quad \frac{\partial H_z}{\partial y} \bigg|_{y=0, b} = 0
$$

我们得到 $H_z$ 的解析解：
$$H_z(x,y,z) = A_{mn} \cos(\frac{m\pi x}{a}) \cos(\frac{n\pi y}{b}) e^{-j\beta z}$$

### 2.2 截止频率的物理来源
分离变量法导致了波数 $k_c$ 的离散化：
$$k_c = \sqrt{(\frac{m\pi}{a})^2 + (\frac{n\pi}{b})^2}$$

传播常数 $\beta = \sqrt{k^2 - k_c^2}$。
* 当 $k > k_c$ 时，$\beta$ 是实数，波可以传播。
* 当 $k < k_c$ 时，$\beta$ 是纯虚数，波呈指数衰减（截止）。

这就是**截止频率**公式的来源：
$$f_{c, mn} = \frac{1}{2\sqrt{\mu\epsilon}} \sqrt{(\frac{m}{a})^2 + (\frac{n}{b})^2}$$

### 2.3 主模 $TE_{10}$
对于 $a > b$，最低的截止频率对应 $(m=1, n=0)$。
场分布特征：
* 电场 $E_y \propto \sin(\pi x / a)$：中间最强，两壁为零。
* **单模带宽**：为了只传输 $TE_{10}$ 而抑制 $TE_{20}$ 或 $TE_{01}$，波导的使用频率通常在 $1.25 f_{c,10}$ 到 $1.9 f_{c,10}$ 之间。



---

## 3. 圆波导 (Circular Waveguide)

当边界变成圆形（半径 $a$）时，我们必须使用**圆柱坐标系** $(\rho, \phi, z)$。

### 3.1 贝塞尔方程的引入
亥姆霍兹方程在圆柱坐标系下变为：
$$\frac{\partial^2 H_z}{\partial \rho^2} + \frac{1}{\rho} \frac{\partial H_z}{\partial \rho} + \frac{1}{\rho^2} \frac{\partial^2 H_z}{\partial \phi^2} + k_c^2 H_z = 0$$

其径向部分的解是**贝塞尔函数 (Bessel Functions)** $J_n(k_c \rho)$。
对于 TE 模，边界条件要求 $\frac{\partial H_z}{\partial \rho} \big|_{\rho=a} = 0$。这意味着 $J_n'(k_c a) = 0$。

### 3.2 模式的根 ($p'_{nm}$)
不同于矩形波导的整数倍关系，圆波导的截止波数取决于贝塞尔导函数的根 $p'_{nm}$：
$$f_{c, nm} = \frac{p'_{nm}}{2\pi a \sqrt{\mu\epsilon}}$$

* **$TE_{11}$ 模**：对应 $J_1'$ 的第一个根 $p'_{11} \approx 1.841$。它是圆波导的**主模**。
* **$TM_{01}$ 模**：对应 $J_0$ 的第一个根 $p_{01} \approx 2.405$。

### 3.3 简并模式与极化
圆波导存在**极化简并**。例如 $TE_{11}$ 可以是水平极化，也可以是垂直极化，它们的截止频率完全一样。这在天线馈源中非常有用（可以做双极化天线），但也容易引起干扰。

---

## 4. 波阻抗与功率传输

波导不是只有电压和电流，更重要的是**波阻抗 (Wave Impedance)** $Z$。
$$Z_{TE} = \frac{k \eta}{\beta}, \quad Z_{TM} = \frac{\beta \eta}{k}$$
其中 $\eta = \sqrt{\mu/\epsilon}$ 是介质本质阻抗。

* 当 $f \to f_c$ 时，$\beta \to 0$。
    * $Z_{TE} \to \infty$：呈现开路特性，能量传不过去。
    * $Z_{TM} \to 0$：呈现短路特性。

---

## 总结

金属波导通过导体的“硬边界”强制电场归零，从而离散化了波数。
* 矩形波导数学简单，极化稳定，通过长宽比控制带宽。
* 圆波导涉及贝塞尔函数，具有旋转对称性，常用于雷达和卫星天线接口。

在下篇中，我们将拆掉金属壁，换成折射率界面，探索光纤中的奥秘。