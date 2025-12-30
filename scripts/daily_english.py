import os
import requests
import datetime
import random
import json

# ================= 配置区 =================
# 自动定位到 source/_posts 目录
script_dir = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(script_dir, '..', 'source', '_posts')

# 环境变量获取
API_KEY = os.environ.get("LLM_API_KEY")
BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.deepseek.com")


# =========================================

def get_daily_quote():
    """
    【真实公开源】获取金山词霸每日一句
    返回: (英文句子, 中文翻译, 图片URL)
    """
    try:
        url = "http://open.iciba.com/dsapi/"
        res = requests.get(url, timeout=5).json()
        return res['content'], res['note'], res['picture2']
    except:
        return "Stay hungry, stay foolish.", "求知若饥，虚心若愚。", "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"


def generate_learning_content():
    """
    【AI 生成】调用 LLM 生成单词表和长文阅读
    """
    if API_KEY:
        print(f"DEBUG: API Key found (starts with {API_KEY[:3]}...)")
    else:
        print("Error: LLM_API_KEY is missing.")
        return None

    # 定义多元化的阅读主题池
    topics = [
        "TED Talk (Inspirational & Educational)",
        "Cognitive Psychology & Mental Health",  # 心理
        "Optics & Metasurfaces Technology",  # 光学/超表面 (你的专业)
        "Nature & Wildlife Documentary",  # 自然
        "Global Travel & Cultural Exploration",  # 旅游
        "Personal Growth & Career Development"  # 成长
    ]
    today_topic = random.choice(topics)
    print(f"Today's Topic: {today_topic}")

    # 🟢 System Prompt
    system_prompt = "You are a professional ESL (English as a Second Language) teacher and editor. Your goal is to provide high-quality reading materials and vocabulary lists for advanced learners."

    # 🟢 User Prompt (高要求)
    user_prompt = f"""
    Please generate a comprehensive daily English learning post based on the topic: **{today_topic}**.

    **REQUIREMENTS:**

    1. **Part 1: Vocabulary Builder (10 Words)**
       - Select exactly **10 sophisticated/useful words** related to the topic.
       - For each word, provide:
         - Word
         - IPA Pronunciation
         - **English Definition**
         - **Chinese Definition** (Keep it concise)
         - A Sample Sentence showing proper usage.

    2. **Part 2: Deep Reading Article**
       - Title: Create an engaging title based on {today_topic}.
       - Length: **Long-form article (approx. 200-500 words)**. Do not write a short summary; write a full article.
       - Style: Professional, informative, and engaging (like The Economist or NatGeo).
       - **Analysis**: At the end, explain 3 complex sentence structures or idioms used in the text.

    **OUTPUT FORMAT (Strict JSON):**
    {{
        "topic_display": "{today_topic}",
        "vocab_list": [
            {{ "word": "...", "ipa": "...", "en_def": "...", "cn_def": "...", "sentence": "..." }},
            ... (total 10 items)
        ],
        "reading": {{
            "title": "...",
            "content": "...", 
            "analysis": "..."
        }}
    }}
    """

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"}
    }

    try:
        print("Requesting AI generation (this may take 30-60s due to long content)...")
        response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=data, timeout=90)  # 增加超时时间到90秒
        result = response.json()
        content_json = json.loads(result['choices'][0]['message']['content'])
        return content_json
    except Exception as e:
        print(f"AI Generation Failed: {e}")
        return None


def create_markdown():
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")

    # 1. 并行获取：金山词霸句 + AI生成内容
    quote_en, quote_cn, quote_img = get_daily_quote()
    ai_data = generate_learning_content()

    if not ai_data:
        print("Skipping generation due to AI failure.")
        return

    # 提取 AI 数据
    topic = ai_data['topic_display']
    vocabs = ai_data['vocab_list']
    reading = ai_data['reading']

    # 2. 构建单词表 Markdown (10个)
    vocab_md = ""
    for v in vocabs:
        vocab_md += f"""
- **{v['word']}** `/{v['ipa']}/`
  - 🇺🇸 {v['en_def']}
  - 🇨🇳 {v['cn_def']}
  - 📝 *{v['sentence']}*
"""

    # 3. 构建整篇 Markdown
    md_content = f"""---
title: "🌍 Daily English: {reading['title']} | {date_str}"
date: {now.strftime("%Y-%m-%d %H:%M:%S")}
categories: English Learning
tags: [English, {topic}, Vocabulary, Reading]
---

## 🖼️ Part 1: Daily Quote

![]({quote_img})

> **"{quote_en}"**
>
> {quote_cn}

---

## 🔑 Part 2: Vocabulary Builder (10 Words)

Here are 10 key words selected from today's reading on **{topic}**:

{vocab_md}

---

## 📖 Part 3: Deep Reading

### {reading['title']}

{reading['content']}

---

### 💡 Language Highlights

{reading['analysis']}

---

*(Content generated by DeepSeek AI; Quote source: Iciba)*
"""

    # 4. 写入文件
    # 文件名格式: 2025-01-01-daily-english.md
    filename = f"{date_str}-daily-english.md"
    filepath = os.path.join(POSTS_DIR, filename)

    # ⚠️ 调试模式：强制覆盖写入，方便你反复测试效果
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"Successfully generated (Overwritten): {filename}")


if __name__ == "__main__":
    create_markdown()