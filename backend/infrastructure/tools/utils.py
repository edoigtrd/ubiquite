from typing import List, Dict
import requests
import stealth_requests
from pydantic import BaseModel, Field
from langchain.tools import StructuredTool
from lxml import html as lhtml
from backend.infrastructure.utils import convert_to_markdown, convert_to_yaml
from backend.infrastructure.config import load_main_config
from sympy import sympify, SympifyError


class FailsafeWrapper:
    def __init__(self, func, ctx=None, *args, **kwargs):
        self.func = func
        self.args = args
        self.kwargs = kwargs
        self.ctx = ctx

    def __call__(self, *args, **kwargs):
        # sum self.args and self.kwargs with args and kwargs
        args = self.args + args
        kwargs = {**self.kwargs, **kwargs}
        if "ctx" in self.func.__code__.co_varnames and self.ctx is not None:
            kwargs["ctx"] = self.ctx
        try:
            return self.func(*args, **kwargs)
        except Exception as e:
            return convert_to_yaml({
                "error": str(e)
            })

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


