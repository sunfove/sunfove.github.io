#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日文献解读生成器
1. 从 arXiv 拉取最新论文
2. 用 LLM 深度解读
3. 保存为 Hexo 博文并发布
"""
import os
import sys
import json
import time
import random
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).parent))

# ── arXiv 查询列表 ──
ARXIV_QUERIES = [
    "all:metasurface",
    "all:metalens",
    "all:nanophotonics",
    "all:computational+AND+all:imaging+AND+all:optics",
    "all:holography+AND+all:metasurface",
    "all:diffractive+AND+all:optical+AND+all:neural",
    "all:beam+AND+all:shaping+AND+all:metasurface",
]
ARXIV_BASE = "http://export.arxiv.org/api/query"

def search_arxiv(query, max_results=20):
    """搜索 arXiv 论文"""
    url = f"{ARXIV_BASE}?search_query={query}&sortBy=submittedDate&sortOrder=descending&max_results={max_results}"
    resp = requests.get(url, timeout=30)
    root = ET.fromstring(resp.content)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "arxiv": "http://arxiv.org/schemas/atom"
    }
    papers = []
    for entry in root.findall("atom:entry", ns):
        paper_id = entry.find("atom:id", ns).text.strip()
        arxiv_id = paper_id.split("/abs/")[-1]
        title = " ".join(entry.find("atom:title", ns).text.strip().split())
        authors = [a.find("atom:name", ns).text.strip() for a in entry.findall("atom:author", ns)]
        summary = " ".join(entry.find("atom:summary", ns).text.strip().split())
        published = entry.find("atom:published", ns).text.strip()
        papers.append({
            "arxiv_id": arxiv_id,
            "title": title,
            "authors": authors[:6],
            "summary": summary,
            "published": published,
            "url": f"https://arxiv.org/abs/{arxiv_id}",
            "pdf": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
        })
    return papers

def fetch_all_papers(max_per_query=5):
    """从多个查询获取论文"""
    all_papers = []
    seen = set()
    for query in random.sample(ARXIV_QUERIES, 3):
        try:
            papers = search_arxiv(query, max_per_query)
            for p in papers:
                if p["arxiv_id"] not in seen:
                    seen.add(p["arxiv_id"])
                    all_papers.append(p)
        except Exception as e:
            print(f"[WARN] arXiv 查询失败: {query} -- {e}")
    return sorted(all_papers, key=lambda p: p["published"], reverse=True)

def load_history(base_dir):
    f = Path(base_dir) / "temp" / "paper_review_history.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    return {"reviewed_ids": [], "dates": []}

def save_history(base_dir, history):
    f = Path(base_dir) / "temp" / "paper_review_history.json"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")

def select_paper(base_dir, papers):
    """选择一篇未解读过的论文"""
    history = load_history(base_dir)
    available = [p for p in papers if p["arxiv_id"] not in history["reviewed_ids"]]
    if not available:
        history["reviewed_ids"] = []
        available = papers
    return available[0] if available else papers[0]

def call_llm(messages, max_tokens=6000):
    """调用 LLM API（OpenAI 兼容）"""
    api_key = os.environ.get("LLM_API_KEY")
    base_url = os.environ.get("LLM_BASE_URL", "https://api.lkeap.cloud.tencent.com/plan/v3")
    model = os.environ.get("LLM_MODEL", "deepseek-chat")

    if not api_key:
        print("[ERROR] LLM_API_KEY 未设置")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.5,
    }
    for attempt in range(3):
        try:
            resp = requests.post(f"{base_url}/v1/chat/completions", headers=headers, json=body, timeout=120)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
            print(f"[WARN] LLM 返回 {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"[WARN] LLM 调用失败 (attempt {attempt+1}): {e}")
        time.sleep(5)
    return None

def generate_review(paper):
    """用 LLM 生成文献解读"""
    prompt = f"""你是一位光学/光子学领域的资深研究者，请对以下最新 arXiv 论文进行深入解读。

## 论文信息
- 标题：{paper['title']}
- 作者：{', '.join(paper['authors'])}
- arXiv ID：{paper['arxiv_id']}
- 链接：{paper['url']}
- 摘要：{paper['summary']}

## 要求
请以中文撰写一篇结构化的文献解读，包含以下部分：

### TL;DR
用一句话概括这篇论文的核心贡献和创新点。

### 研究背景
这篇论文试图解决什么问题？该领域当前有什么挑战？前人工作有哪些局限？

### 核心方法
详细解释论文提出的方法/技术。如果涉及数学公式，请用 LaTeX 表示（用 $...$ 或 $$...$$）。解释为什么这个方法有效。

### 关键结果
总结主要实验/理论结果。用了什么数据集或仿真设置？性能提升了多少？与其他方法对比如何？

### 亮点与局限
客观评价这篇工作的优势与不足。有哪些值得进一步探索的方向？

### 对你的启发
这篇论文对你（一位超表面/光学领域的研究者）有什么启发？是否有可迁移到你的工作的思路？

请用学术但可读的风格撰写，控制总字数在 1500-2000 字左右。"""

    return call_llm([
        {"role": "system", "content": "你是一位光学/光子学领域的资深研究者，擅长解读学术论文。请始终用中文回复。"},
        {"role": "user", "content": prompt}
    ], max_tokens=6000)

def generate_title(paper):
    """生成中文标题"""
    prompt = f"将以下英文学术论文标题翻译为简洁的中文（15字以内），直接返回译文不要解释：\n{paper['title']}"
    result = call_llm([
        {"role": "user", "content": prompt}
    ], max_tokens=50)
    if result:
        return result.strip().strip('"').strip("'").strip("《》")
    return paper["title"][:40]

def build_post(paper, review_text, title_cn):
    """构建 Hexo 博文"""
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    date_slug = datetime.now().strftime("%Y-%m-%d")
    arxiv_id = paper["arxiv_id"]
    authors_str = ", ".join(paper["authors"][:4])
    if len(paper["authors"]) > 4:
        authors_str += " et al."

    front_matter = f"""---
title: 文献解读 | {title_cn}
date: {date_str}
categories: 文献解读
tags:
  - 文献解读
  - arXiv
  - {paper['arxiv_id'].split('.')[0]}
paper_title: "{paper['title']}"
paper_authors: "{authors_str}"
paper_arxiv: "{paper['arxiv_id']}"
paper_url: "{paper['url']}"
paper_pdf: "{paper['pdf']}"
index_img:
math: true
---"""

    body = f"""## 📌 论文引用

> **标题**：{paper['title']}
> **作者**：{authors_str}
> **来源**：arXiv:{arxiv_id}
> **日期**：{paper['published'][:10]}

{review_text}

## 📎 论文地址

- **arXiv**：[{arxiv_id}]({paper['url']})
- **PDF**：[{paper['pdf']}]({paper['pdf']})

---

*本文由 AI 自动生成，内容基于 arXiv 论文摘要进行深度解读。如有疏漏，欢迎指正。*
"""
    filename = f"{date_slug}-paper-review-{arxiv_id.replace('/', '-')}.md"
    return front_matter + body, filename

def main():
    parser = argparse.ArgumentParser(description="每日文献解读生成器")
    parser.add_argument("--dry-run", action="store_true", help="仅预览不保存")
    parser.add_argument("--arxiv-id", type=str, help="指定 arXiv ID 进行解读")
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent

    if args.arxiv_id:
        # 指定论文模式
        url = f"http://export.arxiv.org/api/query?id_list={args.arxiv_id}"
        resp = requests.get(url, timeout=30)
        root = ET.fromstring(resp.content)
        ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
        entry = root.find("atom:entry", ns)
        if entry is None:
            print(f"[ERROR] 未找到论文: {args.arxiv_id}")
            return 1
        paper = {
            "arxiv_id": args.arxiv_id,
            "title": " ".join(entry.find("atom:title", ns).text.strip().split()),
            "authors": [a.find("atom:name", ns).text.strip() for a in entry.findall("atom:author", ns)],
            "summary": " ".join(entry.find("atom:summary", ns).text.strip().split()),
            "published": entry.find("atom:published", ns).text.strip(),
            "url": f"https://arxiv.org/abs/{args.arxiv_id}",
            "pdf": f"https://arxiv.org/pdf/{args.arxiv_id}.pdf",
        }
    else:
        # 自动模式
        print("[INFO] 正在从 arXiv 获取最新论文...")
        papers = fetch_all_papers(15)
        print(f"[INFO] 获取到 {len(papers)} 篇论文")
        paper = select_paper(base_dir, papers)
        print(f"[INFO] 选定论文: {paper['title'][:80]}...")

    print(f"\n{'='*60}")
    print(f"  论文: {paper['title']}")
    print(f"  作者: {', '.join(paper['authors'][:3])}")
    print(f"  arXiv: {paper['arxiv_id']}")
    print(f"{'='*60}\n")

    print("[INFO] 正在生成中文标题...")
    title_cn = generate_title(paper)
    print(f"[INFO] 中文标题: {title_cn}")

    print("[INFO] 正在生成深度解读...")
    review = generate_review(paper)
    if not review:
        print("[ERROR] LLM 生成失败")
        return 1

    content, filename = build_post(paper, review, title_cn)

    if args.dry_run:
        print("\n--- 预览 ---")
        print(content[:500])
        return

    # 保存
    posts_dir = base_dir / "source" / "_posts"
    posts_dir.mkdir(parents=True, exist_ok=True)
    filepath = posts_dir / filename
    filepath.write_text(content, encoding="utf-8")
    print(f"[OK] 已保存: {filepath}")

    # 更新历史
    history = load_history(base_dir)
    history["reviewed_ids"].append(paper["arxiv_id"])
    today = datetime.now().strftime("%Y-%m-%d")
    if today not in history["dates"]:
        history["dates"].append(today)
    save_history(base_dir, history)
    print(f"[OK] 已更新历史记录（共 {len(history['reviewed_ids'])} 篇）")

    return 0

if __name__ == "__main__":
    sys.exit(main() or 0)
