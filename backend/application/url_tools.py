import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from pydantic import BaseModel, Field

class SourcePreview(BaseModel):
    title: str | None = None
    description: str | None = None
    image: str | None = None
    url: str
    site_name: str | None = None


def get_url_preview(url: str) -> SourcePreview:
    response = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")

    def get_meta(property_name):
        tag = soup.find("meta", property=property_name) or soup.find("meta", attrs={"name": property_name})
        return tag["content"].strip() if tag and "content" in tag.attrs else None

    preview = {
        "title": get_meta("og:title"),
        "description": get_meta("og:description") or get_meta("description"),
        "image": get_meta("og:image"),
        "url": get_meta("og:url") or url,
        "site_name": get_meta("og:site_name") or urlparse(url).netloc
    }

    if not preview["image"]:
        parsed = urlparse(url)
        favicon_tag = soup.find("link", rel=lambda x: x and "icon" in x.lower())
        if favicon_tag and favicon_tag.get("href"):
            preview["image"] = urljoin(url, favicon_tag["href"])
        else:
            preview["image"] = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"

    return SourcePreview(**preview)