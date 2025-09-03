from app.parsers import python_parser
from pathlib import Path

def test_parser_detects_functions_with_details():
    """Test detection of functions with arguments, return types, and docstrings."""
    file_path = "../examples/python_project/hello.py"
    result = python_parser.parse_python_file(file_path)

    assert "functions" in result
    assert "classes" in result
    assert "error" not in result

    functions = result["functions"]
    assert len(functions) == 2  # greet and add

    # Check greet function
    greet_func = next(f for f in functions if f["name"] == "greet")
    assert greet_func["args"] == ["name"]
    assert greet_func["returns"] == "str"
    assert greet_func["docstring"] == "Greets the user by name."

    # Check add function
    add_func = next(f for f in functions if f["name"] == "add")
    assert add_func["args"] == ["a", "b"]
    assert add_func["returns"] == "int"
    assert add_func["docstring"] == "Adds two numbers."

def test_parser_detects_classes_and_methods():
    """Test detection of classes with bases, docstrings, and methods."""
    file_path = "../examples/python_project/hello.py"
    result = python_parser.parse_python_file(file_path)

    classes = result["classes"]
    assert len(classes) == 2  # Greeter and Calculator

    # Check Greeter class
    greeter_class = next(c for c in classes if c["name"] == "Greeter")
    assert greeter_class["bases"] == []  # No explicit bases
    assert greeter_class["docstring"] == "Handles greeting operations."
    assert len(greeter_class["methods"]) == 3  # __init__, say_hello, farewell

    # Check __init__ method
    init_method = next(m for m in greeter_class["methods"] if m["name"] == "__init__")
    assert init_method["args"] == ["self", "default_name"]
    assert init_method["returns"] is None
    assert init_method["docstring"] == "Initialize with a default name."

    # Check say_hello method
    hello_method = next(m for m in greeter_class["methods"] if m["name"] == "say_hello")
    assert hello_method["args"] == ["self", "name"]
    assert hello_method["returns"] == "str"
    assert hello_method["docstring"] == "Returns a hello message."

    # Check Calculator class
    calc_class = next(c for c in classes if c["name"] == "Calculator")
    assert calc_class["docstring"] == "A simple calculator class."
    assert len(calc_class["methods"]) == 2  # multiply, divide

    multiply_method = next(m for m in calc_class["methods"] if m["name"] == "multiply")
    assert multiply_method["args"] == ["self", "x", "y"]
    assert multiply_method["returns"] == "float"
    assert multiply_method["docstring"] == "Multiplies two numbers."

def test_parser_error_handling():
    """Test error handling for invalid files."""
    result = python_parser.parse_python_file("nonexistent.py")
    assert "error" in result
    assert "File not found" in result["error"]

def test_parser_detects_functions(tmp_path: Path):
    """Legacy test for backward compatibility."""
    # create a temporary Python file
    file = tmp_path / "hello.py"
    file.write_text("def foo():\n    print('hi')\n")

    result = python_parser.parse_repo(str(tmp_path))

    assert "hello.py" in result["modules"]
    assert any(f["name"] == "foo" for f in result["functions"])
