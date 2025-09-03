import ast
from pathlib import Path
from typing import Dict, List, Any, Optional

def parse_python_file(file_path: str) -> Dict[str, Any]:
    """
    Parse a Python file using the ast module and extract structured information.

    Args:
        file_path: Path to the Python file to parse.

    Returns:
        Dict containing functions and classes with their details.
    """
    file = Path(file_path)
    if not file.exists() or not file.is_file():
        return {"error": f"File not found: {file_path}"}

    try:
        with open(file, "r", encoding="utf-8") as f:
            source = f.read()
        tree = ast.parse(source, filename=str(file))
    except SyntaxError as e:
        return {"error": f"Syntax error in {file_path}: {str(e)}"}
    except Exception as e:
        return {"error": f"Error parsing {file_path}: {str(e)}"}

    functions = []
    classes = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and not _is_method(node, tree):
            functions.append(_extract_function_info(node))
        elif isinstance(node, ast.ClassDef):
            classes.append(_extract_class_info(node))

    return {
        "functions": functions,
        "classes": classes
    }

def _is_method(func_node: ast.FunctionDef, tree: ast.Module) -> bool:
    """Check if a function is a method by seeing if it's inside a class."""
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for item in node.body:
                if item is func_node:
                    return True
    return False

def _extract_function_info(node: ast.FunctionDef) -> Dict[str, Any]:
    """Extract information from a function node."""
    args = [arg.arg for arg in node.args.args]
    returns = _get_type_annotation(node.returns)
    docstring = _get_docstring(node)
    return {
        "name": node.name,
        "args": args,
        "returns": returns,
        "docstring": docstring
    }

def _extract_class_info(node: ast.ClassDef) -> Dict[str, Any]:
    """Extract information from a class node."""
    bases = []
    for base in node.bases:
        if isinstance(base, ast.Name):
            bases.append(base.id)
        elif isinstance(base, ast.Attribute):
            bases.append(f"{base.value.id}.{base.attr}" if isinstance(base.value, ast.Name) else str(base.attr))

    docstring = _get_docstring(node)
    methods = []

    for item in node.body:
        if isinstance(item, ast.FunctionDef):
            methods.append(_extract_function_info(item))

    return {
        "name": node.name,
        "bases": bases,
        "docstring": docstring,
        "methods": methods
    }

def _get_type_annotation(node: Optional[ast.AST]) -> Optional[str]:
    """Convert AST type annotation to string."""
    if node is None:
        return None
    try:
        # Use ast.unparse if available (Python 3.9+)
        if hasattr(ast, 'unparse'):
            return ast.unparse(node)
        else:
            # Fallback for older Python versions
            return _unparse_annotation(node)
    except:
        return None

def _unparse_annotation(node: ast.AST) -> str:
    """Simple unparser for type annotations."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        value = _unparse_annotation(node.value) if hasattr(node, 'value') else ''
        return f"{value}.{node.attr}"
    elif isinstance(node, ast.Subscript):
        value = _unparse_annotation(node.value)
        slice_val = _unparse_annotation(node.slice) if hasattr(node, 'slice') else ''
        return f"{value}[{slice_val}]"
    elif isinstance(node, ast.List):
        elts = [_unparse_annotation(elt) for elt in node.elts]
        return f"[{', '.join(elts)}]"
    else:
        return str(node)

def _get_docstring(node: ast.AST) -> Optional[str]:
    """Extract docstring from a node."""
    if not hasattr(node, 'body') or not node.body:
        return None
    first_stmt = node.body[0]
    if isinstance(first_stmt, ast.Expr):
        if isinstance(first_stmt.value, ast.Constant) and isinstance(first_stmt.value.value, str):
            return first_stmt.value.value
        elif isinstance(first_stmt.value, ast.Str):
            return first_stmt.value.s
    return None

# Legacy function for backward compatibility
def parse_repo(repo_path: str) -> Dict[str, Any]:
    """
    Parse a Python repo into modules, functions, and calls.
    Deprecated: Use parse_python_file for richer parsing.
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
