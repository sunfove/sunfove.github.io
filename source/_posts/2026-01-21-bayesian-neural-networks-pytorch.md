---
title: "拥抱不确定性：使用 PyTorch 构建贝叶斯神经网络 (BNN)"
date: 2026-01-21 08:30:00
tags:
  - PyTorch
  - Bayesian Deep Learning
  - Variational Inference
  - Python
  - AI Research
categories:
  - Engineering & Implementation
description: "从理论推导到代码落地。本文将深入探讨变分推理（Variational Inference）与重参数化技巧（Reparameterization Trick），并手把手教你用 PyTorch 实现一个能够量化自身“无知”的贝叶斯神经网络。"
mathjax: true
---

# 引言：当 AI 学会说“我不确定”

传统的深度神经网络（DNN）往往不仅是错误的，而且是**自信地错误（Confidently Wrong）**。

想象一个训练用于识别猫狗的分类器。如果你给它一张飞机的照片，它可能会输出“狗：99.9%”，而不是“我不知道”。这是因为传统神经网络学习的是权重的**点估计（Point Estimate）**——它寻找一组最优的参数 $\theta$，使得损失函数最小化。

贝叶斯神经网络（Bayesian Neural Network, BNN）则完全不同。它不寻找具体的权重值，而是学习权重的**分布（Distribution）**。这使得模型不仅能给出预测结果，还能给出**置信区间（Confidence Interval）**。

在医疗诊断、自动驾驶等高风险领域，知道模型何时“不确定”，比知道模型何时“正确”更重要。本文将从数学原理出发，利用 **变分推理（Variational Inference）** 和 **PyTorch**，构建一个从零开始的 BNN。

---

# 第一部分：从点到面的数学跨越

## 1.1 核心差异

在传统神经网络中，我们通过最大似然估计（MLE）或最大后验估计（MAP）寻找最优权重 $w^*$：

$$w^* = \underset{w}{\arg\max} \ P(D|w)$$

而在贝叶斯深度学习中，我们的目标是计算权重的**后验分布** $P(w|D)$。根据上一篇文章提到的贝叶斯公式：

$$P(w|D) = \frac{P(D|w)P(w)}{P(D)}$$

* $P(D|w)$：似然性（数据拟合程度）。
* $P(w)$：先验（例如，假设权重服从标准正态分布）。
* $P(D)$：边缘似然（Evidence）。

## 1.2 难点：不可计算的积分

问题的症结在于分母 $P(D)$。它需要对所有可能的参数配置进行积分：
$$P(D) = \int P(D|w)P(w) dw$$

在深度神经网络中，$w$ 的维度可能有数百万之巨。在高维空间进行这种积分在计算上是不可行的（Intractable）。因此，我们无法直接解析求出后验分布。

## 1.3 解决方案：变分推理 (Variational Inference)

既然算不出真后验 $P(w|D)$，我们就找一个简单的分布 $q_\theta(w)$（比如高斯分布）来近似它。

我们的目标是找到一组参数 $\theta$（比如高斯的均值 $\mu$ 和方差 $\sigma^2$），使得 $q_\theta(w)$ 和真实的 $P(w|D)$ 越像越好。衡量两个分布差异的标准工具是 **KL 散度（Kullback-Leibler Divergence）**。

我们需要最小化：
$$KL(q_\theta(w) || P(w|D))$$

经过数学推导，最小化 KL 散度等价于最大化 **证据下界（ELBO, Evidence Lower Bound）**。将其转化为损失函数（Loss Function）的形式，我们要最小化：

$$\mathcal{L}(\theta, D) = \underbrace{KL(q_\theta(w) || P(w))}_{\text{复杂性代价 (Complexity Cost)}} - \underbrace{\mathbb{E}_{q_\theta(w)}[\log P(D|w)]}_{\text{似然性代价 (Likelihood Cost)}}$$

1.  **复杂性代价**：迫使我们的近似分布 $q_\theta(w)$ 接近先验分布 $P(w)$（通常是标准正态分布）。这起到了**正则化**的作用。
2.  **似然性代价**：确保我们的模型能够拟合数据。

---

# 第二部分：核心技术——重参数化技巧 (Bayes by Backprop)

要在神经网络中实现上述理论，我们面临一个工程难题：**如何在采样过程中进行反向传播？**

如果是直接从 $N(\mu, \sigma^2)$ 中采样得到 $w$，这个采样操作是不可导的，梯度无法传回 $\mu$ 和 $\sigma$。

**重参数化技巧（Reparameterization Trick）** 巧妙地解决了这个问题。我们不再直接采样 $w$，而是采样一个无参数的噪声 $\epsilon$：

1.  采样 $\epsilon \sim N(0, 1)$。
2.  令 $w = \mu + \sigma \cdot \epsilon$。

现在，$w$ 对于 $\mu$ 和 $\sigma$ 都是可导的，我们可以像训练普通神经网络一样利用 SGD 或 Adam 来更新这两个参数。

---

# 第三部分：PyTorch 实战

我们将实现一个简单的贝叶斯线性层（Bayesian Linear Layer）。为了数值稳定性，我们通常不直接学习 $\sigma$，而是学习 $\rho$，并令 $\sigma = \log(1 + e^\rho)$。

## 3.1 定义贝叶斯层

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class BayesianLinear(nn.Module):
    def __init__(self, in_features, out_features):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        
        # 初始化权重分布的参数: Mean (mu) 和 Rho (用于计算 Sigma)
        self.weight_mu = nn.Parameter(torch.Tensor(out_features, in_features).uniform_(-0.2, 0.2))
        self.weight_rho = nn.Parameter(torch.Tensor(out_features, in_features).uniform_(-5, -4))
        
        self.bias_mu = nn.Parameter(torch.Tensor(out_features).uniform_(-0.2, 0.2))
        self.bias_rho = nn.Parameter(torch.Tensor(out_features).uniform_(-5, -4))
        
        # 存储 KL 散度
        self.kl_divergence = 0
        
    def forward(self, x):
        # 1. 计算 Sigma = log(1 + exp(rho))
        weight_sigma = torch.log1p(torch.exp(self.weight_rho))
        bias_sigma = torch.log1p(torch.exp(self.bias_rho))
        
        # 2. 重参数化采样 (Reparameterization Trick)
        # 采样 epsilon ~ N(0, 1)
        w_epsilon = torch.randn_like(weight_sigma)
        b_epsilon = torch.randn_like(bias_sigma)
        
        # w = mu + sigma * epsilon
        weight = self.weight_mu + weight_sigma * w_epsilon
        bias = self.bias_mu + bias_sigma * b_epsilon
        
        # 3. 计算 KL 散度 (解析解: Gaussian vs Gaussian)
        # 这里简化计算，假设先验 P(w) 是标准正态分布 N(0, 1)
        # KL(N(mu, sigma) || N(0, 1))
        self.kl_divergence = self._calculate_kl(self.weight_mu, weight_sigma) + \
                             self._calculate_kl(self.bias_mu, bias_sigma)
        
        return F.linear(x, weight, bias)
    
    def _calculate_kl(self, mu, sigma):
        # KL 散度公式 for two Gaussians where prior is N(0, 1)
        # 0.5 * sum(sigma^2 + mu^2 - 1 - log(sigma^2))
        return 0.5 * torch.sum(sigma**2 + mu**2 - 1 - 2 * torch.log(sigma))
```

## 3.2 构建贝叶斯神经网络

我们将构建一个简单的回归网络。

```python
class BayesianNetwork(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.blinear1 = BayesianLinear(input_dim, hidden_dim)
        self.blinear2 = BayesianLinear(hidden_dim, hidden_dim)
        self.blinear3 = BayesianLinear(hidden_dim, output_dim)
        
    def forward(self, x):
        x = F.relu(self.blinear1(x))
        x = F.relu(self.blinear2(x))
        x = self.blinear3(x)
        return x
    
    def get_total_kl(self):
        return self.blinear1.kl_divergence + \
               self.blinear2.kl_divergence + \
               self.blinear3.kl_divergence
```

## 3.3 定义损失函数与训练循环

损失函数 = 负对数似然 (NLL) + $\beta \times$ KL 散度。
对于回归问题，NLL 等价于均方误差 (MSE)。

```python
def train_bnn(model, X_train, y_train, epochs=1000):
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        
        # 前向传播
        predictions = model(X_train)
        
        # 计算 Loss
        # 1. Likelihood Cost (MSE)
        mse_loss = criterion(predictions, y_train)
        
        # 2. Complexity Cost (KL)
        # KL 权重通常随着 batch size 调整，这里简化处理
        kl_loss = model.get_total_kl() / X_train.shape[0] 
        
        total_loss = mse_loss + 0.01 * kl_loss # beta = 0.01
        
        total_loss.backward()
        optimizer.step()
        
        if epoch % 100 == 0:
            print(f"Epoch {epoch}: MSE={mse_loss.item():.4f}, KL={kl_loss.item():.4f}")

# 假设数据生成
X = torch.linspace(-3, 3, 100).view(-1, 1)
y = torch.sin(X) + torch.randn_like(X) * 0.1
# train_bnn(model, X, y)
```

## 3.4 预测：蒙特卡洛采样

BNN 的强大之处在于推理阶段。我们不仅进行一次预测，而是进行多次前向传播（每次的权重都不一样，因为是从分布中采样的）。

```python
def predict_uncertainty(model, X_test, num_samples=100):
    preds = []
    # 多次采样模拟
    for _ in range(num_samples):
        with torch.no_grad():
            preds.append(model(X_test).numpy())
            
    preds = np.array(preds)
    
    # 计算均值作为预测结果
    mean_pred = preds.mean(axis=0)
    
    # 计算标准差作为不确定性 (Uncertainty)
    std_pred = preds.std(axis=0)
    
    return mean_pred, std_pred
```



通过绘制 `mean_pred` $\pm$ `2 * std_pred`，我们可以看到一个非常直观的现象：**在数据密集的区域，置信区间很窄（模型很自信）；在没有数据的区域，置信区间迅速发散（模型承认自己不知道）。**

---

# 第四部分：两种不确定性

在深入理解 BNN 后，我们需要区分两种不同性质的不确定性，这对于实际应用至关重要：

1.  **偶然不确定性 (Aleatoric Uncertainty)**：
    * **来源**：数据本身的噪声（如传感器误差、图像模糊）。
    * **特性**：即使增加更多数据也无法消除。
    * **建模**：通常通过让模型输出分布的参数（如预测高斯的 $\sigma$）来捕获。

2.  **认知不确定性 (Epistemic Uncertainty)**：
    * **来源**：模型对知识的缺乏（模型没见过这类数据）。
    * **特性**：**可以通过增加更多训练数据来减少**。
    * **建模**：这就是我们今天构建的 BNN（权重的分布）所捕获的不确定性。

一个完美的 AI 系统应该同时具备捕捉这两种不确定性的能力。

---

# 结语：通往鲁棒 AI 的必经之路

贝叶斯神经网络并非没有代价。它的参数量翻倍（存储均值和方差），收敛速度较慢，且对超参数（先验的选择、KL 的权重）较为敏感。

然而，在需要**安全、可解释和鲁棒性**的场景下，BNN 提供了传统深度学习无法比拟的优势。它提醒我们，真正的智能不仅仅是给出答案，更是对自我认知的审视。

> "It is better to be roughly right than precisely wrong."  
> —— John Maynard Keynes

---

*Would you like to explore how to extend this model to capture Aleatoric Uncertainty by modifying the output layer loss function, or discuss the difference between Variational Inference and MCMC methods?*