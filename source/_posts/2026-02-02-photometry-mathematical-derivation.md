---
title: 光度学原理的数学重构：从立体角微分到亮度守恒的严格推导
date: 2026-02-02 15:00:00
tags: [Optics, Calculus, Physics, Rendering, Math]
categories: [Physics, Theoretical Optics]
description: 本文摒弃通俗类比，利用多元微积分与球面几何构建光度学的数学大厦。详细推导立体角定义、距离平方反比定律、朗伯余弦积分（M=πL）以及亮度守恒定理，为理解渲染方程与光学设计提供坚实的理论支撑。
mathjax: true
---

光度学（Photometry）并非简单的单位换算，而是一门建立在几何光学与辐射度量学基础上的严密学科。对于追求极致的图形学工程师或光学物理学研究者而言，知其然（公式）不够，必须知其所以然（推导）。

本文将从最基础的几何量——立体角出发，利用微积分工具，对光通量、光强、照度、亮度这四个核心物理量给出数学上的定义与推导。

## 一、 数学基石：立体角 (Solid Angle) 的微分形式

在讨论光如何传播之前，必须先定义“方向”的量度。

### 1.1 定义
在二维平面，角度 $\theta$ 定义为弧长 $s$ 与半径 $r$ 之比。
在三维空间，立体角 $\Omega$ 定义为球面表面积 $A$ 与半径平方 $r^2$ 之比。

$$
\Omega = \frac{A}{r^2} \quad (\text{单位: 球面度 steradian, } sr)
$$

### 1.2 球坐标系下的微分推导
考虑球坐标系 $(r, \theta, \phi)$，其中 $\theta$ 为天顶角（Zenith angle, $0 \to \pi$），$\phi$ 为方位角（Azimuth angle, $0 \to 2\pi$）。

![](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260202_095700.png)

球面上的微元面积 $dA$ 可以由两段微弧长构成：
1.  经线方向弧长：$r d\theta$
2.  纬线方向弧长：$r \sin\theta d\phi$


因此，微元面积 $dA$ 为：

$$
dA = (r d\theta)(r \sin\theta d\phi) = r^2 \sin\theta d\theta d\phi
$$

代入立体角定义 $d\Omega = dA / r^2$，我们得到**立体角的微分形式**：

$$
d\Omega = \sin\theta d\theta d\phi
$$

这是后续所有光度学积分推导的核心公式。全球面的立体角积分为：
$$
\int_{0}^{2\pi} d\phi \int_{0}^{\pi} \sin\theta d\theta = 2\pi \cdot [-\cos\theta]_0^{\pi} = 4\pi \, sr
$$


### 1.3 光通量、强度、照度和亮度

![](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260202_095107.png)

---

## 二、 光通量 ($\Phi$) 与 发光强度 ($I$)

### 2.1 光通量 (Luminous Flux, $\Phi$)
光通量是加权的辐射功率，单位为流明 ($lm$)。它是光度学中的基本标量。

### 2.2 发光强度 (Luminous Intensity, $I$)
光强描述点光源在特定方向上的辐射密度。
**定义**：单位立体角内的光通量。

$$
I = \frac{d\Phi}{d\Omega} \quad (\text{单位: } cd = lm/sr)
$$

由此可得光通量的计算公式：
$$
\Phi = \int_{\Omega} I(\theta, \phi) d\Omega = \int_{0}^{2\pi} \int_{0}^{\pi} I(\theta, \phi) \sin\theta d\theta d\phi
$$

**特例**：对于各向同性（Isotropic）点光源，$I$ 为常数，则 $\Phi = 4\pi I$。

---

## 三、 照度 ($E$) 的严格推导：从微分到定律

照度定义为单位面积接收的光通量：$E = d\Phi / dA$。
我们将推导点光源照射到表面时的**平方反比定律**和**余弦定律**。

### 3.1 几何模型
设有一点光源 $S$，光强为 $I$。在距离 $r$ 处有一微元面积 $dA$，其法线 $\mathbf{n}$ 与光线入射方向 $\mathbf{l}$ 的夹角为 $\theta_i$（入射角）。

![](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260202_101645.png)

### 3.2 推导过程
1.  **投影面积**：光源“看”到的有效面积并不是 $dA$，而是 $dA$ 在垂直光线方向的投影 $dA_{\perp}$。
    $$
    dA_{\perp} = dA \cos\theta_i
    $$

2.  **立体角关联**：微元 $dA$ 对光源所张的立体角 $d\Omega$ 为：
    $$
    d\Omega = \frac{dA_{\perp}}{r^2} = \frac{dA \cos\theta_i}{r^2}
    $$

3.  **光通量传递**：在该立体角内，光源发出的光通量 $d\Phi$ 为：
    $$
    d\Phi = I d\Omega = I \frac{dA \cos\theta_i}{r^2}
    $$

4.  **照度计算**：根据照度定义 $E = d\Phi / dA$，代入上式：
    $$
    E = \frac{I \frac{dA \cos\theta_i}{r^2}}{dA}
    $$

5.  **最终公式**：
    $$
    E = \frac{I \cos\theta_i}{r^2}
    $$

这一公式同时包含了两大定律：
* **$1/r^2$** ：距离平方反比定律。
* **$\cos\theta_i$** ：朗伯余弦定律（Lambert's Cosine Law for Illuminance）。

---




## 四、 亮度 ($L$)：相空间密度的定义


亮度（Luminance）是光度学中最复杂、最抽象，却也是最核心的物理量。亮度 $L$ 定义为：单位立体角、单位投影面积上的光通量。


如果说光通量是“水量”，照度是“淋湿地面的程度”，那么亮度描述的就是**光在传输过程中的状态**。它不仅仅涉及空间位置（在哪？），还涉及方向（去哪？）。在物理光学的**相空间（Phase Space）**中，亮度是描述位置空间 $(x, y, z)$ 与方向空间 $(\theta, \phi)$ 联合分布密度的物理量。

为了理解亮度的定义公式，我们采用“剥洋葱”的方式，通过两次微分运算，从宏观的光通量一步步推导至亮度。

![](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260202_111412.png)

**第一步：方向微分（锁定方向）**
假设一个光源发出的总光通量为 $\Phi$。
光射向四面八方，我们首先只关心射向特定方向 $\vec{\omega}$ 的光。
我们将总光通量对**立体角 $d\Omega$** 进行微分。
这定义了**发光强度 (Intensity, $I$)** ：
$$
I = \frac{d\Phi}{d\Omega}
$$
*此时，我们确定了光“往哪个方向飞”，得到了光束的**角密度**。*

**第二步：空间微分（锁定投影面积）**
现在我们有了一束强度为 $I$ 的光，但我们还想知道这束光是“从多大的表面发出来的”。
我们考察表面上一个极小的微元面积 $dA$。由于视线与表面法线 $\mathbf{n}$ 存在夹角 $\theta$，我们看到的**有效发光面积**并不是 $dA$，而是其在视线垂直方向上的投影：
$$
dA_{proj} = dA \cdot \cos\theta
$$
我们将光强 $I$ 对这个**投影面积**进行第二次微分，这就得到了**亮度 (Luminance, $L$)** ：
$$
L = \frac{dI}{dA_{proj}} = \frac{dI}{dA \cdot \cos\theta}
$$
*此时，我们进一步确定了光“从哪里来”，得到了光束的**面密度**。*

**第三步：亮度的统一定义**
结合上述两步，亮度 $L$ 实际上是光通量 $\Phi$ 对立体角和投影面积的**二阶微分**：

$$
L = \frac{d}{dA \cos\theta} \left( \frac{d\Phi}{d\Omega} \right) = \frac{d^2\Phi}{d\Omega \cdot (dA \cdot \cos\theta)}
$$

整理后，我们得到光通量的积分形式，这在渲染方程（Rendering Equation）中极为常见：
$$
d^2\Phi = L \cdot \cos\theta \cdot dA \cdot d\Omega
$$


> **💡 学术注脚：光度学与辐射度量学的同构性**
>
> 许多读者可能会遇到 **辐射度 (Radiance, $L_e$)** 这个术语。
> * **辐射度 ($W \cdot sr^{-1} \cdot m^{-2}$)**：描述纯粹的物理能量分布。
> * **亮度 ($cd \cdot m^{-2}$)**：是辐射度经过人眼视见函数 $V(\lambda)$ 加权积分后的结果。
>
> 两者在数学定义和微分推导上是完全**同构**的。本文为了保持符号系统的一致性，统一使用**亮度**进行推导，但上述关于相空间、投影面积的所有物理规律，对于辐射度同样完全适用。


---

## 五、 应用案例1：朗伯体出射度 $M = \pi L$ 的证明

这是一个经典的面试题，也是理解光度学的试金石。
**问题**：已知一个朗伯体（Lambertian surface）表面亮度为 $L$（常数），求其光出射度 $M$（单位面积向半球空间辐射的总光通量）。
**直觉误区**：既然半球立体角是 $2\pi$，为什么 $M \neq 2\pi L$？

### 5.1 建立积分
光出射度 $M$ 定义为面密度：$M = \frac{d\Phi}{dA}$。
根据亮度定义：$d\Phi = L \cdot dA \cos\theta \cdot d\Omega$。
两边除以 $dA$ 并对半球空间积分：
$$
M = \int_{\Omega} L \cos\theta d\Omega
$$

### 5.2 展开积分
将微分立体角 $d\Omega = \sin\theta d\theta d\phi$ 代入。
积分范围：
* 方位角 $\phi$: $0 \to 2\pi$
* 天顶角 $\theta$: $0 \to \pi/2$ (注意只积半球，不是全球)

$$
M = \int_{0}^{2\pi} d\phi \int_{0}^{\pi/2} L \cos\theta \sin\theta d\theta
$$

由于是朗伯体，$L$ 与角度无关，提取到积分号外：

$$
M = L \cdot \left( \int_{0}^{2\pi} d\phi \right) \cdot \left( \int_{0}^{\pi/2} \cos\theta \sin\theta d\theta \right)
$$

### 5.3 求解积分
第一部分：
$$
\int_{0}^{2\pi} d\phi = 2\pi
$$

第二部分（利用倍角公式 $\sin\theta \cos\theta = \frac{1}{2}\sin 2\theta$）：
$$
\int_{0}^{\pi/2} \frac{1}{2} \sin 2\theta d\theta = \left[ -\frac{1}{4} \cos 2\theta \right]_0^{\pi/2}
$$
$$
= -\frac{1}{4} (\cos\pi - \cos 0) = -\frac{1}{4} (-1 - 1) = \frac{1}{2}
$$

### 5.4 最终结果
$$
M = L \cdot (2\pi) \cdot (\frac{1}{2}) = \pi L
$$

**结论**：朗伯表面的光出射度是亮度的 $\pi$ 倍。
那个丢失的因子 $2$ 来自于 $\cos\theta$ 项（投影面积效应），它使得掠射角方向的能量贡献衰减了。

---

## 六、 应用案例2：亮度守恒定理 (Conservation of Luminance) 的推导

光学系统中有一个重要结论：**亮度在光线传播过程中保持不变（假设无介质吸收和散射）。**

### 6.1 光管模型 (Light Tube)
考虑一束光在空间中传播，截面 1 为 $dA_1$，光束立体角为 $d\Omega_1$；传播到位置 2，截面为 $dA_2$，立体角为 $d\Omega_2$。

由能量守恒，通过两截面的光通量相等：
$$
d\Phi_1 = d\Phi_2
$$

展开亮度公式（设光线垂直截面，$\cos\theta=1$）：
$$
L_1 dA_1 d\Omega_1 = L_2 dA_2 d\Omega_2
$$

### 6.2 几何光学不变量 (Etendue)
由几何光学可知，量 $G = dA \cdot d\Omega$ 称为光学扩展量（Etendue）。在理想光学系统中，Etendue 是守恒的。
$$
dA_1 d\Omega_1 = dA_2 d\Omega_2
$$
(简单的例子：透镜聚焦，光斑面积 $dA$ 减小，但会聚角 $d\Omega$ 必然增大，乘积不变。)

### 6.3 结论
将 6.2 代入 6.1：
$$
L_1 (dA_1 d\Omega_1) = L_2 (dA_2 d\Omega_2) \implies L_1 = L_2
$$

**物理意义**：无论你用多大的透镜去聚焦太阳光，你都无法得到比太阳表面亮度更高的像。这保证了热力学第二定律在光学中成立（无法通过被动光学系统将目标加热到超过热源温度）。

---

## 七、 总结：四大物理量的关系网络

通过上述推导，我们可以画出严密的数学关系图：

1.  **光通量 $\Phi$**：能量的总和，无方向、无位置，纯标量。
    $$ \Phi = \iint L \cos\theta d\Omega dA $$
2.  **光强 $I$**：$\Phi$ 对 $\Omega$ 的导数，**只包含方向信息 (点光源近似)**。
    $$ I = \frac{d\Phi}{d\Omega} = \int L \cos\theta dA $$
3.  **照度 $E$**：$\Phi$ 对 $A$ 的导数，**只保留位置信息**。
    $$ E = \frac{d\Phi}{dA} = \int L \cos\theta d\Omega $$
4.  **亮度 $L$**：基本的相空间分布函数，**信息最全，包含位置+方向**。
    $$ L = \frac{d^2\Phi}{d\Omega dA \cos\theta} $$

这里列出工程中和渲染中最常用的推导关系：

#### 1. 亮度 $L$ $\leftrightarrow$ 发光强度 $I$
描述**面光源**与**点光源**的联系。亮度可以理解为“发光强度的面密度”。
$$
L = \frac{dI}{dA \cdot \cos\theta} \quad \iff \quad I = \int_{A} L \cos\theta dA
$$
* **应用场景**：当我们有一个面积为 $A$ 的面光源（如显示器），已知其亮度 $L$，想把它近似看作一个点光源时，就用积分公式计算其总光强 $I$。

#### 2. 照度 $E$ $\leftrightarrow$ 发光强度 $I$ (平方反比定律)
描述**点光源**照射到**表面**的情况。这是经典光学的核心定律。
$$
dE = \frac{I \cos\theta_{in}}{r^2} \quad (\text{其中 } d\Omega = \frac{dA \cos\theta_{in}}{r^2})
$$
* **应用场景**：计算路灯（近似点光源）在地面某点的照度。

#### 3. 照度 $E$ $\leftrightarrow$ 亮度 $L$ (环境光积分)
描述**环境光**（来自四面八方）照射到**表面**的情况。这是全局光照渲染（Global Illumination）的基础。
$$
E = \int_{\Omega} L_{incident} \cos\theta_{in} d\Omega
$$
* **应用场景**：计算天空光（面光源）对地面的照度。注意这里必须对入射半球进行积分，且必须包含余弦项 $\cos\theta_{in}$。


理解这些微积分关系，是进行复杂光学设计（如车灯设计、投影仪光路）和计算机图形学渲染（如路径追踪算法 Path Tracing）的先决条件。