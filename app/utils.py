import html2text
import yaml
from enum import Enum
from timezonefinder import TimezoneFinder
import zoneinfo


_h2t = html2text.HTML2Text()
_h2t.ignore_images = True
_h2t.ignore_emphasis = False
_h2t.ignore_links = False
_h2t.body_width = 0


def convert_to_markdown(html: str) -> str:
    """Convert HTML to Markdown using html2text with sane defaults."""
    return _h2t.handle(html)

def convert_to_yaml(data: dict) -> str:
    """Convert a dictionary to a YAML-formatted string."""
    return yaml.dump(data, sort_keys=False)

def get_timezone(lat: float, lon: float) -> str:
    """Get the timezone name for given latitude and longitude."""
    tf = TimezoneFinder()
    tz = tf.timezone_at(lat=lat, lng=lon) or "UTC"
    return zoneinfo.ZoneInfo(tz)

class Role(Enum) :
    USER = "human"
    ASSISTANT = "ai"