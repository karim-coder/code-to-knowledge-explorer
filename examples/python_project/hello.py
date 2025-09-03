"""A sample Python module for testing the parser."""

def greet(name: str) -> str:
    """Greets the user by name."""
    return f"Hello, {name}!"

def add(a: int, b: int) -> int:
    """Adds two numbers."""
    return a + b

class Greeter:
    """Handles greeting operations."""

    def __init__(self, default_name: str = "World"):
        """Initialize with a default name."""
        self.default_name = default_name

    def say_hello(self, name: str = None) -> str:
        """Returns a hello message."""
        if name is None:
            name = self.default_name
        return f"Hello, {name}!"

    def farewell(self) -> str:
        """Returns a farewell message."""
        return "Goodbye!"

class Calculator:
    """A simple calculator class."""

    def multiply(self, x: float, y: float) -> float:
        """Multiplies two numbers."""
        return x * y

    def divide(self, x: float, y: float) -> float:
        """Divides two numbers."""
        if y == 0:
            raise ValueError("Cannot divide by zero")
        return x / y
