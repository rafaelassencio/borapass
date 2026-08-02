import { useState } from "react";
import { MapPin } from "lucide-react";

export default function PartnerMapPicker({
  initialLat = -22.9068,
  initialLng = -43.1729,
  initialUrl = "",
  onSelectCoords,
  onSelectUrl,
}: {
  initialLat?: number;
  initialLng?: number;
  initialUrl?: string;
  onSelectCoords?: (lat: number, lng: number) => void;
  onSelectUrl?: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);

  function handleChange(val: string) {
    setUrl(val);
    if (onSelectUrl) onSelectUrl(val);
    if (onSelectCoords) onSelectCoords(initialLat, initialLng);
  }

  return (
    <div className="space-y-1.5 pt-1 border-t border-border/60">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5 text-primary" /> Link da Localização no Google Maps
      </label>
      <input
        type="url"
        required
        value={url}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="https://maps.google.com/?q=..."
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
      />
      <p className="text-[10px] text-muted-foreground">
        Cole aqui o link de localização gerado pelo Google Maps do seu estabelecimento.
      </p>
    </div>
  );
}
