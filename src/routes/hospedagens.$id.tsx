import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing, fallbackImage } from "@/lib/listings";
import { ArrowLeft, Heart, Share2, MapPin, Loader2 } from "lucide-react";

export const Route = createFileRoute("/hospedagens/$id")({
  head: () => ({ meta: [{ title: "Hospedagem — Bora Pass" }] }),
  component: HotelDetail,
});

function HotelDetail() {
  const { id } = Route.useParams();
  const { data: hotel, isLoading } = useListing(id);

  if (isLoading) {
    return <AppShell><div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AppShell>;
  }
  if (!hotel) throw notFound();

  return (
    <AppShell>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={hotel.image_url || fallbackImage("hospedagem")} alt={hotel.title} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link to="/hospedagens" className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex gap-2">
            <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Share2 className="h-5 w-5" /></button>
            <button className="rounded-full bg-black/40 p-2 text-white backdrop-blur"><Heart className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h1 className="text-2xl font-extrabold">{hotel.title}</h1>
        {(hotel.address || hotel.city) && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{hotel.address || hotel.city}</p>}
        {hotel.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{hotel.description}</p>}
        <div className="h-24" />
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-muted-foreground">A partir de</div>
              <div className="text-xl font-extrabold text-primary">{hotel.price != null ? <>R$ {hotel.price} <span className="text-xs font-normal text-muted-foreground">/ noite</span></> : "Consulte"}</div>
            </div>
            <button className="flex-1 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand">Reservar</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
