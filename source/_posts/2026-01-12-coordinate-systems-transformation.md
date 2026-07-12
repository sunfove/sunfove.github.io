---
title: 空间几何的基石：直角、柱、球坐标系的原理与转换详解
date: 2026-01-12 16:00:00
tags: [数学, 几何, Python, 坐标变换, 算法]
categories: 算法与数学
mathjax: true
excerpt: 为什么麦克斯韦方程组在球坐标下解起来更简单？为什么光纤分析要用柱坐标？本文详解直角坐标 (Cartesian)、柱坐标 (Cylindrical) 和球坐标 (Spherical) 的定义、转换公式及 Python 实现代码。
---

在解决物理和工程问题时，**“选择比努力更重要”**。
选择一个合适的坐标系，往往能把一个复杂的偏微分方程变成简单的代数方程。

* **方方正正的物体**（如芯片、房间）：用**直角坐标**。
* **轴对称的物体**（如光纤、波导、同轴电缆）：用**柱坐标**。
* **中心对称的物体**（如原子、行星、点波源）：用**球坐标**。

本文将总结这三者之间的转换关系，并附带 Python 代码实现。

---

## 01. 直角坐标系 (Cartesian Coordinates)

这是我们最熟悉的“出厂设置”。

* **定义**：通过三条互相垂直的轴 $(x, y, z)$ 来定位空间中的一点。
* **基矢量**：$\hat{x}, \hat{y}, \hat{z}$ (或 $\vec{i}, \vec{j}, \vec{k}$)。
* **微元体积**：$dV = dx dy dz$。

---

## 02. 柱坐标系 (Cylindrical Coordinates)

想象你把一张二维的极坐标图，沿着 z 轴拉长成一根管子。

### 2.1 定义
由三个参数 $(\rho, \phi, z)$ 构成：
* **$\rho$ (径向距离)**：点到 **z 轴** 的垂直距离 ($\rho \ge 0$)。
* **$\phi$ (方位角)**：点在 xy 平面上的投影与 x 轴的夹角 ($0 \le \phi < 2\pi$)。
* **$z$ (高度)**：与直角坐标的 z 完全一样。

### 2.2 转换公式

**从 柱坐标 $(\rho, \phi, z)$ $\to$ 直角坐标 $(x, y, z)$：**
$$
\begin{cases}
x = \rho \cos\phi \\
y = \rho \sin\phi \\
z = z
\end{cases}
$$

**从 直角坐标 $(x, y, z)$ $\to$ 柱坐标 $(\rho, \phi, z)$：**
$$
\begin{cases}
\rho = \sqrt{x^2 + y^2} \\
\phi = \arctan(\frac{y}{x}) \\
z = z
\end{cases}
$$
*注意：计算 $\phi$ 时通常使用 `atan2(y, x)` 函数以区分象限。*

* **微元体积**：$dV = \rho d\rho d\phi dz$ (注意多了一个雅可比因子 $\rho$)。



[Image of Cylindrical coordinate system diagram]


---

## 03. 球坐标系 (Spherical Coordinates)

这是处理球对称问题（如氢原子波函数）的神器。
*注意：数学界和物理/工程界对符号的定义常有不同，本文采用**ISO 标准/物理学通用定义**。*

### 3.1 定义
由三个参数 $(r, \theta, \phi)$ 构成：
* **$r$ (径向距离)**：点到 **原点** 的距离 ($r \ge 0$)。
* **$\theta$ (极角/天顶角)**：点与 **z 轴正方向** 的夹角 ($0 \le \theta \le \pi$)。
* **$\phi$ (方位角)**：点在 xy 平面上的投影与 x 轴的夹角 ($0 \le \phi < 2\pi$)。这与柱坐标的 $\phi$ 是一样的。

### 3.2 转换公式

**从 球坐标 $(r, \theta, \phi)$ $\to$ 直角坐标 $(x, y, z)$：**
$$
\begin{cases}
x = r \sin\theta \cos\phi \\
y = r \sin\theta \sin\phi \\
z = r \cos\theta
\end{cases}
$$

**从 直角坐标 $(x, y, z)$ $\to$ 球坐标 $(r, \theta, \phi)$：**
$$
\begin{cases}
r = \sqrt{x^2 + y^2 + z^2} \\
\theta = \arccos(\frac{z}{r}) \\
\phi = \arctan(\frac{y}{x})
\end{cases}
$$

* **微元体积**：$dV = r^2 \sin\theta dr d\theta d\phi$ (注意雅可比因子是 $r^2 \sin\theta$)。



[Image of Spherical coordinate system diagram]


---

## 04. Python 代码实战

在实际计算中（特别是涉及大量数据点时），我们强烈建议使用 `numpy`，因为它能自动处理数组运算，并且 `arctan2` 函数能完美解决分母为 0 和象限判断的问题。

```python
import numpy as np

class CoordTransform:
    """
    空间坐标系转换工具类
    支持单点或 Numpy 数组的批量转换
    """
    
    @staticmethod
    def cartesian_to_cylindrical(x, y, z):
        """直角 (x,y,z) -> 柱 (rho, phi, z)"""
        rho = np.sqrt(x**2 + y**2)
        phi = np.arctan2(y, x) % (2 * np.pi) # 归一化到 [0, 2pi]
        return rho, phi, z

    @staticmethod
    def cylindrical_to_cartesian(rho, phi, z):
        """柱 (rho, phi, z) -> 直角 (x,y,z)"""
        x = rho * np.cos(phi)
        y = rho * np.sin(phi)
        return x, y, z

    @staticmethod
    def cartesian_to_spherical(x, y, z):
        """直角 (x,y,z) -> 球 (r, theta, phi)"""
        r = np.sqrt(x**2 + y**2 + z**2)
        # 防止 r=0 导致除零错误
        theta = np.zeros_like(r)
        mask = r > 0
        if isinstance(r, np.ndarray):
            theta[mask] = np.arccos(z[mask] / r[mask])
        elif r > 0:
            theta = np.arccos(z / r)
            
        phi = np.arctan2(y, x) % (2 * np.pi)
        return r, theta, phi

    @staticmethod
    def spherical_to_cartesian(r, theta, phi):
        """球 (r, theta, phi) -> 直角 (x,y,z)"""
        x = r * np.sin(theta) * np.cos(phi)
        y = r * np.sin(theta) * np.sin(phi)
        z = r * np.cos(theta)
        return x, y, z

# --- 测试案例 ---
if __name__ == "__main__":
    # 定义一个直角坐标点: (1, 1, 1)
    x, y, z = 1.0, 1.0, 1.0
    print(f"原始直角坐标: ({x}, {y}, {z})")

    # 1. 转柱坐标
    rho, phi, z_cyl = CoordTransform.cartesian_to_cylindrical(x, y, z)
    print(f"柱坐标: rho={rho:.2f}, phi={np.degrees(phi):.2f}°, z={z_cyl}")

    # 2. 转球坐标
    r, theta, phi_sph = CoordTransform.cartesian_to_spherical(x, y, z)
    print(f"球坐标: r={r:.2f}, theta={np.degrees(theta):.2f}°, phi={np.degrees(phi_sph):.2f}°")

    # 3. 验证还原
    x_new, y_new, z_new = CoordTransform.spherical_to_cartesian(r, theta, phi_sph)
    print(f"还原直角坐标: ({x_new:.2f}, {y_new:.2f}, {z_new:.2f})")