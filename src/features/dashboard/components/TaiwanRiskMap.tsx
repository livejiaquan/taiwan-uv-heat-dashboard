import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapPin } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger, formatNumber } from "../../../lib/format";
import type { CountyRisk, RiskTone } from "../../../lib/types";

interface TaiwanRiskMapProps {
  counties: CountyRisk[];
  selectedCounty?: string;
  onSelect: (county: string) => void;
}

const TAIWAN_CENTER: L.LatLngExpression = [23.72, 120.95];
const TAIWAN_BOUNDS = L.latLngBounds([21.65, 118.0], [26.45, 122.45]);

const markerColors: Record<RiskTone, { fill: string; stroke: string }> = {
  unknown: { fill: "#94a3b8", stroke: "#475569" },
  low: { fill: "#10b981", stroke: "#047857" },
  moderate: { fill: "#f59e0b", stroke: "#b45309" },
  high: { fill: "#f97316", stroke: "#c2410c" },
  "very-high": { fill: "#ef4444", stroke: "#b91c1c" },
  extreme: { fill: "#c026d3", stroke: "#86198f" },
};

export function TaiwanRiskMap({ counties, selectedCounty, onSelect }: TaiwanRiskMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, L.CircleMarker>>(new Map());

  const selected = useMemo(
    () => counties.find((county) => county.county === selectedCounty),
    [counties, selectedCounty],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      attributionControl: true,
      maxBounds: TAIWAN_BOUNDS.pad(0.2),
      minZoom: 6,
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(TAIWAN_CENTER, 7);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resize = window.setTimeout(() => map.invalidateSize(), 80);
    const markers = markerRefs.current;
    return () => {
      window.clearTimeout(resize);
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      markers.clear();
    };
  }, []);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    markerRefs.current.clear();

    for (const county of counties) {
      const colors = markerColors[county.overallLevel.tone];
      const marker = L.circleMarker([county.lat, county.lon], {
        radius: county.overallLevel.tone === "unknown" ? 8 : 9 + Math.max(0, county.overallLevel.score) * 2,
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: county.county === selectedCounty ? 0.95 : 0.78,
        opacity: 0.95,
        weight: county.county === selectedCounty ? 4 : 2,
      });

      marker.bindTooltip(
        `${county.county}<br>UV ${formatInteger(county.uvIndex)} · ${formatNumber(
          Math.max(
            county.heatIndex ?? -Infinity,
            county.forecastMaxTemperature ?? -Infinity,
            county.observedTemperature ?? -Infinity,
          ),
        )}°C<br>${county.overallLevel.label}`,
        { direction: "top", offset: [0, -8], opacity: 0.95 },
      );
      marker.on("click", () => onSelect(county.county));
      marker.addTo(layer);
      markerRefs.current.set(county.county, marker);
    }
  }, [counties, onSelect, selectedCounty]);

  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo([selected.lat, selected.lon], 8, { duration: 0.55 });
  }, [selected]);

  return (
    <section className="rounded-2xl border border-white/75 bg-white/85 p-5 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-sm font-bold text-reef-700">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Taiwan Risk Map
          </p>
          <h2 className="mt-1 text-2xl font-black text-ink-900">台灣縣市風險地圖</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">
            以實際台灣底圖呈現各縣市風險位置，點選標記可同步右側縣市細節。
          </p>
        </div>
        {selected ? <RiskPill level={selected.overallLevel} label={selected.county} /> : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-ink-100/60">
        <div ref={containerRef} className="risk-map" aria-label="台灣縣市 UV 與高溫風險地圖" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink-500">
        <LegendDot tone="unknown" label="資料不足" />
        <LegendDot tone="low" label="低" />
        <LegendDot tone="moderate" label="中" />
        <LegendDot tone="high" label="高" />
        <LegendDot tone="very-high" label="很高" />
        <LegendDot tone="extreme" label="極端" />
      </div>
    </section>
  );
}

function LegendDot({ tone, label }: { tone: RiskTone; label: string }) {
  const colors = markerColors[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white/70 px-2.5 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.fill }} />
      {label}
    </span>
  );
}
