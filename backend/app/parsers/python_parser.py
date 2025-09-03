import ast
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
import re

def parse_python_file(file_path: str) -> Dict[str, Any]:
    """
    Parse a Python file using the ast module and extract comprehensive structural information.

    Args:
        file_path: Path to the Python file to parse.

    Returns:
        Dict containing functions, classes, relationships, and analysis insights.
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

    # Extract all code elements
    functions = []
    classes = []
    imports = []
    relationships = {
        "function_calls": [],
        "class_inheritance": [],
        "method_calls": [],
        "attribute_access": []
    }

    # First pass: collect all functions and classes
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and not _is_method(node, tree):
            functions.append(_extract_function_info(node))
        elif isinstance(node, ast.ClassDef):
            classes.append(_extract_class_info(node))
        elif isinstance(node, ast.Import):
            imports.extend(_extract_import_info(node))
        elif isinstance(node, ast.ImportFrom):
            imports.extend(_extract_import_from_info(node))

    # Second pass: extract relationships
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            _extract_call_relationships(node, relationships, functions, classes)
        elif isinstance(node, ast.Attribute):
            _extract_attribute_relationships(node, relationships)

    # Calculate code metrics and insights
    metrics = _calculate_code_metrics(source, functions, classes, relationships)

    return {
        "functions": functions,
        "classes": classes,
        "imports": imports,
        "relationships": relationships,
        "metrics": metrics,
        "insights": _generate_insights(functions, classes, relationships, metrics)
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

def _extract_import_info(node: ast.Import) -> List[Dict[str, str]]:
    """Extract information from import statements."""
    imports = []
    for alias in node.names:
        imports.append({
            "name": alias.name,
            "asname": alias.asname,
            "type": "import"
        })
    return imports

def _extract_import_from_info(node: ast.ImportFrom) -> List[Dict[str, str]]:
    """Extract information from from-import statements."""
    imports = []
    module = node.module or ""
    for alias in node.names:
        imports.append({
            "module": module,
            "name": alias.name,
            "asname": alias.asname,
            "type": "from_import"
        })
    return imports

def _extract_call_relationships(node: ast.Call, relationships: Dict, functions: List, classes: List) -> None:
    """Extract function and method call relationships."""
    if isinstance(node.func, ast.Name):
        # Direct function call
        func_name = node.func.id
        relationships["function_calls"].append({
            "caller": None,  # Will be filled by context
            "callee": func_name,
            "type": "function_call"
        })
    elif isinstance(node.func, ast.Attribute):
        # Method call or attribute access
        if isinstance(node.func.value, ast.Name):
            obj_name = node.func.value.id
            method_name = node.func.attr
            relationships["method_calls"].append({
                "object": obj_name,
                "method": method_name,
                "type": "method_call"
            })

def _extract_attribute_relationships(node: ast.Attribute, relationships: Dict) -> None:
    """Extract attribute access relationships."""
    if isinstance(node.value, ast.Name):
        relationships["attribute_access"].append({
            "object": node.value.id,
            "attribute": node.attr,
            "type": "attribute_access"
        })

def _calculate_code_metrics(source: str, functions: List, classes: List, relationships: Dict) -> Dict[str, Any]:
    """Calculate various code metrics."""
    lines = source.split('\n')
    total_lines = len(lines)
    code_lines = len([line for line in lines if line.strip() and not line.strip().startswith('#')])

    return {
        "total_lines": total_lines,
        "code_lines": code_lines,
        "function_count": len(functions),
        "class_count": len(classes),
        "complexity_score": _calculate_complexity_score(functions, classes),
        "relationship_density": len(relationships["function_calls"]) + len(relationships["method_calls"]),
        "documentation_coverage": _calculate_doc_coverage(functions, classes)
    }

def _calculate_complexity_score(functions: List, classes: List) -> float:
    """Calculate a simple complexity score based on code structure."""
    score = 0
    score += len(functions) * 1.0  # Functions add complexity
    score += len(classes) * 2.0    # Classes add more complexity
    for cls in classes:
        score += len(cls["methods"]) * 0.5  # Methods add complexity
    return round(score, 2)

def _calculate_doc_coverage(functions: List, classes: List) -> float:
    """Calculate documentation coverage percentage."""
    total_items = len(functions)
    for cls in classes:
        total_items += 1 + len(cls["methods"])

    documented_items = 0
    for func in functions:
        if func["docstring"]:
            documented_items += 1
    for cls in classes:
        if cls["docstring"]:
            documented_items += 1
        for method in cls["methods"]:
            if method["docstring"]:
                documented_items += 1

    return round((documented_items / total_items * 100) if total_items > 0 else 0, 1)

def _generate_insights(functions: List, classes: List, relationships: Dict, metrics: Dict) -> List[str]:
    """Generate insightful observations about the code."""
    insights = []

    # Complexity insights
    if metrics["complexity_score"] > 10:
        insights.append("High complexity detected - consider breaking down large functions or classes")
    elif metrics["complexity_score"] < 3:
        insights.append("Simple codebase with good modularity")

    # Documentation insights
    if metrics["documentation_coverage"] < 50:
        insights.append(f"Low documentation coverage ({metrics['documentation_coverage']}%) - consider adding more docstrings")
    elif metrics["documentation_coverage"] > 80:
        insights.append("Excellent documentation coverage!")

    # Structure insights
    if len(classes) > len(functions):
        insights.append("Class-heavy design - good for encapsulation")
    elif len(functions) > len(classes) * 2:
        insights.append("Function-heavy design - good for procedural programming")

    # Relationship insights
    if metrics["relationship_density"] > 20:
        insights.append("High coupling detected - functions/classes are tightly interconnected")
    elif metrics["relationship_density"] < 5:
        insights.append("Low coupling - good separation of concerns")

    return insights

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
