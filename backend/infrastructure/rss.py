from __future__ import annotations
from typing import Optional
from pydantic import BaseModel
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
import functools

class Article(BaseModel):
    title: str
    link: str
    description: Optional[str] = None
    pub_date: Optional[str] = None
    image : Optional[str] = None

ATOM_NS = "{http://www.w3.org/2005/Atom}"
CONTENT_NS = "{http://purl.org/rss/1.0/modules/content/}"

def _fetch_xml(url: str) -> ET.Element:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=15) as r:
        data = r.read()
    return ET.fromstring(data)

def _text(el: Optional[ET.Element]) -> Optional[str]:
    return el.text.strip() if el is not None and el.text else None

def _first(el: ET.Element, paths: list[str]) -> Optional[ET.Element]:
    for p in paths:
        found = el.find(p)
        if found is not None:
            return found
    return None

def fetch_latest_article(url: str) -> Article:
    root = _fetch_xml(url)

    # RSS 2.0
    if root.tag.endswith("rss"):
        channel = _first(root, ["channel"])
        if channel is None:
            raise ValueError("Invalid RSS feed")
        items = channel.findall("item")
        if not items:
            raise ValueError("No items in feed")
        item = items[0]
        title = _text(_first(item, ["title"])) or ""
        link = _text(_first(item, ["link"])) or ""
        desc = _text(_first(item, ["description", CONTENT_NS + "encoded"]))
        pub = _text(_first(item, ["pubDate", "date"]))
        image = _text(_first(item, ["image", CONTENT_NS + "url"]))
        if not image:
            enclosure = item.find("enclosure")
            if enclosure is not None and enclosure.get("type", "").startswith("image/"):
                image = enclosure.get("url")
        return Article(title=title, link=link, description=desc, pub_date=pub, image=image)

    # Atom 1.0
    if root.tag == ATOM_NS + "feed":
        entries = root.findall(ATOM_NS + "entry")
        if not entries:
            raise ValueError("No entries in feed")
        entry = entries[0]
        title = _text(entry.find(ATOM_NS + "title")) or ""
        link_el = None
        for l in entry.findall(ATOM_NS + "link"):
            if l.get("rel") in (None, "alternate"):
                link_el = l
                break
        link = (link_el.get("href") if link_el is not None else None) or ""
        desc = _text(entry.find(ATOM_NS + "summary")) or _text(entry.find(ATOM_NS + "content"))
        pub = _text(_first(entry, [ATOM_NS + "updated", ATOM_NS + "published"]))
        return Article(title=title, link=link, description=desc, pub_date=pub)

    raise ValueError("Unsupported feed format")

@functools.lru_cache(maxsize=32)
def fetch_latest_article_cached(url: str) -> Article:
    return fetch_latest_article(url)