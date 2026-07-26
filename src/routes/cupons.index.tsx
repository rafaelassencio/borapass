import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useListings, fallbackImage } from "@/lib/listings";
import { Loader2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/cupons/")({
  head: () => ({ meta: [{ title: "Cupons — Bora Pass" }] }),
  component: CuponsList,
});

function CuponsList() {
  const { data, isLoading } = useListings("cupom");
  const list = data ?? [];
  return (
    <AppShell>
      <PageHeader title="Cupons" subtitle="Economize em cada experiência" />
      <div className="px-5 pt-4">
        <div className="space-y-3">
          {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}
          {!isLoading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Nenhum cupom disponível ainda</p>
            </div>
          )}
          {list.map((c) => (
            <Link key={c.id} to="/cupons/$id" params={{ id: c.id }} className="block">
              <div className="flex overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
                <div className="relative w-24 shrink-0">
                  <img src={c.image_url || fallbackImage("cupom")} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 p-4">
                  {c.city && <p className="text-[11px] font-bold uppercase tracking-wider text-accent">{c.city}</p>}
                  <h3 className="mt-0.5 line-clamp-1 font-semibold">{c.title}</h3>
                  {c.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.description}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">Bora Pass</Badge>
                    {c.discount && <span className="rounded-full bg-gradient-ember px-3 py-1 text-xs font-extrabold text-white shadow-ember">{c.discount}</span>}
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
