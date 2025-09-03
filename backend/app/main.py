from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.parsers import python_parser

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/parse/python")
def parse_python_file(path: str = "../examples/python_project/hello.py"):
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
