from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import uuid
from backend.infrastructure.config import load_main_config

_cfg = load_main_config()

_NOMINATIM = _cfg.get("nominatim.url")


def create_user_agent() -> str:
    return f"Ubiquite instance {uuid.uuid4()} edoigtrd/ubiquite" 

geocoder = Nominatim(user_agent=create_user_agent(), domain=_NOMINATIM)
geocode = RateLimiter(geocoder.geocode, min_delay_seconds=1, swallow_exceptions=True)
reverse = RateLimiter(geocoder.reverse, min_delay_seconds=1, swallow_exceptions=True)


def geocode_address(address: str):
    location = geocode(address)
    if location:
        return location.latitude, location.longitude
    return ValueError(f"Could not geocode address: {address}")


def osm_url(lat: float, lon: float, zoom: int = 16) -> str:
    """Return the OpenStreetMap URL centered on a given lat/lon."""
    return f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map={zoom}/{lat}/{lon}"

def reverse_geocode_city(lat: float, lon: float) -> str:
    location = reverse((lat, lon), exactly_one=True)
    if location is None:
        return "Unknown location"
    address = location.raw.get("address", {})
    city = address.get("city") or address.get("town") or address.get("village") or address.get("hamlet")
    state = address.get("state")
    country = address.get("country")
    parts = []
    if city:
        parts.append(city)
    if state:
        parts.append(state)
    if country:
        parts.append(country)
    return ", ".join(parts) if parts else "Unknown location"