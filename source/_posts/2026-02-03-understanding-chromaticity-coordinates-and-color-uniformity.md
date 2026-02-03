---
title: 深度解析：色坐标的物理本质与色彩不均匀度的 MATLAB 算法实现
date: 2026-02-03 10:00:00
tags: [Color Science, MATLAB, Optics, Algorithm, VESA Standard]
categories: [Engineering, Colorimetry]
description: 本文从光谱功率分布出发，推导 CIE 色坐标系统的数学构建，深入探讨色彩不均匀度（Color Non-uniformity）的计算原理，并提供完整的 MATLAB 实现代码。
mathjax: true
---

## 引言：从物理光子到心理感知

在显示技术（Display Technology）与固态照明（SSL）领域，我们面临的一个核心哲学与工程问题是：**如何用数字量化主观的色彩感知？**

光本质上是电磁波，由光谱功率分布（Spectral Power Distribution, SPD）描述。然而，人类并非光谱仪。我们的视觉系统通过视网膜上的三种视锥细胞（L, M, S）将无限维度的光谱信息“压缩”为三维信号。

本文将解析这一压缩过程如何诞生了“色坐标”，并进一步探讨如何利用数学工具量化显示设备的缺陷——**色彩不均匀度**。

---

## 一、 色坐标的第一性原理

### 1.1 三刺激值：感知的基石

1931年，国际照明委员会（CIE）基于大量配色实验，定义了标准观察者函数 $\bar{x}(\lambda), \bar{y}(\lambda), \bar{z}(\lambda)$。对于任意光源的光谱 $P(\lambda)$，其三刺激值 $X, Y, Z$ 由下式给出：

$$
\begin{cases}
X = k \int_{380}^{780} P(\lambda) \bar{x}(\lambda) d\lambda \\
Y = k \int_{380}^{780} P(\lambda) \bar{y}(\lambda) d\lambda \\
Z = k \int_{380}^{780} P(\lambda) \bar{z}(\lambda) d\lambda
\end{cases}
$$

这里，物理世界的光谱能量通过积分变换，映射到了心理物理学的 $XYZ$ 空间。

### 1.2 降维与投影：从 CIE 1931 xy 到 CIE 1976 u'v'

为了将“色度”（Chromaticity）与“亮度”（Luminance, $Y$）分离，我们在 $X+Y+Z=1$ 的平面上进行投影，得到了经典的 **CIE 1931 xy 色坐标**：

$$x = \frac{X}{X+Y+Z}, \quad y = \frac{Y}{X+Y+Z}$$

!

然而，CIE 1931 存在一个著名的拓扑缺陷：**视觉感知的不均匀性**。在图中绿色区域移动 $0.01$ 的距离，人眼可能察觉不到变化；而在蓝色区域移动同样的距离，色差却极其明显。这由麦克亚当椭圆（MacAdam Ellipses）所证实。

为了解决此问题，工业界引入了 **CIE 1976 UCS (Uniform Chromaticity Scale)** 系统。通过射影变换，将 $xy$ 空间拉伸为更符合人眼感知的 $u'v'$ 空间：

$$
\begin{align}
u' &= \frac{4X}{X + 15Y + 3Z} = \frac{4x}{-2x + 12y + 3} \\
v' &= \frac{9Y}{X + 15Y + 3Z} = \frac{9y}{-2x + 12y + 3}
\end{align}
$$

**关键点：** 在计算色彩不均匀度时，必须使用 $u'v'$ 坐标系统，而非 $xy$ 系统，否则计算出的“距离”无法真实反映人眼的差异感受。

---

## 二、 色彩不均匀度的定义与计算

色彩不均匀度（Color Non-uniformity）通常指显示面板或照明阵列在不同空间位置上的色度漂移量。

### 2.1 欧几里得距离 ($\Delta u'v'$)

这是最基础且最通用的度量方式。假设面板中心点的色坐标为 $(u'_c, v'_c)$，任意测试点 $i$ 的色坐标为 $(u'_i, v'_i)$，则该点的色偏差为：

$$ \Delta u'v'_i = \sqrt{(u'_i - u'_c)^2 + (v'_i - v'_c)^2} $$

### 2.2 VESA FPDM 标准

在平板显示测量标准（FPDM）中，通常采用 9 点法或 13 点法。色彩不均匀度通常定义为所有采样点相对于参考点（通常是中心点或平均值）的最大色差：

$$ NonUniformity = \max_{i} (\Delta u'v'_i) $$

对于高阶应用，我们还需要考量 **JND (Just Noticeable Difference)**，通常 $\Delta u'v' < 0.004$ 被认为是人眼可接受的商业标准，而专业级显示器要求 $\Delta u'v' < 0.002$。

---

## 三、 MATLAB 代码实现

以下 MATLAB 代码模拟了一个 9 点测量的场景。它实现了从 $XYZ$ 到 $u'v'$ 的转换，计算色彩不均匀度，并可视化结果。

### 3.1 核心算法脚本

```matlab
function color_uniformity_analysis()
    % color_uniformity_analysis
    % 模拟显示面板的色彩不均匀度计算 (CIE 1976 u'v' Space)
    %
    % Output: 
    %   Visualizes the chromaticity diagram and sample points.
    %   Prints the max delta u'v'.
    
    clc; clear; close all;

    %% 1. 定义模拟数据 (Simulated Measurement Data)
    % 假设这是从 Minolta CA-410 或类似仪器读取的 9 个点的 XYZ 数据
    % 数据格式: [X, Y, Z]
    % 模拟一个稍微偏蓝且不均匀的屏幕
    measurements_XYZ = [
        95.0, 100.0, 108.0;  % Point 1 (Top-Left)
        96.2, 100.0, 109.5;  % Point 2 (Top-Center)
        94.8, 100.0, 107.8;  % Point 3 (Top-Right)
        95.5, 100.0, 108.2;  % Point 4 (Mid-Left)
        96.0, 100.0, 108.9;  % Point 5 (Center - Reference)
        95.3, 100.0, 107.5;  % Point 6 (Mid-Right)
        94.5, 100.0, 110.0;  % Point 7 (Bottom-Left)
        95.8, 100.0, 109.2;  % Point 8 (Bottom-Center)
        95.1, 100.0, 108.5   % Point 9 (Bottom-Right)
    ];

    %% 2. 坐标转换: XYZ -> u'v'
    % 调用内部函数进行转换
    uv_coords = xyz2uv(measurements_XYZ);
    
    u_prime = uv_coords(:, 1);
    v_prime = uv_coords(:, 2);

    %% 3. 计算色彩不均匀度 (Calculation)
    % 策略: 计算所有点相对于中心点 (Point 5) 的欧氏距离
    center_idx = 5; 
    ref_u = u_prime(center_idx);
    ref_v = v_prime(center_idx);
    
    % 初始化距离数组
    num_points = size(measurements_XYZ, 1);
    delta_uv = zeros(num_points, 1);
    
    for i = 1:num_points
        du = u_prime(i) - ref_u;
        dv = v_prime(i) - ref_v;
        delta_uv(i) = sqrt(du^2 + dv^2);
    end
    
    [max_delta, max_idx] = max(delta_uv);
    mean_delta = mean(delta_uv);

    %% 4. 结果输出
    fprintf('=== 色彩不均匀度分析报告 ===\n');
    fprintf('参考点 (Center): u''=%.4f, v''=%.4f\n', ref_u, ref_v);
    fprintf('最大色差 (Max Delta u''v''): %.5f (at Point %d)\n', max_delta, max_idx);
    fprintf('平均色差 (Mean Delta u''v''): %.5f\n', mean_delta);
    
    if max_delta > 0.004
        fprintf('判定结果: Fail (超过一般人眼识别阈值 0.004)\n');
    else
        fprintf('判定结果: Pass\n');
    end

    %% 5. 可视化 (Visualization)
    figure('Color', 'w', 'Name', 'Color Uniformity Plot');
    hold on; grid on; axis equal;
    
    % 绘制 CIE 1976 图的局部范围 (为了看清细微差别，我们放大显示)
    padding = 0.01;
    xlim([min(u_prime)-padding, max(u_prime)+padding]);
    ylim([min(v_prime)-padding, max(v_prime)+padding]);
    
    % 绘制散点
    scatter(u_prime, v_prime, 100, delta_uv, 'filled', 'MarkerEdgeColor', 'k');
    colormap('jet');
    c = colorbar;
    c.Label.String = '\Delta u''v'' from Center';
    
    % 标记中心点
    plot(ref_u, ref_v, 'r+', 'MarkerSize', 15, 'LineWidth', 2);
    text(ref_u, ref_v, '  Center', 'FontSize', 10);
    
    % 标记最差点
    text(u_prime(max_idx), v_prime(max_idx), sprintf('  Max Diff: %.4f', max_delta), ...
        'Color', 'red', 'FontWeight', 'bold');

    title('Panel Color Uniformity (CIE 1976 u''v'')');
    xlabel('u''');
    ylabel('v''');
    
    hold off;
end

function uv = xyz2uv(XYZ)
    % xyz2uv Converts XYZ tristimulus values to CIE 1976 u'v' coordinates.
    % formula:
    % u' = 4X / (X + 15Y + 3Z)
    % v' = 9Y / (X + 15Y + 3Z)
    
    X = XYZ(:, 1);
    Y = XYZ(:, 2);
    Z = XYZ(:, 3);
    
    denominator = X + 15*Y + 3*Z;
    
    u = (4 * X) ./ denominator;
    v = (9 * Y) ./ denominator;
    
    uv = [u, v];
end
```

### 3.2 代码解析

1.  **数据输入与结构化**：代码首先模拟了 9 个测试点的 XYZ 三刺激值。在实际生产线中，这些数据通常通过 API 直接从色度计（Colorimeter）读取。
2.  **非线性变换**：`xyz2uv` 函数严格遵循 CIE 1976 公式。注意这里的矩阵运算采用了向量化处理（Vectorization），这是 MATLAB 高效运算的核心。
3.  **度量逻辑**：我们选择了“中心点”作为 Reference。在某些严格的汽车或医疗显示标准中，可能会计算任意两点间的最大差值（Max Pairwise Difference）。
4.  **可视化**：由于色彩不均匀度通常是微小量（$10^{-3}$ 数量级），直接画在全色域图上会挤成一点。因此代码自动调整了坐标轴范围（Zoom-in），并用颜色映射（Heatmap）来直观展示偏差程度。

---

## 四、 深入讨论：数值背后的工业意义

### 4.1 为什么 $\Delta u'v'$ 优于 $\Delta xy$？

虽然 $\Delta xy$ 计算简单，但它不具备**感知相关性**。在 $xy$ 图中，绿色区域的大距离位移可能人眼无法察觉，而蓝色区域的微小位移却显而易见。工业界若使用 $\Delta xy$ 作为良率标准，会导致“假阳性”或“假阴性”判定，直接造成经济损失。

### 4.2 Murmura 与 Just Noticeable Difference (JND)

虽然 $\Delta u'v'$ 是目前的黄金标准，但学术界正在转向更高级的度量，如 $\Delta E_{00}$ (CIEDE2000)。这需要将数据进一步转换到 $L^*a^*b^*$ 空间。然而，由于 $\Delta u'v'$ 计算的高效性和直观性，它依然是面板厂（Panel Maker）与品牌厂（OEM）之间签署规格书（Spec）的首选语言。

---

## 结语

色坐标不仅是数学游戏，它是连接物理光学与人类感知的桥梁。通过 MATLAB 我们可以精确地模拟这一过程，将抽象的“不均匀”转化为可控的工程指标。

希望这篇文章能帮你建立起对色彩度量的数理直觉。

