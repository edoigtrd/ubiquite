from langchain.tools import StructuredTool

from .searx import search_searx, SearchInput
from .url_fetch import retrieve_url, RetrieveUrlInput
from .math import math, MathInput
from .map import create_map, MapCreationInput
from .utils import FailsafeWrapper
from ..utils import s


def build_tools(ctx):
    search_tool = StructuredTool.from_function(
        func=FailsafeWrapper(search_searx, ctx),
        name="search_searx",
        description="Search Searx. THIS TOOL USAGE IS MANDATORY",
        args_schema=SearchInput,
    )

    fetch_url_tool = StructuredTool.from_function(
        func=FailsafeWrapper(retrieve_url, ctx),
        name="fetch_url",
        description="Fetch a URL and convert its HTML content to Markdown.",
        args_schema=RetrieveUrlInput,
    )

    math_tool = StructuredTool.from_function(
        func=FailsafeWrapper(math, ctx),
        name="math",
        description="Evaluate a mathematical expression (sympy.simplify).\nPlease always use this tool for math expressions.",
        args_schema=MathInput,
    )

    map_tool = StructuredTool.from_function(
        func=FailsafeWrapper(create_map, ctx),
        name="create_map",
        description=s(
            "Create a map with given points (latitude, longitude, name, description, url).",
            " Use it when the user asks for a map or to visualize locations.",
            "Note: When working with maps, if points are to be created or located, you can use either direct latitude/longitude (latlon) values or resolve place names/addresses using Nominatim through the map creation tool. Prefer using Nominatim for user-friendly address-based points when appropriate, but latlon can be used if coordinates are already provided or more suitable.",
            " You can only generate one map per response, if you create more than one map in a single response, only the last one will be saved. This feature can be used if you made a mistake in the first map creation attempt.",
        ),
        args_schema=MapCreationInput,
    )

    return [search_tool, fetch_url_tool, math_tool, map_tool]