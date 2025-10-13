from pydantic import BaseModel, Field
from sympy import sympify, SympifyError

def math(expression: str) -> str:
    try:
        expr = sympify(expression).n()
        return str(expr)
    except SympifyError as e:
        return f"Error evaluating expression: {str(e)}"

class MathInput(BaseModel):
    expression: str = Field(..., description="The mathematical expression to evaluate")