import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { categories, tours, hotels, restaurants, coupons } from "@/lib/mock-data";
import { Search, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/explorar")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Explorar — Bora Pass" }] }),
  component: Explorar,
});

function Explorar() {
  const { cat } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(cat ?? "passeios");

  const all = useMemo(() => {
    const t = tours.map((x) => ({ kind: "passeios" as const, id: x.id, title: x.name, sub: x.address, image: x.image, price: `R$ ${x.price}`, rating: x.rating, to: `/passeios/${x.id}` }));
    const h = hotels.map((x) => ({ kind: "hospedagens" as const, id: x.id, title: x.name, sub: x.address, image: x.image, price: `R$ ${x.price}/noite`, rating: x.rating, to: `/hospedagens/${x.id}` }));
    const r = restaurants.map((x) => ({ kind: "restaurantes" as const, id: x.id, title: x.name, sub: `${x.cuisine} · ${x.price}`, image: x.image, price: "", rating: x.rating, to: `/explorar` }));
    const c = coupons.map((x) => ({ kind: "cupons" as const, id: x.id, title: x.title, sub: x.partner, image: x.image, price: x.discount, rating: 0, to: `/cupons/${x.id}` }));
    return [...t, ...h, ...r, ...c];
  }, []);

  const filtered = all.filter((x) => {
    const matchCat = active === "todos" || x.kind === active;
    const matchQ = !query || x.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <AppShell>
      <PageHeader title="Explorar" subtitle="Encontre o que fazer, comer e curtir" />
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
          <FilterChip active={active === "todos"} onClick={() => setActive("todos")}>Todos</FilterChip>
          {categories.slice(0, 6).map((c) => (
            <FilterChip key={c.id} active={active === c.slug} onClick={() => setActive(c.slug)}>
              {c.icon} {c.label}
            </FilterChip>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {filtered.map((x) => (
            <Link
              key={`${x.kind}-${x.id}`}
              to={x.to}
              className="overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <img src={x.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                <Badge className="absolute left-2 top-2 bg-white/85 text-foreground backdrop-blur">
                  {x.kind}
                </Badge>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold">{x.title}</h3>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{x.sub}</p>
                <div className="mt-1 flex items-center justify-between">
                  {x.rating > 0 ? (
                    <span className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{x.rating}</span>
                    </span>
                  ) : <span />}
                  {x.price && <span className="text-xs font-bold text-primary">{x.price}</span>}
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">Nada encontrado.</p>
          )}
        </div>
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
