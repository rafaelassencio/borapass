import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

type Kind = "passeios" | "hoteis" | "restaurantes" | "eventos" | "cupons";

const emojis: Record<Kind, string> = {
  passeios: "🎢",
  hoteis: "🏨",
  restaurantes: "🍽️",
  eventos: "📅",
  cupons: "🎟️",
};
const colors: Record<Kind, string> = {
  passeios: "#0EA5E9",
  hoteis: "#2563eb",
  restaurantes: "#F97316",
  eventos: "#a855f7",
  cupons: "#ef4444",
};

function makeIcon(kind: Kind) {
  return L.divIcon({
    className: "!bg-transparent !border-0",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:${colors[kind]};color:white;border:3px solid white;box-shadow:0 6px 14px -4px rgba(0,0,0,0.35);font-size:18px">${emojis[kind]}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export default function MapView({
  markers,
}: {
  markers: { id: string; lat: number; lng: number; label: string; kind: Kind }[];
}) {
  const center: [number, number] = useMemo(() => {
    if (markers.length === 0) return [-22.98, -43.2];
    const lat = markers.reduce((a, m) => a + m.lat, 0) / markers.length;
    const lng = markers.reduce((a, m) => a + m.lng, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={makeIcon(m.kind)}>
          <Popup>
            <div className="text-sm font-semibold">{m.label}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
