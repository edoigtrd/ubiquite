from typing import List, Dict
import requests
import stealth_requests
from pydantic import BaseModel, Field
from langchain.tools import StructuredTool
from lxml import html as lhtml
from backend.infrastructure.utils import convert_to_markdown


def search_searx(ctx, query: str, language: str) -> List[Dict[str, str]]:
    url = ctx.cfg("searx.endpoint")
    response = requests.get(url, params={
        "q": query,
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


def strip_doc(html: str) -> str:
    doc = lhtml.fromstring(html)

    for el in doc.xpath("//img | //source"):
        for attr in ("src", "srcset", "data-src", "data-srcset"):
            el.attrib.pop(attr, None)

    for svg in doc.xpath("//svg"):
        parent = svg.getparent()
        if parent is not None:
            parent.remove(svg)

    return lhtml.tostring(doc, encoding="unicode")


def retrieve_url(url: str) -> str:
    response = stealth_requests.get(url)
    document = response.text
    document = strip_doc(document)
    if response.status_code == 200:
        return convert_to_markdown(document)
    return f"Failed to retrieve URL: {response.status_code} {response.reason}"


class SearchInput(BaseModel):
    query: str = Field(..., description="The search query")
    language: str = Field(..., description="The language code")


class RetrieveUrlInput(BaseModel):
    url: str = Field(..., description="The URL to retrieve")


def build_tools(ctx):
    search_tool = StructuredTool.from_function(
        func=lambda query, language: search_searx(ctx, query=query, language=language),
        name="search_searx",
        description="Search Searx. THIS TOOL USAGE IS MANDATORY",
        args_schema=SearchInput,
    )

    fetch_url_tool = StructuredTool.from_function(
        func=retrieve_url,
        name="fetch_url",
        description="Fetch a URL and convert its HTML content to Markdown.",
        args_schema=RetrieveUrlInput,
    )

    return [search_tool, fetch_url_tool]
