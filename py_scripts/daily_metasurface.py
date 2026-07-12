#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
超表面日报生成器 - Daily Metasurface Report
支持两种模式：
1. LLM API 模式（独立运行）
2. Agent 模式（由 AI 填充内容后发布）
"""
import os
import sys
import json
import random
import argparse
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


class MetasurfaceTopicPool:
    """超表面主题池"""

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
        if category and category in cls.TOPICS:
            topic = random.choice(cls.TOPICS[category])
            return {"topic": topic, "category": category}
        cat = random.choice(list(cls.TOPICS.keys()))
        topic = random.choice(cls.TOPICS[cat])
        return {"topic": topic, "category": cat}

    @classmethod
    def get_all_topics(cls) -> list:
        all_topics = []
        for cat, topics in cls.TOPICS.items():
            for t in topics:
                all_topics.append({"topic": t, "category": cat})
        return all_topics

    @classmethod
    def export_to_json(cls, filepath: str):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(cls.TOPICS, f, ensure_ascii=False, indent=2)


def generate_front_matter(title: str, category: str, date_str: str = None) -> str:
    """生成 Hexo Front-matter"""
    if date_str is None:
        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    tags_map = {
        "fundamental_physics": ["超表面", "基础物理", "相位调控"],
        "design_methods": ["超表面", "优化设计", "拓扑优化"],
        "metalenses": ["超表面", "超构透镜", "Metalens"],
        "holography": ["超表面", "全息术", "Holography"],
        "beam_shaping": ["超表面", "光束整形", "涡旋光束"],
        "polarization": ["超表面", "偏振光学", "Polarization"],
        "tunable": ["超表面", "可调超表面", "Active Metasurface"],
        "sensing": ["超表面", "光学传感", "Sensing"],
        "neural_optics": ["超表面", "光学神经网络", "Optical AI"],
        "manufacturing": ["超表面", "纳米制造", "Nanofabrication"],
        "applications": ["超表面", "应用器件", "Applications"],
    }
    tags = tags_map.get(category, ["超表面", "Metasurface"])

    return f"""---
title: {title}
date: {date_str}
categories:
  - 超表面技术
tags:
{chr(10).join(f'  - {tag}' for tag in tags)}
excerpt: 今日超表面技术日报：{title}
index_img: /img/fluid.png
math: true
---"""


def load_history(base_dir: Path) -> dict:
    history_file = base_dir / "temp" / "metasurface_history.json"
    if history_file.exists():
        with open(history_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"used_topics": [], "generated_dates": []}


def save_history(base_dir: Path, history: dict):
    history_file = base_dir / "temp" / "metasurface_history.json"
    history_file.parent.mkdir(parents=True, exist_ok=True)
    with open(history_file, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def select_topic(base_dir: Path) -> dict:
    history = load_history(base_dir)
    all_topics = MetasurfaceTopicPool.get_all_topics()
    available = [t for t in all_topics if t["topic"] not in history.get("used_topics", [])]

    if not available:
        print("[INFO] 所有主题已用完，重置历史记录")
        history["used_topics"] = []
        available = all_topics

    topic = random.choice(available)

    # 标记已使用
    history["used_topics"].append(topic["topic"])
    today = datetime.now().strftime("%Y-%m-%d")
    if today not in history.get("generated_dates", []):
        history["generated_dates"].append(today)
    save_history(base_dir, history)

    return topic


def save_article(base_dir: Path, filename: str, content: str) -> Path:
    posts_dir = base_dir / "source" / "_posts"
    posts_dir.mkdir(parents=True, exist_ok=True)
    filepath = posts_dir / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[OK] 文章已保存: {filepath}")
    return filepath


def build_and_deploy(base_dir: Path) -> bool:
    """构建并部署"""
    import subprocess

    os.chdir(base_dir)

    print("\n🔨 开始构建网站...")
    result = subprocess.run(["npx", "hexo", "generate"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] Hexo 构建失败:\n{result.stderr}")
        return False
    print("[OK] Hexo 构建完成")

    public_dir = base_dir / "public"
    deploy_cmd = f"cp -r {public_dir}/* /var/www/time-frame.cloud/ && chown -R www-data:www-data /var/www/time-frame.cloud"
    result = subprocess.run(deploy_cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] 部署失败: {result.stderr}")
        return False
    print("[OK] 网站已部署")
    return True


def main():
    parser = argparse.ArgumentParser(description="超表面日报生成器")
    parser.add_argument("--agent-mode", action="store_true",
                        help="Agent 模式：选择主题并输出 JSON，等待外部填充内容")
    parser.add_argument("--publish-file", type=str,
                        help="发布指定文件（已包含完整内容）")
    parser.add_argument("--build-only", action="store_true",
                        help="仅构建部署")
    parser.add_argument("--list-topics", action="store_true",
                        help="列出所有主题")
    parser.add_argument("--dry-run", action="store_true",
                        help="干运行（不保存不部署）")

    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent

    if args.list_topics:
        print(json.dumps(MetasurfaceTopicPool.TOPICS, ensure_ascii=False, indent=2))
        return

    if args.build_only:
        build_and_deploy(base_dir)
        return

    if args.agent_mode:
        # Agent 模式：选择主题，生成 front-matter，输出 JSON
        topic = select_topic(base_dir)
        date_str = datetime.now().strftime("%Y-%m-%d")
        slug = topic["topic"][:30].replace(" ", "-").replace("/", "-")
        filename = f"{date_str}-metasurface-{slug}.md"
        front_matter = generate_front_matter(topic["topic"], topic["category"], date_str)

        result = {
            "topic": topic["topic"],
            "category": topic["category"],
            "filename": filename,
            "date": date_str,
            "front_matter": front_matter,
            "posts_dir": str(base_dir / "source" / "_posts"),
            "base_dir": str(base_dir),
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if args.publish_file:
        # 发布已有文件
        filepath = Path(args.publish_file)
        if not filepath.exists():
            print(f"[ERROR] 文件不存在: {filepath}")
            return 1
        # 复制到 _posts（如果不是已经在那里）
        posts_dir = base_dir / "source" / "_posts"
        if filepath.parent != posts_dir:
            import shutil
            dest = posts_dir / filepath.name
            shutil.copy2(filepath, dest)
            print(f"[OK] 已复制到: {dest}")
        build_and_deploy(base_dir)
        return

    # 默认：dry run 输出主题信息
    topic = select_topic(base_dir)
    print(f"📋 选定主题: {topic['topic']} [{topic['category']}]")
    print(f"   运行 'python3 daily_metasurface.py --agent-mode' 获取完整 JSON")


if __name__ == "__main__":
    sys.exit(main() or 0)
