"""
内容生成模块
负责调用 LLM API 生成博客文章内容
支持网络搜索学习、深度内容生成、代码生成等
"""
import os
import json
import requests
import time
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path


def load_env_file():
    """从 .env 文件加载环境变量"""
    env_file = Path(__file__).parent.parent.parent / ".env"
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    # 只有当环境变量未设置时才覆盖
                    if key not in os.environ:
                        os.environ[key] = value


class ContentGenerator:
    """博客内容生成器"""

    def __init__(self):
        # 尝试从 .env 文件加载
        load_env_file()

        self.api_key = os.environ.get("LLM_API_KEY")
        self.base_url = os.environ.get("LLM_BASE_URL", "https://api.lkeap.cloud.tencent.com/plan/v3")

        # 使用配置的模型，或根据 URL 自动选择
        configured_model = os.environ.get("LLM_MODEL")
        if configured_model:
            self.model = configured_model
        elif "lkeap" in self.base_url.lower() or "plan" in self.base_url.lower():
            self.model = "tc-code-latest"  # 腾讯云 Token Plan
        elif "deepseek" in self.base_url.lower():
            self.model = "deepseek-chat"
        elif "hunyuan" in self.base_url.lower() or "tencent" in self.base_url.lower():
            self.model = "hunyuan-lite"
        else:
            self.model = "gpt-3.5-turbo"

        print(f"[INFO] API 配置: {self.base_url}, 模型: {self.model}")

    def _call_llm(self, messages: List[Dict], max_tokens: int = 8000, temperature: float = 0.7) -> Optional[str]:
        """
        调用 LLM API

        Args:
            messages: 消息列表
            max_tokens: 最大生成 token 数
            temperature: 温度参数

        Returns:
            生成的内容
        """
        if not self.api_key:
            print("[ERROR] LLM_API_KEY 环境变量未设置")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        try:
            print(f"[INFO] 正在调用 LLM API...")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=300  # 5分钟超时
            )
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
        except requests.exceptions.Timeout:
            print("[ERROR] API 请求超时")
            return None
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] API 请求失败: {e}")
            return None
        except (KeyError, IndexError) as e:
            print(f"[ERROR] 解析响应失败: {e}")
            return None

    def research_topic(self, topic: str) -> Dict:
        """
        研究主题，收集关键知识点

        Args:
            topic: 主题名称

        Returns:
            研究结果字典
        """
        system_prompt = """你是一位资深的学术研究员和技术写作专家。
你的任务是深入研究给定主题，收集关键知识点、核心概念、数学公式和实际应用。

你需要输出 JSON 格式的研究报告。"""

        user_prompt = f"""
请深入研究以下主题，并输出一份详细的知识报告：

**主题**: {topic}

**要求**:
1. 列出该主题的 3-5 个核心概念
2. 列出关键数学公式（使用 LaTeX 格式）
3. 列出 2-3 个典型应用场景
4. 列出 3-5 个适合深入讲解的子话题
5. 推荐 2-3 个可以编写代码演示的内容

**输出格式 (JSON)**:
{{
    "core_concepts": [
        {{"name": "概念名", "description": "简短描述"}}
    ],
    "key_formulas": [
        {{"name": "公式名", "latex": "LaTeX公式", "explanation": "公式解释"}}
    ],
    "applications": [
        {{"name": "应用名", "description": "应用描述"}}
    ],
    "subtopics": ["子话题1", "子话题2"],
    "code_demos": [
        {{"title": "演示标题", "description": "演示什么内容", "language": "python"}}
    ]
}}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = self._call_llm(messages, max_tokens=4000)

        if response:
            try:
                # 尝试解析 JSON
                # 处理可能的 markdown 代码块
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]

                return json.loads(response.strip())
            except json.JSONDecodeError:
                print("[WARN] 无法解析 JSON，返回原始内容")
                return {"raw_content": response}

        return {}

    def generate_article(self, topic: str, category: str, research_data: Dict = None) -> Dict:
        """
        生成完整的博客文章

        Args:
            topic: 主题名称
            category: 文章分类
            research_data: 研究数据（可选）

        Returns:
            文章数据字典
        """
        # 如果没有提供研究数据，先进行研究
        if not research_data:
            print(f"[INFO] 正在研究主题: {topic}")
            research_data = self.research_topic(topic)

        # 直接生成 Markdown 格式的文章（不用 JSON）
        system_prompt = """你是一位专业的技术博客作者，擅长将复杂的技术概念以清晰、深入、有趣的方式呈现给读者。

你的文章特点：
1. 深度：不只是概念介绍，要有数学推导和底层原理
2. 实用：提供可运行的代码示例和实际应用
3. 清晰：逻辑结构清晰，章节分明
4. 专业：引用准确，公式规范

请直接输出 Markdown 格式的文章内容，不要使用 JSON 格式。"""

        research_context = ""
        if research_data and "raw_content" not in research_data:
            concepts = research_data.get('core_concepts', [])
            formulas = research_data.get('key_formulas', [])
            if concepts:
                research_context += f"\n核心概念: {', '.join([c.get('name', '') for c in concepts[:3]])}"
            if formulas:
                research_context += f"\n关键公式: {', '.join([f.get('name', '') for f in formulas[:2]])}"

        user_prompt = f"""
请为以下主题撰写一篇深度技术博客文章：

**主题**: {topic}
**分类**: {category}
{research_context}

**文章结构要求**:
1. **引言**：引出问题，说明重要性（100-200字）
2. **核心概念**：解释 2-3 个核心概念，配合数学公式
3. **数学原理**：给出关键公式和推导（使用 $$...$$ 格式）
4. **代码实现**：提供一段完整的 Python 代码（要有注释，能实际运行）
5. **应用场景**：1-2 个实际应用例子
6. **总结**：关键要点回顾

**格式要求**:
- 使用 Markdown 格式
- 数学公式使用 $$...$$ 包裹
- 代码块使用 ```python ... ```
- 文章总字数控制在 1500-2500 字
- 在需要图片的地方用 [图片: 描述] 标注

请直接开始撰写文章，不要输出任何其他内容：
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        print(f"[INFO] 正在生成文章: {topic}")
        response = self._call_llm(messages, max_tokens=4000, temperature=0.7)

        if response:
            # 直接返回 Markdown 内容
            return {
                "title": topic,
                "excerpt": f"本文深入讲解{topic}的核心原理与应用。",
                "content": response,
                "topic": topic,
                "category": category,
                "generated_at": datetime.now().isoformat(),
                "code_blocks": [],
                "images_needed": [],
                "references": []
            }

        return {}

    def improve_article(self, article_content: str, issues: List[str]) -> str:
        """
        改进文章内容

        Args:
            article_content: 原始文章内容
            issues: 需要改进的问题列表

        Returns:
            改进后的内容
        """
        system_prompt = "你是一位专业的技术编辑，擅长改进文章质量。"

        user_prompt = f"""
请改进以下文章内容，解决以下问题：

**需要改进的问题**:
{chr(10).join(f'- {issue}' for issue in issues)}

**原始文章**:
{article_content}

**要求**:
1. 保持原有结构和风格
2. 针对性地解决每个问题
3. 不改变文章的核心内容

请输出改进后的完整文章内容。
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return self._call_llm(messages, max_tokens=8000) or article_content

    def generate_summary(self, article_content: str) -> str:
        """
        生成文章摘要

        Args:
            article_content: 文章内容

        Returns:
            摘要
        """
        system_prompt = "你是一位专业的编辑，擅长提炼文章精华。"

        user_prompt = f"""
请为以下文章生成一个简洁有力的摘要（100字以内）：

{article_content[:2000]}  # 只取前2000字

摘要要求：
1. 点明文章核心主题
2. 突出文章价值
3. 吸引读者阅读

只输出摘要内容，不要其他内容。
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return self._call_llm(messages, max_tokens=200) or ""

    def generate_code_explanation(self, code: str) -> str:
        """
        生成代码解释

        Args:
            code: 代码内容

        Returns:
            代码解释
        """
        system_prompt = "你是一位 Python 编程专家，擅长解释代码逻辑。"

        user_prompt = f"""
请解释以下代码的功能和逻辑：

```python
{code}
```

要求：
1. 解释代码的整体功能
2. 逐行解释关键步骤
3. 说明输出结果的含义

输出格式为 Markdown。
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return self._call_llm(messages, max_tokens=1500) or ""


# 测试代码
if __name__ == "__main__":
    generator = ContentGenerator()

    # 测试主题研究
    print("=" * 50)
    print("测试主题研究")
    print("=" * 50)

    research = generator.research_topic("高斯光束传播特性")
    print(json.dumps(research, ensure_ascii=False, indent=2))
