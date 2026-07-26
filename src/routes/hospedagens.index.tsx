import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { hotels } from "@/lib/mock-data";
import { Star, MapPin } from "lucide-react";

export const Route = createFileRoute("/hospedagens/")({
  head: () => ({ meta: [{ title: "Hospedagens — Bora Pass" }] }),
  component: HotelList,
});

function HotelList() {
  return (
    <AppShell>
      <PageHeader title="Hospedagens" subtitle="Hotéis, pousadas e resorts" />
      <div className="space-y-4 p-5">
        {hotels.map((h) => (
          <Link key={h.id} to="/hospedagens/$id" params={{ id: h.id }} className="block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
            <div className="aspect-[16/10] overflow-hidden">
              <img src={h.image} alt={h.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <h3 className="font-bold">{h.name}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{h.address}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {h.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">{a}</span>
                ))}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <b>{h.rating}</b>
                  <span className="text-xs text-muted-foreground">({h.reviews})</span>
                </span>
                <div>
                  <span className="text-xl font-extrabold text-primary">R$ {h.price}</span>
                  <span className="text-xs text-muted-foreground"> / diária</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
