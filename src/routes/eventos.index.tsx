import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { events } from "@/lib/mock-data";
import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/eventos/")({
  head: () => ({ meta: [{ title: "Eventos — Bora Pass" }] }),
  component: EventsList,
});

function EventsList() {
  const dates = Array.from(new Set(events.map((e) => e.date))).sort();
  const [selectedDate, setSelectedDate] = useState<string>(dates[0]);
  const list = events.filter((e) => e.date === selectedDate);
  return (
    <AppShell>
      <PageHeader title="Eventos" subtitle="O que rola nos próximos dias" />
      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map((d) => {
            const dt = new Date(d);
            const active = d === selectedDate;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex min-w-16 flex-col items-center rounded-2xl border px-3 py-2 transition ${
                  active ? "border-transparent bg-gradient-brand text-white shadow-brand" : "border-border bg-card"
                }`}
              >
                <span className="text-[10px] uppercase font-semibold opacity-80">
                  {dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                </span>
                <span className="text-lg font-extrabold leading-none">{dt.getDate()}</span>
                <span className="text-[10px] opacity-80">{dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-4">
          {list.map((e) => (
            <Link key={e.id} to="/eventos/$id" params={{ id: e.id }} className="block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-elevated">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={e.image} alt={e.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">{e.category}</Badge>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="text-lg font-bold">{e.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs opacity-90">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-lg font-extrabold text-primary">{e.price === 0 ? "Grátis" : `R$ ${e.price}`}</span>
                <span className="rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white shadow-brand">Ver evento</span>
              </div>
            </Link>
          ))}
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhum evento nesta data.</p>}
        </div>
      </div>
    </AppShell>
  );
}
