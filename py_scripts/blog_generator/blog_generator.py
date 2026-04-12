"""
博客生成器主控模块
整合所有模块，生成完整的博客文章
"""
import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from .topic_manager import TopicManager
from .content_generator import ContentGenerator
from .code_executor import CodeExecutor
from .image_handler import ImageHandler
from .reference_manager import ReferenceManager


class BlogGenerator:
    """博客生成器主类"""

    def __init__(self, base_dir: str = None):
        """
        初始化博客生成器

        Args:
            base_dir: 博客根目录
        """
        if base_dir is None:
            base_dir = Path(__file__).parent.parent.parent
        self.base_dir = Path(base_dir)

        # 初始化各模块
        self.topic_manager = TopicManager(str(self.base_dir))
        self.content_generator = ContentGenerator()
        self.code_executor = CodeExecutor(str(self.base_dir / "temp" / "code_outputs"))
        self.image_handler = ImageHandler(str(self.base_dir / "source" / "images" / "articles"))
        self.reference_manager = ReferenceManager(str(self.base_dir / "temp"))

        # 目录配置
        self.temp_dir = self.base_dir / "temp"
        self.posts_dir = self.base_dir / "source" / "_posts"
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def generate_single_article(self, topic: str, category: str = None,
                                 keywords: List[str] = None,
                                 save_to_temp: bool = True) -> Optional[Dict]:
        """
        生成单篇文章

        Args:
            topic: 主题
            category: 分类
            keywords: 关键词
            save_to_temp: 是否保存到 temp 目录

        Returns:
            文章数据
        """
        print(f"\n{'='*60}")
        print(f"开始生成文章: {topic}")
        print(f"{'='*60}\n")

        # Step 1: 研究主题
        print("[Step 1/5] 研究主题...")
        research_data = self.content_generator.research_topic(topic)

        # Step 2: 生成文章内容
        print("\n[Step 2/5] 生成文章内容...")
        article_data = self.content_generator.generate_article(
            topic=topic,
            category=category or "uncategorized",
            research_data=research_data
        )

        if not article_data:
            print("[ERROR] 文章生成失败")
            return None

        # Step 3: 执行代码并捕获结果
        print("\n[Step 3/5] 执行代码...")
        if "code_blocks" in article_data:
            for code_block in article_data["code_blocks"]:
                if code_block.get("language") == "python":
                    print(f"  执行代码块: {code_block.get('id', 'unknown')}")
                    result = self.code_executor.execute_and_capture(
                        code_block["code"],
                        code_block.get("id", "code")
                    )
                    code_block["execution_result"] = result

        # Step 4: 处理图片
        print("\n[Step 4/5] 处理图片...")
        if "images_needed" in article_data and article_data["images_needed"]:
            article_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            image_results = self.image_handler.download_for_article(
                article_id=article_id,
                image_specs=article_data["images_needed"]
            )
            article_data["downloaded_images"] = image_results

        # Step 5: 生成最终 Markdown 文件
        print("\n[Step 5/5] 生成 Markdown 文件...")
        markdown_content = self._assemble_markdown(article_data)

        # 保存文件
        filename = self._generate_filename(topic)
        if save_to_temp:
            filepath = self.temp_dir / filename
        else:
            filepath = self.posts_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        print(f"\n[OK] 文章已保存: {filepath}")

        # 标记主题已使用
        self.topic_manager.mark_topic_used(topic, keywords)

        article_data["filepath"] = str(filepath)
        article_data["filename"] = filename

        return article_data

    def _assemble_markdown(self, article_data: Dict) -> str:
        """
        组装 Markdown 内容

        Args:
            article_data: 文章数据

        Returns:
            完整的 Markdown 内容
        """
        # Front matter
        title = article_data.get("title", article_data.get("topic", "Untitled"))
        excerpt = article_data.get("excerpt", "")
        category = article_data.get("category", "uncategorized")
        tags = article_data.get("keywords", [category])

        front_matter = f"""---
title: {title}
date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
categories: {category}
tags: {json.dumps(tags, ensure_ascii=False)}
excerpt: {excerpt}
mathjax: true
---

"""

        # 正文内容
        content = article_data.get("content", "")

        # 处理代码块，添加执行结果
        if "code_blocks" in article_data:
            content = self._insert_code_results(content, article_data["code_blocks"])

        # 处理图片占位符
        if "downloaded_images" in article_data:
            content = self._insert_images(content, article_data["downloaded_images"])

        # 添加参考文献
        if "references" in article_data:
            content += "\n\n" + self._format_references(article_data["references"])

        # 添加版权声明
        content += "\n\n" + self.reference_manager.generate_disclaimer(title)

        return front_matter + content

    def _insert_code_results(self, content: str, code_blocks: List[Dict]) -> str:
        """在 Markdown 中插入代码执行结果"""
        for block in code_blocks:
            result = block.get("execution_result")
            if not result or not result.get("success"):
                continue

            # 查找对应的代码块位置
            code_id = block.get("id", "")

            # 添加执行结果
            result_text = "\n\n**执行结果:**\n"

            if result.get("stdout"):
                # 限制输出长度
                stdout = result["stdout"]
                if len(stdout) > 500:
                    stdout = stdout[:500] + "\n... (输出过长，已截断)"
                result_text += f"\n```\n{stdout.strip()}\n```\n"

            # 添加图片
            for fig in result.get("figures", []):
                relative_path = fig.get("relative_path", fig.get("path", ""))
                result_text += f"\n![]({relative_path})\n"

            # 在代码块后插入结果
            # 这里简化处理，实际需要更精确的位置插入
            content = content.replace(
                f"```python\n{block.get('code', '')}\n```",
                f"```python\n{block.get('code', '')}\n```{result_text}"
            )

        return content

    def _insert_images(self, content: str, images: List[Dict]) -> str:
        """在 Markdown 中插入图片"""
        for img in images:
            # 替换图片占位符
            placeholder = f"[图片: {img.get('description', '')}]"
            relative_path = img.get("local_path", "")

            # 计算相对于 source 目录的路径
            if relative_path:
                try:
                    rel_path = Path(relative_path).relative_to(self.base_dir / "source")
                    img_markdown = f"![](/{rel_path})"
                except:
                    img_markdown = f"![]({relative_path})"

                content = content.replace(placeholder, img_markdown)

        return content

    def _format_references(self, references: List[Dict]) -> str:
        """格式化参考文献"""
        if not references:
            return ""

        lines = ["## 参考文献", ""]

        for i, ref in enumerate(references, 1):
            ref_type = ref.get("type", "paper")

            if ref_type == "paper":
                authors = ref.get("authors", "Unknown")
                if isinstance(authors, list):
                    authors = ", ".join(authors)
                lines.append(
                    f"{i}. {authors}. **{ref.get('title', '')}**. "
                    f"{ref.get('journal', '')}, {ref.get('year', '')}."
                )
            elif ref_type == "book":
                lines.append(
                    f"{i}. {ref.get('authors', '')}. **{ref.get('title', '')}**. "
                    f"{ref.get('publisher', '')}, {ref.get('year', '')}."
                )
            else:
                lines.append(f"{i}. {ref.get('title', '')}. {ref.get('url', '')}")

        return "\n".join(lines)

    def _generate_filename(self, topic: str) -> str:
        """生成文件名"""
        date_str = datetime.now().strftime("%Y-%m-%d")
        # 简化标题用于文件名
        safe_title = re.sub(r'[^\w\s-]', '', topic)
        safe_title = re.sub(r'[-\s]+', '-', safe_title).strip('-')
        safe_title = safe_title[:50]  # 限制长度
        return f"{date_str}-{safe_title}.md"

    def generate_batch(self, count: int = 5, category: str = None,
                       topics: List[str] = None, save_to_temp: bool = True) -> List[Dict]:
        """
        批量生成文章

        Args:
            count: 生成数量
            category: 指定分类
            topics: 指定主题列表
            save_to_temp: 是否保存到 temp 目录

        Returns:
            生成的文章列表
        """
        results = []

        # 获取要生成的主题
        if topics:
            topic_list = [{"topic": t, "category": category or "uncategorized"} for t in topics]
        else:
            # 优先从队列获取主题
            topic_list = []
            for _ in range(count):
                topic = self.topic_manager.get_next_topic()
                if topic:
                    topic_list.append(topic)

            # 如果队列不足，从预设主题中随机选择
            if len(topic_list) < count:
                remaining = count - len(topic_list)
                random_topics = self.topic_manager.select_random_topics(remaining)
                topic_list.extend(random_topics)

        print(f"\n{'='*60}")
        print(f"批量生成 {len(topic_list)} 篇文章")
        print(f"{'='*60}")

        for i, topic_info in enumerate(topic_list, 1):
            print(f"\n\n{'#'*60}")
            print(f"# 进度: {i}/{len(topic_list)}")
            print(f"{'#'*60}")

            result = self.generate_single_article(
                topic=topic_info["topic"],
                category=topic_info.get("category"),
                keywords=topic_info.get("keywords"),
                save_to_temp=save_to_temp
            )

            if result:
                results.append(result)

        print(f"\n\n{'='*60}")
        print(f"批量生成完成! 成功: {len(results)}/{len(topic_list)}")
        print(f"{'='*60}")

        return results

    def publish_from_temp(self, filename: str = None) -> bool:
        """
        将 temp 目录的文章发布到正式目录

        Args:
            filename: 文件名（None 表示发布所有）

        Returns:
            是否成功
        """
        if filename:
            source = self.temp_dir / filename
            if not source.exists():
                print(f"[ERROR] 文件不存在: {source}")
                return False

            dest = self.posts_dir / filename
            content = source.read_text(encoding='utf-8')

            # 更新日期
            content = re.sub(
                r'date: .*',
                f'date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
                content
            )

            dest.write_text(content, encoding='utf-8')
            print(f"[OK] 已发布: {filename}")
            return True

        else:
            # 发布所有 temp 目录的文章
            published = 0
            for md_file in self.temp_dir.glob("*.md"):
                if md_file.name.startswith("topic_"):  # 跳过配置文件
                    continue
                if self.publish_from_temp(md_file.name):
                    published += 1

            print(f"[OK] 共发布 {published} 篇文章")
            return published > 0

    def get_status(self) -> Dict:
        """获取系统状态"""
        topic_status = self.topic_manager.get_topic_status()
        ref_count = self.reference_manager.get_citation_count()

        # 统计 temp 目录的文章数
        temp_articles = list(self.temp_dir.glob("*.md"))
        temp_count = len([f for f in temp_articles if not f.name.startswith("topic_")])

        return {
            "topics": topic_status,
            "references": ref_count,
            "temp_articles": temp_count
        }


# 命令行入口
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="博客生成器")
    parser.add_argument("--generate", "-g", type=int, help="生成 N 篇文章")
    parser.add_argument("--topic", "-t", type=str, help="指定主题")
    parser.add_argument("--category", "-c", type=str, help="指定分类")
    parser.add_argument("--publish", "-p", type=str, nargs="?", const="all", help="发布文章（可指定文件名）")
    parser.add_argument("--status", "-s", action="store_true", help="查看状态")
    parser.add_argument("--no-temp", action="store_true", help="直接发布到正式目录")

    args = parser.parse_args()

    generator = BlogGenerator()

    if args.status:
        status = generator.get_status()
        print("\n📊 系统状态")
        print("=" * 40)
        print(f"主题: 已使用 {status['topics']['used_count']}/{status['topics']['total_available']}")
        print(f"队列: {status['topics']['queue_count']} 个待生成")
        print(f"引用库: {status['references']['total']} 条记录")
        print(f"临时文章: {status['temp_articles']} 篇待发布")

    elif args.publish:
        if args.publish == "all":
            generator.publish_from_temp()
        else:
            generator.publish_from_temp(args.publish)

    elif args.topic:
        generator.generate_single_article(
            topic=args.topic,
            category=args.category,
            save_to_temp=not args.no_temp
        )

    elif args.generate:
        generator.generate_batch(
            count=args.generate,
            category=args.category,
            save_to_temp=not args.no_temp
        )

    else:
        parser.print_help()
