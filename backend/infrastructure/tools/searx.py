from typing import List, Dict
import requests
import stealth_requests
from pydantic import BaseModel, Field
from langchain.tools import StructuredTool
from lxml import html as lhtml
from backend.infrastructure.utils import convert_to_markdown, convert_to_yaml
from backend.infrastructure.config import load_main_config
from sympy import sympify, SympifyError


def search_searx(ctx, query: str, language: str) -> List[Dict[str, str]]:
    url = ctx.cfg("searx.endpoint")

    focus_cond = load_main_config().get("focuses.{}.cond".format(ctx.focus)) if ctx.focus else None
    focus_str = " OR ".join(focus_cond) if focus_cond else None
    q = "{} {}".format(focus_str, query) if focus_str else query
    
    response = requests.get(url, params={
        "q": q,
        "language": language,
        "format": "json",
    })

    data = response.json()
    results = []
    for result in data.get("results", []):
        results.append({
            "title": result.get("title", ""),
            "content": result.get("content", ""),
            "url": result.get("url", ""),
        })
    return results

class SearchInput(BaseModel):
    query: str = Field(..., description="The search query")
    language: str = Field(..., description="The language code")