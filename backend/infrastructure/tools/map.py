from __future__ import annotations
from typing import List, Union, Annotated, Literal, Optional
from pydantic import BaseModel, Field, model_validator
from backend.infrastructure.geo import geocode_address
from concurrent.futures import ThreadPoolExecutor, as_completed
import geojson
from backend.infrastructure.persistence import create_map_entry

def _resolve_nominatim_point(p: NominatimPoint) -> LatLonPoint:
    coords = geocode_address(p.nominatim_query)
    if not coords:
        raise ValueError(f"Geocoding failed for: {p.nominatim_query}")
    lat, lon = coords
    return LatLonPoint(
        lat=lat,
        lon=lon,
        name=p.name or p.nominatim_query,
        description=p.description,
        url=p.url,
    )

def create_map(ctx, points: List[Union[LatLonPoint, NominatimPoint]]) -> str:
    resolved: List[Optional[LatLonPoint]] = [None] * len(points)
    to_resolve: dict = {}

    # Keep existing LatLonPoint and queue NominatimPoint
    for i, p in enumerate(points):
        if isinstance(p, LatLonPoint):
            resolved[i] = p
        elif isinstance(p, NominatimPoint):
            to_resolve[i] = p
        else:
            raise TypeError(f"Unsupported point type at index {i}: {type(p)}")

    # Parallel geocoding
    errors: list[str] = []
    if to_resolve:
        max_workers = 4  # keep polite to Nominatim; adjust if you self-host
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            future_map = {ex.submit(_resolve_nominatim_point, p): i for i, p in to_resolve.items()}
            for fut in as_completed(future_map):
                idx = future_map[fut]
                try:
                    resolved[idx] = fut.result()
                except Exception as e:
                    errors.append(f"index={idx} query={to_resolve[idx].nominatim_query} error={e}")

    if errors:
        # You can choose to log instead of raising
        raise RuntimeError("Some points failed to geocode:\n" + "\n".join(errors))

    latlon_points: List[LatLonPoint] = [p for p in resolved if p is not None]

    features = []
    for p in latlon_points:
        feature = geojson.Feature(
            geometry=geojson.Point((p.lon, p.lat)),
            properties={
                "name": p.name,
                "description": p.description,
                "url": p.url,
            }
        )
        features.append(feature)

    fc = geojson.FeatureCollection(features)
    geojson_str = geojson.dumps(fc, indent=2)

    create_map_entry(str(ctx.current_message_id), geojson_str)

    return geojson_str


class LatLonPoint(BaseModel):
    type : Literal["latlon"] = "latlon"
    lat : float = Field(..., description="Latitude of the point")
    lon : float = Field(..., description="Longitude of the point")
    name : str | None = Field(default=None, description="Name of the point")
    description : str | None = Field(default=None, description="Description of the point")
    url : str | None = Field(default=None, description="URL associated with the point")


class NominatimPoint(BaseModel):
    type : Literal["nominatim"] = "nominatim"
    nominatim_query : str = Field(..., description="Nominatim query string")
    name : str | None = Field(default=None, description="Name of the point")
    description : str | None = Field(default=None, description="Description of the point")
    url : str | None = Field(default=None, description="URL associated with the point")

Point = Annotated[Union[NominatimPoint, LatLonPoint], Field(discriminator="type")]

class MapCreationInput(BaseModel):
    points: List[Point] = Field(..., description="List of points to include on the map")

    @model_validator(mode="before")
    def ensure_point_types(values):
        pts = values.get("points")
        if pts is None:
            return values
        new_pts = []
        for p in pts:
            if not isinstance(p, dict):
                new_pts.append(p)
                continue
            if 'type' in p:
                if  p['type'] == 'latlon' :
                    new_pts.append(dict(p, type="latlon"))
                elif p['type'] == 'nominatim':
                    new_pts.append(dict(p, type="nominatim"))
            else:
                if 'lat' in p and 'lon' in p:
                    new_pts.append(dict(p, type="latlon"))
                elif 'nominatim_query' in p:
                    new_pts.append(dict(p, type="nominatim"))
        values["points"] = new_pts
        return values
