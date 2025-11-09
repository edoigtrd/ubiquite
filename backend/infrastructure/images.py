from backend.infrastructure.rerankers import ImageResult
import requests
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
from backend.infrastructure.config import load_config

def search_searx_images(query: str, language: str = "fr", max_results: int = 10) -> List[Dict[str, str]]:
    url = load_config().get("searx.endpoint", "https://searx.be") + "/search"

    response = requests.get(
        url,
        params={
            "q": query,
            "language": language,
            "categories": "images",
            "format": "json",
            "safesearch": 1,
            "num": max_results,
        },
        verify=False,
        timeout=10,
    )
    response.raise_for_status()

    data = response.json()
    data = data.get("results", [])
    return data[:max_results]

def search_searx_images_wrapper(query: List[str], language: str = "fr", max_results: int = 10) -> List[ImageResult]:
    max_results_per_query = load_config().get("images_search.max_results_per_query", 6)
    res = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(search_searx_images, q, language, max_results_per_query): q for q in query}
        for future in as_completed(futures):
            results = future.result()
            for r in results:
                res.append(ImageResult(
                    title=r.get("title", ""),
                    url=r.get("url", ""),
                    source=r.get("source", ""),
                    img=r.get("img_src", None)
                ))
    seen_urls = set()
    unique_res = []
    for r in res:
        if r.img is None:
            continue
        if r.img not in seen_urls:
            unique_res.append(r)
            seen_urls.add(r.img)
    return unique_res