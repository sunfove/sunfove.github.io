---
title: 超表面矢量全息技术
date: 2026-07-18
categories:
  - 超表面技术
tags:
  - 超表面
  - 全息术
  - Holography
excerpt: 今日超表面技术日报：超表面矢量全息技术
index_img:
math: true
---

## 引言

全息术自 Gabor 发明以来，一直是光学领域最具魅力的技术之一——它能完整记录和重建光场的全部信息。然而，传统标量全息术仅能操控单一偏振态，在面对现代光学对多维信息编码的迫切需求时显得力不从心。超表面矢量全息技术正是突破这一瓶颈的关键途径：通过亚波长尺度的超表面单元同时独立操控光场的相位、振幅和偏振，实现对矢量光场的全维度重建。

近期这一领域进展迅猛：2025年8月，研究者报道了基于超薄超表面的高效率矢量全息方案；2026年4月，矢量声学全息被证明可用于多路复用信息编码；6月，一种"虚拟"超表面技术宣称实现了超快光场整形，被评价为未来成像的"游戏规则改变者"。本文将深入探讨超表面矢量全息的核心原理、数学框架与前沿应用。

## 核心概念

### 1. 矢量光场与超表面

传统全息术关注的是标量光场——即单一偏振分量下的复振幅分布。矢量光场（vectorial optical field）则要求同时描述两个正交偏振分量上的复振幅，其完整数学表示为：

$$ \mathbf{E}(x,y) = \begin{pmatrix} E_x(x,y) \\ E_y(x,y) \end{pmatrix} = \begin{pmatrix} A_x(x,y)e^{i\phi_x(x,y)} \\ A_y(x,y)e^{i\phi_y(x,y)} \end{pmatrix} $$

对于任意目标矢量光场，超表面需要在每个像素位置 $ (x,y) $ 上实现一个完整的 $ 2 \times 2 $ 琼斯矩阵（Jones matrix）：

$$ \mathbf{J}(x,y) = \begin{pmatrix} J_{xx} & J_{xy} \\ J_{yx} & J_{yy} \end{pmatrix} $$

这个琼斯矩阵必须满足互易性和能量守恒的约束（在无源、无损耗情况下为酉矩阵），能够将入射偏振态映射为任意目标偏振态。

### 2. 几何相位与传输相位协同

实现任意琼斯矩阵的超表面通常需要联合利用两种相位调控机制：

**几何相位（Pancharatnam-Berry 相位）** 来源于各向异性超表面单元的旋转操作。当圆偏振光通过旋转角为 $ \theta $ 的纳米天线时，交叉偏振分量获得 $ \pm 2\theta $ 的相位延迟：

$$ \mathbf{J}_{GP}(\theta) = R(-\theta) \cdot \begin{pmatrix} t_o & 0 \\ 0 & t_e \end{pmatrix} \cdot R(\theta) $$

其中 $ R(\theta) $ 是旋转矩阵，$ t_o $ 和 $ t_e $ 分别为沿普通轴和异常轴的透射系数。

**传输相位（Propagation phase）** 通过调整纳米结构的几何尺寸（长度、宽度）来改变有效折射率，从而独立控制两个正交偏振态上的相位延迟 $ \phi_o $ 和 $ \phi_e $。

当两者结合，总琼斯矩阵变为：

$$ \mathbf{J}_{total} = R(-\theta) \cdot \begin{pmatrix} t_o e^{i\phi_o} & 0 \\ 0 & t_e e^{i\phi_e} \end{pmatrix} \cdot R(\theta) $$

通过合理选择 $ \{\theta, \phi_o, \phi_e, t_o, t_e\} $ 五个自由度，可在每个像素位置实现所需的琼斯矩阵元素。

### 3. 多通道复用与信息容量

矢量全息的一个核心优势是信息容量的指数级提升。对于标量全息的 $ N \times N $ 像素阵列，即使每个像素可独立控制相位，其信息自由度也只有 $ N^2 $。而在矢量全息中：

$$ C_{vec} = 4 \times N^2 = 4N^2 $$

四个独立通道分别对应 $ E_x $ 和 $ E_y $ 的实部与虚部。若进一步引入轨道角动量（OAM）、波长等多维复用，总信息容量为：

$$ C_{total} = 4 \times M_{OAM} \times M_{\lambda} \times N^2 $$

2025年12月，研究人员展示了基于双层超表面的任意总角动量矢量全息方案，利用 OAM 模式的正交性在单一器件中编码了多条独立全息通道。

## 数学原理：矢量全息的设计逆问题

超表面矢量全息的核心是一个逆向设计问题。给定目标矢量光场分布 $ \mathbf{E}_{target}(x,y) $ 在目标平面 $ z = z_0 $ 处，需要逆向求解超表面平面 $ z = 0 $ 上每个单元所需的琼斯矩阵。

**正向传播模型：**

$$ \mathbf{E}_{out}(x',y') = \iint G(x'-x, y'-y) \cdot \mathbf{J}(x,y) \cdot \mathbf{E}_{in}(x,y) \,dx\,dy $$

其中 $ G(x'-x, y'-y) $ 是自由空间标量格林函数（可用角谱法或 Rayleigh–Sommerfeld 衍射积分计算），$ \mathbf{J}(x,y) $ 为超表面局域琼斯矩阵，矩阵乘法顺序不可交换。

**优化目标函数：**

$$ \mathcal{L} = \sum_{x,y} w(x,y) \cdot \left\| \mathbf{E}_{out}(x,y) - \mathbf{E}_{target}(x,y) \right\|^2 + \lambda \cdot \mathcal{R}(\mathbf{J}) $$

其中 $ w(x,y) $ 为空间权重函数，$ \mathcal{R}(\mathbf{J}) $ 是正则化项，约束琼斯矩阵的物理可实现性（如无源性要求 $ \mathbf{J}^\dagger\mathbf{J} \leq \mathbf{I} $）。

### 梯度优化方法

使用伴随法（adjoint method）高效计算梯度：

$$ \frac{\partial\mathcal{L}}{\partial \mathbf{J}(x,y)} = \mathbf{E}_{adj}^\dagger(x,y) \cdot \mathbf{E}_{in}(x,y) $$

其中伴随场 $ \mathbf{E}_{adj} $ 通过在输出平面注入误差信号 $ \mathbf{E}_{out} - \mathbf{E}_{target} $ 并反向传播获得。

实际上，对每个超表面单元的几何参数 $ p $（如长度 $ L $、宽度 $ W $、旋转角 $ \theta $），利用链式法则：

$$ \frac{\partial\mathcal{L}}{\partial p} = \text{Tr}\left[ \left(\frac{\partial\mathcal{L}}{\partial\mathbf{J}}\right)^T \frac{\partial\mathbf{J}}{\partial p} \right] $$

其中 $ \partial\mathbf{J}/\partial p $ 可通过数值模拟（FDTD/RCWA）或解析模型获得，这是实现端到端梯度优化的关键。

## 应用场景

### 1. 超高密度光学加密与安全

2026年5月报道的新型全息安全技术（"以光为钥"）利用矢量全息的多维度编码能力实现难以复制的光学密钥。通过将不同信息编码在正交偏振、OAM 模式或波长通道中，只有在满足特定入射条件（特定偏振态、特定波长组合）时才能正确解密。数学上，加密/解密过程可表示为：

$$ \mathbf{I}_{decrypted} = f_{\theta}(\mathbf{J}, \mathbf{E}_{key}; \lambda) $$

其中 $ \mathbf{E}_{key} $ 是特定的密钥光场，$ f_{\theta} $ 代表特定光学参数配置下的重建函数。这种方式的信息容量远超传统 QR 码或全息防伪标签。

### 2. AR/VR 近眼显示

矢量全息在显示领域的潜力尤为突出。通过对波前偏振分布的精确控制，矢量全息光学元件可在单层结构中实现多焦点成像、偏振敏感的深度线索重建，解决传统立体显示的辐辏-调节冲突（VAC）问题。2026年6月的"虚拟超表面"工作进一步演示了超快可重构光场整形，为实时全息显示铺平道路。

## 今日动态

- **Ultra-fast light-shaping "virtual" metasurface**（2026-06-25）：科学家开发了一种新型"虚拟"超表面，可超越传统透镜和光学元件限制来操控光场，被评价为未来成像领域的突破。 [阅读详情](https://phys.org/news/2026-06-ultra-fast-technology-game-changer.html)

- **Hologram technology with "light as key"**（2026-05-06）：一种将光运动作为密钥的全息技术问世，仅在特定条件下才揭示信息，为光学安全防护提供了全新手段。 [阅读详情](https://phys.org/news/2026-05-hologram-technology-key-enables-hard.html)

- **Vectorial Acoustic Multiplexed Holography**（2026-04-27，arXiv）：研究者在声学域实现了矢量复用全息，借鉴光学矢量全息的偏振复用思想扩展到声波领域。 [查看论文](https://arxiv.org/abs/2604.xxxxx)

- **Ultrathin metasurface enables high-efficiency vectorial holography**（2025-08-21）：基于超薄超表面实现了高效率矢量全息方案，为器件小型化与集成化提供重要参考。 [阅读详情](https://phys.org/news/2025-08-ultrathin-metasurface-enables-high-efficiency.html)

## 总结

超表面矢量全息技术代表着全息光学从"标量时代"迈入"矢量时代"的范式转变。其核心突破在于利用超表面单元的亚波长自由度实现完整的偏振-相位联合操控，从而在单一器件中完成多维光场信息的编码与重建。

关键技术要点回顾：

1. **琼斯矩阵全息**：在超表面每个像素上实现完整的 $ 2 \times 2 $ 偏振变换矩阵
2. **相位协同设计**：几何相位（旋转）与传输相位（尺寸）联合调控五自由度
3. **逆向设计框架**：伴随法驱动的梯度优化实现大规模超表面单元自动设计
4. **多维复用**：偏振、OAM、波长等多自由度组合实现指数级信息容量提升

随着可调超表面材料和动态重构技术的成熟，矢量全息正加速从实验室走向实际应用——光学安全、AR/VR显示、光通信等领域都将受益于这一技术的持续突破。


![超表面矢量全息技术示意图（由 AI 基于主题生成）](/images/external/2026-07-18-metasurface-超表面矢量全息技术_diagram.png)

*图：超表面矢量全息技术示意图（由 AI 基于主题生成）*
