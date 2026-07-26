import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { lazy, Suspense, useState } from "react";
import { tours, hotels, restaurants, events, coupons } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/mapa")({
  head: () => ({ meta: [{ title: "Mapa — Bora Pass" }] }),
  component: MapaPage,
});

type Layer = "passeios" | "hoteis" | "restaurantes" | "eventos" | "cupons";
const layers: { id: Layer; label: string; emoji: string }[] = [
  { id: "passeios", label: "Passeios", emoji: "🎢" },
  { id: "hoteis", label: "Hotéis", emoji: "🏨" },
  { id: "restaurantes", label: "Restaurantes", emoji: "🍽️" },
  { id: "eventos", label: "Eventos", emoji: "📅" },
  { id: "cupons", label: "Cupons", emoji: "🎟️" },
];

function MapaPage() {
  const [active, setActive] = useState<Record<Layer, boolean>>({
    passeios: true, hoteis: true, restaurantes: true, eventos: true, cupons: false,
  });

  const markers = [
    ...(active.passeios ? tours.map((t) => ({ id: `t-${t.id}`, lat: t.lat, lng: t.lng, label: t.name, kind: "passeios" as Layer })) : []),
    ...(active.hoteis ? hotels.map((h) => ({ id: `h-${h.id}`, lat: h.lat, lng: h.lng, label: h.name, kind: "hoteis" as Layer })) : []),
    ...(active.restaurantes ? restaurants.map((r) => ({ id: `r-${r.id}`, lat: r.lat, lng: r.lng, label: r.name, kind: "restaurantes" as Layer })) : []),
    ...(active.eventos ? events.map((e) => ({ id: `e-${e.id}`, lat: e.lat, lng: e.lng, label: e.name, kind: "eventos" as Layer })) : []),
    ...(active.cupons ? coupons.slice(0, 2).map((c, i) => ({ id: `c-${c.id}`, lat: -22.98 + i * 0.01, lng: -43.2 + i * 0.01, label: c.title, kind: "cupons" as Layer })) : []),
  ];

  return (
    <AppShell>
      <PageHeader title="Mapa" subtitle="Explore o que está perto de você" />
      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {layers.map((l) => (
            <button
              key={l.id}
              onClick={() => setActive((a) => ({ ...a, [l.id]: !a[l.id] }))}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active[l.id] ? "border-transparent bg-primary text-primary-foreground shadow-brand" : "border-border bg-card text-muted-foreground"
              }`}
            >
              {l.emoji} {l.label}
              <Badge className="ml-1.5 h-4 bg-white/20 px-1 text-[10px]">
                {markers.filter((m) => m.kind === l.id).length}
              </Badge>
            </button>
          ))}
        </div>
        <div className="mt-3 h-[70vh] overflow-hidden rounded-2xl shadow-elevated">
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
            <MapView markers={markers} />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}
