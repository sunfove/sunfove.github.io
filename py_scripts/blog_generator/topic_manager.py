"""
主题管理模块
负责管理博客主题的选取、历史记录、主题队列等
"""
import os
import json
import random
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict


class TopicManager:
    """博客主题管理器"""

    # 预设的专业领域主题池
    DEFAULT_TOPICS = {
        "optics": [
            "高斯光束传播特性与应用",
            "衍射光学元件设计原理",
            "光学薄膜设计与分析",
            "非成像光学设计",
            "激光谐振腔设计",
            "光纤光学与模式耦合",
            "微纳光学与超表面",
            "自适应光学原理",
            "光学成像质量评价（MTF/PSF）",
            "偏振光学与琼斯矩阵",
            "非线性光学效应（谐波产生、光参量振荡）",
            "光学涡旋与轨道角动量",
            "光子晶体与光子带隙",
            "集成光子学器件",
            "光学超分辨成像技术",
        ],
        "algorithms": [
            "梯度下降算法及其变种",
            "遗传算法与进化策略",
            "粒子群优化算法",
            "模拟退火算法",
            "贝叶斯优化方法",
            "强化学习基础与算法",
            "卷积神经网络架构演进",
            "Transformer架构解析",
            "图神经网络原理",
            "生成对抗网络（GAN）",
            "变分自编码器（VAE）",
            "扩散模型原理",
            "注意力机制详解",
            "知识蒸馏技术",
            "模型量化与剪枝",
        ],
        "physics": [
            "麦克斯韦方程组的物理意义",
            "量子力学基础（薛定谔方程）",
            "统计力学与玻尔兹曼分布",
            "热力学定律与熵",
            "电磁波传播理论",
            "固体物理基础（能带理论）",
            "半导体物理与PN结",
            "激光原理（受激辐射）",
            "量子纠缠与贝尔不等式",
            "相对论基础（洛伦兹变换）",
            "流体力学基础",
            "声学波动方程",
            "等离子体物理导论",
            "超导物理基础",
            "拓扑物理简介",
        ],
        "mathematics": [
            "傅里叶变换与应用",
            "拉普拉斯变换",
            "小波变换原理",
            "矩阵分解技术（SVD/EVD）",
            "数值积分方法",
            "微分方程数值解法",
            "优化理论基础",
            "概率论与统计推断",
            "信息论基础（熵与互信息）",
            "图论基础算法",
            "数值稳定性与条件数",
            "张量分解与张量网络",
            "随机过程导论",
            "泛函分析基础",
            "复变函数与保角映射",
        ],
        "signal_processing": [
            "数字滤波器设计",
            "快速傅里叶变换（FFT）",
            "采样定理与信号重建",
            "自适应滤波器",
            "小波分析与应用",
            "时频分析方法",
            "图像处理基础",
            "边缘检测算法",
            "图像分割技术",
            "图像复原与去噪",
            "压缩感知理论",
            "阵列信号处理",
            "盲源分离技术",
            "语音信号处理",
            "雷达信号处理",
        ],
    }

    def __init__(self, base_dir: str = None):
        """
        初始化主题管理器

        Args:
            base_dir: 博客根目录
        """
        if base_dir is None:
            base_dir = Path(__file__).parent.parent.parent
        self.base_dir = Path(base_dir)
        self.temp_dir = self.base_dir / "temp"
        self.posts_dir = self.base_dir / "source" / "_posts"
        self.history_file = self.temp_dir / "topic_history.json"
        self.queue_file = self.temp_dir / "topic_queue.json"

        # 确保目录存在
        self.temp_dir.mkdir(parents=True, exist_ok=True)

        # 加载历史记录
        self.history = self._load_history()
        self.queue = self._load_queue()

    def _load_history(self) -> Dict:
        """加载主题历史记录"""
        if self.history_file.exists():
            with open(self.history_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"used_topics": [], "used_keywords": []}

    def _save_history(self):
        """保存主题历史记录"""
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(self.history, f, ensure_ascii=False, indent=2)

    def _load_queue(self) -> List[Dict]:
        """加载主题队列"""
        if self.queue_file.exists():
            with open(self.queue_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def _save_queue(self):
        """保存主题队列"""
        with open(self.queue_file, 'w', encoding='utf-8') as f:
            json.dump(self.queue, f, ensure_ascii=False, indent=2)

    def add_to_queue(self, topic: str, category: str = None, keywords: List[str] = None):
        """
        添加主题到队列

        Args:
            topic: 主题名称
            category: 所属分类
            keywords: 关键词列表
        """
        item = {
            "topic": topic,
            "category": category or "uncategorized",
            "keywords": keywords or [],
            "added_at": datetime.now().isoformat()
        }
        self.queue.append(item)
        self._save_queue()
        print(f"[OK] 已添加主题到队列: {topic}")

    def get_next_topic(self) -> Optional[Dict]:
        """从队列获取下一个主题"""
        if self.queue:
            topic = self.queue.pop(0)
            self._save_queue()
            return topic
        return None

    def select_random_topics(self, n: int = 5, avoid_duplicates: bool = True) -> List[Dict]:
        """
        随机选择 n 个主题

        Args:
            n: 选择数量
            avoid_duplicates: 是否避免重复

        Returns:
            主题列表
        """
        all_topics = []
        for category, topics in self.DEFAULT_TOPICS.items():
            for topic in topics:
                if avoid_duplicates and topic in self.history.get("used_topics", []):
                    continue
                all_topics.append({
                    "topic": topic,
                    "category": category,
                    "keywords": self._extract_keywords(topic)
                })

        if len(all_topics) < n:
            print(f"[WARN] 可用主题不足 {n} 个，将返回所有可用主题")
            selected = all_topics
        else:
            selected = random.sample(all_topics, n)

        return selected

    def _extract_keywords(self, topic: str) -> List[str]:
        """从主题中提取关键词"""
        # 简单的关键词提取（实际可以用 NLP 方法增强）
        keywords = []
        # 移除常见停用词，提取核心词汇
        stop_words = {"的", "与", "及", "和", "或", "等", "之"}
        words = topic.replace("(", " ").replace(")", " ").split()
        for word in words:
            if word not in stop_words and len(word) > 1:
                keywords.append(word)
        return keywords

    def mark_topic_used(self, topic: str, keywords: List[str] = None):
        """标记主题已使用"""
        if topic not in self.history["used_topics"]:
            self.history["used_topics"].append(topic)
        if keywords:
            for kw in keywords:
                if kw not in self.history["used_keywords"]:
                    self.history["used_keywords"].append(kw)
        self._save_history()

    def get_topic_status(self) -> Dict:
        """获取主题使用状态"""
        total_topics = sum(len(topics) for topics in self.DEFAULT_TOPICS.values())
        used_count = len(self.history.get("used_topics", []))
        queue_count = len(self.queue)

        return {
            "total_available": total_topics,
            "used_count": used_count,
            "remaining_count": total_topics - used_count,
            "queue_count": queue_count,
            "categories": {cat: len(topics) for cat, topics in self.DEFAULT_TOPICS.items()}
        }

    def clear_history(self):
        """清空历史记录"""
        self.history = {"used_topics": [], "used_keywords": []}
        self._save_history()
        print("[OK] 历史记录已清空")

    def list_categories(self) -> List[str]:
        """列出所有分类"""
        return list(self.DEFAULT_TOPICS.keys())

    def get_topics_by_category(self, category: str) -> List[str]:
        """获取指定分类的主题"""
        return self.DEFAULT_TOPICS.get(category, [])


# 命令行接口
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="博客主题管理器")
    parser.add_argument("--status", action="store_true", help="查看主题状态")
    parser.add_argument("--select", type=int, default=5, help="随机选择 N 个主题")
    parser.add_argument("--add", type=str, help="添加主题到队列")
    parser.add_argument("--queue", action="store_true", help="查看当前队列")
    parser.add_argument("--clear", action="store_true", help="清空历史记录")

    args = parser.parse_args()

    tm = TopicManager()

    if args.status:
        status = tm.get_topic_status()
        print("\n📊 主题状态统计")
        print("=" * 40)
        print(f"总主题数: {status['total_available']}")
        print(f"已使用: {status['used_count']}")
        print(f"剩余可用: {status['remaining_count']}")
        print(f"队列中: {status['queue_count']}")
        print("\n各分类主题数:")
        for cat, count in status['categories'].items():
            print(f"  - {cat}: {count}")

    elif args.select:
        topics = tm.select_random_topics(args.select)
        print(f"\n🎯 已选择 {len(topics)} 个主题:")
        for i, t in enumerate(topics, 1):
            print(f"{i}. [{t['category']}] {t['topic']}")

    elif args.add:
        tm.add_to_queue(args.add)

    elif args.queue:
        if tm.queue:
            print("\n📋 当前主题队列:")
            for i, item in enumerate(tm.queue, 1):
                print(f"{i}. {item['topic']}")
        else:
            print("队列为空")

    elif args.clear:
        tm.clear_history()
