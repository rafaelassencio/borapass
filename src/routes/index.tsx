import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles, Star, ArrowRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { categories } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroCity from "@/assets/hero-city.jpg";
import { CitySelectorButton } from "@/components/CitySelector";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useSelectedCity } from "@/hooks/use-city";
import { useListings, fallbackImage } from "@/lib/listings";
import { useHomeBanners, useHomeHighlights } from "@/lib/home-content";
import { useAuth } from "@/hooks/use-auth";
import {
  useAutoGenerateAlerts,
} from "@/lib/notifications";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bora Pass — Descubra o melhor de cada destino" },
      { name: "description", content: "Home do Bora Pass: passeios, cupons, hospedagens e eventos perto de você." },
    ],
  }),
  component: Home,
});

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between px-5">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const [city] = useSelectedCity();
  const cityId = city?.id ?? null;
  const { user } = useAuth();
  useAutoGenerateAlerts(user?.id, cityId);

  const { data: banners } = useHomeBanners();
  const { data: highlights } = useHomeHighlights(cityId);
  const { data: tours } = useListings("passeio", cityId);
  const { data: coupons } = useListings("cupom", cityId);
  const { data: events } = useListings("evento", cityId);
  const { data: restaurants } = useListings("restaurante", cityId);
  const { data: hotels } = useListings("hospedagem", cityId);

  // Rotate banner backgrounds every 6s
  const [bannerIdx, setBannerIdx] = useState(0);
  const activeBanners = banners ?? [];
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % activeBanners.length), 6000);
    return () => clearInterval(t);
  }, [activeBanners.length]);
  const currentBanner = activeBanners[bannerIdx];

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {currentBanner ? (
            currentBanner.media_type === "video" ? (
              <video
                key={currentBanner.id}
                src={currentBanner.media_url}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                key={currentBanner.id}
                src={currentBanner.media_url}
                alt={currentBanner.title ?? ""}
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <img src={heroCity} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/40 to-background" />
        </div>
        <div className="relative px-5 pb-8 pt-10 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/80">Olá, viajante 👋</p>
              <div className="mt-1">
                <CitySelectorButton />
              </div>
            </div>
            <NotificationsBell />
          </div>

          <h1 className="mt-6 text-3xl font-extrabold leading-tight">
            Seu passe para viver <br /> o melhor do destino.
          </h1>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-elevated">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input
              placeholder="Buscar passeios, cupons, restaurantes..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Link
              to="/explorar"
              className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand transition active:scale-95"
            >
              Buscar
            </Link>
          </div>
        </div>
      </section>

      {/* Destaques (entre pesquisa e categorias) */}
      {highlights && highlights.length > 0 && (
        <section className="-mt-4 px-5">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {highlights.map((h) => {
              const content = (
                <div
                  key={h.id}
                  className="relative min-w-[85%] snap-start overflow-hidden rounded-2xl shadow-brand"
                >
                  {h.image_url ? (
                    <img src={h.image_url} alt={h.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-gradient-brand" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <Sparkles className="mb-1 h-4 w-4 opacity-90" />
                    <h3 className="text-lg font-bold leading-tight">{h.title}</h3>
                    {h.subtitle && <p className="mt-0.5 text-xs opacity-90">{h.subtitle}</p>}
                  </div>
                </div>
              );
              return h.link_url ? (
                <a key={h.id} href={h.link_url} className="min-w-[85%] snap-start">{content}</a>
              ) : (
                content
              );
            })}
          </div>
        </section>
      )}

      {/* Categorias */}
      <section className="mt-8">
        <SectionHeader title="Categorias" />
        <div className="grid grid-cols-4 gap-3 px-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/explorar"
              search={{ cat: c.slug }}
              className="group flex flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-2xl shadow-soft transition group-hover:scale-105 group-hover:shadow-elevated`}
              >
                {c.icon}
              </div>
              <span className="text-center text-[11px] font-medium leading-tight text-foreground">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Passeios em destaque */}
      {(tours ?? []).length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Passeios em destaque" to="/passeios" />
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 scrollbar-hide">
            {(tours ?? []).slice(0, 8).map((t) => (
              <Link
                key={t.id}
                to="/passeios/$id"
                params={{ id: t.id }}
                className="min-w-[75%] snap-start overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img src={t.image_url || fallbackImage("passeio")} alt={t.title} className="h-full w-full object-cover" loading="lazy" />
                  {t.discount && <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">{t.discount}</Badge>}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-semibold">{t.title}</h3>
                  {(t.city || t.address) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{t.address || t.city}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    {t.price != null ? (
                      <>
                        <span className="text-lg font-bold text-primary">R$ {t.price}</span>
                        <span className="text-xs text-muted-foreground">/ pessoa</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Consulte</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cupons próximos */}
      {(coupons ?? []).length > 0 && (
        <section className="mt-6">
          <SectionHeader title="Cupons próximos" to="/cupons" />
          <div className="space-y-3 px-5">
            {(coupons ?? []).slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to="/cupons/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 shadow-soft transition hover:shadow-elevated"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-ember">
                  <img src={c.image_url || fallbackImage("cupom")} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{c.city ?? "—"}</p>
                  <h3 className="line-clamp-1 text-sm font-semibold">{c.title}</h3>
                  {c.description && <p className="line-clamp-1 text-[11px] text-muted-foreground">{c.description}</p>}
                </div>
                {c.discount && (
                  <div className="flex flex-col items-center rounded-xl bg-gradient-ember px-3 py-2 text-white shadow-ember">
                    <span className="text-sm font-extrabold leading-none">{c.discount}</span>
                    <span className="mt-0.5 text-[9px] uppercase">off</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Eventos */}
      {(events ?? []).length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Eventos acontecendo" to="/eventos" />
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 scrollbar-hide">
            {(events ?? []).slice(0, 6).map((e) => (
              <Link
                key={e.id}
                to="/eventos/$id"
                params={{ id: e.id }}
                className="relative min-w-[60%] snap-start overflow-hidden rounded-2xl shadow-soft"
              >
                <img src={e.image_url || fallbackImage("evento")} alt={e.title} className="h-40 w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  {e.city && <Badge className="mb-1 bg-white/25 backdrop-blur">{e.city}</Badge>}
                  <h3 className="line-clamp-1 text-sm font-bold">{e.title}</h3>
                  {e.address && <p className="line-clamp-1 text-[11px] opacity-90">{e.address}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Restaurantes */}
      {(restaurants ?? []).length > 0 && (
        <section className="mt-6">
          <SectionHeader title="Restaurantes recomendados" to="/explorar" />
          <div className="grid grid-cols-2 gap-3 px-5">
            {(restaurants ?? []).slice(0, 6).map((r) => (
              <Card key={r.id} className="overflow-hidden p-0 shadow-soft">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img src={r.image_url || fallbackImage("restaurante")} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold">{r.title}</h3>
                  {r.city && <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.city}</p>}
                  {r.price != null && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-primary">R$ {r.price}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Hotéis */}
      {(hotels ?? []).length > 0 && (
        <section className="mt-6">
          <SectionHeader title="Hotéis em promoção" to="/hospedagens" />
          <div className="space-y-3 px-5">
            {(hotels ?? []).slice(0, 5).map((h) => (
              <Link
                key={h.id}
                to="/hospedagens/$id"
                params={{ id: h.id }}
                className="flex gap-3 overflow-hidden rounded-2xl bg-card p-2 shadow-soft transition hover:shadow-elevated"
              >
                <img src={h.image_url || fallbackImage("hospedagem")} alt={h.title} className="h-24 w-28 shrink-0 rounded-xl object-cover" loading="lazy" />
                <div className="min-w-0 flex-1 py-1">
                  <h3 className="line-clamp-1 font-semibold">{h.title}</h3>
                  {(h.address || h.city) && <p className="text-xs text-muted-foreground">{h.address || h.city}</p>}
                  <div className="mt-1">
                    {h.price != null ? (
                      <>
                        <span className="text-base font-bold text-primary">R$ {h.price}</span>
                        <span className="text-xs text-muted-foreground"> / diária</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Consulte</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio geral */}
      {!(tours ?? []).length &&
        !(coupons ?? []).length &&
        !(events ?? []).length &&
        !(restaurants ?? []).length &&
        !(hotels ?? []).length && (
          <div className="mx-5 mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Nenhum anúncio ainda{city ? ` em ${city.name}` : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {city ? "Troque a cidade ou volte em breve." : "Selecione uma cidade ou aguarde novos anúncios."}
            </p>
          </div>
        )}
    </AppShell>
  );
}
