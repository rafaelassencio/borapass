import { MapPin, Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { useCities } from "@/lib/cities";
import { useSelectedCity } from "@/hooks/use-city";
import { cn } from "@/lib/utils";

export function CitySelectorButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [city] = useSelectedCity();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur transition hover:bg-white/25", className)}
      >
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-semibold">
          {city ? `${city.name}${city.state ? `, ${city.state}` : ""}` : "Escolha uma cidade"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
      </button>
      {open && <CitySheet onClose={() => setOpen(false)} />}
    </>
  );
}

function CitySheet({ onClose }: { onClose: () => void }) {
  const { data: cities, isLoading } = useCities();
  const [city, setCity] = useSelectedCity();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-background p-5 shadow-elevated"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Escolha sua cidade</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          As buscas, cupons e eventos serão filtrados por essa cidade.
        </p>
        <div className="mt-4 space-y-1.5">
          {city && (
            <button
              onClick={() => {
                setCity(null);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm hover:bg-secondary"
            >
              <span className="text-muted-foreground">Todas as cidades</span>
            </button>
          )}
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            (cities ?? []).map((c) => {
              const active = city?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCity({ id: c.id, name: c.name, state: c.state });
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                    active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">{c.name}</p>
                      {c.state && <p className="text-[11px] text-muted-foreground">{c.state}</p>}
                    </div>
                  </div>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })
          )}
          {!isLoading && (cities ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhuma cidade cadastrada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
