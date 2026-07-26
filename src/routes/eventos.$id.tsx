import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing, fallbackImage } from "@/lib/listings";
import { ArrowLeft, MapPin, Share2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/eventos/$id")({
  head: () => ({ meta: [{ title: "Evento — Bora Pass" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { data: event, isLoading } = useListing(id);

  if (isLoading) {
    return <AppShell><div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AppShell>;
  }
  if (!event) throw notFound();

  return (
    <AppShell>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={event.image_url || fallbackImage("evento")} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white">
          <Link to="/eventos" className="rounded-full bg-white/20 p-2 backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
          <button className="rounded-full bg-white/20 p-2 backdrop-blur"><Share2 className="h-5 w-5" /></button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h1 className="text-2xl font-extrabold">{event.title}</h1>
        </div>
      </div>
      <div className="p-5">
        {(event.address || event.city) && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Local</p>
            <p className="mt-1 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{event.address || event.city}</p>
          </div>
        )}
        {event.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{event.description}</p>}
        <div className="h-24" />
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Ingresso</div>
              <div className="text-xl font-extrabold text-primary">{event.price == null ? "Consulte" : event.price === 0 ? "Grátis" : `R$ ${event.price}`}</div>
            </div>
            <button className="flex-1 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand">Garantir vaga</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
