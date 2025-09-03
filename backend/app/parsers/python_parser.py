import ast
from pathlib import Path
from typing import Dict, List, Any

def parse_repo(repo_path: str) -> Dict[str, Any]:
    """
    Parse a Python repo into modules, functions, and calls.
    """
    repo = Path(repo_path)
    result = {"modules": [], "functions": [], "calls": []}

    for file in repo.rglob("*.py"):
        module_name = file.relative_to(repo).as_posix()
        result["modules"].append(module_name)

        with open(file, "r", encoding="utf-8") as f:
            try:
                tree = ast.parse(f.read(), filename=str(file))
            except SyntaxError:
                continue

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                result["functions"].append(
                    {
                        "name": node.name,
                        "module": module_name,
                        "lineno": node.lineno,
                    }
                )
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    result["calls"].append({"callee": node.func.id})
                elif isinstance(node.func, ast.Attribute):
                    result["calls"].append({"callee": node.func.attr})

    return result
