import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { tours } from "@/lib/mock-data";
import { Star, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/passeios/")({
  head: () => ({ meta: [{ title: "Passeios — Bora Pass" }] }),
  component: PasseiosList,
});

function PasseiosList() {
  return (
    <AppShell>
      <PageHeader title="Passeios" subtitle={`${tours.length} experiências para viver`} />
      <div className="space-y-4 p-5">
        {tours.map((t) => (
          <Link key={t.id} to="/passeios/$id" params={{ id: t.id }} className="block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <img src={t.image} alt={t.name} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
              {t.tags.map((tag, i) => (
                <Badge key={tag} className="absolute top-3 bg-accent text-accent-foreground shadow-ember" style={{ left: 12 + i * 90 }}>{tag}</Badge>
              ))}
            </div>
            <div className="p-4">
              <h3 className="font-bold">{t.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> <b className="text-foreground">{t.rating}</b> ({t.reviews})</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.duration}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.address}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold text-primary">R$ {t.price}</span>
                  <span className="text-xs text-muted-foreground"> / pessoa</span>
                </div>
                <span className="rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white shadow-brand">Ver detalhes</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
