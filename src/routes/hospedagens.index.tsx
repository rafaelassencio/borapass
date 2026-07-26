import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useListings, fallbackImage } from "@/lib/listings";
import { MapPin, Loader2, Building2 } from "lucide-react";

export const Route = createFileRoute("/hospedagens/")({
  head: () => ({ meta: [{ title: "Hospedagens — Bora Pass" }] }),
  component: HotelList,
});

function HotelList() {
  const { data, isLoading } = useListings("hospedagem");
  const items = data ?? [];
  return (
    <AppShell>
      <PageHeader title="Hospedagens" subtitle="Hotéis, pousadas e resorts" />
      <div className="space-y-4 p-5">
        {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Nenhuma hospedagem cadastrada ainda</p>
          </div>
        )}
        {items.map((h) => (
          <Link key={h.id} to="/hospedagens/$id" params={{ id: h.id }} className="block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
            <div className="aspect-[16/10] overflow-hidden">
              <img src={h.image_url || fallbackImage("hospedagem")} alt={h.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <h3 className="font-bold">{h.title}</h3>
              {(h.address || h.city) && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{h.address || h.city}</p>}
              {h.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{h.description}</p>}
              <div className="mt-3 flex items-end justify-between">
                <span />
                <div>
                  {h.price != null ? (
                    <>
                      <span className="text-xl font-extrabold text-primary">R$ {h.price}</span>
                      <span className="text-xs text-muted-foreground"> / diária</span>
                    </>
                  ) : <span className="text-sm text-muted-foreground">Consulte</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
