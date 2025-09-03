from app.parsers import python_parser
from pathlib import Path

def test_parser_detects_functions(tmp_path: Path):
    # create a temporary Python file
    file = tmp_path / "hello.py"
    file.write_text("def foo():\n    print('hi')\n")

    result = python_parser.parse_repo(str(tmp_path))

    assert "hello.py" in result["modules"]
    assert any(f["name"] == "foo" for f in result["functions"])
