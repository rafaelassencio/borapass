import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { hotels } from "@/lib/mock-data";
import { ArrowLeft, Heart, Share2, Star, MapPin } from "lucide-react";
import { lazy, Suspense } from "react";
const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/hospedagens/$id")({
  loader: ({ params }) => {
    const hotel = hotels.find((h) => h.id === params.id);
    if (!hotel) throw notFound();
    return { hotel };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.hotel.name} — Bora Pass` }]
      : [{ title: "Hospedagem — Bora Pass" }],
  }),
  component: HotelDetail,
});

function HotelDetail() {
  const { hotel } = Route.useLoaderData();
  return (
    <AppShell>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link to="/hospedagens" className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex gap-2">
            <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Share2 className="h-5 w-5" /></button>
            <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Heart className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h1 className="text-2xl font-extrabold">{hotel.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{hotel.address}</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <b>{hotel.rating}</b> ({hotel.reviews} avaliações) · {hotel.distanceKm} km do centro
        </div>
        <div className="mt-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Comodidades</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {hotel.amenities.map((a: string) => (
              <span key={a} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{a}</span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Localização</h2>
          <div className="mt-2 h-56 overflow-hidden rounded-2xl shadow-soft">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
              <MapView markers={[{ id: hotel.id, lat: hotel.lat, lng: hotel.lng, label: hotel.name, kind: "hoteis" }]} />
            </Suspense>
          </div>
        </div>
        <div className="h-24" />
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-muted-foreground">A partir de</div>
              <div className="text-xl font-extrabold text-primary">R$ {hotel.price} <span className="text-xs font-normal text-muted-foreground">/ noite</span></div>
            </div>
            <button className="flex-1 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand">Reservar</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
