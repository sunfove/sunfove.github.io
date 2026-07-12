---
title: 麦克斯韦方程组 (Maxwell's Equations) 的完整推导
date: 2026-01-11 12:00:00
tags: [电动力学, 麦克斯韦方程, 位移电流, 矢量分析, 物理史]
categories: 物理硬核
excerpt: 费曼曾说：“一万年后，人类如果不把麦克斯韦方程组的发现作为 19 世纪最重要的事件，那就太搞笑了。”本文不使用公理化定义，而是从电荷、电流、磁铁的实验现象出发，利用散度与旋度定理，一步步推导出这组统治宇宙的方程。
---

在物理学中，很少有公式能像**麦克斯韦方程组**这样，兼具数学的对称美与物理的深刻性。

它用短短四行公式，统一了电、磁、光。
今天，我们不搞“天降公式”那一套。我们将回到 19 世纪的实验室，从最基础的实验定律出发，利用数学工具，一点点“逼”出这组方程。

---

## 准备工作：数学工具箱

在推导之前，我们需要两个连接“宏观”与“微观”的数学神器：

1.  **高斯散度定理 (Divergence Theorem)**：
    穿过闭合曲面的通量 $\Phi$，等于体积内源的散度总和。
    $$\oint_S \mathbf{A} \cdot d\mathbf{a} = \int_V (\nabla \cdot \mathbf{A}) dV$$
2.  **斯托克斯定理 (Stokes' Theorem)**：
    沿闭合曲线的环流，等于该曲线围成曲面上旋度的通量。
    $$\oint_L \mathbf{A} \cdot d\mathbf{l} = \int_S (\nabla \times \mathbf{A}) \cdot d\mathbf{a}$$

---

## 方程一：高斯电场定律 (Gauss's Law)
**——电场的源头是电荷**

**1. 物理起点：库仑定律**
我们在真空中放一个点电荷 $Q$，它在 $r$ 处的电场是：
$$\mathbf{E} = \frac{1}{4\pi\epsilon_0} \frac{Q}{r^2} \mathbf{\hat{r}}$$

**2. 宏观通量**
我们要计算穿过包围这个电荷的任意闭合球面 $S$ 的电通量。
$$\oint_S \mathbf{E} \cdot d\mathbf{a} = \oint_S \left( \frac{1}{4\pi\epsilon_0} \frac{Q}{r^2} \right) d\mathbf{a}$$
由于球面面积是 $4\pi r^2$，代入计算得到：
$$\oint_S \mathbf{E} \cdot d\mathbf{a} = \frac{Q}{\epsilon_0}$$
这就是**高斯定律的积分形式**：总通量等于内部总电荷除以 $\epsilon_0$。

**3. 微分化 (推导)**
将总电荷 $Q$ 写成电荷密度 $\rho$ 的体积分：$Q = \int_V \rho dV$。
同时利用**散度定理**把左边变成体积分：
$$\int_V (\nabla \cdot \mathbf{E}) dV = \int_V \frac{\rho}{\epsilon_0} dV$$
因为对于任意体积 $V$ 都成立，被积函数必须相等：

$$\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}$$

*(物理含义：电场是有源场，电荷就是那个源。)*

---

## 方程二：高斯磁场定律
**——磁场没有“单极子”**

**1. 物理起点：磁铁切开还是磁铁**
无论你怎么切割磁铁，你永远得到的是一个 N 极和一个 S 极，从未发现过单独的“磁荷”。磁感线永远是闭合的圈，从 N 出来回到 S。

**2. 数学表述**
既然没有磁荷（源头），那么穿过任意闭合曲面的磁通量必须是 0（进多少出多少）。
$$\oint_S \mathbf{B} \cdot d\mathbf{a} = 0$$

**3. 微分化**
再次利用散度定理：
$$\int_V (\nabla \cdot \mathbf{B}) dV = 0$$

$$\nabla \cdot \mathbf{B} = 0$$

*(物理含义：磁场是无源场，磁力线永远闭合。)*

---

## 方程三：法拉第电磁感应定律
**——变化的磁场产生电场**

**1. 物理起点：法拉第的实验**
当穿过线圈的磁通量 $\Phi_B$ 发生变化时，线圈中会产生感应电动势 $\mathcal{E}$。
$$\mathcal{E} = -\frac{d\Phi_B}{dt}$$
*(负号来自楞次定律：感应电流阻碍磁通变化)*

**2. 场论翻译**
电动势 $\mathcal{E}$ 本质上是电场 $\mathbf{E}$ 沿着闭合回路 $L$ 的做功（环流）：
$$\mathcal{E} = \oint_L \mathbf{E} \cdot d\mathbf{l}$$
磁通量 $\Phi_B$ 是磁场 $\mathbf{B}$ 在曲面 $S$ 上的积分：
$$\Phi_B = \int_S \mathbf{B} \cdot d\mathbf{a}$$

代入法拉第定律：
$$\oint_L \mathbf{E} \cdot d\mathbf{l} = - \frac{d}{dt} \int_S \mathbf{B} \cdot d\mathbf{a}$$

**3. 微分化**
利用**斯托克斯定理**将左边变为面积分：
$$\int_S (\nabla \times \mathbf{E}) \cdot d\mathbf{a} = - \int_S \frac{\partial \mathbf{B}}{\partial t} \cdot d\mathbf{a}$$
去掉积分号：

$$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$$

*(物理含义：电场不一定是静电场，变化的磁场也能产生“涡旋”状的电场。)*

---

## 方程四：安培-麦克斯韦定律
**——伟大的修补**

这是麦克斯韦封神的一步。

**1. 旧安培定律的困境**
早期的安培定律说：电流 $I$ 会产生环绕的磁场。
$$\nabla \times \mathbf{B} = \mu_0 \mathbf{J}$$
其中 $\mathbf{J}$ 是电流密度。

**2. 致命漏洞**
我们对上式两边取**散度**（Divergence）。
* 左边：$\nabla \cdot (\nabla \times \mathbf{B})$。根据矢量恒等式，**旋度的散度恒为 0**。
* 右边：$\mu_0 (\nabla \cdot \mathbf{J})$。

这意味着 $\nabla \cdot \mathbf{J} = 0$。这在恒定电流（静磁学）下是对的。
但在**非恒定电流**下，根据电荷守恒定律（连续性方程）：
$$\nabla \cdot \mathbf{J} = -\frac{\partial \rho}{\partial t}$$
**矛盾出现了！** 当电荷密度随时间变化时（例如给电容器充电），旧安培定律不成立！



**3. 麦克斯韦的补救：位移电流**
为了让等式成立，麦克斯韦通过高斯定律 $\rho = \epsilon_0 (\nabla \cdot \mathbf{E})$ 替换了 $\rho$：
$$\nabla \cdot \mathbf{J} = -\frac{\partial}{\partial t} (\epsilon_0 \nabla \cdot \mathbf{E}) = -\nabla \cdot (\epsilon_0 \frac{\partial \mathbf{E}}{\partial t})$$
移项得到：
$$\nabla \cdot \left( \mathbf{J} + \epsilon_0 \frac{\partial \mathbf{E}}{\partial t} \right) = 0$$

看！如果我们把括号里的东西定义为“广义电流”，散度就是 0 了。
麦克斯韦把这一项 $\mathbf{J}_d = \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}$ 称为**位移电流 (Displacement Current)**。

**4. 最终形式**
将这个新项加回安培定律：

$$\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}$$

*(物理含义：不仅电流能产生磁场，变化的电场也能产生磁场！)*

---

## 终章：光的预言

现在，我们集齐了四大方程：

1.  $\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}$ （电荷产生电场）
2.  $\nabla \cdot \mathbf{B} = 0$ （磁荷不存在）
3.  $\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$ （动磁生电）
4.  $\nabla \times \mathbf{B} = \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t} + \mu_0 \mathbf{J}$ （动电生磁）

麦克斯韦盯着后两个方程，如果在真空中（$\mathbf{J}=0, \rho=0$），它们呈现出完美的对称性。
变化的电场产生磁场，变化的磁场又产生电场……这种交替激发会向远处传播。

他对这两个方程取旋度，消去变量，惊人地推导出了波动方程：
$$\nabla^2 \mathbf{E} = \mu_0 \epsilon_0 \frac{\partial^2 \mathbf{E}}{\partial t^2}$$
波速 $v = \frac{1}{\sqrt{\mu_0 \epsilon_0}}$。

当时，$\mu_0$（真空磁导率）和 $\epsilon_0$（真空介电常数）只是实验室测出来的两个常数。
麦克斯韦把它们代入一算：
$$v \approx 3 \times 10^8 \, m/s$$

这个数字，恰好与当时测量的**光速**吻合，实际上，**光，就是一种电磁波。**

---