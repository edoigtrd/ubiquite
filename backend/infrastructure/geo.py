from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import uuid
from backend.infrastructure.config import load_main_config
import importlib
from typing import Optional, Tuple, List, Dict, Any
from glom import glom, Coalesce
import functools


def load_class(path: str):
    module_name, class_name = path.rsplit(".", 1)
    module = importlib.import_module(module_name)
    return getattr(module, class_name)

_cfg = load_main_config()

_NOMINATIM = _cfg.get("nominatim.url")


def create_user_agent() -> str:
    return f"Ubiquite instance {uuid.uuid4()} edoigtrd/ubiquite"

_NOMINATIM_PARAMS = _cfg.get("nominatim", {"url":"nominatim.openstreetmap.org" })

if 'ratelimiter' in _NOMINATIM_PARAMS:
    _RATELIMITER_PARAMS = _NOMINATIM_PARAMS['ratelimiter']
    del _NOMINATIM_PARAMS['ratelimiter']

if 'cls' in _NOMINATIM_PARAMS:
    cls_path = _NOMINATIM_PARAMS['cls']
    cls = load_class(cls_path)
    del _NOMINATIM_PARAMS['cls']
else:
    cls = Nominatim

if not 'user_agent' in _NOMINATIM_PARAMS:
    _NOMINATIM_PARAMS['user_agent'] = create_user_agent()

geocoder = cls(**_NOMINATIM_PARAMS)
geocode = RateLimiter(geocoder.geocode, **_RATELIMITER_PARAMS)
reverse = RateLimiter(geocoder.reverse, **_RATELIMITER_PARAMS)


def geocode_address(address: str):
    location = geocode(address)
    if location:
        return location.latitude, location.longitude
    return ValueError(f"Could not geocode address: {address}")


def osm_url(lat: float, lon: float, zoom: int = 16) -> str:
    """Return the OpenStreetMap URL centered on a given lat/lon."""
    return f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map={zoom}/{lat}/{lon}"

def _pick_from_components(components: List[Dict[str, Any]], wanted: Tuple[str, ...]) -> Optional[str]:
    for comp in components or []:
        types = comp.get("types", [])
        if any(t in types for t in wanted):
            return comp.get("long_name") or comp.get("short_name")
    return None

@functools.lru_cache(maxsize=2048)
def reverse_geocode_city(lat: float, lon: float) -> str:
    loc = reverse((lat, lon), exactly_one=True)
    if not loc:
        return "Unknown location"

    raw = getattr(loc, "raw", None)
    if raw is None:
        s = str(loc).strip()
        return s if s else "Unknown location"

    # Nominatim paths
    city = glom(raw, Coalesce("address.city", "address.town", "address.village", "address.hamlet"), default=None)
    state = glom(raw, Coalesce("address.state", "address.region", "address.province"), default=None)
    country = glom(raw, "address.country", default=None)

    # GoogleV3 fallbacks
    components = glom(raw, Coalesce("address_components", "results.0.address_components"), default=[])
    if city is None:
        city = _pick_from_components(
            components,
            ("locality", "postal_town", "administrative_area_level_2", "sublocality", "sublocality_level_1"),
        )
    if state is None:
        state = _pick_from_components(components, ("administrative_area_level_1", "region", "province"))
    if country is None:
        country = _pick_from_components(components, ("country",))

    parts = [p for p in (city, state, country) if p]
    return ", ".join(parts) if parts else "Unknown location"