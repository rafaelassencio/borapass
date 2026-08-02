import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useListings, fallbackImage } from "@/lib/listings";
import { MapPin, Loader2, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useSelectedCity } from "@/hooks/use-city";

export const Route = createFileRoute("/passeios/")({
  head: () => ({ meta: [{ title: "Passeios — Bora Pass" }] }),
  component: PasseiosList,
});

function PasseiosList() {
  const [city] = useSelectedCity();
  const { data, isLoading } = useListings("passeio", city?.id, city?.name);
  const items = data ?? [];
  return (
    <AppShell>
      <PageHeader
        title="Passeios"
        subtitle={isLoading ? "Carregando..." : `${items.length} experiências para viver`}
      />
      <div className="space-y-4 p-5">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Compass className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Nenhum passeio disponível ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Volte em breve, novidades chegando.
            </p>
          </div>
        )}
        {items.map((t) => (
          <Link
            key={t.id}
            to="/passeios/$id"
            params={{ id: t.id }}
            className="block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <img
                src={t.image_url || fallbackImage("passeio")}
                alt={t.title}
                className="h-full w-full object-cover transition-transform hover:scale-105"
                loading="lazy"
              />
              {t.discount && (
                <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground shadow-ember">
                  {t.discount}
                </Badge>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold">{t.title}</h3>
              {t.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {t.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {t.city}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  {t.price != null ? (
                    <>
                      <span className="text-xl font-bold text-primary">R$ {t.price}</span>
                      <span className="text-xs text-muted-foreground"> / pessoa</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Consulte</span>
                  )}
                </div>
                <span className="rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white shadow-brand">
                  Ver detalhes
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
