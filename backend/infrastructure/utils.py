import html2text
import yaml
from enum import Enum
from timezonefinder import TimezoneFinder
import zoneinfo
from functools import lru_cache
from typing import Iterable, Callable, List, TypeVar

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