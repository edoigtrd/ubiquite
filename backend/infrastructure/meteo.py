import requests
from typing import Tuple, Dict
from backend.infrastructure.config import load_main_config

_cfg = load_main_config()
_NOMINATIM = _cfg.get("nominatim.url")
_OPENMETEO = _cfg.get("weather.open_meteo_url")
_ICON_BASE = _cfg.get("weather.icons_base_url")

_session = requests.Session()
_session.headers.update({"User-Agent": "edo-weather/1.0 (+contact@example.com)"})


def reverse_geocode_city(lat: float, lon: float) -> str:
    r = _session.get(
        _NOMINATIM,
        params={"lat": lat, "lon": lon, "format": "json", "addressdetails": 1},
        timeout=10,
    )
    r.raise_for_status()
    a = r.json().get("address", {})
    return a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or r.json().get("display_name", "")


def fetch_open_meteo(lat: float, lon: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
        "wind_speed_unit": "kmh",
        "timezone": "auto",
    }
    r = _session.get(_OPENMETEO, params=params, timeout=10)
    r.raise_for_status()
    return r.json()


def _label_and_icon(code: int, is_day: int) -> Tuple[str, str]:
    day = bool(is_day)
    if code == 0:
        return ("sunny", "clear-day" if day else "clear-night")
    if code in (1, 2):
        return ("partly cloudy", "partly-cloudy-day" if day else "partly-cloudy-night")
    if code == 3:
        return ("cloudy", "overcast-day" if day else "overcast-night")
    if code in (45, 48):
        return ("fog", "fog-day" if day else "fog-night")
    if code in (51, 53, 55):
        return ("drizzle", "drizzle")
    if code in (56, 57):
        return ("freezing drizzle", "sleet")
    if code in (61, 63, 65):
        labels: Dict[int, str] = {61: "light rain", 63: "moderate rain", 65: "heavy rain"}
        return (labels[code], "rain")
    if code in (66, 67):
        return ("freezing rain", "sleet")
    if code in (71, 73, 75, 77):
        return ("snow", "snow")
    if code in (80, 81, 82):
        labels = {80: "light showers", 81: "showers", 82: "violent showers"}
        return (labels[code], "rain")
    if code in (85, 86):
        return ("snow showers", "snow")
    if code in (95, 96, 99):
        return ("thunderstorm", "thunderstorms-day" if day else "thunderstorms-night")
    return ("not available", "not-available")


def get_weather_snapshot(lat: float, lon: float) -> dict:
    city = reverse_geocode_city(lat, lon)
    om = fetch_open_meteo(lat, lon)
    cur = om["current"]
    condition, icon_slug = _label_and_icon(int(cur["weather_code"]), int(cur["is_day"]))
    return {
        "city": city,
        "local_time": cur["time"],
        "condition": condition,
        "temp_c": cur["temperature_2m"],
        "wind_kmh": cur["wind_speed_10m"],
        "humidity_pct": cur["relative_humidity_2m"],
        "icon_slug": icon_slug,
        "icon_url_hint": f"{_ICON_BASE}/{icon_slug}.svg",
    }
