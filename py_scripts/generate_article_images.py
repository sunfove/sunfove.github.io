#!/usr/bin/env python3
"""
为光学文章生成必要的示意图
"""
import sys
from pathlib import Path

def create_simple_diagrams():
    """创建简单的文本图表和说明文件"""

    images_dir = Path(__file__).parent.parent / "source" / "images" / "optics" / "articles"
    images_dir.mkdir(parents=True, exist_ok=True)

    # 1. 麦克斯韦方程组图示
    maxwell_diagram = """
    麦克斯韦方程组（真空）
    ==============================

    高斯定律: ∇·E = 0
    高斯磁定律: ∇·B = 0
    法拉第定律: ∇×E = -∂B/∂t
    安培-麦克斯韦定律: ∇×B = μ₀ε₀∂E/∂t

    波动方程: ∇²E - (1/c²)∂²E/∂t² = 0
              其中 c = 1/√(μ₀ε₀)
    """

    with open(images_dir / "maxwell_equations.txt", 'w', encoding='utf-8') as f:
        f.write(maxwell_diagram)

    # 2. MZI结构示意图
    mzi_diagram = """
    马赫-曾德尔干涉仪（MZI）结构
    ===============================

    输入 → ──→ [分束器1] ──→ [相位调制器1] ──→ [分束器2] ──→ 输出
                ↓                  ↓                    ↓
              [相位调制器2] ←── [反射镜1] ←── [反射镜2]

    数学表示:
    U = | e^(iφ)cosθ   -e^(iφ)sinθ |
        | e^(-iφ)sinθ   e^(-iφ)cosθ |
    """

    with open(images_dir / "mzi_structure.txt", 'w', encoding='utf-8') as f:
        f.write(mzi_diagram)

    # 3. Zernike多项式图示
    zernike_diagram = """
    Zernike多项式前几项（低阶像差）
    =============================

    Z₁ = 1                    → Piston（平移）
    Z₂ = 2ρcosθ              → Tip（X方向倾斜）
    Z₃ = 2ρsinθ              → Tilt（Y方向倾斜）
    Z₄ = √3(2ρ² - 1)        → Defocus（离焦）
    Z₅ = √6ρ²sin2θ          → Astigmatism（像散）
    Z₆ = √8(3ρ³ - 2ρ)      → Coma（彗差）
    Z₇ = √8ρ³sin3θ          → Trefoil（三叶草）
    Z₈ = √8(6ρ⁴ - 6ρ² + 1) → Spherical（球差）

    其中 ρ = √(x² + y²), θ = arctan(y/x)
    """

    with open(images_dir / "zernike_polynomials.txt", 'w', encoding='utf-8') as f:
        f.write(zernike_diagram)

    # 4. 神经网络损失函数图示
    loss_diagram = """
    损失函数与优化轨迹
    ===================

    高维损失函数 f(W) 的可视化（二维截面）
    =========================================

    y轴 ↑
        │      ● 全局最小值
        │     /│\\
        │    / │  \\
        │   /  │   \\
        │  /   │    \\
        │ /    │     \\
        │/_____|______\\___
        │      │
        └──────→ x轴

    梯度下降: 从高处逐步"滚"向最低点
    动量方法: 惯性使粒子能够"冲"过局部最小值
    """

    with open(images_dir / "loss_landscape.txt", 'w', encoding='utf-8') as f:
        f.write(loss_diagram)

    # 5. 量子比特表示
    qubit_diagram = """
    量子比特（Qubit）的表示
    ==========================

    Bloch球表示:
    ==============

              |0⟩ (北极)
                  ↑
                  ●
                 /|\\
                / | \\
               /  |  \\
              /   |   \\
             /    |    \\
            /     |     \\
    |+⟩←━━━━━━━━━●━━━━━━━━━→ |1⟩ (南极)
           中心   |     (赤道平面)
                  ●
                 |
                 ↓
               |-⟩ (南极，相位差π)

    数学形式: |ψ⟩ = α|0⟩ + β|1⟩
    其中 |α|² + |β|² = 1
    """

    with open(images_dir / "qubit_bloch_sphere.txt", 'w', encoding='utf-8') as f:
        f.write(qubit_diagram)

    # 6. 自适应光学系统图示
    ao_diagram = """
    自适应光学系统组成
    ===================

    大气 → 望远镜主镜 → 分束器 → 探测器（波前传感器）
                   ↓
               变形镜（DM） ← 控制器
                   ↑
                激励器

    工作循环:
    1. 探测器测量波前畸变
    2. 控制器计算校正信号
    3. 变形镜改变镜面形状
    4. 重复（通常 100-1000 Hz）
    """

    with open(images_dir / "ao_system.txt", 'w', encoding='utf-8') as f:
        f.write(ao_diagram)

    # 7. 光子神经网络结构
    photonic_nn_diagram = """
    光子神经网络（PNN）结构
    ===========================

    输入光场 → [光学层1] → [光学层2] → ... → [输出层] → 探测器
                ↓            ↓                ↓
             MZI网络      MZI网络          非线性激活
                ↓            ↓                ↓
             电子处理    电子处理          数字输出

    与传统神经网络对比:
    ========================
    传统NN: 电子计算 → 全连接层 → 非线性激活 → 输出
    光子NN: 光学计算 → MZI网络 → 光电混合激活 → 输出

    优势: 速度 ↑ 能耗 ↓ 并行性 ↑
    挑战: 精度 ↓ 可编程性 ↓ 噪声 ↑
    """

    with open(images_dir / "photonic_nn_structure.txt", 'w', encoding='utf-8') as f:
        f.write(photonic_nn_diagram)

    print(f"[OK] Image description files created at: {images_dir}")
    return True


if __name__ == "__main__":
    success = create_simple_diagrams()
    sys.exit(0 if success else 1)
