"""
代码执行模块
负责执行 Python 代码并捕获结果（文本输出、图表等）
"""
import os
import sys
import io
import ast
import subprocess
import tempfile
import traceback
import base64
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class CodeExecutor:
    """Python 代码执行器"""

    def __init__(self, output_dir: str = None):
        """
        初始化代码执行器

        Args:
            output_dir: 输出目录（用于保存图片等）
        """
        if output_dir is None:
            output_dir = Path(__file__).parent.parent.parent / "temp" / "code_outputs"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 用于图片保存的目录
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(parents=True, exist_ok=True)

    def execute_code(self, code: str, timeout: int = 60) -> Dict:
        """
        执行 Python 代码并捕获结果

        Args:
            code: Python 代码
            timeout: 超时时间（秒）

        Returns:
            执行结果字典
        """
        result = {
            "success": False,
            "stdout": "",
            "stderr": "",
            "output_files": [],
            "figures": [],
            "error": None,
            "execution_time": 0
        }

        # 创建一个临时文件来执行代码
        # 在代码中注入 matplotlib 的保存逻辑
        modified_code = self._prepare_code(code)

        start_time = datetime.now()

        try:
            # 使用 subprocess 执行，更安全
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.py',
                delete=False,
                encoding='utf-8'
            ) as f:
                f.write(modified_code)
                temp_file = f.name

            # 执行代码
            process = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.output_dir)
            )

            result["stdout"] = process.stdout
            result["stderr"] = process.stderr
            result["success"] = process.returncode == 0

            if process.returncode != 0:
                result["error"] = process.stderr

            # 检查生成的图片文件
            self._collect_output_files(result)

            # 清理临时文件
            try:
                os.unlink(temp_file)
            except:
                pass

        except subprocess.TimeoutExpired:
            result["error"] = f"代码执行超时（>{timeout}秒）"
        except Exception as e:
            result["error"] = f"执行错误: {str(e)}\n{traceback.format_exc()}"
        finally:
            end_time = datetime.now()
            result["execution_time"] = (end_time - start_time).total_seconds()

        return result

    def _prepare_code(self, code: str) -> str:
        """
        准备代码，注入图片保存逻辑

        Args:
            code: 原始代码

        Returns:
            修改后的代码
        """
        # 检查是否使用了 matplotlib
        uses_matplotlib = 'matplotlib' in code or 'plt.' in code or 'pyplot' in code

        if uses_matplotlib:
            # 生成唯一的时间戳前缀
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # 使用绝对路径
            figures_dir = str(self.images_dir.resolve())

            # 在代码开头注入 matplotlib 设置
            injection = f"""
import matplotlib
matplotlib.use('Agg')  # 非交互式后端
import matplotlib.pyplot as plt
import os
_figures_dir = r'{figures_dir}'
os.makedirs(_figures_dir, exist_ok=True)
_fig_idx = 0

# 原始代码开始
"""

            # 在代码末尾添加保存逻辑
            save_code = f"""
# 保存所有图形
try:
    import matplotlib.pyplot as _plt
    for _fig_num in _plt.get_fignums():
        _f = _plt.figure(_fig_num)
        _path = os.path.join(_figures_dir, f'figure_{timestamp}_{{_fig_idx}}.png')
        _f.savefig(_path, dpi=150, bbox_inches='tight')
        print(f'[SAVED_FIGURE] {{_path}}')
        _fig_idx += 1
except Exception as _e:
    print(f'[FIGURE_SAVE_ERROR] {{_e}}')
"""

            return injection + "\n" + code + "\n" + save_code

        return code

    def _collect_output_files(self, result: Dict):
        """收集执行产生的输出文件"""
        # 从 stdout 中提取保存的图片路径
        for line in result["stdout"].split('\n'):
            if '[SAVED_FIGURE]' in line:
                filepath = line.split('[SAVED_FIGURE]')[1].strip()
                if os.path.exists(filepath):
                    result["figures"].append(filepath)
                    result["output_files"].append(filepath)

    def execute_and_capture(self, code: str, code_id: str = "code") -> Dict:
        """
        执行代码并返回格式化的结果

        Args:
            code: Python 代码
            code_id: 代码标识

        Returns:
            格式化的结果字典
        """
        result = self.execute_code(code)

        formatted = {
            "id": code_id,
            "code": code,
            "success": result["success"],
            "stdout": result["stdout"],
            "stderr": result["stderr"],
            "error": result["error"],
            "figures": [],
            "execution_time": result["execution_time"]
        }

        # 处理图片文件
        for fig_path in result.get("figures", []):
            try:
                with open(fig_path, 'rb') as f:
                    img_data = base64.b64encode(f.read()).decode()

                # 计算相对于 source 目录的路径
                try:
                    relative_path = str(Path(fig_path).relative_to(self.output_dir.parent.parent / "source"))
                except ValueError:
                    # 如果无法计算相对路径，使用绝对路径
                    relative_path = fig_path

                formatted["figures"].append({
                    "path": fig_path,
                    "base64": img_data,
                    "relative_path": relative_path
                })
            except Exception as e:
                print(f"[WARN] 无法读取图片 {fig_path}: {e}")

        return formatted

    def validate_code(self, code: str) -> Tuple[bool, str]:
        """
        验证代码语法

        Args:
            code: Python 代码

        Returns:
            (是否有效, 错误信息)
        """
        try:
            ast.parse(code)
            return True, ""
        except SyntaxError as e:
            return False, f"语法错误: {e}"

    def extract_code_from_markdown(self, markdown: str) -> List[Dict]:
        """
        从 Markdown 中提取代码块

        Args:
            markdown: Markdown 内容

        Returns:
            代码块列表
        """
        code_blocks = []
        lines = markdown.split('\n')
        in_code_block = False
        current_lang = ""
        current_code = []
        code_id = 0

        for line in lines:
            if line.startswith('```'):
                if not in_code_block:
                    # 开始代码块
                    in_code_block = True
                    current_lang = line[3:].strip() or "text"
                    current_code = []
                else:
                    # 结束代码块
                    in_code_block = False
                    if current_lang.lower() == 'python':
                        code_blocks.append({
                            "id": f"code_{code_id}",
                            "language": current_lang,
                            "code": '\n'.join(current_code)
                        })
                        code_id += 1
                    current_lang = ""
                    current_code = []
            elif in_code_block:
                current_code.append(line)

        return code_blocks

    def execute_all_codes(self, markdown: str) -> Tuple[str, List[Dict]]:
        """
        执行 Markdown 中的所有 Python 代码块，并替换为执行结果

        Args:
            markdown: Markdown 内容

        Returns:
            (更新后的 Markdown, 执行结果列表)
        """
        code_blocks = self.extract_code_from_markdown(markdown)
        results = []

        for block in code_blocks:
            print(f"[INFO] 执行代码块: {block['id']}")
            result = self.execute_and_capture(block['code'], block['id'])
            results.append(result)

            # 如果执行成功且有输出，在 Markdown 中添加执行结果
            if result["success"]:
                # 在原代码块后添加执行结果
                output_marker = f"\n\n**执行结果:**\n"

                if result["stdout"].strip():
                    output_marker += f"\n```\n{result['stdout'].strip()}\n```\n"

                # 如果有图片，添加图片引用
                for fig in result["figures"]:
                    relative_path = fig.get("relative_path", fig["path"])
                    output_marker += f"\n![]({relative_path})\n"

                # 替换原代码块（简化处理，实际需要更精确的替换逻辑）
                # 这里我们返回结果，由调用方处理替换

        return markdown, results


# 测试代码
if __name__ == "__main__":
    executor = CodeExecutor()

    # 测试代码
    test_code = """
import numpy as np
import matplotlib.pyplot as plt

# 生成数据
x = np.linspace(0, 10, 100)
y = np.sin(x)

# 绘图
plt.figure(figsize=(8, 4))
plt.plot(x, y, 'b-', label='sin(x)')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Sine Wave')
plt.legend()
plt.grid(True)
plt.show()

print("代码执行成功!")
print(f"x 的范围: {x.min():.2f} 到 {x.max():.2f}")
"""

    print("=" * 50)
    print("测试代码执行")
    print("=" * 50)

    result = executor.execute_and_capture(test_code, "test_code")
    print(f"执行成功: {result['success']}")
    print(f"标准输出: {result['stdout']}")
    print(f"生成的图片数: {len(result['figures'])}")
