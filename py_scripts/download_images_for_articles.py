#!/usr/bin/env python3
"""
光学相关文章图片下载脚本
从公开网络下载光学计算、量子光学等相关的示意图和图表
"""

import requests
import os
import time
from urllib.parse import urlparse
from pathlib import Path
import json

# 创建images目录
IMAGES_DIR = Path(__file__).parent.parent / "source" / "images" / "optics"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# 光学相关文章需要的图片URL列表
ARTICLE_IMAGES = {
    "optical_computing": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Maxwell_equations.png/640px-Maxwell_equations.png",
            "filename": "maxwell_equations.png",
            "description": "麦克斯韦方程组"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mach-Zehnder_interferometer.svg/640px-Mach-Zehnder_interferometer.svg.png",
            "filename": "mach_zehnder_interferometer.png",
            "description": "马赫-曾德尔干涉仪"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Optical_waveguide.png/640px-Optical_waveguide.png",
            "filename": "optical_waveguide.png",
            "description": "光波导示意图"
        }
    ],
    "neural_networks": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Neural_network.png/640px-Neural_network.png",
            "filename": "neural_network.png",
            "description": "神经网络示意图"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Artificial_neural_network.svg/640px-Artificial_neural_network.svg.png",
            "filename": "artificial_neural_network.png",
            "description": "人工神经网络"
        }
    ],
    "quantum_optics": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Boson_sampling_circuit.svg/640px-Boson_sampling_circuit.svg.png",
            "filename": "boson_sampling_circuit.png",
            "description": "玻色采样电路"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Qubit_representation.png/640px-Qubit_representation.png",
            "filename": "qubit_representation.png",
            "description": "量子比特表示"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Rabi_oscillations.png/640px-Rabi_oscillations.png",
            "filename": "rabi_oscillations.png",
            "description": "拉比振荡"
        }
    ],
    "interferometry": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Michelson_interferometer.svg/640px-Michelson_interferometer.svg.png",
            "filename": "michelson_interferometer.png",
            "description": "迈克尔逊干涉仪"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Fabry-Perot_interferometer.svg/640px-Fabry-Perot_interferometer.svg.png",
            "filename": "fabry_perot_interferometer.png",
            "description": "法布里-珀罗干涉仪"
        }
    ],
    "machine_learning": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/CNN_with_connections.png/640px-CNN_with_connections.png",
            "filename": "cnn_architecture.png",
            "description": "CNN网络架构"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Convolution_arithmetic_-_No_padding_strides.gif/640px-Convolution_arithmetic_-_No_padding_strides.gif",
            "filename": "convolution_arithmetic.gif",
            "description": "卷积运算动画"
        }
    ]
}


def download_image(url: str, save_path: Path, description: str = "", max_retries=3) -> bool:
    """
    下载图片

    参数:
        url: 图片URL
        save_path: 保存路径
        description: 图片描述
        max_retries: 最大重试次数

    返回:
        下载是否成功
    """
    try:
        # 设置请求头
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        print(f"下载: {url}")
        print(f"描述: {description}")
        print(f"保存到: {save_path}")

        # 下载图片（带重试机制）
        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=headers, timeout=60)
                response.raise_for_status()
                break
            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    raise
                print(f"重试 {attempt + 1}/{max_retries}...")
                time.sleep(2)

        # 确保目录存在
        save_path.parent.mkdir(parents=True, exist_ok=True)

        # 保存图片
        with open(save_path, 'wb') as f:
            f.write(response.content)

        print(f"[OK] 下载成功: {save_path.name} ({len(response.content)} bytes)")
        print()
        return True

    except Exception as e:
        print(f"[FAIL] 下载失败: {str(e)}")
        print()
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("光学相关文章图片下载脚本")
    print("=" * 60)
    print()

    # 下载所有类别的图片
    all_images = []
    for category, images in ARTICLE_IMAGES.items():
        print(f"\n{'='*60}")
        print(f"类别: {category}")
        print('='*60)
        print()

        category_dir = IMAGES_DIR / category
        category_dir.mkdir(parents=True, exist_ok=True)

        for img_info in images:
            url = img_info["url"]
            filename = img_info["filename"]
            description = img_info.get("description", "")

            save_path = category_dir / filename

            # 检查是否已存在
            if save_path.exists():
                print(f"[SKIP] 跳过已存在: {filename}")
                print()
                continue

            # 下载图片
            success = download_image(url, save_path, description)

            if success:
                # 记录图片信息
                all_images.append({
                    "category": category,
                    "filename": filename,
                    "url": url,
                    "description": description,
                    "local_path": str(save_path.relative_to(IMAGES_DIR.parent.parent))
                })

    # 生成图片索引文件
    index_file = IMAGES_DIR / "image_index.json"
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(all_images, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"[DONE] 完成!")
    print(f"[DIR] 图片保存在: {IMAGES_DIR}")
    print(f"[INDEX] 索引文件: {index_file}")
    print(f"[TOTAL] 共下载 {len(all_images)} 张图片")
    print("="*60)


if __name__ == "__main__":
    main()
