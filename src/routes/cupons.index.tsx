import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { coupons } from "@/lib/mock-data";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const filters = ["Todos", "Restaurantes", "Hotéis", "Parques", "Lojas", "Cafés"] as const;

export const Route = createFileRoute("/cupons/")({
  head: () => ({ meta: [{ title: "Cupons — Bora Pass" }] }),
  component: CuponsList,
});

function CuponsList() {
  const [active, setActive] = useState<(typeof filters)[number]>("Todos");
  const list = coupons.filter((c) => active === "Todos" || c.category === active);
  return (
    <AppShell>
      <PageHeader title="Cupons" subtitle="Economize em cada experiência" />
      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                active === f ? "border-transparent bg-gradient-ember text-white shadow-ember" : "border-border bg-card"
              }`}
            >{f}</button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {list.map((c) => (
            <Link key={c.id} to="/cupons/$id" params={{ id: c.id }} className="block">
              <div className="flex overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
                <div className="relative w-24 shrink-0">
                  <img src={c.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent">{c.partner}</p>
                  <h3 className="mt-0.5 line-clamp-1 font-semibold">{c.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">Até {c.validUntil}</Badge>
                    <span className="rounded-full bg-gradient-ember px-3 py-1 text-xs font-extrabold text-white shadow-ember">{c.discount}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
