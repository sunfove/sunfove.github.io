---
title: 穿透物质的微观指纹：拉曼散射的物理起源与第一性原理分析
date: 2026-02-20 22:38:44
tags:
  - 物理学
  - 光谱学
  - 量子力学
  - 第一性原理
categories:
  - 科研笔记
description: 本文从第一性原理出发，深度剖析拉曼散射的经典电磁学模型与量子力学本质，结合群论与热力学，系统阐述这一非弹性散射现象背后的深刻物理规律及其现代科学应用。
mathjax: true
---

# 拉曼散射的原理分析

## 1. 引言


当我们观察世界时，光是我们感知物质最主要的媒介。大部分情况下，光与物质的碰撞表现为“弹性碰撞”——光子被散射，但其能量（颜色）不发生改变。这就是解释了为何天空是蓝色的**瑞利散射（Rayleigh Scattering）**。然而，物理学的迷人之处往往隐藏在那些极其微弱的“异常”之中。

1928年，印度物理学家钱德拉塞卡拉·文卡塔·拉曼（C.V. Raman）在研究液体对光的散射时，敏锐地发现：在强烈的单色光散射光谱中，除了与入射光频率相同的谱线外，还存在极其微弱的、频率发生改变的伴线。这种光子与分子之间发生能量交换的“非弹性散射”现象，被命名为**拉曼散射（Raman Scattering）**。拉曼也因此发现获得了1930年的诺贝尔物理学奖。

每一种分子的振动和转动能级都是独一无二的，因此，拉曼散射光谱就像是物质的“光学指纹”。本文将摒弃表面的现象描述，回到物理学的本源，采用第一性原理（First Principles）方法，从经典电磁学到量子力学，为您彻底解构拉曼散射背后的深层逻辑。

![alt text](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260221_044741.png)

---

## 2. 原理起点：光为何会发生散射？

要理解拉曼散射，我们必须首先回答一个基本问题：**光为什么会被物质散射？**

物质是由带正电的原子核和带负电的电子云构成的体系。光，本质上是一种高频交变的电磁波。当这束电磁波照射到分子上时，交变的电场会对分子内部的电荷分布施加周期性的作用力，导致电子云相对于原子核发生周期性的位移。

这种电荷中心的周期性分离，在物理学上被称为**诱导偶极矩（Induced Dipole Moment）**。根据经典电磁学，一个随时间振荡的电偶极子会像一个微型天线一样，向四面八方辐射电磁波。这种二次辐射的电磁波，就是我们观察到的“散射光”。

诱导偶极矩 $\mu$ 与入射光电场 $E$ 之间的关系可以用分子极化率（Polarizability）$\alpha$ 来表示：

$$\mu=\alpha E$$

在这里，极化率 $\alpha$ 衡量的是分子的电子云在外部电场作用下变形的难易程度。如果 $\alpha$ 是一个恒定不变的常数，那么辐射出的光频率将与入射光完全一致。然而，分子本身并不是静止的，原子的振动打破了这种绝对的弹性。

---

## 3. 经典电磁学解释：极化率的动态调制

为了推导出拉曼散射的频率移动，我们引入经典电磁学的振子模型。

### 3.1 理论推导

假设入射单色光的电场随时间周期性变化，其频率为 $\nu_0$。入射电场 $E$ 可以写为：

$$E=E_0 \cos(2\pi \nu_0 t)$$

同时，分子内部的原子在平衡位置附近进行简谐振动。假设该分子振动（或转动）的频率为 $\nu_m$，其核间距的位移 $q$ 可以表示为：

$$q=q_0 \cos(2\pi \nu_m t)$$

这里 $q_0$ 是振动振幅。关键的一步在于：**分子的极化率 $\alpha$ 并不是常数，它依赖于分子的核间距。** 当原子间距改变时，电子云的束缚程度也会改变。因此，我们可以将极化率 $\alpha$ 在平衡位置 $q=0$ 处进行泰勒展开（Taylor Expansion）：

$$\alpha=\alpha_0+\left(\frac{\partial\alpha}{\partial q}\right)_0 q+\frac{1}{2}\left(\frac{\partial^2\alpha}{\partial q^2}\right)_0 q^2+\dots$$

忽略高阶项，仅保留线性近似，将 $q$ 的表达式代入：

$$\alpha=\alpha_0+\left(\frac{\partial\alpha}{\partial q}\right)_0 q_0 \cos(2\pi \nu_m t)$$

现在，我们将这个被“分子振动调制”的极化率表达式代回诱导偶极矩的方程 $\mu = \alpha E$ 中：

$$\mu=\left[ \alpha_0+\left(\frac{\partial\alpha}{\partial q}\right)_0 q_0 \cos(2\pi \nu_m t) \right] E_0 \cos(2\pi \nu_0 t)$$

展开这个方程，我们需要运用积化和差的三角恒等式：$\cos A \cos B = \frac{1}{2}[\cos(A+B) + \cos(A-B)]$。

$$\mu=\alpha_0 E_0 \cos(2\pi \nu_0 t)+\frac{1}{2} E_0 q_0 \left(\frac{\partial\alpha}{\partial q}\right)_0 [\cos(2\pi(\nu_0-\nu_m)t)+\cos(2\pi(\nu_0+\nu_m)t)]$$

### 3.2 物理意义的解析

上述展开式的三项，完美地预言了实验中观察到的三种散射光：

1.  **瑞利散射（Rayleigh Scattering）：** 第一项 $\alpha_0 E_0 \cos(2\pi \nu_0 t)$ 具有与入射光相同的频率 $\nu_0$。它代表了弹性散射，占据了散射光能量的绝大比例（通常占比 $10^{-4}$ 量级）。
2.  **斯托克斯拉曼散射（Stokes Raman Scattering）：** 第二项中的 $\cos(2\pi(\nu_0-\nu_m)t)$ 表示辐射光的频率变小了（红移）。在这个过程中，光子将一部分能量传递给了分子，激发了分子的振动。
3.  **反斯托克斯拉曼散射（Anti-Stokes Raman Scattering）：** 第二项中的 $\cos(2\pi(\nu_0+\nu_m)t)$ 表示辐射光的频率变大了（蓝移）。在这里，原本已经处于振动激发态的分子将能量传递给了光子，自身回到了低能态。

![Rayleigh and Raman energy level diagram](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260221_030547.png)


### 3.3 拉曼活性的必要条件

从经典公式中我们可以得出一个至关重要的推论：要使拉曼散射发生（即第二项不为零），必须满足：

$$\left(\frac{\partial\alpha}{\partial q}\right)_0 \neq 0$$

这意味着，**只有当分子的振动能够引起其极化率发生改变时，这种振动模式才是“拉曼活跃”的（Raman Active）。** 这一结论构成了拉曼光谱选择定则的经典基础。

---

## 4. 量子力学视角：光子与声子的虚能级跃迁

尽管经典电磁学成功解释了频率偏移和拉曼活性条件，但它存在一个致命缺陷：经典理论认为斯托克斯线和反斯托克斯线的强度应该是对称的（即系数完全相同）。然而在室温下的实际实验中，斯托克斯线的强度远大于反斯托克斯线。要解释强度的不对称性，我们必须借助**量子力学（Quantum Mechanics）**和**统计热力学（Statistical Thermodynamics）**。

### 4.1 虚能级与海森堡不确定性原理

在量子力学框架下，拉曼散射被描述为光子与分子发生非弹性碰撞的跃迁过程。分子的振动能级是量子化的，其能量可以表示为：

$$E_v=\left(v+\frac{1}{2}\right)h\nu_m$$

其中 $v$ 是振动量子数 ($v=0, 1, 2, \dots$)。

当一个能量为 $h\nu_0$ 的入射光子与分子相互作用时，它并没有足够的能量将电子激发到真实的较高电子能级。相反，分子被瞬间激发到一个极其短暂的、非定态的**虚能级（Virtual State）**。

虚能级的存在可以通过海森堡时间-能量不确定性原理来理解：

$$\Delta E \Delta t \ge \frac{\hbar}{2}$$

由于分子在虚能级上的停留时间 $\Delta t$ 极短（通常在飞秒量级 $10^{-15}$s），导致其能量的不确定度 $\Delta E$ 极大，因此即使没有实能级匹配，相互作用也能发生。

* **瑞利散射：** 分子从基态 ($v=0$) 跃迁到虚能级，随后立即回落到基态 ($v=0$)，释放出能量不变的光子 $h\nu_0$。
* **斯托克斯散射：** 分子从基态 ($v=0$) 跃迁到虚能级，但回落时停留在第一激发态 ($v=1$)。散射光子失去了部分能量：$h\nu_s = h\nu_0 - h\nu_m$。
* **反斯托克斯散射：** 分子最初已经处于激发态 ($v=1$)，跃迁到虚能级后，回落到基态 ($v=0$)。散射光子获得了额外的能量：$h\nu_{as} = h\nu_0 + h\nu_m$。

![Quantum mechanical explanation of virtual states](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260221_033327.png)


### 4.2 热力学解释：玻尔兹曼分布与真实强度的非对称性

为什么在自然界室温状态下，斯托克斯线总是比反斯托克斯线强得多？甚至反斯托克斯线经常微弱到难以被探测器捕捉？要解答这个宏观光谱学问题，我们必须潜入统计力学（Statistical Mechanics）的深海。

#### 4.2.1 玻尔兹曼分布：微观能级的“人口普查”

在热力学平衡状态下，一个由海量分子组成的宏观系统，其分子在各个量子化振动能级上的布局概率，严格受到温度的支配。根据统计力学中的正则系综（Canonical Ensemble）理论，系统处于能量为 $E$ 的特定状态的概率正比于玻尔兹曼因子 $e^{-E/kT}$。

我们将分子的振动近似为量子简谐振子，其能级公式为 $E_v = (v + 1/2)h\nu_m$。因此，处于第一激发态（$v=1$，反斯托克斯跃迁的唯一起点）与处于基态（$v=0$，斯托克斯跃迁的起点）的分子数量之比，可以精确表达为：

$$\frac{N_1}{N_0} = \frac{\exp(-E_1/kT)}{\exp(-E_0/kT)} = \exp\left(-\frac{h\nu_m}{kT}\right)$$

为了便于在光谱学中计算，我们通常将振动频率 $\nu_m$ 替换为波数 $\tilde{\nu}_m$（单位为 $\text{cm}^{-1}$），公式改写为：

$$\frac{N_1}{N_0} = \exp\left(-\frac{hc\tilde{\nu}_m}{kT}\right)$$

其中，$h$ 是普朗克常数，$c$ 是光速，$k$ 是玻尔兹曼常数，$T$ 是绝对温度。

**物理图像的直观具象化：**
假设我们在室温（$T = 300\text{ K}$）下观察一块纯硅（Si）晶体。硅最著名的光学声子拉曼峰位于 $\tilde{\nu}_m \approx 520\text{ cm}^{-1}$。
计算可知，室温下的热涨落能量 $kT \approx 208\text{ cm}^{-1}$。由于振动能级间距（$520\text{ cm}^{-1}$）远大于系统提供的热能（$208\text{ cm}^{-1}$），这意味着在宏观统计上，绝大多数硅原子都在极其“寒冷”的基态中沉睡。真实计算出的 $N_1/N_0$ 比值大约只有 $0.08$。也就是说，每 100 个硅分子中，只有不到 8 个具备发射反斯托克斯光子的“资格”。



#### 4.2.2 严谨的强度比公式：频率四次方修正

仅仅依靠分子数量的比例（$N_1/N_0$），还不足以得出最精确的光谱强度比。我们在前面推导偶极矩辐射时提到过，电偶极子辐射电磁波的功率，与其辐射频率的四次方成正比（这也是瑞利散射公式的核心）。

因此，拉曼散射的真实光学强度 $I$ 不仅与参与跃迁的初始分子数 $N$ 成正比，还与**散射光的绝对频率的四次方**成正比：

* **斯托克斯强度：** $I_S \propto N_0 (\nu_0 - \nu_m)^4$
* **反斯托克斯强度：** $I_{AS} \propto N_1 (\nu_0 + \nu_m)^4$

将两者相除，并代入玻尔兹曼分布公式，我们终于得到了拉曼光谱学中极其重要且严谨的**理论强度比方程**：

$$\frac{I_{AS}}{I_S} = \left( \frac{\nu_0 + \nu_m}{\nu_0 - \nu_m} \right)^4 \exp\left(-\frac{hc\tilde{\nu}_m}{kT}\right)$$

在这个终极方程中，由于 $\nu_0 + \nu_m > \nu_0 - \nu_m$，前面的频率四次方项（动力学因子）实际上是在“帮助”反斯托克斯线增强。然而，后面的指数项（热力学因子）衰减得实在太厉害了，它以压倒性的优势统治了整个等式，最终导致宏观上 $I_S \gg I_{AS}$。

#### 4.2.3 极致的工程应用：非接触式拉曼测温计

既然斯托克斯与反斯托克斯的强度比对系统的绝对温度 $T$ 存在如此严密的解析数学关系，物理学家们顺水推舟，将其反转为一个优雅的工程工具——**微纳尺度的绝对光学温度计**。

我们将上述公式两边取对数，反向求解温度 $T$：

$$T = \frac{hc\tilde{\nu}_m}{k \ln\left[ \frac{I_S}{I_{AS}} \left( \frac{\nu_0 + \nu_m}{\nu_0 - \nu_m} \right)^4 \right]}$$

**这是一种精妙的温度测量方式！**
在现代芯片制造中，晶体管的特征尺寸已经缩小到几纳米，传统的接触式热电偶根本无法探测芯片内部的局部过热（Hotspots）。而利用激光拉曼测温，工程师只需将一束极其微小的激光聚焦在芯片表面的特定晶体管上，同时测量其斯托克斯和反斯托克斯峰的强度面积比，代入上述公式，就能在亚微米级的空间分辨率下，得出该点毫无误差的绝对温度。无需校准，不受材料表面发射率影响，这是纯粹由物理定律背书的完美测量。

为了展示其实用性，我们可以使用 Python 编写一个计算器，模拟真实科研中如何通过强度比反推温度：

```python
import numpy as np

def calculate_raman_temperature(ratio_AS_to_S, laser_wavelength_nm, raman_shift_cm1):
    """
    根据反斯托克斯与斯托克斯的强度比，精确反推微观区域的绝对温度。
    ratio_AS_to_S: 实验测得的反斯托克斯/斯托克斯积分强度比
    laser_wavelength_nm: 激发激光波长 (nm)
    raman_shift_cm1: 拉曼频移 (cm^-1)
    """
    # 物理常数
    h = 6.62607015e-34  # 普朗克常数 J·s
    c = 299792458       # 光速 m/s
    k_B = 1.380649e-23  # 玻尔兹曼常数 J/K
    
    # 单位转换
    nu_0 = 1e7 / laser_wavelength_nm  # 入射光波数 cm^-1
    nu_m = raman_shift_cm1            # 声子波数 cm^-1
    
    # 频率四次方修正因子 (动力学因子)
    freq_factor = ((nu_0 + nu_m) / (nu_0 - nu_m))**4
    
    # 提取纯玻尔兹曼热力学因子
    boltzmann_factor = ratio_AS_to_S / freq_factor
    
    # 能量差转焦耳 (注意 cm^-1 转换到 m^-1 需要乘 100)
    delta_E = h * c * (nu_m * 100)
    
    # 防止由于噪声导致比值为0的数学错误
    if boltzmann_factor <= 0:
        return float('inf')
        
    # 计算绝对温度 T (开尔文)
    temperature_K = delta_E / (k_B * np.log(1 / boltzmann_factor))
    return temperature_K

# 模拟实验数据：用 532 nm 激光打在硅片(520 cm^-1)上，测得 AS/S 强度比为 0.12
measured_ratio = 0.12
T_kelvin = calculate_raman_temperature(measured_ratio, 532, 520)

print(f"检测到反斯托克斯与斯托克斯强度比为 {measured_ratio}")
print(f"反推当前微观区域绝对温度为: {T_kelvin:.2f} K (约 {T_kelvin - 273.15:.2f} °C)")
```



## 5. 分子对称性视角：拉曼选择定则的数学内核

要彻底精通拉曼散射，必须跨越到化学物理的深水区：群论（Group Theory）。前面我们提到经典模型中的必要条件是 $\left(\frac{\partial\alpha}{\partial q}\right)_0 \neq 0$。但在复杂分子中，如何判断哪种振动模式满足这个条件？这完全由分子的**几何对称性**决定。

### 5.1 极化率张量

在三维空间中，分子的极化率 $\alpha$ 并不是一个标量，而是一个二阶对称张量（Tensor）：

$$
\alpha = \begin{pmatrix} 
\alpha_{xx} & \alpha_{xy} & \alpha_{xz} \\ 
\alpha_{yx} & \alpha_{yy} & \alpha_{yz} \\ 
\alpha_{zx} & \alpha_{zy} & \alpha_{zz} 
\end{pmatrix}
$$

一个振动模式要具有拉曼活性，必须使得极化率张量中至少有一个分量在振动过程中发生变化。在群论中，这意味着该振动模式的不可约表示（Irreducible Representation）必须与二次函数（如 $x^2, xy, z^2$ 等）具有相同的对称性。

### 5.2 相互排斥原理（Rule of Mutual Exclusion）

拉曼光谱与红外（IR）光谱常常被认为是互补的。红外吸收的条件是分子的偶极矩（不仅是诱导的，包括固有偶极矩）发生变化，即 $\frac{\partial \mu}{\partial q} \neq 0$。

群论推导出了一个优美的物理定律——**相互排斥原理**：
> 对于具有对称中心（Centrosymmetric）的分子（例如二氧化碳 $CO_2$ 或苯 $C_6H_6$），凡是具有红外活性的振动模式，必然没有拉曼活性；凡是具有拉曼活性的振动模式，必然没有红外活性。

* **例子：二氧化碳 ($CO_2$)**
    * **对称伸缩振动（Symmetric stretch）：** 两个氧原子同时远离或靠近碳原子。偶极矩保持为零（无红外活性），但电子云体积周期性变化导致极化率改变（**有拉曼活性**）。
    * **反对称伸缩振动（Asymmetric stretch）：** 一侧氧原子靠近，另一侧远离。偶极矩周期性改变（**有红外活性**），但整体极化率变化相互抵消（无拉曼活性）。

通过对比红外与拉曼光谱，科学家可以反向推演出未知分子的三维空间构型。

![Vibrational modes of CO2 molecule](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260221_034750.png)



---

## 6. 跨学科前沿应用

理解了第一性原理之后，我们才能真正看懂拉曼光谱为何能在现代科学中占据不可替代的统治地位。它的无损、无需复杂样品制备以及能够提供分子结构级信息的特点，使其应用横跨多个学科。

### 6.1 凝聚态物理与材料科学：二维材料的“基因测序”

在碳基纳米材料（如石墨烯、碳纳米管、富勒烯）的研究中，拉曼光谱是最具权威性的表征工具。碳原子的 $sp^2$ 杂化网络对极化率的变化极其敏感。

* **G 峰（约 1580 cm⁻¹）：** 代表了碳原子在平面内的面内伸缩振动，属于 $E_{2g}$ 对称性模式。G 峰的位置和形状能够精确反映材料的层数、掺杂浓度以及应力状态。
* **D 峰（约 1350 cm⁻¹）：** 这是一个**缺陷激活（Defect-activated）**的呼吸振动模式（$A_{1g}$ 对称性）。在完美的石墨烯晶格中，由于动量守恒的限制，光子无法直接激发声子（波矢 $\vec{q} \neq 0$）。只有当晶格存在缺陷（打破平移对称性）时，D 峰才会出现。因此，$I_D/I_G$ 的强度比是衡量碳材料晶格缺陷密度的核心指标。
* **2D 峰（约 2700 cm⁻¹）：** 它是 D 峰的双声子共振拉曼过程，即使在无缺陷的石墨烯中也存在。2D 峰的形状和半峰宽（FWHM）可以直接用来判断石墨烯的层数。

![Raman spectra of graphene showing D, G, and 2D bands](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260221_034954.png)


### 6.2 生物医学工程：无水干扰的“活体指纹”

如果说红外光谱在生物学中的应用经常被“水”扼杀，那么拉曼光谱则在水溶液环境中如鱼得水。
从第一性原理来看，水分子（$H_2O$）的 O-H 键伸缩振动具有极大的偶极矩变化（红外吸收极强），但其电子云极化率的变化率 $\left(\frac{\partial\alpha}{\partial q}\right)$ 却非常小。因此，**水是一个极弱的拉曼散射体**。

这一物理特性使得拉曼光谱成为**非破坏性活体细胞成像**的绝佳工具：
* **癌症早期诊断：** 癌变细胞内的脂质（Lipids）、蛋白质和核酸比例会发生微观变化。通过分析约 2800-3000 cm⁻¹ 区域的 C-H 伸缩振动峰群，拉曼光谱可以在细胞形态发生可见病变之前，通过化学成分的变化识别出恶性肿瘤细胞。
* **受激拉曼散射显微镜（SRS Microscopy）：** 结合非线性光学原理，现代 SRS 显微镜实现了对活体生物组织的高速、无标记（Label-free）三维实时成像，药物分子如何在细胞内分布和代谢，在拉曼镜头下无所遁形。

![Raman mapping of a biological cell showing lipid and protein distribution](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/clipboard_20260221_035651.png)


### 6.3 空间探索与天体生物学：寻找地外生命的分子证据

拉曼光谱的硬核应用甚至延伸到了外太空。2020年，NASA的“毅力号”（Perseverance）火星车搭载了一台名为 **SHERLOC** (Scanning Habitable Environments with Raman & Luminescence for Organics & Chemicals) 的深紫外拉曼光谱仪登陆火星。

* **为何选择拉曼探测火星？** 传统的质谱或色谱分析通常需要粉碎、加热等破坏性的样品制备。而拉曼光谱仪只需将激光打在火星岩石表面，就能原位（in-situ）分析其矿物成分，并探测其中是否含有形成生命的有机大分子（如多环芳烃、氨基酸等）。拉曼光谱的高特异性，使其成为证明地外行星古代宜居性（Habitability）的最有力武器。

### 6.4 表面增强拉曼散射 (SERS)：突破物理极限的单分子探测

传统的拉曼散射效率极低，但当分子吸附在粗糙的纳米级贵金属（如金、银）表面时，其拉曼信号可以被惊人地放大 $10^6$ 甚至 $10^{11}$ 倍！这就是 **表面增强拉曼散射（SERS）**。
其核心物理机制主要来源于**电磁场增强（Electromagnetic Enhancement）**。入射光激发了金属纳米颗粒表面的自由电子发生集体振荡，即**局域表面等离子体共振（LSPR）**。在纳米颗粒之间的间隙（热点，Hot spots），局部电场 $E_{loc}$ 会被成百上千倍地放大。由于拉曼散射强度与局部电场的四次方成正比：
$$I_{SERS} \propto |E_{loc}|^4$$
这种指数级的放大效应，使得 SERS 能够突破传统检测的极限，实现对**单一分子（Single-molecule level）**的直接光谱观测，目前已被广泛应用于环境毒素检测、病毒抗原筛查以及痕量炸药探测。


## 7. 结语

拉曼散射不仅仅是一种光谱技术，更是人类理解物质世界微观动力学的一扇窗。随着纳米光子学与非线性光学的进一步融合，拉曼光谱必将在材料科学、深空探测、生命科学等领域揭示更多隐藏在物质深处的秘密。

***


> **⚠️ 版权与免责声明 (Copyright & Disclaimer):**
> 
> 本文为非商业性的学术与技术分享，旨在促进第一性原理与光谱学的科学普及。文中部分辅助理解的配图来源于公开网络检索，未能逐一联系原作者获取正式授权。图片版权均归属原作者或对应学术期刊、机构所有。
> 
> 在此郑重声明：若原图权利人对本文的引用存在任何异议，或认为构成了未经授权的使用，请随时通过博客后台留言或邮件与本人联系。我将在收到通知后第一时间全力配合，进行版权信息的补充标明或立即执行删除处理。由衷感谢每一位科研工作者对科学知识开放传播的包容与贡献！

1.  **生物细胞的无标记拉曼分子成像 (Raman Mapping of Biological Cells)**
    * [Nature Communications Biology: s42003-020-1100-4](https://www.nature.com/articles/s42003-020-1100-4)
2.  **石墨烯的特征拉曼光谱特征峰 (Raman Spectra of Graphene)**
    * [ResearchGate: Figure 5_319949840](https://www.researchgate.net/figure/Raman-spectra-illustrating-the-D-G-and-2D-bands-for-the-as-received-and-the-dispersed_fig5_319949840)
3.  **二氧化碳分子的振动模式与选择定则 (Vibrational Modes of CO2)**
    * [ResearchGate: Figure 8_367241552](https://www.researchgate.net/figure/Example-of-Raman-active-and-infrared-active-bond-vibrations-for-CO2-A-CO2-molecule-has_fig8_367241552)
4.  **拉曼效应的科学史与物理图像 (The Raman Effect Explained)**
    * [Swarajya Magazine: The Raman Effect](https://swarajyamag.com/science/national-science-day-the-raman-effect-and-one-of-its-key-applications-explained)
5.  **瑞利散射与拉曼跃迁虚能级能级图 (Virtual States Energy Diagram)**
    * [Edinburgh Instruments: What is Raman Spectroscopy?](https://www.edinst.com/resource/what-is-raman-spectroscopy/)

