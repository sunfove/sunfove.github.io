#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为文章自动配图：
1. 尝试从 Wikimedia Commons 搜索公开授权图片
2. 失败时生成 matplotlib 示意图
"""
import os
import re
import sys
import hashlib
import requests
import json
import random
from urllib.parse import quote, urlparse
from pathlib import Path

matplotlib_available = False
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.font_manager import FontProperties
    matplotlib_available = True
except ImportError:
    pass


USER_AGENT = 'Mozilla/5.0 (compatible; MetasurfaceBot/1.0; +https://time-frame.cloud/)'
HEADERS = {'User-Agent': USER_AGENT}
IMAGE_DIR = Path('/home/ubuntu/time-frame-website/source/images/external')


def get_chinese_font():
    candidates = [
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    ]
    for c in candidates:
        if Path(c).exists():
            return FontProperties(fname=c)
    return None


def translate_to_english(keywords):
    """简单的关键词中英映射，用于搜索图片"""
    mapping = {
        '超表面': 'metasurface',
        '全息': 'holography',
        '全息术': 'hologram',
        '偏振': 'polarization',
        '相位': 'phase',
        '透镜': 'metalens',
        '涡旋': 'vortex beam',
        '光束': 'light beam',
        '纳米': 'nanostructure',
        '光学': 'optics',
        '传感': 'sensor',
        '神经网络': 'neural network',
        '制造': 'nanofabrication',
    }
    en = []
    for k in keywords:
        if k in mapping:
            en.append(mapping[k])
        elif re.match(r'[\u4e00-\u9fff]', k):
            en.append(k)
    return ' '.join(en) if en else 'metasurface optics'


def extract_keywords(title, content):
    """从标题和正文提取关键词"""
    all_text = title + ' ' + content
    # 常见超表面关键词
    candidates = ['超表面', '全息', '全息术', '偏振', '相位', '透镜', '涡旋',
                  '光束', '纳米', '光学', '传感', '神经网络', '制造', 'metalens',
                  'holography', 'polarization', 'phase', 'vortex', 'nanostructure']
    found = [c for c in candidates if c in all_text]
    return found


def search_wikimedia(query, limit=5):
    """搜索 Wikimedia Commons 图片"""
    url = 'https://commons.wikimedia.org/w/api.php'
    params = {
        'action': 'query',
        'list': 'search',
        'srsearch': query,
        'srnamespace': 6,  # File namespace
        'srlimit': limit,
        'format': 'json',
        'origin': '*',
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        results = data.get('query', {}).get('search', [])
        return [r['title'].replace('File:', '') for r in results if 'title' in r]
    except Exception as e:
        print(f'[WARN] Wikimedia 搜索失败: {e}')
        return []


def get_wikimedia_file_info(filename):
    """获取图片信息（授权、作者、描述）"""
    url = 'https://commons.wikimedia.org/w/api.php'
    params = {
        'action': 'query',
        'titles': f'File:{filename}',
        'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size',
        'format': 'json',
        'origin': '*',
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        pages = data.get('query', {}).get('pages', {})
        for pid, page in pages.items():
            info = page.get('imageinfo', [{}])[0]
            if 'url' in info:
                meta = info.get('extmetadata', {})
                artist = meta.get('Artist', {}).get('value', '')
                license_name = meta.get('LicenseShortName', {}).get('value', '')
                desc = meta.get('ImageDescription', {}).get('value', '')
                return {
                    'url': info['url'],
                    'width': info.get('width', 0),
                    'height': info.get('height', 0),
                    'artist': re.sub(r'<[^>]+>', '', artist)[:60],
                    'license': license_name,
                    'desc': re.sub(r'<[^>]+>', '', desc)[:120],
                }
        return None
    except Exception as e:
        print(f'[WARN] 获取文件信息失败: {e}')
        return None


def download_image(url, slug, suffix=''):
    """下载图片到本地"""
    try:
        ext = Path(urlparse(url).path).suffix or '.jpg'
        if ext.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            ext = '.jpg'
        filename = f"{slug}_{suffix}{hashlib.md5(url.encode()).hexdigest()[:8]}{ext}"
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        local = IMAGE_DIR / filename

        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        local.write_bytes(resp.content)
        print(f'[OK] 下载图片: {local}')
        return local
    except Exception as e:
        print(f'[WARN] 下载图片失败: {e}')
        return None


def generate_diagram(title, out_path, width=800, height=400):
    """生成 matplotlib 示意图"""
    if not matplotlib_available:
        return None
    import numpy as np

    cjk_font = get_chinese_font()
    fig = plt.figure(figsize=(width/100, height/100), dpi=100, facecolor='white')
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    # 根据标题选择不同的示意图
    t = title.lower()
    if 'holograph' in t or '全息' in t:
        # 相位螺旋
        theta = np.linspace(0, 4*np.pi, 1000)
        r = np.linspace(0, 1, 1000)
        x = r * np.cos(theta)
        y = r * np.sin(theta)
        ax.plot(x, y, color='#4CAF50', linewidth=2)
        ax.add_patch(plt.Circle((0, 0), 0.05, color='#4CAF50', fill=True))
        ax.set_xlim(-1.1, 1.1)
        ax.set_ylim(-1.1, 1.1)
        ax.set_aspect('equal')
        ax.axis('off')
    elif 'lens' in t or 'metalens' in t or '透镜' in t:
        # 透镜聚焦
        x = np.linspace(-1, 1, 100)
        y = 0.5 * x**2
        ax.plot(x, y, color='#2196F3', linewidth=4)
        for i in range(5):
            ax.plot([0, 0], [0.5, -1+i*0.2], color='#FF9800', alpha=0.5, linewidth=1.5)
        ax.set_xlim(-1.2, 1.2)
        ax.set_ylim(-1.2, 1.2)
        ax.set_aspect('equal')
        ax.axis('off')
    else:
        # 默认：纳米柱阵列
        n = 12
        for i in range(n):
            for j in range(n):
                rect = plt.Rectangle((i/n, j/n), 0.8/n, 0.8/n,
                                      facecolor=plt.cm.viridis((i+j)/(2*n)),
                                      edgecolor='white', linewidth=0.5)
                ax.add_patch(rect)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.set_aspect('equal')
        ax.axis('off')

    # 标题覆盖
    ax.text(0.5, 0.92, title, fontsize=16, color='#333', fontweight='bold',
            ha='center', va='top', transform=ax.transAxes, fontproperties=cjk_font)

    plt.savefig(out_path, dpi=100, facecolor='white', bbox_inches='tight', pad_inches=0.1)
    plt.close(fig)
    return out_path


def insert_image_into_article(md_path, image_path, caption):
    """在文章末尾插入图片和引用说明"""
    text = Path(md_path).read_text(encoding='utf-8')
    relative = f"/images/external/{image_path.name}"
    insert = f"\n\n![{caption}]({relative})\n\n*图：{caption}*\n"
    if insert not in text:
        text += insert
        Path(md_path).write_text(text, encoding='utf-8')
        print(f'[OK] 已插入图片: {caption}')
    else:
        print('[INFO] 图片已存在，跳过')


def process_article(md_path):
    slug = Path(md_path).stem
    text = Path(md_path).read_text(encoding='utf-8')
    # 提取 front matter 中的 title
    m = re.match(r'^---\n(.*?)\n---\n', text, re.DOTALL)
    title = ''
    if m:
        fm = m.group(1)
        tm = re.search(r'^title:\s*(.+)$', fm, re.MULTILINE)
        if tm:
            title = tm.group(1).strip()

    content = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.DOTALL, count=1)
    keywords = extract_keywords(title, content)
    print(f'[INFO] 文章: {title}')
    print(f'[INFO] 关键词: {keywords}')

    # 1. 尝试 Wikimedia Commons
    en_query = translate_to_english(keywords)
    print(f'[INFO] 搜索 Wikimedia: {en_query}')
    filenames = search_wikimedia(en_query)
    if not filenames:
        # fallback 用更通用关键词
        filenames = search_wikimedia('metasurface optics')

    if filenames:
        for fn in filenames:
            info = get_wikimedia_file_info(fn)
            if not info:
                continue
            # 过滤尺寸
            if info['width'] < 300 or info['height'] < 200:
                continue
            local = download_image(info['url'], slug, 'wiki_')
            if local:
                caption = f"{title}相关概念示意（来源：Wikimedia Commons"
                if info['artist']:
                    caption += f"，作者：{info['artist']}"
                if info['license']:
                    caption += f"，授权：{info['license']}"
                caption += "）"
                insert_image_into_article(md_path, local, caption)
                return

    # 2. Fallback: 生成 matplotlib 示意图
    print('[INFO] 未找到合适的 Wikimedia 图片，生成示意图')
    out_path = IMAGE_DIR / f"{slug}_diagram.png"
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    generate_diagram(title, out_path)
    if out_path.exists():
        insert_image_into_article(md_path, out_path, f'{title}示意图（由 AI 基于主题生成）')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 fetch_article_images.py <md_file>')
        sys.exit(1)
    process_article(sys.argv[1])
