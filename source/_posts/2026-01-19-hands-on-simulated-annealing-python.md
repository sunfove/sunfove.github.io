---
title: 实战篇：用 Python 徒手实现模拟退火算法解决 TSP 问题
date: 2026-01-20 09:00:00
tags: [Python, Algorithms, TSP, Data Visualization, Optimization]
categories: 
  - Computer Science
  - Applied Engineering
description: 继上一篇关于模拟退火物理原理的探讨后，本文将进入代码实战环节。我们将使用 Python 和 NumPy 从零构建一个高效的模拟退火求解器，解决经典的旅行商问题（TSP）。文章详细解析了邻域构造策略（2-opt）、温度控制代码实现以及如何利用 Matplotlib 可视化“从无序到有序”的熵减过程。
mathjax: true
---

在上一篇文章《熵减的艺术》中，我们探讨了模拟退火算法（Simulated Annealing, SA）背后的统计物理学原理。我们理解了温度如何控制随机性，以及 Metropolis 准则如何帮助我们在复杂的能量景观中跳出局部最优。

今天，我们将把这些优雅的方程转化为可执行的 Python 代码。

我们将挑战组合优化领域的“果蝇”——**旅行商问题 (Traveling Salesman Problem, TSP)**。TSP 的目标非常直观：给定一组城市和城市间的距离，寻找一条访问每个城市恰好一次并回到起点的最短路径。

尽管其表述简单，但 TSP 是典型的 **NP-Hard** 问题。当城市数量增加时，可能的路径数量呈阶乘级爆炸（$N!$）。对于 30 个城市，可能的路径数量大约是 $2.65 \times 10^{32}$，比宇宙观测范围内的原子数量还要多。穷举法在这里是失效的，而模拟退火正是解决此类问题的利器。

## 1. 工程设计与环境准备

在开始写代码之前，我们需要思考几个核心的工程实现细节，这些细节对应着物理模型中的关键要素：

1.  **系统状态 ($x$)**：在 TSP 中，状态是一个城市的排列序列（Permutation）。
2.  **能量函数 ($E(x)$)**：对应路径的总长度。我们的目标是最小化它。
3.  **邻域操作 (Move)**：如何从当前状态产生新状态？简单的“交换两个城市”往往效率低下，我们将采用更高级的 **2-opt (翻转)** 策略，这相当于消除路径中的“交叉结”。
4.  **退火计划 (Schedule)**：采用经典的指数降温。

### 环境依赖

我们将使用 `numpy` 进行数值计算，使用 `matplotlib` 进行结果可视化。

```bash
pip install numpy matplotlib
```

## 2. 核心类定义：SimulatedAnnealing

为了保证代码的模块化和复用性，我们定义一个 `TSP_SA` 类。

### 2.1 初始化与距离矩阵

计算几何距离是一个耗时操作。为了避免在循环中重复计算 $\sqrt{(x_1-x_2)^2 + (y_1-y_2)^2}$，我们最好预先计算好所有城市之间的**距离矩阵 (Distance Matrix)**。这是一个典型的“空间换时间”策略。

```python
import numpy as np
import matplotlib.pyplot as plt
import math
import random

class TSP_SA:
    def __init__(self, coords, t_start=1000, t_end=1e-3, alpha=0.995, max_iter_per_temp=100):
        """
        初始化模拟退火求解器
        :param coords: 城市坐标数组 (N, 2)
        :param t_start: 初始温度 (对应物理中的高温熔融态)
        :param t_end: 终止温度 (对应物理中的低温结晶态)
        :param alpha: 冷却系数 (决定降温速率)
        :param max_iter_per_temp: 每个温度下的内循环迭代次数 (等温过程)
        """
        self.coords = coords
        self.num_cities = len(coords)
        self.t_start = t_start
        self.t_end = t_end
        self.alpha = alpha
        self.max_iter_per_temp = max_iter_per_temp
        
        # 预计算距离矩阵，避免重复计算
        self.dist_matrix = self._calculate_distance_matrix()
        
        # 初始化状态
        self.current_solution = np.arange(self.num_cities)
        np.random.shuffle(self.current_solution) # 随机打乱作为初始解
        
        # 计算初始能量
        self.current_cost = self._calculate_total_distance(self.current_solution)
        
        # 记录全局最优解
        self.best_solution = self.current_solution.copy()
        self.best_cost = self.current_cost
        
        # 用于记录历史数据以便绘图
        self.cost_history = []
        
    def _calculate_distance_matrix(self):
        """利用广播机制高效计算欧几里得距离矩阵"""
        # 利用 (N, 1, 2) - (1, N, 2) 产生 (N, N, 2) 的差值张量
        diff = self.coords[:, np.newaxis, :] - self.coords[np.newaxis, :, :]
        # 求范数
        dist_matrix = np.linalg.norm(diff, axis=-1)
        return dist_matrix
```

### 2.2 能量计算与状态扰动 (The Physics)

这是算法的灵魂所在。

**关于邻域操作 (Mutation)：**
在 TSP 中，简单的交换 (Swap) 两个城市通常只能产生微小的局部变化。更有效的操作是 **2-opt Reversal**。即随机选择一段路径，将其顺序**逆转**。
* **物理直觉：** 如果你在解开一团乱麻，最好的方式不是把两个线头换位置，而是把打结的一段“翻转”过来，使其理顺。

```python
    def _calculate_total_distance(self, solution):
        """计算当前路径的总长度 (Energy)"""
        total_dist = 0
        for i in range(self.num_cities):
            start_node = solution[i]
            end_node = solution[(i + 1) % self.num_cities] # 回到起点
            total_dist += self.dist_matrix[start_node, end_node]
        return total_dist

    def _generate_neighbor(self, solution):
        """
        产生新解：使用 2-opt (区间翻转) 策略
        比简单的 swap 更容易解开路径交叉
        """
        new_solution = solution.copy()
        l = random.randint(2, self.num_cities - 1)
        i = random.randint(0, self.num_cities - l)
        
        # 将区间 [i, i+l] 进行逆序
        new_solution[i : i + l] = new_solution[i : i + l][::-1]
        
        return new_solution
```

### 2.3 Metropolis 准则 (The Law)

这部分代码直接翻译了玻尔兹曼分布推导出的接受概率公式。请注意浮点数溢出的保护。

$$
P_{accept} = e^{-\frac{\Delta E}{T}}
$$

```python
    def _accept(self, new_cost, current_cost, temperature):
        """
        Metropolis 准则
        :return: Boolean, 是否接受新解
        """
        delta_E = new_cost - current_cost
        
        # 情况1: 新解更优 (能量更低)，贪婪接受
        if delta_E < 0:
            return True
        
        # 情况2: 新解更差，按概率接受
        # P = exp(-delta_E / T)
        else:
            probability = math.exp(-delta_E / temperature)
            return random.random() < probability
```

### 2.4 主循环 (The Annealing Process)

主循环模拟了随着时间推移，热浴温度逐渐降低的过程。

```python
    def anneal(self):
        """执行模拟退火主循环"""
        temperature = self.t_start
        
        while temperature > self.t_end:
            # 内循环：等温过程 (Isothermal Process)
            # 在当前温度下进行多次尝试，使系统趋于平衡
            for _ in range(self.max_iter_per_temp):
                # 1. 产生新解
                new_solution = self._generate_neighbor(self.current_solution)
                new_cost = self._calculate_total_distance(new_solution)
                
                # 2. 接受判别 (Metropolis)
                if self._accept(new_cost, self.current_cost, temperature):
                    self.current_solution = new_solution
                    self.current_cost = new_cost
                    
                    # 更新全局最优
                    if self.current_cost < self.best_cost:
                        self.best_solution = self.current_solution.copy()
                        self.best_cost = self.current_cost
            
            # 记录本轮温度下的能量值
            self.cost_history.append(self.best_cost)
            
            # 3. 降温 (Cooling)
            temperature *= self.alpha
            
        return self.best_solution, self.best_cost
```

## 3. 运行与可视化

让我们生成 50 个随机城市坐标，并运行我们的模拟退火算法。为了直观感受算法的效果，我们将绘制出初始的随机路径和最终优化后的路径。

```python
if __name__ == "__main__":
    # 设置随机种子以复现结果
    np.random.seed(42)
    random.seed(42)

    # 1. 生成数据：50个随机城市
    num_cities = 50
    coords = np.random.rand(num_cities, 2) * 100  # 范围 [0, 100]

    # 2. 实例化并运行算法
    # 注意：T_start 需要根据数据规模调整，通常设为平均距离的量级
    sa = TSP_SA(coords, t_start=1000, t_end=0.01, alpha=0.99, max_iter_per_temp=200)
    best_path, best_dist = sa.anneal()

    print(f"Optimization Finished!")
    print(f"Final Minimum Distance: {best_dist:.2f}")

    # 3. 可视化对比
    plt.figure(figsize=(12, 6))

    # 子图1：收敛曲线
    plt.subplot(1, 2, 1)
    plt.plot(sa.cost_history, 'b-')
    plt.title("Energy Optimization Curve")
    plt.xlabel("Temperature Steps")
    plt.ylabel("Total Distance (Energy)")
    plt.grid(True)

    # 子图2：最佳路径
    plt.subplot(1, 2, 2)
    # 绘制城市点
    plt.scatter(coords[:, 0], coords[:, 1], c='red', s=40, zorder=2)
    # 绘制路径线
    # 需要把路径闭合，加上起点
    plot_path = np.append(best_path, best_path[0]) 
    plt.plot(coords[plot_path, 0], coords[plot_path, 1], 'g-', linewidth=1.5, zorder=1)
    
    plt.title(f"Optimal TSP Path (N={num_cities})\nDist={best_dist:.2f}")
    plt.axis('equal')
    
    plt.tight_layout()
    plt.show()
```

## 4. 结果深度解析

当你运行上述代码时，你会观察到两个有趣的现象：

### 4.1 能量收敛曲线 (The Energy Landscape)

`Energy Optimization Curve` 图表通常会显示出三个阶段：
1.  **高温混沌期：** 曲线波动剧烈，能量值很高。此时 $T$ 很大，系统频繁接受差解，几乎在随机游走。这对应物理上的液体状态。
2.  **相变期 (Phase Transition)：** 能量开始快速下降。随着 $T$ 降低，拒绝差解的概率增加，系统开始迅速向低能谷底滑落。这是算法最有效率的阶段。
3.  **低温冻结期：** 曲线趋于平缓。此时 $T$ 极低，系统几乎不再接受任何差解，最终被“冻结”在某个局部最优或全局最优解上。

### 4.2 路径拓扑演化

在 `Optimal TSP Path` 图中，你会发现：
* 优化后的路径几乎**没有任何交叉**。在二维欧几里得空间中，任何两条相交的边都可以通过交换端点（即 2-opt 操作）来缩短总长度（三角不等式原理）。
* 路径形成了一个凸包状的轮廓，内部点被有序地连接起来。

## 5. 关键参数调优指南 (The Art of Tuning)

模拟退火虽然强大，但它不是“开箱即用”的魔法。它的效果高度依赖于参数设置，这就是所谓的“调参玄学”。

1.  **初始温度 $T_{start}$**：
    * 如果设得太低，一开始就无法接受差解，算法会退化为贪婪算法，瞬间陷入局部最优。
    * **经验法则**：运行一次随机游走，计算相邻状态能量差的方差 $\sigma^2$。通常设定 $T_{start} \approx 3\sigma$ 以确保初始接受率在 80%-90% 左右。

2.  **降温系数 $\alpha$**：
    * 通常在 $[0.8, 0.995]$ 之间。
    * $\alpha = 0.8$：淬火（快速冷却），速度快但解质量差。
    * $\alpha = 0.99$：退火（缓慢冷却），解质量高但耗时极长。

3.  **邻域结构**：
    * 对于 TSP，`Reversal` (2-opt) 优于 `Swap`。
    * 对于更复杂的问题，可能需要混合多种操作算子。

## 结语

通过这两篇文章，我们完成了一次奇妙的跨界之旅：从金属冶炼的熔炉，到统计力学的玻尔兹曼分布，最后在 Python 代码中解决了一个复杂的组合优化问题。

这正是算法之美——**它不仅是逻辑的堆砌，更是自然法则在数字世界的回响。**

现在，你手中有了一把锤子（模拟退火代码），可以去寻找你的钉子了。尝试修改代码中的 `Energy Function`，你完全可以用同样的框架去解决**排课问题**、**芯片布局**甚至**神经网络的超参数搜索**。