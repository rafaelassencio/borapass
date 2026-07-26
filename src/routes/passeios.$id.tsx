import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { tours } from "@/lib/mock-data";
import { ArrowLeft, Heart, Share2, MapPin, Clock, Star, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { lazy, Suspense } from "react";

const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/passeios/$id")({
  loader: ({ params }) => {
    const tour = tours.find((t) => t.id === params.id);
    if (!tour) throw notFound();
    return { tour };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.tour.name} — Bora Pass` },
          { name: "description", content: loaderData.tour.description },
          { property: "og:title", content: loaderData.tour.name },
          { property: "og:description", content: loaderData.tour.description },
        ]
      : [{ title: "Passeio — Bora Pass" }],
  }),
  component: PasseioDetail,
});

function PasseioDetail() {
  const { tour } = Route.useLoaderData();
  return (
    <AppShell>
      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img src={tour.image} alt={tour.name} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link to="/passeios" className="rounded-full bg-black/40 p-2 text-white backdrop-blur">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex gap-2">
              <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Share2 className="h-5 w-5" /></button>
              <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Heart className="h-5 w-5" /></button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="flex flex-wrap gap-2">
            {tour.tags.map((t: string) => <Badge key={t} className="bg-accent text-accent-foreground">{t}</Badge>)}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">{tour.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> <b className="text-foreground">{tour.rating}</b> ({tour.reviews} avaliações)</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {tour.duration}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tour.description}</p>

          <div className="mt-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Galeria</h2>
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {tour.gallery.map((g: string, i: number) => (
                <img key={i} src={g} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" loading="lazy" />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Localização</h2>
            <div className="mt-2 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <span>{tour.address}</span>
            </div>
            <div className="mt-3 h-56 overflow-hidden rounded-2xl shadow-soft">
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
                <MapView markers={[{ id: tour.id, lat: tour.lat, lng: tour.lng, label: tour.name, kind: "passeios" }]} />
              </Suspense>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold shadow-soft">
              <Navigation className="h-4 w-4 text-primary" /> Como chegar
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Comentários</h2>
            <div className="mt-2 space-y-3">
              {[
                { name: "Rafael M.", text: "Experiência inesquecível! Vista de tirar o fôlego.", rating: 5 },
                { name: "Juliana P.", text: "Muito bem organizado, guias super atenciosos.", rating: 5 },
              ].map((c) => (
                <div key={c.name} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="flex items-center gap-0.5 text-xs">
                      {Array.from({ length: c.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="h-24" />
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-muted-foreground">A partir de</div>
              <div className="text-xl font-extrabold text-primary">R$ {tour.price}</div>
            </div>
            <button className="flex-1 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition active:scale-95">
              Comprar ingresso
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
