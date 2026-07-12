"""
图片处理模块
负责搜索、下载、生成博客所需的图片
支持：
1. 从 Wikimedia Commons 下载公开图片
2. 从 Unsplash 下载免费图片
3. 使用 matplotlib 生成示意图
4. 使用 AI 生成图片（可选）
"""
import os
import re
import requests
import hashlib
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from urllib.parse import quote, urlparse


class ImageHandler:
    """图片处理类"""

    def __init__(self, output_dir: str = None):
        """
        初始化图片处理器

        Args:
            output_dir: 图片输出目录
        """
        if output_dir is None:
            output_dir = Path(__file__).parent.parent.parent / "source" / "images" / "articles"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 图片索引文件
        self.index_file = self.output_dir.parent / "image_index.json"
        self.image_index = self._load_index()

        # 请求头
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # Unsplash API（免费，无需认证）
        self.unsplash_access_key = os.environ.get("UNSPLASH_ACCESS_KEY")

    def _load_index(self) -> Dict:
        """加载图片索引"""
        if self.index_file.exists():
            import json
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"images": [], "articles": {}}

    def _save_index(self):
        """保存图片索引"""
        import json
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(self.image_index, f, ensure_ascii=False, indent=2)

    def _generate_filename(self, url: str, prefix: str = "img") -> str:
        """生成唯一文件名"""
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{timestamp}_{url_hash}"

    def download_image(self, url: str, filename: str = None, description: str = "") -> Optional[str]:
        """
        下载图片

        Args:
            url: 图片 URL
            filename: 文件名（可选）
            description: 图片描述

        Returns:
            本地文件路径或 None
        """
        try:
            # 确定文件扩展名
            parsed = urlparse(url)
            ext = os.path.splitext(parsed.path)[1] or '.jpg'
            if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']:
                ext = '.jpg'

            # 生成文件名
            if not filename:
                filename = self._generate_filename(url)
            filename = filename + ext
            filepath = self.output_dir / filename

            # 如果已存在，直接返回
            if filepath.exists():
                print(f"[SKIP] 图片已存在: {filename}")
                return str(filepath)

            print(f"[INFO] 下载图片: {url}")
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            # 保存图片
            with open(filepath, 'wb') as f:
                f.write(response.content)

            # 更新索引
            self.image_index["images"].append({
                "filename": filename,
                "url": url,
                "description": description,
                "downloaded_at": datetime.now().isoformat()
            })
            self._save_index()

            print(f"[OK] 图片已保存: {filepath}")
            return str(filepath)

        except Exception as e:
            print(f"[ERROR] 下载图片失败: {e}")
            return None

    def search_wikimedia(self, query: str, limit: int = 5) -> List[Dict]:
        """
        从 Wikimedia Commons 搜索图片

        Args:
            query: 搜索关键词
            limit: 返回数量限制

        Returns:
            图片信息列表
        """
        try:
            # Wikimedia API
            api_url = "https://commons.wikimedia.org/w/api.php"
            params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srnamespace": "6",  # File namespace
                "srlimit": limit,
                "format": "json"
            }

            response = requests.get(api_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("query", {}).get("search", []):
                title = item.get("title", "").replace("File:", "")
                # 获取图片 URL
                image_info = self._get_wikimedia_image_url(title)
                if image_info:
                    results.append({
                        "title": title,
                        "url": image_info["url"],
                        "thumb_url": image_info.get("thumburl"),
                        "description": image_info.get("description", "")
                    })

            return results

        except Exception as e:
            print(f"[ERROR] Wikimedia 搜索失败: {e}")
            return []

    def _get_wikimedia_image_url(self, filename: str) -> Optional[Dict]:
        """获取 Wikimedia 图片的 URL"""
        try:
            api_url = "https://commons.wikimedia.org/w/api.php"
            params = {
                "action": "query",
                "titles": f"File:{filename}",
                "prop": "imageinfo",
                "iiprop": "url|thumburl|extmetadata",
                "iiurlwidth": 800,  # 缩略图宽度
                "format": "json"
            }

            response = requests.get(api_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                if "imageinfo" in page_info:
                    info = page_info["imageinfo"][0]
                    return {
                        "url": info.get("url"),
                        "thumburl": info.get("thumburl"),
                        "description": info.get("extmetadata", {}).get("ImageDescription", {}).get("value", "")
                    }
            return None

        except Exception as e:
            print(f"[ERROR] 获取图片 URL 失败: {e}")
            return None

    def search_unsplash(self, query: str, limit: int = 5) -> List[Dict]:
        """
        从 Unsplash 搜索图片

        Args:
            query: 搜索关键词
            limit: 返回数量限制

        Returns:
            图片信息列表
        """
        results = []

        # 如果有 API key，使用官方 API
        if self.unsplash_access_key:
            try:
                api_url = "https://api.unsplash.com/search/photos"
                params = {
                    "query": query,
                    "per_page": limit,
                    "client_id": self.unsplash_access_key
                }

                response = requests.get(api_url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()

                for item in data.get("results", []):
                    results.append({
                        "title": item.get("description") or item.get("alt_description", ""),
                        "url": item.get("urls", {}).get("regular"),
                        "thumb_url": item.get("urls", {}).get("small"),
                        "author": item.get("user", {}).get("name", ""),
                        "source": "Unsplash",
                        "source_url": item.get("links", {}).get("html", "")
                    })

                return results

            except Exception as e:
                print(f"[ERROR] Unsplash API 搜索失败: {e}")

        # 使用 source.unsplash.com（免费，无需认证）
        try:
            for i in range(limit):
                # 使用 source.unsplash.com 获取随机相关图片
                url = f"https://source.unsplash.com/800x600/?{quote(query)}&sig={i}"
                results.append({
                    "title": f"Unsplash: {query}",
                    "url": url,
                    "source": "Unsplash",
                    "source_url": f"https://unsplash.com/s/photos/{quote(query)}"
                })
        except Exception as e:
            print(f"[ERROR] Unsplash 搜索失败: {e}")

        return results

    def search_images(self, query: str, sources: List[str] = None, limit: int = 5) -> List[Dict]:
        """
        综合搜索图片

        Args:
            query: 搜索关键词
            sources: 来源列表，默认 ['wikimedia', 'unsplash']
            limit: 每个来源的数量限制

        Returns:
            图片信息列表
        """
        if sources is None:
            sources = ['wikimedia', 'unsplash']

        all_results = []

        if 'wikimedia' in sources:
            results = self.search_wikimedia(query, limit)
            for r in results:
                r['source'] = 'Wikimedia Commons'
            all_results.extend(results)

        if 'unsplash' in sources:
            results = self.search_unsplash(query, limit)
            all_results.extend(results)

        return all_results

    def download_for_article(self, article_id: str, image_specs: List[Dict]) -> List[Dict]:
        """
        为文章下载所需图片

        Args:
            article_id: 文章标识
            image_specs: 图片规格列表，每个包含 description, query 等

        Returns:
            下载结果列表
        """
        results = []

        for i, spec in enumerate(image_specs):
            query = spec.get("query") or spec.get("description", "")
            description = spec.get("description", "")

            print(f"[INFO] 搜索图片 {i+1}/{len(image_specs)}: {query}")

            # 搜索图片
            search_results = self.search_images(query, limit=3)

            if search_results:
                # 选择第一个结果下载
                img_info = search_results[0]
                filename = f"{article_id}_{i+1}"

                local_path = self.download_image(
                    img_info["url"],
                    filename=filename,
                    description=description
                )

                if local_path:
                    results.append({
                        "local_path": local_path,
                        "source": img_info.get("source", ""),
                        "source_url": img_info.get("source_url", img_info.get("url")),
                        "description": description,
                        "author": img_info.get("author", "")
                    })

            # 避免请求过快
            time.sleep(1)

        # 更新文章图片索引
        if results:
            self.image_index["articles"][article_id] = {
                "images": results,
                "updated_at": datetime.now().isoformat()
            }
            self._save_index()

        return results

    def generate_diagram(self, diagram_type: str, params: Dict) -> Optional[str]:
        """
        使用 matplotlib 生成示意图

        Args:
            diagram_type: 图表类型
            params: 参数

        Returns:
            生成的图片路径
        """
        import matplotlib
        matplotlib.use('Agg')  # 非交互式后端
        import matplotlib.pyplot as plt
        import numpy as np

        try:
            fig, ax = plt.subplots(figsize=(10, 6))

            if diagram_type == "gaussian_beam":
                # 高斯光束示意图
                z = np.linspace(-5, 5, 100)
                w0 = params.get("w0", 1)
                zR = params.get("zR", 2)

                w = w0 * np.sqrt(1 + (z/zR)**2)

                ax.plot(z, w, 'b-', linewidth=2, label='Beam radius')
                ax.plot(z, -w, 'b-', linewidth=2)
                ax.fill_between(z, -w, w, alpha=0.3)
                ax.axhline(y=0, color='k', linestyle='--', alpha=0.5)
                ax.set_xlabel('z (Rayleigh lengths)')
                ax.set_ylabel('w(z) / w₀')
                ax.set_title('Gaussian Beam Propagation')
                ax.legend()
                ax.grid(True, alpha=0.3)

            elif diagram_type == "wave_propagation":
                # 波动传播示意图
                x = np.linspace(0, 4*np.pi, 200)
                y = np.sin(x)

                ax.plot(x, y, 'b-', linewidth=2)
                ax.set_xlabel('Position')
                ax.set_ylabel('Amplitude')
                ax.set_title('Wave Propagation')
                ax.grid(True, alpha=0.3)

            else:
                print(f"[WARN] 未知图表类型: {diagram_type}")
                return None

            # 保存图片
            filename = f"{diagram_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = self.output_dir / filename
            plt.savefig(filepath, dpi=150, bbox_inches='tight', facecolor='white')
            plt.close()

            print(f"[OK] 图表已生成: {filepath}")
            return str(filepath)

        except Exception as e:
            print(f"[ERROR] 生成图表失败: {e}")
            return None


# 测试代码
if __name__ == "__main__":
    handler = ImageHandler()

    print("=" * 50)
    print("测试图片搜索")
    print("=" * 50)

    # 测试 Wikimedia 搜索
    results = handler.search_wikimedia("Gaussian beam", limit=3)
    print(f"找到 {len(results)} 张图片:")
    for r in results:
        print(f"  - {r['title']}: {r['url']}")

    print("\n" + "=" * 50)
    print("测试图表生成")
    print("=" * 50)

    # 测试图表生成
    path = handler.generate_diagram("gaussian_beam", {"w0": 1, "zR": 2})
    if path:
        print(f"图表已保存到: {path}")
