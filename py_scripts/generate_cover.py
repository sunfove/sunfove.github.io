#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为超表面/光学文章自动生成封面配图
"""
import os
import re
import sys
import yaml
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle, FancyBboxPatch
from matplotlib.collections import PatchCollection


def parse_front_matter(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    m = re.match(r'^---\n(.*?)\n---\n', raw, re.DOTALL)
    if m:
        return yaml.safe_load(m.group(1))
    return {}


def clean_filename(title):
    return re.sub(r'[^\w\u4e00-\u9fff]+', '_', title).strip('_')[:50]


import matplotlib.font_manager as fm


def set_fonts():
    # 优先用系统中文字体
    cjk = fm.FontProperties(family='Noto Sans CJK SC')
    plt.rcParams['font.family'] = ['DejaVu Sans']
    plt.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'DejaVu Sans', 'Arial Unicode MS']
    plt.rcParams['axes.unicode_minus'] = False
    return cjk


def draw_metasurface_array(ax, n=16):
    """绘制超表面纳米柱阵列"""
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, n*n))
    patches = []
    for i in range(n):
        for j in range(n):
            x = i / n
            y = j / n
            h = 0.6 + 0.35 * np.sin(x * 6) * np.cos(y * 5)
            rect = Rectangle((x, y), 0.9/n, 0.9/n, facecolor=colors[i*n+j], edgecolor='white', linewidth=0.3)
            patches.append(rect)
    pc = PatchCollection(patches, match_original=True)
    ax.add_collection(pc)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect('equal')
    ax.axis('off')


def draw_phase_profile(ax):
    """绘制相位分布曲面投影"""
    x = np.linspace(-2, 2, 200)
    y = np.linspace(-2, 2, 200)
    X, Y = np.meshgrid(x, y)
    Z = np.arctan2(Y, X) + np.pi
    ax.contourf(X, Y, Z, levels=50, cmap='twilight', alpha=0.9)
    ax.set_aspect('equal')
    ax.axis('off')


def draw_jones_matrix(ax):
    """绘制琼斯矩阵示意"""
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.text(0.5, 0.75, r'$\mathbf{J} = \begin{pmatrix} J_{xx} & J_{xy} \\ J_{yx} & J_{yy} \end{pmatrix}$',
            fontsize=22, ha='center', va='center', color='white', fontweight='bold')
    ax.text(0.5, 0.25, r'Jones Matrix for Vectorial Holography',
            fontsize=12, ha='center', va='center', color='white', alpha=0.8)
    ax.set_facecolor('#0a1628')
    ax.axis('off')


def generate_cover(title, excerpt, out_path, width=1200, height=600):
    set_fonts()
    fig = plt.figure(figsize=(width/100, height/100), dpi=100, facecolor='#0a1628')
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor('#0a1628')
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    # 根据标题选择背景图
    title_lower = title.lower()
    if '相位' in title or 'phase' in title_lower or '全息' in title or 'holog' in title_lower:
        draw_phase_profile(ax)
    elif '矩阵' in title or 'jones' in title_lower or '偏振' in title or 'polar' in title_lower:
        draw_jones_matrix(ax)
    else:
        draw_metasurface_array(ax)

    # 渐变遮罩
    overlay = plt.Rectangle((0, 0), 1, 1, transform=ax.transAxes, facecolor='black', alpha=0.45)
    ax.add_patch(overlay)

    # 标题
    cjk_font = fm.FontProperties(family='Noto Sans CJK SC')
    ax.text(0.08, 0.62, title, fontsize=28, color='white', fontweight='bold',
            ha='left', va='top', wrap=True, transform=ax.transAxes,
            fontproperties=cjk_font, linespacing=1.4)

    # 摘要/副标题
    if excerpt:
        excerpt = excerpt[:80] + '...' if len(excerpt) > 80 else excerpt
        ax.text(0.08, 0.42, excerpt, fontsize=13, color=(1, 1, 1, 0.85),
                ha='left', va='top', transform=ax.transAxes, linespacing=1.5,
                fontproperties=cjk_font)

    # 标签
    ax.text(0.92, 0.08, '时间帧 · Metasurface Tech', fontsize=11, color=(1, 1, 1, 0.5),
            ha='right', va='bottom', transform=ax.transAxes,
            fontproperties=cjk_font)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    plt.savefig(out_path, dpi=100, facecolor='#0a1628', edgecolor='none', bbox_inches='tight', pad_inches=0)
    plt.close(fig)
    return out_path


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 generate_cover.py <md_file>')
        sys.exit(1)

    md_file = sys.argv[1]
    front_matter = parse_front_matter(md_file)
    title = front_matter.get('title', 'Untitled')
    excerpt = front_matter.get('excerpt', '')

    out_dir = '/home/ubuntu/time-frame-website/source/images/covers'
    out_path = os.path.join(out_dir, f"{clean_filename(title)}.png")
    generate_cover(title, excerpt, out_path)
    print(f'COVER:{out_path}')
