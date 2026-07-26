import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useListings, fallbackImage } from "@/lib/listings";
import { MapPin, Loader2, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/eventos/")({
  head: () => ({ meta: [{ title: "Eventos — Bora Pass" }] }),
  component: EventsList,
});

function EventsList() {
  const { data, isLoading } = useListings("evento");
  const list = data ?? [];
  return (
    <AppShell>
      <PageHeader title="Eventos" subtitle="O que rola nos próximos dias" />
      <div className="px-5 pt-4">
        <div className="space-y-4">
          {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!isLoading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Nenhum evento agendado ainda</p>
            </div>
          )}
          {list.map((e) => (
            <Link key={e.id} to="/eventos/$id" params={{ id: e.id }} className="block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={e.image_url || fallbackImage("evento")} alt={e.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="text-lg font-bold">{e.title}</h3>
                  {(e.address || e.city) && (
                    <div className="mt-1 flex items-center gap-3 text-xs opacity-90">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.address || e.city}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-lg font-extrabold text-primary">{e.price == null ? "Consulte" : e.price === 0 ? "Grátis" : `R$ ${e.price}`}</span>
                <span className="rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white shadow-brand">Ver evento</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
