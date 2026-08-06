import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Search, Loader2, Heart, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSelectedCity } from "@/hooks/use-city";
import {
  fallbackImage,
  fetchWithTimeout,
  getTrashedListingIds,
  getInactiveListingIds,
  getStoredPartnerOffers,
  type Listing,
  type ListingCategory,
} from "@/lib/listings";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/explorar")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Explorar — Bora Pass" }] }),
  component: Explorar,
});

const CATS: Array<{ slug: string; label: string; cat: ListingCategory | "todos" }> = [
  { slug: "todos", label: "✨ Todos", cat: "todos" },
  { slug: "passeios", label: "🎢 Passeios", cat: "passeio" },
  { slug: "hospedagens", label: "🏨 Hospedagens", cat: "hospedagem" },
  { slug: "restaurantes", label: "🍽️ Restaurantes", cat: "restaurante" },
  { slug: "eventos", label: "🎉 Eventos", cat: "evento" },
  { slug: "cupons", label: "🎟️ Cupons", cat: "cupom" },
];

import { tours as mockTours, hotels as mockHotels, coupons as mockCoupons } from "@/lib/mock-data";

function useAllListingsForCity(selectedCity?: { id: string; name: string } | null) {
  return useQuery({
    queryKey: ["listings", "all", selectedCity?.id ?? selectedCity?.name ?? "all"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      let dbData: Listing[] = [];
      try {
        const { data } = await fetchWithTimeout(
          supabase.from("listings").select("*").order("created_at", { ascending: false }),
          2500,
        );

        if (data) dbData = data as Listing[];
      } catch {
        /* fallback */
      }

      let localCustom: Listing[] = [];
      if (typeof window !== "undefined") {
        const savedRaw = localStorage.getItem("borapass:custom-listings");
        if (savedRaw) {
          try {
            localCustom = JSON.parse(savedRaw);
          } catch {
            /* fallback */
          }
        }
      }

      const mergedMap = new Map<string, Listing>();

      // Mock tours fallback
      mockTours.forEach((t) => {
        mergedMap.set(t.id, {
          id: t.id,
          title: t.name,
          category: "passeio",
          description: t.description,
          image_url: t.image,
          price: t.price,
          store_price: Math.round(t.price * 1.25),
          traveler_price: t.price > 0 ? Math.round(t.price * 0.85) : 0,
          premium_price: t.price > 0 ? Math.round(t.price * 0.7) : 0,
          address: t.address,
          city: "Rio de Janeiro",
          lat: t.lat,
          lng: t.lng,
          active: true,
          status: "published",
          created_at: new Date().toISOString(),
          city_id: null,
          discount: t.tags[0] || "15% OFF",
          owner_id: null,
          partner_id: null,
          updated_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
        } as unknown as Listing);
      });

      // Mock hotels fallback
      mockHotels.forEach((h) => {
        mergedMap.set(h.id, {
          id: h.id,
          title: h.name,
          category: "hospedagem",
          description: `Hospedagem em ${h.name}. Comodidades: ${h.amenities.join(", ")}.`,
          image_url: h.image,
          price: h.price,
          store_price: Math.round(h.price * 1.25),
          traveler_price: Math.round(h.price * 0.85),
          premium_price: Math.round(h.price * 0.7),
          address: h.address,
          city: "Rio de Janeiro",
          lat: h.lat,
          lng: h.lng,
          active: true,
          status: "published",
          created_at: new Date().toISOString(),
          city_id: null,
          discount: "20% OFF",
          owner_id: null,
          partner_id: null,
          updated_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
        } as unknown as Listing);
      });

      // Mock coupons fallback
      mockCoupons.forEach((c) => {
        mergedMap.set(c.id, {
          id: c.id,
          title: c.title,
          category: "cupom",
          description: `${c.description} (${c.rules})`,
          image_url: c.image,
          price: 0,
          store_price: 30,
          traveler_price: 0,
          premium_price: 0,
          address: c.partner,
          city: "Rio de Janeiro",
          lat: -22.9068,
          lng: -43.1729,
          active: true,
          status: "published",
          created_at: new Date().toISOString(),
          city_id: null,
          discount: c.discount,
          expires_at: c.validUntil,
          owner_id: null,
          partner_id: null,
          updated_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
        } as unknown as Listing);
      });

      // DB Data items
      for (const item of dbData) {
        mergedMap.set(item.id, item);
      }

      // Stored partner & custom offers
      const storedOffers = getStoredPartnerOffers();
      for (const item of storedOffers) {
        mergedMap.set(item.id, item);
      }

      const allListings = Array.from(mergedMap.values());
      const trashedIds = getTrashedListingIds();
      const inactiveIds = getInactiveListingIds();

      const activeListings = allListings.filter((item) => {
        if (trashedIds.has(item.id)) return false;
        if (inactiveIds.has(item.id)) return false;
        if (item.active === false) return false;
        return true;
      });

      if (selectedCity && selectedCity.name) {
        const normSelected = selectedCity.name.toLowerCase().trim();
        return activeListings.filter((r) => {
          if (r.city_id && r.city_id === selectedCity.id) return true;
          if (r.city && r.city.toLowerCase().trim().includes(normSelected)) return true;
          if (r.address && r.address.toLowerCase().trim().includes(normSelected)) return true;
          return false;
        });
      }

      return activeListings;
    },
  });
}

type PriceFilterType = "all" | "free" | "paid";

function Explorar() {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(user?.id);
  const { isPremium } = useRoles(user?.id);
  const { cat, q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const initial = CATS.find((c) => c.slug === cat)?.slug ?? "todos";
  const [active, setActive] = useState<string>(initial);
  const [priceFilter, setPriceFilter] = useState<PriceFilterType>("all");
  const [city] = useSelectedCity();
  const { data, isLoading } = useAllListingsForCity(city);

  useEffect(() => {
    if (q !== undefined) {
      setQuery(q);
    }
  }, [q]);

  const filtered = useMemo(() => {
    const rows = data ?? [];

    return rows.filter((r) => {
      const catMatch =
        active === "todos" || CATS.find((c) => c.slug === active)?.cat === r.category;

      const q = query.trim().toLowerCase();
      const qMatch =
        !q || r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q);

      // Regra de itens gratuitos (preço R$ 0, cortesia ou indicação explicita de grátis)
      const offerType = (r as { offer_type?: string }).offer_type;
      const isFreeItem =
        r.price === 0 ||
        offerType === "perk" ||
        (r.discount ?? "").toLowerCase().includes("gratis") ||
        (r.discount ?? "").toLowerCase().includes("grátis") ||
        (r.discount ?? "").toLowerCase().includes("cortesia") ||
        (r.discount ?? "").toLowerCase().includes("free");

      const priceMatch =
        priceFilter === "all" ||
        (priceFilter === "free" && isFreeItem) ||
        (priceFilter === "paid" && !isFreeItem && (r.price ?? 0) > 0);

      return catMatch && qMatch && priceMatch;
    });
  }, [data, active, query, priceFilter]);

  const routeForCategory = (c: string, id: string) => {
    const norm = (c || "").toLowerCase().trim();
    if (
      norm.includes("hospedag") ||
      norm.includes("hotel") ||
      norm.includes("pousada") ||
      norm.includes("resort")
    ) {
      return { to: "/hospedagens/$id" as const, params: { id } };
    }
    if (norm.includes("passeio") || norm.includes("trilha") || norm.includes("tour")) {
      return { to: "/passeios/$id" as const, params: { id } };
    }
    if (norm.includes("evento") || norm.includes("fest")) {
      return { to: "/eventos/$id" as const, params: { id } };
    }
    if (norm.includes("cupom") || norm.includes("restaurante") || norm.includes("gastro")) {
      return { to: "/cupons/$id" as const, params: { id } };
    }
    return { to: "/hospedagens/$id" as const, params: { id } };
  };

  return (
    <AppShell>
      <PageHeader
        title="Explorar Destinos"
        subtitle={city ? `Anúncios e eventos em ${city.name}` : "Todas as cidades"}
      />
      <div className="px-5 pt-4">
        {/* Barra de Pesquisa */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por passeios, eventos, hoteis..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-foreground"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATS.map((c) => (
            <FilterChip key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)}>
              {c.label}
            </FilterChip>
          ))}
        </div>

        {/* Filtro por Valor: Todos | Gratuitos | Pagos */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-card p-1 border border-border shadow-soft">
          <button
            onClick={() => setPriceFilter("all")}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              priceFilter === "all"
                ? "bg-gradient-brand text-white shadow-brand"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            ✨ Todos
          </button>
          <button
            onClick={() => setPriceFilter("free")}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              priceFilter === "free"
                ? "bg-emerald-600 text-white shadow-brand font-extrabold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            🎁 Gratuitos (R$ 0)
          </button>
          <button
            onClick={() => setPriceFilter("paid")}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              priceFilter === "paid"
                ? "bg-gradient-ember text-white shadow-ember"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            💵 Pagos
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {filtered.map((x) => {
              const r = routeForCategory(x.category, x.id);
              const offerType = (x as { offer_type?: string }).offer_type;
              const isFree =
                x.price === 0 ||
                offerType === "perk" ||
                (x.discount ?? "").toLowerCase().includes("gratis") ||
                (x.discount ?? "").toLowerCase().includes("grátis") ||
                (x.discount ?? "").toLowerCase().includes("cortesia");

              const isFav = isFavorite(x.id);

              return (
                <Link
                  key={x.id}
                  to={r.to as string}
                  params={r.params as never}
                  className="overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated border border-border/60 relative group"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={x.image_url || fallbackImage(x.category as ListingCategory)}
                      alt={x.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <Badge className="absolute left-2 top-2 bg-white/85 text-foreground backdrop-blur font-bold text-[10px]">
                      {x.category}
                    </Badge>

                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(x.id, x.title);
                      }}
                      className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition active:scale-95 hover:bg-black/75 shadow-md"
                      title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : "text-white"}`}
                      />
                    </button>

                    {isFree && (
                      <span className="absolute left-2 bottom-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-brand">
                        GRÁTIS 🎁
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-1 text-sm font-bold text-foreground">{x.title}</h3>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {x.city ?? x.address ?? "—"}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span />
                      {isFree ? (
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          GRÁTIS 🎁
                        </span>
                      ) : isPremium ? (
                        <div className="text-right">
                          <span className="text-[9px] font-black text-amber-500 block uppercase">
                            👑 Premium
                          </span>
                          <span className="text-xs font-black text-amber-500 dark:text-amber-400">
                            R$ {x.premium_price || Math.round((x.price || 120) * 0.7)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-xs font-black text-foreground">
                            R$ {x.price || 120}
                          </div>
                          <div className="text-[9.5px] font-black text-amber-600 dark:text-amber-400">
                            👑 Premium R$ {x.premium_price || Math.round((x.price || 120) * 0.7)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 space-y-6">
                <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 text-center shadow-elevated text-white space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 text-xl">
                    🔍
                  </div>
                  <h3 className="text-sm font-extrabold text-white">
                    {query ? `Nenhum resultado para "${query}"` : "Nenhum anúncio encontrado"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Não encontramos nenhum passeio, cupom, hospedagem ou evento correspondente aos filtros aplicados
                    {city ? ` em ${city.name}` : ""}.
                  </p>
                  <div className="pt-1 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setQuery("");
                        setActive("todos");
                        setPriceFilter("all");
                      }}
                      className="rounded-full bg-gradient-brand px-5 py-2 text-xs font-black text-white shadow-brand hover:brightness-110 active:scale-95 transition"
                    >
                      Limpar busca & Filtros
                    </button>
                  </div>
                </div>

                {/* Seção de Sugestões Similares */}
                {data && data.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        ✨ Sugestões Populares para Você
                      </h4>
                      <span className="text-[10px] font-bold text-amber-500">
                        {data.slice(0, 6).length} sugestões
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {data.slice(0, 6).map((x) => {
                        const r = routeForCategory(x.category, x.id);
                        const offerType = (x as { offer_type?: string }).offer_type;
                        const isFree =
                          x.price === 0 ||
                          offerType === "perk" ||
                          (x.discount ?? "").toLowerCase().includes("gratis") ||
                          (x.discount ?? "").toLowerCase().includes("grátis") ||
                          (x.discount ?? "").toLowerCase().includes("cortesia");
                        const isFav = isFavorite(x.id);

                        return (
                          <Link
                            key={`sug-${x.id}`}
                            to={r.to as string}
                            params={r.params as never}
                            className="overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated border border-border/60 relative group"
                          >
                            <div className="relative aspect-square w-full overflow-hidden">
                              <img
                                src={x.image_url || fallbackImage(x.category as ListingCategory)}
                                alt={x.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <Badge className="absolute left-2 top-2 bg-white/85 text-foreground backdrop-blur font-bold text-[10px]">
                                {x.category}
                              </Badge>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavorite(x.id, x.title);
                                }}
                                className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition active:scale-95 hover:bg-black/75 shadow-md"
                              >
                                <Heart
                                  className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : "text-white"}`}
                                />
                              </button>
                              {isFree && (
                                <span className="absolute left-2 bottom-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-brand">
                                  GRÁTIS 🎁
                                </span>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="line-clamp-1 text-sm font-bold text-foreground">{x.title}</h3>
                              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                {x.city ?? x.address ?? "—"}
                              </p>
                              <div className="mt-1 flex items-center justify-between">
                                <span />
                                {isFree ? (
                                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                    GRÁTIS 🎁
                                  </span>
                                ) : isPremium ? (
                                  <div className="text-right">
                                    <span className="text-[9px] font-black text-amber-500 block uppercase">
                                      👑 Premium
                                    </span>
                                    <span className="text-xs font-black text-amber-500 dark:text-amber-400">
                                      R$ {x.premium_price || Math.round((x.price || 120) * 0.7)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-right">
                                    <div className="text-xs font-black text-foreground">
                                      R$ {x.price || 120}
                                    </div>
                                    <div className="text-[9.5px] font-black text-amber-600 dark:text-amber-400">
                                      👑 Premium R$ {x.premium_price || Math.round((x.price || 120) * 0.7)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-transparent bg-gradient-brand text-white shadow-brand"
          : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
