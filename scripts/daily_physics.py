import os
import requests
import datetime
import random
import json

# ================= 配置区 =================
POSTS_DIR = 'source/_posts'

# 环境变量获取
API_KEY = os.environ.get("LLM_API_KEY")
BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.deepseek.com")


# =========================================

def get_daily_english():
    """获取金山词霸每日一句"""
    try:
        url = "http://open.iciba.com/dsapi/"
        res = requests.get(url, timeout=5).json()
        return res['content'], res['note'], res['picture2']
    except:
        return "Knowledge is power.", "知识就是力量。", ""


def generate_deep_content():
    """调用 LLM 生成深度内容"""
    if API_KEY:
        print(f"DEBUG: API Key found (starts with {API_KEY[:3]}...)")
    else:
        print("Error: LLM_API_KEY is missing.")
        return None, None, None

    # 随机选择硬核主题
    topics = ["Optics (Physics)", "Quantum Mechanics", "Calculus", "Linear Algebra", "Thermodynamics"]
    today_topic = random.choice(topics)

    # 🟢 关键修改：升级提示词，要求深度解析
    system_prompt = "You are a distinguished professor known for your ability to explain complex concepts with extreme clarity and depth."
    user_prompt = f"""
    Please generate a challenging **{today_topic}** problem for my daily reading.

    **CRITICAL REQUIREMENTS:**
    1. **Title**: The specific sub-topic (e.g., "Fraunhofer Diffraction" instead of just "Optics").
    2. **Language**: English.
    3. **Depth**: The solution MUST be detailed. **Do not give a one-sentence answer.** - Provide step-by-step mathematical derivations.
       - Explain the physical intuition behind the formulas.
       - Discuss the implications of the result.
       - The solution should be at least 300 words long.

    **Output Format (JSON):**
    {{
        "sub_topic": "The specific concept name",
        "question": "The problem statement...",
        "answer": "The FULL, DETAILED explanation with math and text..."
    }}
    """

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "deepseek-chat",  # 或 gpt-3.5-turbo / gpt-4
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=data, timeout=60)
        result = response.json()
        content_json = json.loads(result['choices'][0]['message']['content'])
        return content_json['sub_topic'], content_json['question'], content_json['answer']
    except Exception as e:
        print(f"AI Generation Failed: {e}")
        return None, None, None


def create_markdown():
    # 获取当前时间
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    hour_str = now.strftime("%H")  # 获取小时，用于生成唯一文件名

    # 1. 获取内容
    en_content, en_note, en_img = get_daily_english()
    sub_topic, question, answer = generate_deep_content()

    if not sub_topic:
        print("Skipping generation due to API failure.")
        return

    # 🟢 关键修改：标题改为 Daily Reading，文件名加入时间防冲突
    # 使用 YAML 格式的双引号防止报错
    md_content = f"""---
title: "📚 Daily Reading: {sub_topic} | {date_str} {time_str}"
date: {now.strftime("%Y-%m-%d %H:%M:%S")}
categories: Daily Reading
tags: [Learning, {sub_topic}]
---

## ☕ Morning English
![]({en_img})
> **{en_content}**
> *{en_note}*

---

## 🧠 Deep Dive: {sub_topic}

### ❓ The Challenge
{question}

---

### 📝 Detailed Analysis
{answer}

---

*(Auto-generated at {time_str})*
"""

    # 2. 写入文件
    # 🟢 关键修改：文件名加上小时 (hour_str)，确保一天三次不会重名
    filename = f"{date_str}-{hour_str}-reading.md"
    filepath = os.path.join(POSTS_DIR, filename)

    if not os.path.exists(filepath):
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        print(f"Successfully generated: {filename}")
    else:
        print(f"File {filename} already exists. Skipping.")


if __name__ == "__main__":
    create_markdown()