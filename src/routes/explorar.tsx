import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Search, Loader2, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSelectedCity } from "@/hooks/use-city";
import { fallbackImage, type Listing, type ListingCategory } from "@/lib/listings";

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

function useAllListingsForCity(cityId: string | null | undefined) {
  return useQuery({
    queryKey: ["listings", "all", cityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("*")
        .eq("active", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (cityId) q = q.eq("city_id", cityId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Listing[];
    },
  });
}

function Explorar() {
  const { cat } = Route.useSearch();
  const [query, setQuery] = useState("");
  const initial = CATS.find((c) => c.slug === cat)?.slug ?? "todos";
  const [active, setActive] = useState<string>(initial);
  const [city] = useSelectedCity();
  const { data, isLoading } = useAllListingsForCity(city?.id ?? null);

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      const catMatch =
        active === "todos" ||
        CATS.find((c) => c.slug === active)?.cat === r.category;
      const q = query.trim().toLowerCase();
      const qMatch = !q || r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [data, active, query]);

  const routeForCategory = (c: string, id: string) => {
    switch (c) {
      case "passeio": return { to: "/passeios/$id" as const, params: { id } };
      case "hospedagem": return { to: "/hospedagens/$id" as const, params: { id } };
      case "evento": return { to: "/eventos/$id" as const, params: { id } };
      case "cupom": return { to: "/cupons/$id" as const, params: { id } };
      default: return { to: "/explorar" as const, params: undefined };
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Explorar"
        subtitle={city ? `Anúncios em ${city.name}` : "Todas as cidades"}
      />
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATS.map((c) => (
            <FilterChip key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)}>
              {c.label}
            </FilterChip>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {filtered.map((x) => {
              const r = routeForCategory(x.category, x.id);
              return (
                <Link
                  key={x.id}
                  to={r.to as string}
                  params={r.params as never}
                  className="overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={x.image_url || fallbackImage(x.category as ListingCategory)}
                      alt={x.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <Badge className="absolute left-2 top-2 bg-white/85 text-foreground backdrop-blur">
                      {x.category}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-1 text-sm font-semibold">{x.title}</h3>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{x.city ?? x.address ?? "—"}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span />
                      {x.price != null ? (
                        <span className="text-xs font-bold text-primary">R$ {x.price}</span>
                      ) : x.discount ? (
                        <span className="text-xs font-bold text-accent">{x.discount}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <Compass className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">Nada encontrado{city ? ` em ${city.name}` : ""}.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? "border-transparent bg-gradient-brand text-white shadow-brand" : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
