#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动博客生成脚本 - 主入口
用于命令行调用和 GitHub Actions 自动执行
"""
import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# 添加模块路径
sys.path.insert(0, str(Path(__file__).parent))

from blog_generator import BlogGenerator, TopicManager


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="自动博客生成系统",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 生成 5 篇文章（保存到 temp 目录）
  python generate_blog.py --generate 5

  # 指定主题生成
  python generate_blog.py --topic "高斯光束传播特性"

  # 查看系统状态
  python generate_blog.py --status

  # 发布 temp 目录的文章
  python generate_blog.py --publish

  # 添加主题到队列
  python generate_blog.py --add-topic "我的主题"

  # 查看主题队列
  python generate_blog.py --queue
"""
    )

    # 生成相关参数
    parser.add_argument("--generate", "-g", type=int, metavar="N",
                        help="随机生成 N 篇文章")
    parser.add_argument("--topic", "-t", type=str, metavar="主题",
                        help="指定单个主题生成文章")
    parser.add_argument("--topics", type=str, metavar="主题列表",
                        help="批量指定主题（逗号分隔）")
    parser.add_argument("--category", "-c", type=str, metavar="分类",
                        help="指定文章分类")

    # 发布相关参数
    parser.add_argument("--publish", "-p", action="store_true",
                        help="发布 temp 目录中的所有文章")
    parser.add_argument("--publish-file", type=str, metavar="文件名",
                        help="发布指定的 temp 文件")
    parser.add_argument("--direct", action="store_true",
                        help="直接保存到正式目录（跳过 temp）")

    # 状态查询参数
    parser.add_argument("--status", "-s", action="store_true",
                        help="查看系统状态")
    parser.add_argument("--queue", action="store_true",
                        help="查看主题队列")
    parser.add_argument("--list-categories", action="store_true",
                        help="列出所有分类")

    # 主题管理参数
    parser.add_argument("--add-topic", type=str, metavar="主题",
                        help="添加主题到队列")
    parser.add_argument("--clear-history", action="store_true",
                        help="清空主题使用历史")

    # 配置参数
    parser.add_argument("--config", type=str, metavar="配置文件",
                        help="指定配置文件（JSON 格式）")

    args = parser.parse_args()

    # 初始化生成器
    generator = BlogGenerator()
    topic_manager = TopicManager()

    # 执行命令
    if args.status:
        print("\n" + "=" * 50)
        print("📊 自动博客系统状态")
        print("=" * 50)

        status = generator.get_status()

        print("\n【主题状态】")
        print(f"  总主题数: {status['topics']['total_available']}")
        print(f"  已使用: {status['topics']['used_count']}")
        print(f"  剩余可用: {status['topics']['remaining_count']}")
        print(f"  队列中: {status['topics']['queue_count']}")

        print("\n【分类统计】")
        for cat, count in status['topics']['categories'].items():
            print(f"  - {cat}: {count} 个主题")

        print("\n【文章状态】")
        print(f"  待发布文章: {status['temp_articles']} 篇")
        print(f"  引用库记录: {status['references']['total']} 条")

        print("=" * 50)

    elif args.queue:
        print("\n📋 当前主题队列:")
        print("-" * 40)
        if topic_manager.queue:
            for i, item in enumerate(topic_manager.queue, 1):
                print(f"{i}. [{item.get('category', 'N/A')}] {item['topic']}")
                print(f"   添加时间: {item.get('added_at', 'N/A')}")
        else:
            print("队列为空")
        print("-" * 40)

    elif args.list_categories:
        print("\n📚 可用分类:")
        print("-" * 40)
        for cat in topic_manager.list_categories():
            topics = topic_manager.get_topics_by_category(cat)
            print(f"\n【{cat}】 ({len(topics)} 个主题)")
            for i, topic in enumerate(topics[:5], 1):
                print(f"  {i}. {topic}")
            if len(topics) > 5:
                print(f"  ... 还有 {len(topics) - 5} 个主题")
        print("-" * 40)

    elif args.add_topic:
        topic_manager.add_to_queue(
            topic=args.add_topic,
            category=args.category
        )

    elif args.clear_history:
        topic_manager.clear_history()

    elif args.generate or args.topics or args.topic:
        # 确定生成模式
        save_to_temp = not args.direct

        if args.topic:
            # 单主题生成
            print(f"\n🎯 生成单篇文章: {args.topic}")
            generator.generate_single_article(
                topic=args.topic,
                category=args.category,
                save_to_temp=save_to_temp
            )

        elif args.topics:
            # 批量指定主题
            topics_list = [t.strip() for t in args.topics.split(",")]
            print(f"\n🎯 批量生成 {len(topics_list)} 篇指定主题文章")
            generator.generate_batch(
                topics=topics_list,
                category=args.category,
                save_to_temp=save_to_temp
            )

        elif args.generate:
            # 随机批量生成
            count = args.generate
            print(f"\n🎯 随机生成 {count} 篇文章")
            generator.generate_batch(
                count=count,
                category=args.category,
                save_to_temp=save_to_temp
            )

    elif args.publish:
        print("\n📤 发布 temp 目录中的所有文章...")
        generator.publish_from_temp()

    elif args.publish_file:
        print(f"\n📤 发布文章: {args.publish_file}")
        generator.publish_from_temp(args.publish_file)

    elif args.config:
        # 从配置文件读取参数
        config_path = Path(args.config)
        if not config_path.exists():
            print(f"[ERROR] 配置文件不存在: {config_path}")
            return 1

        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        print(f"\n⚙️ 从配置文件执行: {config_path}")

        # 根据配置执行
        if config.get("topics"):
            generator.generate_batch(
                topics=config["topics"],
                category=config.get("category"),
                save_to_temp=config.get("save_to_temp", True)
            )
        elif config.get("count"):
            generator.generate_batch(
                count=config["count"],
                category=config.get("category"),
                save_to_temp=config.get("save_to_temp", True)
            )
        elif config.get("publish"):
            generator.publish_from_temp()

    else:
        parser.print_help()

    return 0


if __name__ == "__main__":
    sys.exit(main())