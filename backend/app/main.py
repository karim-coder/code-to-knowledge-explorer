from fastapi import FastAPI
from app.parsers import python_parser

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/parse/python")
def parse_python_file(path: str = "./examples/python_project/hello.py"):
    """
    Parse a Python file and return structured information.

    Args:
        path: Path to the Python file to parse.

    Returns:
        JSON with functions and classes, or error message.
    """
    result = python_parser.parse_python_file(path)
    return result

@app.get("/")
def root():
    return {"message": "Code-to-Knowledge Explorer API is running 🚀"}
