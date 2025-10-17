"use client";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import L from "leaflet";
import convex from "@turf/convex";
import centroid from "@turf/centroid";
import bbox from "@turf/bbox";
import { featureCollection, point } from "@turf/helpers";
import "leaflet/dist/leaflet.css";

type Props = {
  className?: string;
  data?: any; // string JSON (GeoJSON)
};

const FALLBACK_CENTER: [number, number] = [0, 0];
const FALLBACK_ZOOM = 12;

function useGeo(jsonLike: any) {
  const fc = useMemo<FeatureCollection<Geometry, any> | null>(() => {
    if (!jsonLike) return null;
    const raw = typeof jsonLike === "string" ? JSON.parse(jsonLike) : jsonLike;
    if (raw.type === "FeatureCollection") return raw as FeatureCollection;
    if (raw.type === "Feature") return featureCollection([raw]) as any;
    if (raw.type === "Point")
      return featureCollection([point(raw.coordinates)]) as any;
    return null;
  }, [jsonLike]);

  const hull = useMemo(() => (fc ? convex(fc) : null), [fc]);
  const center = useMemo<[number, number]>(() => {
    if (hull) {
      const c = centroid(hull).geometry.coordinates as [number, number];
      return [c[1], c[0]];
    }
    if (fc && fc.features.length > 0) {
      const c = centroid(fc).geometry.coordinates as [number, number];
      return [c[1], c[0]];
    }
    return FALLBACK_CENTER;
  }, [fc, hull]);

  const bounds = useMemo<L.LatLngBounds | null>(() => {
    if (!fc || fc.features.length === 0) return null;
    const [minX, minY, maxX, maxY] = bbox(fc);
    return L.latLngBounds([
      [minY, minX],
      [maxY, maxX]
    ]);
  }, [fc]);

  return { fc, center, bounds };
}

function FitToBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) map.fitBounds(bounds.pad(0.2));
  }, [bounds, map]);
  return null;
}

function AutoZoom({ center, bounds }: { center: [number, number]; bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      const z = map.getBoundsZoom(bounds, false, [50, 50]);
      map.setView(center, z);
    } else {
      map.setView(center, FALLBACK_ZOOM);
    }
  }, [bounds, center, map]);
  return null;
}

const customIcon = L.icon({
  iconUrl: "../public/MaterialSymbolsLocationOn.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

export default function Map({ className, data }: Props) {
  const { fc, center, bounds } = useGeo(data);

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={FALLBACK_ZOOM}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <AutoZoom center={center} bounds={bounds} />

        {fc && (
          <GeoJSON
            data={fc}
            pointToLayer={(_, latlng) => L.marker(latlng, { icon: customIcon })}
            onEachFeature={(feature, layer) => {
              const p = feature?.properties || {};
              const title = p.name ?? "Point";
              const desc = p.description ?? "";
              layer.bindPopup(`<strong>${title}</strong><br/>${desc}`);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
