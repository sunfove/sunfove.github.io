---
title: 自适应光学的算法实现：从波前感知到实时校正
date: 2026-04-09 11:30:00
categories: 光学工程
tags:
  - 自适应光学
  - 波前传感器
  - 实时控制
  - 图像处理
description: 深入分析自适应光学系统的算法实现，包括波前感知、控制算法和校正执行。本文提供完整的数学推导和Python实现，涵盖从传统算法到机器学习方法。
mathjax: true
---

## 引言

天文望远镜受限于大气湍流，其分辨率受限于"Seeing"（视宁度）而非衍射极限。自适应光学（Adaptive Optics, AO）通过实时测量和校正大气湍流引起的光波前畸变，使地基望远镜达到接近衍射极限的成像质量。

本文将从第一性原理出发，系统性地分析自适应光学系统的算法实现，从波前感知、控制算法到校正执行，涵盖传统方法和机器学习的最新进展。

## 1. 大气湍流与波前畸变

### 1.1 大气折射率涨落

大气折射率 $n$ 随温度、压力和湿度的变化而变化：

$$n - 1 = \frac{77.6 \times 10^{-6}}{T} \left(P + \frac{4810 e}{T}\right)$$

其中 $T$ 是温度（K），$P$ 是压力（hPa），$e$ 是水汽压（hPa）。

### 1.2 Kolmogorov湍流模型

Kolmogorov 建立了大气湍流的统计模型，描述折射率涨落的结构函数：

$$D_n(r) = \langle [n(\mathbf{x} + \mathbf{r}) - n(\mathbf{x})]^2 \rangle = C_n^2 r^{2/3}$$

其中 $C_n^2$ 是折射率结构常数，$r$ 是空间间距。

### 1.3 波前相位的结构函数

波前相位 $\phi(\mathbf{x})$ 的结构函数为：

$$D_\phi(r) = \langle [\phi(\mathbf{x} + \mathbf{r}) - \phi(\mathbf{x})]^2 \rangle = 6.88 \left(\frac{r}{r_0}\right)^{5/3}$$

其中 $r_0$ 是**Fried参数**，定义为：

$$r_0 = \left[0.423 k^2 \int_0^\infty C_n^2(z) dz\right]^{-3/5}$$

其中 $k = 2\pi/\lambda$ 是波数，$z$ 是光程高度。

### 1.4 Zernike多项式展开

波前畸变可以用Zernike多项式展开：

$$\phi(\rho, \theta) = \sum_{j=1}^\infty a_j Z_j(\rho, \theta)$$

其中 $a_j$ 是Zernike系数，$Z_j(\rho, \theta)$ 是Zernike多项式。

**前几项Zernike多项式**：
- $Z_1 = 1$：Piston（平移）
- $Z_2 = 2\rho\cos\theta$：Tip（倾斜）
- $Z_3 = 2\rho\sin\theta$：Tilt（倾斜）
- $Z_4 = \sqrt{3}(2\rho^2 - 1)$：Defocus（离焦）
- $Z_5 = \sqrt{6}\rho^2\sin 2\theta$：Astigmatism（像散）

```python
import numpy as np
import matplotlib.pyplot as plt
from typing import Tuple, List
import scipy.special as sp

class ZernikePolynomials:
    """
    Zernike多项式的实现

    用于描述和分析波前畸变
    """

    def __init__(self, order: int = 10):
        """
        参数:
            order: Zernike多项式的最高阶数
        """
        self.order = order

    def zernike(self, n: int, m: int, rho: np.ndarray, theta: np.ndarray) -> np.ndarray:
        """
        计算Zernike多项式 Z_n^m(ρ, θ)

        参数:
            n: 径向阶数
            m: 角向阶数
            rho: 归一化径向坐标 [0, 1]
            theta: 角度坐标 [0, 2π]

        返回:
            Zernike多项式的值
        """
        # 径向多项式
        if (n - m) % 2 != 0:
            return np.zeros_like(rho)

        R = np.zeros_like(rho)
        for s in range(0, (n - m) // 2 + 1):
            coeff = ((-1) ** s * sp.factorial(n - s) /
                    (sp.factorial(s) * sp.factorial((n + m) // 2 - s) *
                     sp.factorial((n - m) // 2 - s)))
            R += coeff * rho ** (n - 2 * s)

        # 角向部分
        if m >= 0:
            angular = np.cos(m * theta)
        else:
            angular = np.sin(-m * theta)

        return R * angular

    def noll_index_to_nm(self, j: int) -> Tuple[int, int]:
        """
        将Noll索引转换为(n, m)对

        参数:
            j: Noll索引（从1开始）

        返回:
            (n, m) 径向和角向阶数
        """
        n = int(np.ceil((np.sqrt(8 * j - 7) - 1) / 2))
        m = ((2 * n + 1) * (n - 2) // 2 + j) % 2 * (n // 2)
        m = m if (n - m) % 2 == 0 else m + 1

        # 调整符号
        if j % 2 == 0:
            m = -m

        return n, abs(m)

    def generate_wavefront(self, coefficients: List[float],
                        size: int = 64) -> np.ndarray:
        """
        根据Zernike系数生成波前

        参数:
            coefficients: Zernike系数列表 [a_1, a_2, ..., a_N]
            size: 网格大小

        返回:
            波前相位图
        """
        x = np.linspace(-1, 1, size)
        y = np.linspace(-1, 1, size)
        X, Y = np.meshgrid(x, y)

        # 转换为极坐标
        Rho = np.sqrt(X**2 + Y**2)
        Theta = np.arctan2(Y, X)

        # 构造圆孔径
        mask = Rho <= 1

        # 叠加Zernike多项式
        wavefront = np.zeros_like(Rho)
        for j, coeff in enumerate(coefficients, start=1):
            if j <= len(coefficients):
                n, m = self.noll_index_to_nm(j)
                zernike_val = self.zernike(n, m, Rho, Theta)
                wavefront += coeff * zernike_val

        return wavefront * mask

    def plot_wavefront(self, coefficients: List[float],
                     size: int = 64, title: str = "Wavefront"):
        """
        绘制波前

        参数:
            coefficients: Zernike系数列表
            size: 网格大小
            title: 图像标题
        """
        wavefront = self.generate_wavefront(coefficients, size)

        plt.figure(figsize=(10, 8))

        # 3D表面图
        ax1 = plt.subplot(2, 2, 1, projection='3d')
        x = np.linspace(-1, 1, size)
        y = np.linspace(-1, 1, size)
        X, Y = np.meshgrid(x, y)
        surf = ax1.plot_surface(X, Y, wavefront, cmap='viridis')
        ax1.set_title('3D Wavefront')
        ax1.set_xlabel('x')
        ax1.set_ylabel('y')
        ax1.set_zlabel('Phase (radians)')
        plt.colorbar(surf, ax=ax1, shrink=0.5)

        # 2D热力图
        ax2 = plt.subplot(2, 2, 2)
        im = ax2.imshow(wavefront, extent=[-1, 1, -1, 1],
                       cmap='viridis', origin='lower')
        ax2.set_title('2D Wavefront')
        ax2.set_xlabel('x')
        ax2.set_ylabel('y')
        plt.colorbar(im, ax=ax2)

        # Zernike系数柱状图
        ax3 = plt.subplot(2, 1, 2)
        indices = range(1, len(coefficients) + 1)
        ax3.bar(indices, coefficients)
        ax3.set_title('Zernike Coefficients')
        ax3.set_xlabel('Noll Index')
        ax3.set_ylabel('Coefficient (radians)')
        ax3.grid(True, alpha=0.3)

        plt.suptitle(title, fontsize=14)
        plt.tight_layout()
        return wavefront


# 测试代码
if __name__ == "__main__":
    print("=" * 60)
    print("Zernike多项式测试")
    print("=" * 60)

    zernike = ZernikePolynomials(order=5)

    # 测试不同的波前畸变
    test_cases = [
        {
            "name": "Tip-Tilt (倾斜)",
            "coefficients": [0, 0.5, 0.3, 0, 0, 0]
        },
        {
            "name": "Defocus (离焦)",
            "coefficients": [0, 0, 0, 1.0, 0, 0]
        },
        {
            "name": "Astigmatism (像散)",
            "coefficients": [0, 0, 0, 0, 0.5, 0.3]
        },
        {
            "name": "Coma (彗差)",
            "coefficients": [0, 0, 0, 0, 0, 0, 0.7, 0.5, 0, 0]
        }
    ]

    for case in test_cases:
        print(f"\n{case['name']}")
        print(f"Zernike系数: {case['coefficients']}")

        wavefront = zernike.plot_wavefront(
            case['coefficients'],
            title=case['name']
        )

        filename = case['name'].replace(' ', '_').replace('(', '').replace(')', '')
        plt.savefig(f'zernike_{filename}.png', dpi=150, bbox_inches='tight')
        plt.show()
```

## 2. 波前传感器

### 2.1 Shack-Hartmann传感器

Shack-Hartmann传感器由微透镜阵列和探测器组成，测量波前的局部斜率。

**工作原理**：
1. 微透镜阵列将入射波前分割成多个子孔径
2. 每个子孔径聚焦在探测器上形成光斑
3. 测量光斑相对于参考位置的偏移
4. 通过偏移量计算局部波前斜率

**数学描述**：
第$i$个子孔径的光斑偏移为：

$$\Delta x_i = \frac{f}{k} \frac{\partial \phi}{\partial x}\Bigg|_i, \quad \Delta y_i = \frac{f}{k} \frac{\partial \phi}{\partial y}\Bigg|_i$$

其中 $f$ 是微透镜焦距，$k = 2\pi/\lambda$ 是波数。

### 2.2 曲率传感器

曲率传感器测量波前的拉普拉斯算子（二阶导数）：

$$\nabla^2 \phi = \frac{\partial^2 \phi}{\partial x^2} + \frac{\partial^2 \phi}{\partial y^2}$$

通过测量焦前和焦后的强度差来推算曲率。

### 2.3 波前重构

从斜率或曲率测量重构波前，求解线性方程组：

$$\mathbf{A}\mathbf{a} = \mathbf{s}$$

其中 $\mathbf{A}$ 是重构矩阵，$\mathbf{a}$ 是Zernike系数向量，$\mathbf{s}$ 是测量数据（斜率或曲率）。

**最小二乘解**：
$$\mathbf{a} = (\mathbf{A}^T \mathbf{A})^{-1} \mathbf{A}^T \mathbf{s}$$

```python
import numpy as np
from typing import Tuple
import matplotlib.pyplot as plt

class WavefrontReconstruction:
    """
    波前重构算法的实现

    从斜率或曲率测量重构波前
    """

    def __init__(self, num_subapertures: Tuple[int, int],
                 zernike_order: int = 10):
        """
        参数:
            num_subapertures: (Nx, Ny) 子孔径数量
            zernike_order: Zernike多项式的最高阶数
        """
        self.Nx, self.Ny = num_subapertures
        self.zernike_order = zernike_order
        self.num_measurements = 2 * self.Nx * self.Ny  # x和y斜率

        # 计算重构矩阵
        self.reconstruction_matrix = self._compute_reconstruction_matrix()

    def _compute_reconstruction_matrix(self) -> np.ndarray:
        """
        计算重构矩阵 A

        A_{i,j} = ∂Z_j/∂x 或 ∂Z_j/∂y 在第i个子孔径中心的值
        """
        from scipy.special import factorial

        num_zernike = self.zernike_order * (self.zernike_order + 1) // 2
        A = np.zeros((self.num_measurements, num_zernike))

        # 子孔径中心坐标
        x_centers = np.linspace(-1, 1, self.Nx)
        y_centers = np.linspace(-1, 1, self.Ny)

        measurement_idx = 0
        for i in range(self.Nx):
            for j in range(self.Ny):
                # 只在圆孔径内的子孔径
                if x_centers[i]**2 + y_centers[j]**2 <= 1:
                    rho = np.sqrt(x_centers[i]**2 + y_centers[j]**2)
                    theta = np.arctan2(y_centers[j], x_centers[i])

                    # 计算每个Zernike多项式的x和y导数
                    zernike_idx = 0
                    for n in range(1, self.zernike_order + 1):
                        for m in range(0, n + 1):
                            if (n - m) % 2 == 0:
                                # 计算径向导数
                                dR_drho = 0
                                for s in range(0, (n - m) // 2 + 1):
                                    coeff = ((-1) ** s * factorial(n - s) /
                                            (factorial(s) *
                                             factorial((n + m) // 2 - s) *
                                             factorial((n - m) // 2 - s)))
                                    dR_drho += coeff * (n - 2 * s) * rho ** (n - 2 * s - 1)

                                # 转换为直角坐标导数
                                dR_dx = dR_drho * (x_centers[i] / (rho + 1e-10))
                                dR_dy = dR_drho * (y_centers[j] / (rho + 1e-10))

                                # x斜率
                                A[measurement_idx, zernike_idx] = dR_dx
                                measurement_idx += 1

                                # y斜率
                                A[measurement_idx, zernike_idx] = dR_dy
                                measurement_idx += 1

                                zernike_idx += 1

        return A

    def reconstruct_from_slopes(self, slope_x: np.ndarray,
                              slope_y: np.ndarray) -> np.ndarray:
        """
        从斜率测量重构波前

        参数:
            slope_x: x方向斜率测量 [Nx, Ny]
            slope_y: y方向斜率测量 [Nx, Ny]

        返回:
            Zernike系数
        """
        # 展平斜率测量
        s = np.concatenate([slope_x.flatten(), slope_y.flatten()])

        # 最小二乘解
        A = self.reconstruction_matrix
        coefficients = np.linalg.lstsq(A, s, rcond=None)[0]

        return coefficients

    def simulate_shack_hartmann(self, wavefront: np.ndarray,
                                focal_length: float = 1.0,
                                wavelength: float = 1e-6) -> Tuple[np.ndarray, np.ndarray]:
        """
        模拟Shack-Hartmann传感器的测量

        参数:
            wavefront: 波前相位图
            focal_length: 微透镜焦距
            wavelength: 波长

        返回:
            (slope_x, slope_y) x和y方向斜率
        """
        # 数值计算梯度
        dy, dx = np.gradient(wavefront)

        # 转换为斜率
        k = 2 * np.pi / wavelength
        slope_x = (focal_length / k) * dx
        slope_y = (focal_length / k) * dy

        return slope_x, slope_y


# 测试代码
if __name__ == "__main__":
    print("=" * 60)
    print("波前重构测试")
    print("=" * 60)

    # 创建重构器
    reconstructor = WavefrontReconstruction(num_subapertures=(8, 8),
                                         zernike_order=6)

    # 创建Zernike多项式生成器
    from zernike_polynomials import ZernikePolynomials
    zernike = ZernikePolynomials(order=6)

    # 生成测试波前
    true_coefficients = [0, 0.5, 0.3, 0.8, 0.4, 0.2, 0.6, 0.1]
    true_wavefront = zernike.generate_wavefront(true_coefficients, size=64)

    print(f"\n真实Zernike系数: {true_coefficients}")

    # 模拟Shack-Hartmann测量
    reconstructor_sim = WavefrontReconstruction(num_subapertures=(8, 8))
    slope_x, slope_y = reconstructor_sim.simulate_shack_hartmann(true_wavefront)

    # 重构波前
    reconstructed_coefficients = reconstructor.reconstruct_from_slopes(slope_x, slope_y)

    print(f"重构Zernike系数: {reconstructed_coefficients}")

    # 比较结果
    reconstructed_wavefront = zernike.generate_wavefront(
        reconstructed_coefficients, size=64
    )

    # 绘制结果
    plt.figure(figsize=(15, 5))

    plt.subplot(1, 3, 1)
    plt.imshow(true_wavefront, extent=[-1, 1, -1, 1],
               cmap='viridis', origin='lower')
    plt.title('True Wavefront')
    plt.xlabel('x')
    plt.ylabel('y')
    plt.colorbar(label='Phase (rad)')

    plt.subplot(1, 3, 2)
    plt.imshow(reconstructed_wavefront, extent=[-1, 1, -1, 1],
               cmap='viridis', origin='lower')
    plt.title('Reconstructed Wavefront')
    plt.xlabel('x')
    plt.ylabel('y')
    plt.colorbar(label='Phase (rad)')

    plt.subplot(1, 3, 3)
    residual = true_wavefront - reconstructed_wavefront
    plt.imshow(residual, extent=[-1, 1, -1, 1],
               cmap='RdBu', origin='lower')
    plt.title('Residual')
    plt.xlabel('x')
    plt.ylabel('y')
    plt.colorbar(label='Phase (rad)')

    plt.tight_layout()
    plt.savefig('wavefront_reconstruction.png', dpi=150, bbox_inches='tight')
    plt.show()

    # 计算重构误差
    rms_error = np.sqrt(np.mean(residual**2))
    print(f"\n重构RMS误差: {rms_error:.6f} rad")
```

## 3. 控制算法

### 3.1 积分控制器

最简单的AO控制器是积分控制器：

$$a_j[k+1] = a_j[k] + g_j e_j[k]$$

其中 $a_j$ 是第 $j$ 个Zernike模式的控制信号，$e_j$ 是对应的误差信号，$g_j$ 是积分增益。

### 3.2 PI控制器

比例-积分（PI）控制器：

$$a_j[k+1] = a_j[k] + g_P e_j[k] + g_I \sum_{i=0}^{k} e_j[i]$$

其中 $g_P$ 是比例增益，$g_I$ 是积分增益。

### 3.3 最优控制

最优控制方法（如LQG控制）考虑噪声特性：

$$\mathbf{a}[k+1] = \mathbf{A}\mathbf{a}[k] + \mathbf{B}\mathbf{e}[k]$$

其中 $\mathbf{A}$ 和 $\mathbf{B}$ 通过求解Riccati方程得到。

```python
import numpy as np
from typing import List, Tuple
import matplotlib.pyplot as plt

class AOController:
    """
    自适应光学控制器

    实现多种控制算法
    """

    def __init__(self, num_modes: int):
        """
        参数:
            num_modes: 控制的Zernike模式数
        """
        self.num_modes = num_modes

    def integral_controller(self, error_signal: np.ndarray,
                         gain: float = 0.1) -> np.ndarray:
        """
        积分控制器

        参数:
            error_signal: 误差信号 [num_modes]
            gain: 积分增益

        返回:
            控制信号增量
        """
        return gain * error_signal

    def pi_controller(self, error_signal: np.ndarray,
                     integral_error: np.ndarray,
                     proportional_gain: float = 0.05,
                     integral_gain: float = 0.1) -> Tuple[np.ndarray, np.ndarray]:
        """
        比例-积分控制器

        参数:
            error_signal: 误差信号 [num_modes]
            integral_error: 积分误差 [num_modes]
            proportional_gain: 比例增益
            integral_gain: 积分增益

        返回:
            (control_signal, new_integral_error)
        """
        # 比例项
        p_term = proportional_gain * error_signal

        # 积分项
        new_integral_error = integral_error + error_signal
        i_term = integral_gain * new_integral_error

        # 总控制信号
        control_signal = p_term + i_term

        return control_signal, new_integral_error

    def lqg_controller(self, state: np.ndarray,
                       measurement: np.ndarray) -> np.ndarray:
        """
        线性二次高斯控制器

        参数:
            state: 系统状态
            measurement: 测量数据

        返回:
            控制信号

        注意：这里提供框架，实际需要完整的LQG设计
        """
        # LQG控制器需要预先计算的增益矩阵
        # K = LQR解，L = 卡尔曼增益
        # control = -K * estimated_state

        # 简化实现
        control = -0.1 * state

        return control


class AOSimulation:
    """
    自适应光学系统的仿真
    """

    def __init__(self, num_modes: int = 10,
                 subapertures: Tuple[int, int] = (8, 8)):
        """
        参数:
            num_modes: Zernike模式数
            subapertures: 子孔径数量 (Nx, Ny)
        """
        self.num_modes = num_modes
        self.num_subapertures = subapertures

        # 初始化组件
        from zernike_polynomials import ZernikePolynomials
        from wavefront_reconstruction import WavefrontReconstruction

        self.zernike = ZernikePolynomials(order=num_modes)
        self.reconstructor = WavefrontReconstruction(subapertures, num_modes)
        self.controller = AOController(num_modes)

    def generate_atmospheric_phase(self, r0: float = 0.1,
                                 size: int = 64) -> np.ndarray:
        """
        生成大气湍流相位屏

        参数:
            r0: Fried参数（m）
            size: 相位屏尺寸

        返回:
            相位屏
        """
        # 使用Kolmogorov模型生成相位屏
        # 这里使用简化的功率谱方法

        # 空间频率
        fx = np.fft.fftfreq(size)
        fy = np.fft.fftfreq(size)
        FX, FY = np.meshgrid(fx, fy)

        # Kolmogorov功率谱
        kappa = 2 * np.pi * np.sqrt(FX**2 + FY**2)
        kappa[0, 0] = 1e-10  # 避免除零

        PSD = 0.023 * r0**(-5/3) * kappa**(-11/3)

        # 生成随机相位
        noise = np.random.randn(size, size) + 1j * np.random.randn(size, size)
        phase_screen = np.fft.ifft2(np.sqrt(PSD) * noise).real

        # 归一化
        phase_screen = phase_screen - np.mean(phase_screen)

        return phase_screen

    def simulate_ao_loop(self, num_iterations: int = 100,
                         r0: float = 0.1) -> dict:
        """
        模拟AO控制循环

        参数:
            num_iterations: 迭代次数
            r0: Fried参数

        返回:
            仿真结果字典
        """
        # 初始化变量
        control_coefficients = np.zeros(self.num_modes)
        integral_error = np.zeros(self.num_modes)

        # 记录数据
        rms_history = []
        coefficients_history = []

        for iteration in range(num_iterations):
            # 1. 生成大气相位
            atmospheric_phase = self.generate_atmospheric_phase(r0)

            # 2. 将大气相位转换为Zernike系数
            # 这里简化处理，实际需要完整的重构
            atmospheric_coefficients = np.random.randn(self.num_modes) * 0.1

            # 3. 计算误差信号（期望波前 - 当前波前）
            current_coefficients = control_coefficients + atmospheric_coefficients
            error_signal = -current_coefficients

            # 4. 控制器计算控制信号
            control_delta, integral_error = self.controller.pi_controller(
                error_signal, integral_error,
                proportional_gain=0.05, integral_gain=0.1
            )

            # 5. 更新控制信号
            control_coefficients += control_delta

            # 记录数据
            rms_error = np.sqrt(np.mean(error_signal**2))
            rms_history.append(rms_error)
            coefficients_history.append(current_coefficients.copy())

            if iteration % 10 == 0:
                print(f"Iteration {iteration}: RMS Error = {rms_error:.6f}")

        return {
            'rms_history': rms_history,
            'coefficients_history': coefficients_history,
            'final_coefficients': control_coefficients
        }

    def plot_results(self, results: dict):
        """
        绘制仿真结果

        参数:
            results: 仿真结果字典
        """
        rms_history = results['rms_history']
        coefficients_history = results['coefficients_history']

        plt.figure(figsize=(12, 6))

        # RMS误差曲线
        plt.subplot(1, 2, 1)
        plt.plot(rms_history, 'b-', linewidth=2)
        plt.xlabel('Iteration')
        plt.ylabel('RMS Error (rad)')
        plt.title('AO Performance')
        plt.grid(True, alpha=0.3)

        # Zernike系数演化
        plt.subplot(1, 2, 2)
        coefficients_array = np.array(coefficients_history)
        for i in range(min(5, self.num_modes)):  # 只显示前5个模式
            plt.plot(coefficients_array[:, i], label=f'Mode {i+1}')

        plt.xlabel('Iteration')
        plt.ylabel('Zernike Coefficient (rad)')
        plt.title('Zernike Coefficient Evolution')
        plt.legend()
        plt.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig('ao_simulation_results.png', dpi=150, bbox_inches='tight')
        plt.show()


# 测试代码
if __name__ == "__main__":
    print("=" * 60)
    print("自适应光学仿真测试")
    print("=" * 60)

    # 创建AO系统
    ao_system = AOSimulation(num_modes=10, subapertures=(8, 8))

    # 运行仿真
    print("\n运行AO控制循环仿真...")
    results = ao_system.simulate_ao_loop(num_iterations=200, r0=0.1)

    # 绘制结果
    ao_system.plot_results(results)

    print("\n仿真完成！")
    print(f"初始RMS误差: {results['rms_history'][0]:.6f} rad")
    print(f"最终RMS误差: {results['rms_history'][-1]:.6f} rad")
    print(f"误差降低比: {results['rms_history'][0] / results['rms_history'][-1]:.2f}")
```

## 4. 机器学习在自适应光学中的应用

### 4.1 神经网络预测

使用神经网络预测大气湍流的演化：

```python
import torch
import torch.nn as nn
import numpy as np
from typing import Tuple

class TurbulencePredictor(nn.Module):
    """
    大气湍流预测神经网络

    预测未来的波前畸变
    """

    def __init__(self, input_dim: int, hidden_dim: int = 128,
                 output_dim: int = 10):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)

    def train(self, data: Tuple[np.ndarray, np.ndarray],
              epochs: int = 100, lr: float = 0.001):
        """
        训练预测模型

        参数:
            data: (X, y) 训练数据
            epochs: 训练轮数
            lr: 学习率
        """
        X, y = data
        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32)

        optimizer = torch.optim.Adam(self.parameters(), lr=lr)
        criterion = nn.MSELoss()

        for epoch in range(epochs):
            optimizer.zero_grad()
            predictions = self(X_tensor)
            loss = criterion(predictions, y_tensor)
            loss.backward()
            optimizer.step()

            if epoch % 10 == 0:
                print(f"Epoch {epoch}: Loss = {loss.item():.6f}")
```

## 5. 结论

自适应光学是现代天文观测的关键技术，其算法实现涵盖多个层面：

1. **波前感知**：Shack-Hartmann传感器、曲率传感器等
2. **波前重构**：从测量数据重构波前相位
3. **控制算法**：积分控制器、PI控制器、最优控制等
4. **机器学习**：神经网络预测、强化学习控制等

随着计算能力的提升和机器学习的发展，自适应光学系统正变得更加智能和高效。

## 参考文献

1. Hardy, J. W. (1998). "Adaptive Optics for Astronomical Telescopes." Oxford University Press.

2. Tyson, R. K. (2015). "Principles of Adaptive Optics." CRC Press.

3. Roddier, F. (1999). "Adaptive Optics in Astronomy." Cambridge University Press.

4. Guyon, O. (2005). "Limits of Adaptive Optics for High-Contrast Imaging." The Astrophysical Journal.

5. Wang, L., & Schoenlein, R. W. (2021). "Adaptive Optics and Machine Learning." Applied Optics.

---

**⚠️ 版权与免责声明 (Copyright & Disclaimer):**

本文为非商业性的学术与技术分享，旨在促进自适应光学领域的技术交流。文中部分辅助理解的配图来源于公开网络检索，未能逐一联系原作者获取正式授权。图片版权均归属原作者或对应学术期刊、机构所有。

在此郑重声明：若原图权利人对本文的引用存在任何异议，或认为构成了未经授权的使用，请随时通过博客后台留言或邮件与本人联系。我将在收到通知后第一时间全力配合，进行版权信息的补充标明或立即执行删除处理。由衷感谢每一位科研工作者对科学知识开放传播的包容与贡献！
