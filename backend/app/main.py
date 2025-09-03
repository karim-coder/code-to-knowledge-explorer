from fastapi import FastAPI
from app.parsers import python_parser

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/parse/python")
def parse_python_repo(path: str = "."):
    """
    Example: /parse/python?path=./examples/python_project
    """
    return python_parser.parse_repo(path)


@app.get("/")
def root():
    return {"message": "Code-to-Knowledge Explorer API is running 🚀"}
