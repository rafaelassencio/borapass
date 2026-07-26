import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { events } from "@/lib/mock-data";
import { ArrowLeft, Calendar, Clock, MapPin, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { lazy, Suspense } from "react";
const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/eventos/$id")({
  loader: ({ params }) => {
    const event = events.find((e) => e.id === params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.event.name} — Bora Pass` }] : [{ title: "Evento — Bora Pass" }],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  const dt = new Date(event.date);
  return (
    <AppShell>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={event.image} alt={event.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white">
          <Link to="/eventos" className="rounded-full bg-white/20 p-2 backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
          <button className="rounded-full bg-white/20 p-2 backdrop-blur"><Share2 className="h-5 w-5" /></button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <Badge className="mb-2 bg-white/25 backdrop-blur">{event.category}</Badge>
          <h1 className="text-2xl font-extrabold">{event.name}</h1>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={<Calendar className="h-4 w-4 text-primary" />} label="Data" value={dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} />
          <InfoCard icon={<Clock className="h-4 w-4 text-primary" />} label="Horário" value={event.time} />
        </div>
        <InfoCard className="mt-3" icon={<MapPin className="h-4 w-4 text-primary" />} label="Local" value={event.location} />

        <div className="mt-4 h-56 overflow-hidden rounded-2xl shadow-soft">
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
            <MapView markers={[{ id: event.id, lat: event.lat, lng: event.lng, label: event.name, kind: "eventos" }]} />
          </Suspense>
        </div>

        <button className="mt-4 w-full rounded-2xl border border-border bg-card py-3 text-sm font-semibold shadow-soft">
          + Adicionar ao calendário
        </button>
        <div className="h-24" />

        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Ingresso</div>
              <div className="text-xl font-extrabold text-primary">{event.price === 0 ? "Grátis" : `R$ ${event.price}`}</div>
            </div>
            <button className="flex-1 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand">
              {event.price === 0 ? "Confirmar presença" : "Comprar ingresso"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-3 shadow-soft ${className}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
