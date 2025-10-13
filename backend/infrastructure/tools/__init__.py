from langchain.tools import StructuredTool

from .searx import search_searx, SearchInput
from .url_fetch import retrieve_url, RetrieveUrlInput
from .math import math, MathInput
from .utils import FailsafeWrapper


def build_tools(ctx):
    search_tool = StructuredTool.from_function(
        func=FailsafeWrapper(search_searx, ctx),
        name="search_searx",
        description="Search Searx. THIS TOOL USAGE IS MANDATORY",
        args_schema=SearchInput,
    )

    fetch_url_tool = StructuredTool.from_function(
        func=FailsafeWrapper(retrieve_url),
        name="fetch_url",
        description="Fetch a URL and convert its HTML content to Markdown.",
        args_schema=RetrieveUrlInput,
    )

    math_tool = StructuredTool.from_function(
        func=FailsafeWrapper(math),
        name="math",
        description="Evaluate a mathematical expression (sympy.simplify).\nPlease always use this tool for math expressions.",
        args_schema=MathInput,
    )

    return [search_tool, fetch_url_tool, math_tool]