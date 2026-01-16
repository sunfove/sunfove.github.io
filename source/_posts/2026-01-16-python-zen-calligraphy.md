---
title: 用 Python 打造你的专属“电子墨宝”：自动生成竖排书法与定制印章
date: 2026-01-16 20:00:00
tags: [Python, Pillow, 图像处理, 书法, 生成艺术]
categories: [Python 趣味实战]
excerpt: 不需要苦练十年，用 Python 也能写出一手好字。本文教你使用 Pillow 库实现古风竖排书法排版，模拟宣纸纹理，并自动生成阳文印章，一键生成可以直接发朋友圈的“墨宝”。
---

在上一篇文章中，我们尝试了动态书写。但在实际应用中，我们往往更需要一张高分辨率、排版考究的**静态书法作品**，用于做壁纸、配图或者打印。

今天，我们将代码升级。这一次，我们不再追求“动”，而是追求“静”与“雅”。我们将实现以下核心升级：

1.  **竖排布局**：抛弃现代的横排，回归传统的**从右向左、从上向下**的书写方式，这是书法“味儿”正不正的关键。
2.  **宣纸质感**：通过噪声算法生成带有颗粒感的米黄色背景，模拟真实宣纸。
3.  **印章生成**：生成一枚标准的红底白字（阴文）或红字白底（阳文）印章，盖在落款处。



---

## 01. 准备工作

只需要安装最基础的图像处理库 `Pillow`：

```bash
pip install pillow
```

此外，**字体是灵魂**。请务必准备一个高质量的书法字体文件（`.ttf` 或 `.otf`）。
* 推荐字体：禹卫书法行书、颜体、柳体、方正黄草。
* 如果没有，Windows 自带的 `simkai.ttf` (楷体) 也可以勉强使用。

---

## 02. 代码实现原理

### 核心难点：竖排排版逻辑

`Pillow` 的原生 `text` 方法只支持横排。要实现竖排，我们需要自己计算坐标：
1.  **分行**：根据画布高度和字号，计算一列能写多少字。
2.  **坐标变换**：
    * $X$ 轴：从右向左递减。第一行在最右边。
    * $Y$ 轴：从上向下递增。
3.  **标点修正**：中文标点在竖排时位置需要调整（例如句号不能在左下角，而应该居中或偏右），本脚本做了简单居中处理。

### 核心亮点：宣纸纹理生成

为了避免背景死白，我们创建一个噪点函数。在米黄色底色上添加随机的灰度扰动，模拟纸张纤维的粗糙感。

---

## 03. 完整 Python 脚本

将以下代码保存为 `zen_calligraphy.py`，并将字体文件放在同级目录下。

```python
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

class ZenCalligrapher:
    def __init__(self, font_path, bg_color=(240, 235, 225)):
        """
        :param font_path: 字体文件路径
        :param bg_color: 背景色 (默认米黄色宣纸)
        """
        self.font_path = font_path
        self.bg_color = bg_color
        
    def add_paper_texture(self, img):
        """给图片添加宣纸噪点纹理"""
        draw = ImageDraw.Draw(img)
        width, height = img.size
        
        # 随机画一些半透明的噪点
        for _ in range(int(width * height * 0.05)): 
            x = random.randint(0, width)
            y = random.randint(0, height)
            # 噪点颜色比背景稍深或稍浅
            noise_color = (
                random.randint(200, 250),
                random.randint(190, 240),
                random.randint(180, 230)
            )
            draw.point((x, y), fill=noise_color)
            
        # 轻微模糊一下，让噪点融入背景
        return img.filter(ImageFilter.SMOOTH_MORE)

    def create_seal(self, name, size=80):
        """生成红色印章 (阴文：红底白字)"""
        # 印章大小
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 画不规则红底 (模拟印泥渗出的边缘)
        seal_color = (180, 20, 20)
        # 稍微收缩一点，留出边缘不规则空间
        rect = [2, 2, size-2, size-2]
        draw.rectangle(rect, fill=seal_color)
        
        # 加载印章字体 (使用同一种字体，或者专门的篆书字体)
        # 这里为了演示方便，根据名字长度自动调整字号
        if len(name) <= 2:
            font_size = int(size * 0.5)
        else:
            font_size = int(size * 0.35)
            
        seal_font = ImageFont.truetype(self.font_path, font_size)
        
        # 居中绘制名字 (白色)
        # 注意：Pillow 10.0+ 使用 textbbox 获取尺寸
        left, top, right, bottom = draw.textbbox((0, 0), name, font=seal_font)
        text_w = right - left
        text_h = bottom - top
        
        x = (size - text_w) // 2
        y = (size - text_h) // 2 - size * 0.05 # 微调垂直位置
        
        draw.text((x, y), name, font=seal_font, fill=(255, 255, 255, 220))
        
        return img

    def generate_artwork(self, text, author, font_size=60, output_file="artwork.jpg"):
        """
        生成竖排书法作品
        :param text: 正文内容
        :param author: 落款名字
        :param font_size: 字号
        """
        # 1. 布局计算
        # 假设标点符号也占一个字的高度
        # 页面边距
        margin = font_size * 2
        
        # 计算每列能写多少字 (高度减去上下边距)
        # 预设画布高度，比如 1200 像素
        canvas_height = 1000
        chars_per_col = (canvas_height - margin * 2) // font_size
        
        # 计算需要多少列
        import math
        total_cols = math.ceil(len(text) / chars_per_col)
        # 加上落款的一列
        total_cols += 1 
        
        # 计算画布宽度
        canvas_width = margin * 2 + total_cols * font_size * 1.2 # 列间距 1.2倍
        canvas_width = int(canvas_width)
        
        # 2. 创建画布
        img = Image.new('RGB', (canvas_width, canvas_height), self.bg_color)
        
        # 添加宣纸质感
        print("正在生成宣纸纹理...")
        img = self.add_paper_texture(img)
        draw = ImageDraw.Draw(img)
        
        # 加载字体
        main_font = ImageFont.truetype(self.font_path, font_size)
        
        # 3. 竖排书写正文
        # 坐标系统：X 从右向左 (canvas_width - margin)
        # Y 从上向下 (margin)
        
        current_x = canvas_width - margin - font_size
        current_y = margin
        
        print("正在挥毫泼墨...")
        for char in text:
            # 绘制文字 (深灰色模拟墨色，不是纯黑)
            ink_color = (20, 20, 20)
            
            # 特殊标点处理 (简单版)
            if char in ['，', '。', '！', '？']:
                # 标点往右下角微调
                draw.text((current_x + font_size*0.3, current_y - font_size*0.3), char, font=main_font, fill=ink_color)
            else:
                draw.text((current_x, current_y), char, font=main_font, fill=ink_color)
            
            current_y += font_size
            
            # 换列检测
            if current_y > canvas_height - margin - font_size:
                current_y = margin
                current_x -= int(font_size * 1.2) # 移到左边一列
        
        # 4. 落款与盖章
        # 落款写在最后一列的偏下位置
        # 如果正文刚好写满这一列，落款就需要新起一列
        if current_y > margin: 
            current_x -= int(font_size * 1.5) # 新起一列，且离正文稍远
            
        sign_font_size = int(font_size * 0.6)
        sign_font = ImageFont.truetype(self.font_path, sign_font_size)
        
        # 落款位置 (靠下)
        sign_x = current_x + (font_size - sign_font_size)//2
        sign_y = canvas_height - margin - len(author)*sign_font_size - font_size * 2
        
        # 写落款
        for char in author:
            draw.text((sign_x, sign_y), char, font=sign_font, fill=(60, 60, 60))
            sign_y += sign_font_size
            
        # 盖章 (在落款下方)
        seal_img = self.create_seal(author, size=int(font_size*1.2))
        img.paste(seal_img, (sign_x - int(font_size*0.3), sign_y + 10), seal_img)
        
        # 5. 保存
        img.save(output_file, quality=95)
        print(f"作品已完成：{output_file}")

# --- 使用示例 ---
if __name__ == "__main__":
    # 配置你的字体路径 (必须修改为存在的路径)
    # 建议去下载一个 "禹卫书法行书" 或 "方正黄草"
    font_path = "C:/Windows/Fonts/simkai.ttf" # Windows 楷体
    
    if not os.path.exists(font_path):
        print(f"错误：找不到字体 {font_path}")
    else:
        master = ZenCalligrapher(font_path)
        
        text_content = "莫听穿林打叶声何妨吟啸且徐行竹杖芒鞋轻胜马谁怕一蓑烟雨任平生"
        author_name = "苏轼"
        
        master.generate_artwork(text_content, author_name, font_size=80, output_file="shufa_art.jpg")
```

---

## 04. 效果解析与优化建议

### 1. 竖排算法 (Vertical Layout)
在 `generate_artwork` 函数中，我们摒弃了常规的 `draw.text` 直接写入长字符串，而是使用了一个 `for` 循环逐字绘制。
* `current_x` 初始值设在画布的最右侧。
* 每写一个字，`current_y` 增加一个字高。
* 当 `current_y` 触底时，重置 `current_y` 到顶部，并将 `current_x` 向左移动一列的宽度。
这种逻辑完美复刻了古人的书写习惯。

### 2. 宣纸纹理 (Paper Texture)
`add_paper_texture` 函数非常简单粗暴但有效。它在纯色背景上随机撒下了一些灰度不同的噪点，然后使用 `ImageFilter.SMOOTH_MORE` 进行模糊。这样生成的背景不会像纯色那样生硬，有一种纸张由于受潮或纤维分布不均产生的自然斑驳感。

### 3. 印章设计
印章部分使用了圆角矩形配合半透明的文字。为了增加真实感，印章的颜色采用了 `(180, 20, 20)` 这种深红色的朱砂色，而不是鲜艳的大红。

### 4. 如何更具“艺术感”？
* **字体是关键**：代码中的 `simkai.ttf` 只是保底方案。去下载一个**毛笔质感强**的字体（如“段宁行书”、“李旭科毛笔行书”），效果会瞬间提升 10 倍。
* **留白**：代码中预设了较大的 `margin`。在书法中，留白（Negative Space）与墨迹同样重要。
* **字色**：注意看代码中的 `ink_color = (20, 20, 20)`，我们没有用纯黑 `(0,0,0)`。真实的墨汁干燥后是深灰偏黑的，纯黑色在屏幕上会显得太“硬”。



快去下载一个好看的字体，生成一张属于你的苏东坡《定风波》吧！