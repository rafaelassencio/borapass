import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { roteiros } from "@/lib/mock-data";
import { Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/roteiros")({
  head: () => ({ meta: [{ title: "Roteiros — Bora Pass" }] }),
  component: RoteirosPage,
});

function RoteirosPage() {
  return (
    <AppShell>
      <PageHeader title="Roteiros" subtitle="Prontos para você viver, do seu jeito" />
      <div className="space-y-4 p-5">
        {roteiros.map((r) => (
          <div key={r.id} className="relative overflow-hidden rounded-3xl bg-card shadow-soft transition hover:shadow-elevated">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img src={r.image} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 backdrop-blur"><Clock className="h-3 w-3" /> {r.duration}</span>
                  <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5"><Sparkles className="h-3 w-3" /> {r.vibe}</span>
                </div>
                <h3 className="mt-2 text-xl font-extrabold">{r.title}</h3>
                <p className="mt-1 text-sm opacity-90">{r.description}</p>
              </div>
            </div>
            <div className="p-4">
              <button className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition active:scale-95">
                Ver roteiro completo
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
