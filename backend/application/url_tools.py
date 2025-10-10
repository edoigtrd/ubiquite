import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin, urlunparse
from pydantic import BaseModel, Field

class SourcePreview(BaseModel):
    title: str | None = None
    description: str | None = None
    image: str | None = None
    url: str
    site_name: str | None = None

def remove_url_params(url: str) -> str:
    parsed = urlparse(url)
    clean = parsed._replace(query="", fragment="")
    return urlunparse(clean)

def get_url_preview(url: str) -> SourcePreview:
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, timeout=5, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    def get_meta(property_name: str) -> str | None:
        tag = soup.find("meta", property=property_name) or soup.find("meta", attrs={"name": property_name})
        return tag["content"].strip() if tag and "content" in tag.attrs else None

    # --- Reddit ---
    if "reddit" in urlparse(url).netloc:
        jpage = requests.get(f"{remove_url_params(url)}.json", timeout=5, headers=headers)
        jpage = jpage.json() if jpage.status_code == 200 else None
        if isinstance(jpage, list) and jpage:
            children = jpage[0].get("data", {}).get("children", [])
            if children:
                post = children[0].get("data", {})
                return SourcePreview(
                    title=post.get("title"),
                    description=post.get("selftext") or post.get("title"),
                    image=post.get("thumbnail") if post.get("thumbnail", "").startswith("http") else None,
                    url=url,
                    site_name="Reddit"
                )

    # --- General metadata ---
    title = get_meta("og:title")
    description = get_meta("og:description") or get_meta("description")
    image = get_meta("og:image") or get_meta("twitter:image")
    site_name = get_meta("og:site_name") or urlparse(url).netloc
    final_url = get_meta("og:url") or url

    # --- Fallback favicon ---
    if not image:
        favicon_tag = soup.find("link", rel=lambda x: x and "icon" in x.lower())
        if favicon_tag and favicon_tag.get("href"):
            image = urljoin(url, favicon_tag["href"])
        else:
            parsed = urlparse(url)
            image = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"

    return SourcePreview(
        title=title,
        description=description,
        image=image,
        url=final_url,
        site_name=site_name
    )
