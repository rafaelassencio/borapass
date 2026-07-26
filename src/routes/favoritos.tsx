import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Heart, Star, Trash2 } from "lucide-react";
import { tours, hotels } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — Bora Pass" }] }),
  component: Favoritos,
});

function Favoritos() {
  const favTours = tours.slice(0, 2);
  const favHotels = hotels.slice(0, 1);
  return (
    <AppShell>
      <PageHeader title="Favoritos" subtitle="Suas experiências salvas" />
      <div className="space-y-6 p-5">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <Heart className="h-4 w-4 text-accent" /> Passeios
          </h2>
          <div className="space-y-3">
            {favTours.map((t) => (
              <Link key={t.id} to="/passeios/$id" params={{ id: t.id }} className="flex gap-3 rounded-2xl bg-card p-2 shadow-soft transition hover:shadow-elevated">
                <img src={t.image} alt="" className="h-20 w-24 rounded-xl object-cover" loading="lazy" />
                <div className="flex-1 py-1">
                  <h3 className="line-clamp-1 font-semibold">{t.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{t.rating}</span>
                    <Badge className="ml-2 bg-accent/15 text-accent">{t.tags[0]}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-bold text-primary">R$ {t.price}</p>
                </div>
                <button className="self-start p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <Heart className="h-4 w-4 text-accent" /> Hospedagens
          </h2>
          <div className="space-y-3">
            {favHotels.map((h) => (
              <Link key={h.id} to="/hospedagens/$id" params={{ id: h.id }} className="flex gap-3 rounded-2xl bg-card p-2 shadow-soft">
                <img src={h.image} alt="" className="h-20 w-24 rounded-xl object-cover" loading="lazy" />
                <div className="flex-1 py-1">
                  <h3 className="line-clamp-1 font-semibold">{h.name}</h3>
                  <p className="text-xs text-muted-foreground">{h.address}</p>
                  <p className="mt-1 text-sm font-bold text-primary">R$ {h.price} <span className="text-xs font-normal text-muted-foreground">/ noite</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
