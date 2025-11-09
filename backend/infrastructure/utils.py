import html2text
import yaml
from enum import Enum
from timezonefinder import TimezoneFinder
import zoneinfo
from functools import lru_cache
from typing import Iterable, Callable, List, Tuple, TypeVar
import re
from PIL import Image
import io
import requests
from concurrent.futures import ThreadPoolExecutor

T = TypeVar("T")


_h2t = html2text.HTML2Text()
_h2t.ignore_images = True
_h2t.ignore_emphasis = False
_h2t.ignore_links = False
_h2t.body_width = 0


def convert_to_markdown(html: str) -> str:
    return _h2t.handle(html)


def convert_to_yaml(data: dict) -> str:
    return yaml.dump(data, sort_keys=False)


def get_timezone(lat: float, lon: float) -> str:
    tf = TimezoneFinder()
    tz = tf.timezone_at(lat=lat, lng=lon) or "UTC"
    return zoneinfo.ZoneInfo(tz)


class Role(Enum):
    USER = "human"
    ASSISTANT = "ai"


def remove_duplicates_cond(lst: Iterable[T], eq: Callable[[T, T], bool]) -> List[T]:
    """Remove duplicates using a custom equality 'eq' while keeping order."""
    lst = list(lst)

    @lru_cache(maxsize=None)
    def cmp(i: int, j: int) -> bool:
        return eq(lst[i], lst[j])

    uniques_idx: List[int] = []
    for i in range(len(lst)):
        dup = False
        for j in uniques_idx:
            if cmp(i, j) or cmp(j, i):
                dup = True
                break
        if not dup:
            uniques_idx.append(i)

    return [lst[i] for i in uniques_idx]

def s(*lines: str) -> str:
    return "".join(lines)

def sanitize_string(text: str) -> str:
    # The messages may contain { and } which interfere with langchain, we need to escape them
    text = re.sub(r'(?<!{){(?!{)', '{{', text)  # { → {{
    text = re.sub(r'(?<!})}(?!})', '}}', text)  # } → }}
    return text

def sanitize_messages(messages: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
    return [(role, sanitize_string(content)) for role, content in messages]

def load_image_from_url(url: str) -> Image.Image:
    try :
        response = requests.get(url)
        image = Image.open(io.BytesIO(response.content))
        return image
    except Exception as e:
        print(f"Error loading image from {url}: {e}")
        return None

def load_images_from_urls(urls: List[str]) -> List[Image.Image]:
    with ThreadPoolExecutor() as executor:
        images = list(executor.map(load_image_from_url, urls))
    return images

def drop_none(l : List[T]) -> List[T]:
    return [x for x in l if x is not None]