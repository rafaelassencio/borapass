import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Bell, Sparkles, Star, Clock, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories, tours, coupons, events, restaurants, hotels, promoBanners } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroCity from "@/assets/hero-city.jpg";

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
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroCity} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/40 to-background" />
        </div>
        <div className="relative px-5 pb-8 pt-10 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/80">Olá, viajante 👋</p>
              <div className="mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-semibold">Rio de Janeiro, RJ</span>
              </div>
            </div>
            <button aria-label="Notificações" className="rounded-full bg-white/15 p-2.5 backdrop-blur transition hover:bg-white/25">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
            </button>
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
            <button className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand transition active:scale-95">
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <section className="-mt-4 px-5">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {promoBanners.map((b) => (
            <div
              key={b.id}
              className={`${b.gradient} relative min-w-[85%] snap-start overflow-hidden rounded-2xl p-5 text-white shadow-brand`}
            >
              <Sparkles className="absolute right-3 top-3 h-5 w-5 opacity-70" />
              <p className="text-xs font-medium uppercase tracking-wider opacity-90">Promoção</p>
              <h3 className="mt-1 text-xl font-bold">{b.title}</h3>
              <p className="mt-1 text-sm opacity-90">{b.subtitle}</p>
              <button className="mt-4 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-foreground">{b.cta}</button>
            </div>
          ))}
        </div>
      </section>

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
      <section className="mt-8">
        <SectionHeader title="Passeios em destaque" to="/passeios" />
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 scrollbar-hide">
          {tours.map((t) => (
            <Link
              key={t.id}
              to="/passeios/$id"
              params={{ id: t.id }}
              className="min-w-[75%] snap-start overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img src={t.image} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
                {t.tags[0] && (
                  <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">{t.tags[0]}</Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 font-semibold">{t.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{t.rating}</span>
                  <span>({t.reviews})</span>
                  <span>·</span>
                  <Clock className="h-3.5 w-3.5" /> {t.duration.split("•")[0].trim()}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-primary">R$ {t.price}</span>
                  <span className="text-xs text-muted-foreground">/ pessoa</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cupons próximos */}
      <section className="mt-6">
        <SectionHeader title="Cupons próximos" to="/cupons" />
        <div className="space-y-3 px-5">
          {coupons.slice(0, 3).map((c) => (
            <Link
              key={c.id}
              to="/cupons/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 shadow-soft transition hover:shadow-elevated"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-ember">
                <img src={c.image} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{c.partner}</p>
                <h3 className="line-clamp-1 text-sm font-semibold">{c.title}</h3>
                <p className="text-[11px] text-muted-foreground">Válido até {c.validUntil}</p>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-gradient-ember px-3 py-2 text-white shadow-ember">
                <span className="text-sm font-extrabold leading-none">{c.discount}</span>
                <span className="mt-0.5 text-[9px] uppercase">off</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Eventos hoje */}
      <section className="mt-8">
        <SectionHeader title="Eventos acontecendo hoje" to="/eventos" />
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 scrollbar-hide">
          {events.slice(0, 4).map((e) => (
            <Link
              key={e.id}
              to="/eventos/$id"
              params={{ id: e.id }}
              className="relative min-w-[60%] snap-start overflow-hidden rounded-2xl shadow-soft"
            >
              <img src={e.image} alt={e.name} className="h-40 w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <Badge className="mb-1 bg-white/25 backdrop-blur">{e.category}</Badge>
                <h3 className="line-clamp-1 text-sm font-bold">{e.name}</h3>
                <p className="text-[11px] opacity-90">{e.time} · {e.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Restaurantes */}
      <section className="mt-6">
        <SectionHeader title="Restaurantes recomendados" to="/explorar" />
        <div className="grid grid-cols-2 gap-3 px-5">
          {restaurants.map((r) => (
            <Card key={r.id} className="overflow-hidden p-0 shadow-soft">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img src={r.image} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold">{r.name}</h3>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.cuisine} · {r.price}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{r.rating}</span>
                  <span className="text-muted-foreground">({r.reviews})</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hotéis */}
      <section className="mt-6">
        <SectionHeader title="Hotéis em promoção" to="/hospedagens" />
        <div className="space-y-3 px-5">
          {hotels.map((h) => (
            <Link
              key={h.id}
              to="/hospedagens/$id"
              params={{ id: h.id }}
              className="flex gap-3 overflow-hidden rounded-2xl bg-card p-2 shadow-soft transition hover:shadow-elevated"
            >
              <img src={h.image} alt={h.name} className="h-24 w-28 shrink-0 rounded-xl object-cover" loading="lazy" />
              <div className="min-w-0 flex-1 py-1">
                <h3 className="line-clamp-1 font-semibold">{h.name}</h3>
                <p className="text-xs text-muted-foreground">{h.address}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{h.rating}</span>
                  <span className="text-muted-foreground">· {h.distanceKm} km do centro</span>
                </div>
                <div className="mt-1">
                  <span className="text-base font-bold text-primary">R$ {h.price}</span>
                  <span className="text-xs text-muted-foreground"> / diária</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
