"""
引用管理模块
负责管理和生成文章的引用记录
"""
import os
import re
import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


class ReferenceManager:
    """引用管理器"""

    def __init__(self, output_dir: str = None):
        """
        初始化引用管理器

        Args:
            output_dir: 输出目录
        """
        if output_dir is None:
            output_dir = Path(__file__).parent.parent.parent / "temp"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 引用数据库文件
        self.db_file = self.output_dir / "references_db.json"
        self.references_db = self._load_db()

    def _load_db(self) -> Dict:
        """加载引用数据库"""
        if self.db_file.exists():
            with open(self.db_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "papers": {},
            "websites": {},
            "images": {}
        }

    def _save_db(self):
        """保存引用数据库"""
        with open(self.db_file, 'w', encoding='utf-8') as f:
            json.dump(self.references_db, f, ensure_ascii=False, indent=2)

    def add_paper(self, paper_id: str, title: str, authors: List[str],
                  journal: str, year: int, doi: str = None, url: str = None):
        """
        添加论文引用

        Args:
            paper_id: 引用标识
            title: 论文标题
            authors: 作者列表
            journal: 期刊名
            year: 发表年份
            doi: DOI
            url: URL
        """
        self.references_db["papers"][paper_id] = {
            "title": title,
            "authors": authors,
            "journal": journal,
            "year": year,
            "doi": doi,
            "url": url,
            "added_at": datetime.now().isoformat()
        }
        self._save_db()
        print(f"[OK] 已添加论文引用: {title}")

    def add_website(self, site_id: str, title: str, url: str,
                    author: str = None, accessed_date: str = None):
        """
        添加网站引用

        Args:
            site_id: 引用标识
            title: 网站标题
            url: URL
            author: 作者/机构
            accessed_date: 访问日期
        """
        if accessed_date is None:
            accessed_date = datetime.now().strftime("%Y-%m-%d")

        self.references_db["websites"][site_id] = {
            "title": title,
            "url": url,
            "author": author,
            "accessed_date": accessed_date,
            "added_at": datetime.now().isoformat()
        }
        self._save_db()
        print(f"[OK] 已添加网站引用: {title}")

    def add_image(self, image_id: str, title: str, source: str,
                  url: str, author: str = None, license: str = None):
        """
        添加图片引用

        Args:
            image_id: 图片标识
            title: 图片标题/描述
            source: 来源
            url: 原始 URL
            author: 作者
            license: 许可证
        """
        self.references_db["images"][image_id] = {
            "title": title,
            "source": source,
            "url": url,
            "author": author,
            "license": license,
            "added_at": datetime.now().isoformat()
        }
        self._save_db()
        print(f"[OK] 已添加图片引用: {title}")

    def generate_bibliography(self, reference_ids: List[str] = None,
                               format: str = "markdown") -> str:
        """
        生成参考文献列表

        Args:
            reference_ids: 要包含的引用 ID 列表（None 表示全部）
            format: 输出格式（markdown/latex/bibtex）

        Returns:
            格式化的参考文献字符串
        """
        lines = []

        # 论文引用
        papers = self.references_db["papers"]
        if reference_ids:
            papers = {k: v for k, v in papers.items() if k in reference_ids}

        if papers:
            lines.append("## 学术论文")
            lines.append("")
            for i, (paper_id, paper) in enumerate(papers.items(), 1):
                if format == "markdown":
                    authors_str = ", ".join(paper["authors"])
                    line = f"{i}. {authors_str}. **{paper['title']}**. {paper['journal']}, {paper['year']}."
                    if paper.get("doi"):
                        line += f" [DOI: {paper['doi']}]"
                    if paper.get("url"):
                        line += f" [Link]({paper['url']})"
                    lines.append(line)

        # 网站引用
        websites = self.references_db["websites"]
        if reference_ids:
            websites = {k: v for k, v in websites.items() if k in reference_ids}

        if websites:
            lines.append("")
            lines.append("## 网络资源")
            lines.append("")
            for i, (site_id, site) in enumerate(websites.items(), 1):
                if format == "markdown":
                    line = f"{i}. "
                    if site.get("author"):
                        line += f"{site['author']}. "
                    line += f"[{site['title']}]({site['url']}). 访问于 {site['accessed_date']}."
                    lines.append(line)

        # 图片引用
        images = self.references_db["images"]
        if reference_ids:
            images = {k: v for k, v in images.items() if k in reference_ids}

        if images:
            lines.append("")
            lines.append("## 图片来源")
            lines.append("")
            for i, (image_id, image) in enumerate(images.items(), 1):
                if format == "markdown":
                    line = f"{i}. [{image['title']}]({image['url']})"
                    if image.get("author"):
                        line += f" by {image['author']}"
                    if image.get("source"):
                        line += f" - {image['source']}"
                    if image.get("license"):
                        line += f" ({image['license']})"
                    lines.append(line)

        return "\n".join(lines)

    def generate_disclaimer(self, article_title: str = "") -> str:
        """
        生成版权声明

        Args:
            article_title: 文章标题

        Returns:
            版权声明文本
        """
        disclaimer = f"""
---

**⚠️ 版权与免责声明 (Copyright & Disclaimer):**

本文《{article_title}》为非商业性的学术与技术分享，旨在促进相关领域的技术交流。

文中涉及的代码示例仅供学习参考，不保证在所有环境下正常运行。部分辅助理解的配图来源于公开网络检索，未能逐一联系原作者获取正式授权。图片版权均归属原作者或对应学术期刊、机构所有。

在此郑重声明：若原图权利人对本文的引用存在任何异议，或认为构成了未经授权的使用，请随时通过博客后台留言或邮件与本人联系。我将在收到通知后第一时间全力配合，进行版权信息的补充标明或立即执行删除处理。由衷感谢每一位科研工作者对科学知识开放传播的包容与贡献！

---
"""
        return disclaimer

    def extract_urls_from_content(self, content: str) -> List[str]:
        """
        从内容中提取 URL

        Args:
            content: 文章内容

        Returns:
            URL 列表
        """
        # 匹配 Markdown 链接
        pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        matches = re.findall(pattern, content)

        urls = []
        for text, url in matches:
            # 过滤掉本地路径和相对路径
            if url.startswith('http://') or url.startswith('https://'):
                urls.append(url)

        return urls

    def generate_references_from_content(self, content: str) -> str:
        """
        从内容自动生成引用列表

        Args:
            content: 文章内容

        Returns:
            引用列表
        """
        urls = self.extract_urls_from_content(content)
        if not urls:
            return ""

        lines = ["## 参考资料", ""]
        seen_urls = set()

        for i, url in enumerate(urls, 1):
            if url in seen_urls:
                continue
            seen_urls.add(url)

            # 提取域名作为来源
            from urllib.parse import urlparse
            domain = urlparse(url).netloc

            lines.append(f"{i}. [{domain}]({url})")

        return "\n".join(lines)

    def get_citation_count(self) -> Dict:
        """获取引用统计"""
        return {
            "papers": len(self.references_db["papers"]),
            "websites": len(self.references_db["websites"]),
            "images": len(self.references_db["images"]),
            "total": sum(len(v) for v in self.references_db.values())
        }


# 测试代码
if __name__ == "__main__":
    manager = ReferenceManager()

    # 添加测试引用
    manager.add_paper(
        paper_id="reck1994",
        title="Experimental realization of any discrete unitary operator",
        authors=["Reck, M.", "Zeilinger, A.", "Bernstein, H.J.", "Bertani, P."],
        journal="Physical Review Letters",
        year=1994,
        doi="10.1103/PhysRevLett.73.58"
    )

    manager.add_website(
        site_id="wikipedia_optics",
        title="Optics - Wikipedia",
        url="https://en.wikipedia.org/wiki/Optics",
        author="Wikipedia Contributors"
    )

    # 生成参考文献
    print(manager.generate_bibliography())
    print(manager.generate_disclaimer("测试文章"))
