#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
超表面日报生成器 - Daily Metasurface Report
每天自动生成一篇超表面(Metaurface)领域的技术报告并发布到网站
"""
import os
import sys
import json
import random
import argparse
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from blog_generator.content_generator import ContentGenerator


class MetasurfaceTopicPool:
    """超表面主题池 - 涵盖超表面全领域"""

    TOPICS = {
        "fundamental_physics": [
            "广义斯涅尔定律与超表面相位调控",
            "几何相位(Pancharatnam-Berry相位)超表面原理",
            "传输相位与共振相位超表面设计",
            "超表面中的偏振调控机制",
            "超表面幅度与相位联合调制",
            "超表面色散工程与宽带设计",
            "超表面近场耦合效应分析",
            "超表面中的拓扑光学效应",
        ],
        "design_methods": [
            "超表面拓扑优化设计方法",
            "超表面逆向设计算法详解",
            "深度学习辅助超表面设计",
            "超表面多目标优化策略",
            "超表面单元库建立与筛选",
            "超表面周期性与非周期性设计",
            "超表面傅里叶光学设计方法",
            "超表面伴随法(Adjoint Method)优化",
        ],
        "metalenses": [
            "超构透镜(Metalens)设计与像差校正",
            "大数值孔径超构透镜设计挑战",
            "消色差超构透镜原理与实现",
            "超构透镜阵列与多焦点成像",
            "超构透镜在显微成像中的应用",
            "可调焦超构透镜设计方法",
            "超构透镜与计算成像结合",
            "超构透镜的偏振敏感成像",
        ],
        "holography": [
            "超表面全息术原理与实现",
            "动态超表面全息显示技术",
            "超表面多通道全息加密",
            "超表面计算全息算法优化",
            "三维超表面全息显示",
            "超表面全息光束整形",
            "超表面矢量全息技术",
        ],
        "beam_shaping": [
            "超表面涡旋光束生成与调控",
            "超表面贝塞尔光束产生",
            "超表面艾里光束生成原理",
            "超表面径向偏振光转换",
            "超表面角动量光束调控",
            "超表面完美涡旋光束设计",
            "超表面光束分束与阵列生成",
        ],
        "polarization": [
            "超表面半波片与四分之一波片",
            "超表面偏振转换器设计",
            "超表面琼斯矩阵操控",
            "手性超表面与圆二色性",
            "超表面偏振分束器设计",
            "超表面偏振成像技术",
            "超表面旋光效应增强",
        ],
        "tunable": [
            "液晶可调超表面原理",
            "相变材料(VO2/GST)可调超表面",
            "MEMS微机电可调超表面",
            "热光效应可调超表面",
            "电光效应可调超表面",
            "机械拉伸可调超表面",
            "全光可调超表面设计",
            "二维材料(石墨烯/MoS2)超表面",
        ],
        "sensing": [
            "超表面生物传感原理与应用",
            "超表面折射率传感器设计",
            "超表面表面增强拉曼散射(SERS)",
            "超表面气体检测技术",
            "超表面温度传感器",
            "超表面应变传感器",
            "超表面化学分子识别",
        ],
        "neural_optics": [
            "衍射深度神经网络(D2NN)原理",
            "超表面光学神经网络",
            "超表面图像处理器件",
            "超表面卷积运算实现",
            "超表面矩阵向量乘法",
            "全光学超表面AI加速器",
            "超表面与光子计算融合",
        ],
        "manufacturing": [
            "电子束光刻制备超表面",
            "深紫外光刻超表面制造",
            "纳米压印超表面批量制备",
            "自组装超表面制备技术",
            "激光直写超表面加工",
            "3D打印超表面结构",
            "CMOS兼容超表面工艺",
        ],
        "applications": [
            "超表面在AR/VR显示中的应用",
            "超表面激光雷达(LiDAR)技术",
            "超表面光通信器件",
            "超表面太阳能电池增强",
            "超表面热辐射调控",
            "超表面隐身与电磁屏蔽",
            "超表面量子光源产生",
            "超表面偏振相机设计",
        ],
    }

    @classmethod
    def get_random_topic(cls, category: str = None) -> dict:
        """随机获取一个主题"""
        if category and category in cls.TOPICS:
            topic = random.choice(cls.TOPICS[category])
            return {"topic": topic, "category": category}
        
        # 随机选择分类
        cat = random.choice(list(cls.TOPICS.keys()))
        topic = random.choice(cls.TOPICS[cat])
        return {"topic": topic, "category": cat}

    @classmethod
    def list_categories(cls) -> list:
        return list(cls.TOPICS.keys())

    @classmethod
    def get_all_topics(cls) -> list:
        """获取所有主题"""
        all_topics = []
        for cat, topics in cls.TOPICS.items():
            for t in topics:
                all_topics.append({"topic": t, "category": cat})
        return all_topics


class DailyMetasurfaceReport:
    """超表面日报生成器"""

    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = Path(__file__).parent.parent
        self.base_dir = Path(base_dir)
        self.posts_dir = self.base_dir / "source" / "_posts"
        self.public_dir = self.base_dir / "public"
        
        # 初始化内容生成器
        self.content_generator = ContentGenerator()
        self.topic_pool = MetasurfaceTopicPool()
        
        # 历史记录
        self.history_file = self.base_dir / "temp" / "metasurface_history.json"
        self.history = self._load_history()

    def _load_history(self) -> dict:
        """加载历史记录"""
        if self.history_file.exists():
            with open(self.history_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"used_topics": [], "generated_dates": []}

    def _save_history(self):
        """保存历史记录"""
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(self.history, f, ensure_ascii=False, indent=2)

    def select_topic(self) -> dict:
        """选择一个未使用过的主题"""
        all_topics = self.topic_pool.get_all_topics()
        available = [t for t in all_topics if t["topic"] not in self.history["used_topics"]]
        
        if not available:
            print("[INFO] 所有主题已用完，重置历史记录")
            self.history["used_topics"] = []
            available = all_topics
        
        topic = random.choice(available)
        return topic

    def generate_report(self, topic: dict = None) -> dict:
        """生成超表面日报"""
        if topic is None:
            topic = self.select_topic()
        
        topic_name = topic["topic"]
        category = topic["category"]
        
        print(f"\n{'='*60}")
        print(f"📝 生成超表面日报")
        print(f"📌 主题: {topic_name}")
        print(f"🏷️ 分类: {category}")
        print(f"{'='*60}\n")
        
        # 使用内容生成器生成文章
        article = self.content_generator.generate_article(
            topic=topic_name,
            category="超表面技术"
        )
        
        if not article:
            print("[ERROR] 文章生成失败")
            return None
        
        # 生成文章文件名
        date_str = datetime.now().strftime("%Y-%m-%d")
        slug = self._generate_slug(topic_name)
        filename = f"{date_str}-metasurface-{slug}.md"
        
        # 生成 Hexo Front-matter
        front_matter = self._generate_front_matter(article, topic_name)
        
        # 完整文章内容
        full_content = front_matter + "\n\n" + article["content"]
        
        return {
            "filename": filename,
            "title": topic_name,
            "category": category,
            "content": full_content,
            "date": date_str
        }

    def _generate_slug(self, title: str) -> str:
        """生成URL友好的slug"""
        import re
        # 简单的中文转拼音或保留关键字符
        slug = re.sub(r'[^\w\s-]', '', title)
        slug = re.sub(r'[\s]+', '-', slug)
        return slug[:50].lower().strip('-')

    def _generate_front_matter(self, article: dict, topic: str) -> str:
        """生成Hexo Front-matter"""
        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        excerpt = article.get("excerpt", f"今日超表面技术日报：{topic}")
        
        # 随机标签
        tags = self._generate_tags(topic)
        
        front_matter = f"""---
title: {topic}
date: {date_str}
categories:
  - 超表面技术
tags:
{chr(10).join(f'  - {tag}' for tag in tags)}
excerpt: {excerpt}
index_img: /img/fluid.png
---"""
        return front_matter

    def _generate_tags(self, topic: str) -> list:
        """根据主题生成标签"""
        base_tags = ["超表面", "Metasurface", "纳米光子学"]
        
        # 根据主题内容添加特定标签
        if "透镜" in topic or "Metalens" in topic:
            base_tags.extend(["超构透镜", "Metalens"])
        if "全息" in topic:
            base_tags.extend(["全息", "Holography"])
        if "偏振" in topic:
            base_tags.extend(["偏振光学", "Polarization"])
        if "涡旋" in topic or "光束" in topic:
            base_tags.extend(["光束整形", "Beam Shaping"])
        if "可调" in topic or "动态" in topic:
            base_tags.extend(["可调超表面", "Active Metasurface"])
        if "传感" in topic:
            base_tags.extend(["光学传感", "Optical Sensing"])
        if "神经" in topic or "AI" in topic or "深度" in topic:
            base_tags.extend(["光学神经网络", "Optical AI"])
        if "设计" in topic and ("优化" in topic or "逆向" in topic):
            base_tags.extend(["拓扑优化", "逆向设计"])
        if "制备" in topic or "制造" in topic or "光刻" in topic:
            base_tags.extend(["纳米制造", "Nanofabrication"])
        
        return base_tags[:6]  # 最多6个标签

    def save_article(self, article_data: dict) -> Path:
        """保存文章到_posts目录"""
        filepath = self.posts_dir / article_data["filename"]
        self.posts_dir.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(article_data["content"])
        
        print(f"[OK] 文章已保存: {filepath}")
        return filepath

    def mark_as_used(self, topic: str):
        """标记主题已使用"""
        if topic not in self.history["used_topics"]:
            self.history["used_topics"].append(topic)
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.history["generated_dates"]:
            self.history["generated_dates"].append(today)
        self._save_history()

    def build_and_deploy(self):
        """构建并部署网站"""
        print("\n🔨 开始构建网站...")
        
        # Hexo 构建
        os.chdir(self.base_dir)
        result = os.system("npx hexo generate 2>&1")
        
        if result != 0:
            print("[ERROR] Hexo 构建失败")
            return False
        
        print("[OK] Hexo 构建完成")
        
        # 复制到 Nginx 目录
        deploy_cmd = f"sudo cp -r {self.public_dir}/* /var/www/time-frame.cloud/ && sudo chown -R www-data:www-data /var/www/time-frame.cloud"
        result = os.system(deploy_cmd)
        
        if result != 0:
            print("[ERROR] 部署失败，尝试用 sudo...")
            return False
        
        print("[OK] 网站已部署到 /var/www/time-frame.cloud")
        return True

    def run(self, dry_run: bool = False):
        """执行完整流程"""
        try:
            # 1. 选择并生成主题
            topic = self.select_topic()
            print(f"📋 选定主题: {topic['topic']}")
            
            # 2. 生成文章
            article_data = self.generate_report(topic)
            if not article_data:
                return False
            
            # 3. 保存文章
            if not dry_run:
                self.save_article(article_data)
                self.mark_as_used(topic["topic"])
                
                # 4. 构建并部署
                self.build_and_deploy()
                
                print(f"\n✅ 超表面日报发布成功!")
                print(f"📅 日期: {article_data['date']}")
                print(f"📝 标题: {article_data['title']}")
                print(f"🔗 链接: https://time-frame.cloud/{article_data['date'].replace('-', '/')}/{article_data['filename'].replace('.md', '')}/")
            else:
                print(f"\n🧪 干运行模式，文章未保存")
                print(f"预览标题: {article_data['title']}")
                print(f"预览内容前200字:\n{article_data['content'][:200]}...")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] 执行失败: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    parser = argparse.ArgumentParser(description="超表面日报生成器")
    parser.add_argument("--dry-run", action="store_true", help="干运行模式（不保存不部署）")
    parser.add_argument("--topic", type=str, help="指定主题生成")
    parser.add_argument("--category", type=str, help="指定分类")
    parser.add_argument("--list-topics", action="store_true", help="列出所有可用主题")
    parser.add_argument("--build-only", action="store_true", help="仅构建部署（不生成新文章）")
    
    args = parser.parse_args()
    
    reporter = DailyMetasurfaceReport()
    
    if args.list_topics:
        print("\n📚 超表面主题池")
        print("=" * 60)
        for cat, topics in MetasurfaceTopicPool.TOPICS.items():
            print(f"\n【{cat}】({len(topics)}个主题)")
            for i, t in enumerate(topics, 1):
                print(f"  {i}. {t}")
        print("=" * 60)
        return
    
    if args.build_only:
        reporter.build_and_deploy()
        return
    
    if args.topic:
        topic = {"topic": args.topic, "category": args.category or "custom"}
        reporter.run(dry_run=args.dry_run)
    else:
        reporter.run(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
