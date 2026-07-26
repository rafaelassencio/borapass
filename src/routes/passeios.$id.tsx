import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing, fallbackImage } from "@/lib/listings";
import { ArrowLeft, Heart, Share2, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/passeios/$id")({
  head: () => ({ meta: [{ title: "Passeio — Bora Pass" }] }),
  component: PasseioDetail,
});

function PasseioDetail() {
  const { id } = Route.useParams();
  const { data: tour, isLoading } = useListing(id);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppShell>
    );
  }
  if (!tour) throw notFound();

  return (
    <AppShell>
      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img src={tour.image_url || fallbackImage("passeio")} alt={tour.title} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link to="/passeios" className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="flex gap-2">
              <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Share2 className="h-5 w-5" /></button>
              <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Heart className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
        <div className="px-5 pt-5">
          {tour.discount && <Badge className="bg-accent text-accent-foreground">{tour.discount}</Badge>}
          <h1 className="mt-3 text-2xl font-extrabold">{tour.title}</h1>
          {(tour.address || tour.city) && (
            <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <span>{tour.address || tour.city}</span>
            </div>
          )}
          {tour.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tour.description}</p>}
          <div className="h-24" />
        </div>
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-muted-foreground">A partir de</div>
              <div className="text-xl font-extrabold text-primary">{tour.price != null ? `R$ ${tour.price}` : "Consulte"}</div>
            </div>
            <button className="flex-1 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition active:scale-95">Comprar ingresso</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
