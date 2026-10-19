"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { DisplayStatus } from "@/lib/availability";

export type MapPlace = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
  status?: DisplayStatus;
};

const ALMATY: L.LatLngTuple = [43.238, 76.945];

const DOT: Record<DisplayStatus, string> = {
  free: "--dot: var(--status-free)",
  limited: "--dot: var(--status-limited)",
  full: "--dot: var(--status-full)",
  stale: "--dot-border: 1.5px solid var(--status-full)",
  unknown: "--dot-border: 1.5px solid var(--status-full)",
};

function pinIcon(place: MapPlace, selected: boolean) {
  const style = place.status ? DOT[place.status] : "";
  // label — только цена (число), текст из базы в HTML не попадает.
  return L.divIcon({
    className: `map-pin${selected ? " is-selected" : ""}`,
    html: `<span style="${style}">${place.label}</span>`,
    iconSize: [110, 44],
    iconAnchor: [55, 22],
  });
}

/** Leaflet + тайлы OpenStreetMap. Грузится только в браузере. */
export default function LeafletMap({
  places,
  selectedId,
  onSelect,
}: {
  places: MapPlace[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Карта и маркеры — при смене списка объектов.
  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, { zoomControl: false }).setView(
      ALMATY,
      9,
    );
    L.control.zoom({ position: "topright" }).addTo(m);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on("click", () => onSelectRef.current(null));

    const current = markers.current;
    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: pinIcon(place, false),
        title: place.title,
        keyboard: true,
      })
        .on("click", () => onSelectRef.current(place.id))
        .addTo(m);
      current.set(place.id, marker);
    }

    if (places.length > 0) {
      m.fitBounds(
        L.latLngBounds(places.map((p) => [p.lat, p.lng] as L.LatLngTuple)),
        { padding: [60, 60], maxZoom: 12 },
      );
    }
    map.current = m;

    return () => {
      current.clear();
      m.remove();
      map.current = null;
    };
  }, [places]);

  // Выделение выбранного маркера.
  useEffect(() => {
    for (const place of places) {
      const marker = markers.current.get(place.id);
      if (!marker) continue;
      const selected = place.id === selectedId;
      marker.setIcon(pinIcon(place, selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
    }
  }, [places, selectedId]);

  return <div ref={container} className="size-full bg-map-bg" />;
}
