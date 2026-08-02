import { MapPin, Check, ChevronDown, X, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useCities, getStoredCities, type CityItem } from "@/lib/cities";
import { useSelectedCity } from "@/hooks/use-city";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function CitySelectorButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [city] = useSelectedCity();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3.5 py-1 font-bold text-white transition hover:bg-slate-900/80 border border-white/30 backdrop-blur-md shadow-md",
          className,
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        <span className="text-xs font-black text-white drop-shadow-sm">
          {city ? `${city.name}${city.state ? `, ${city.state}` : ""}` : "Escolha uma cidade"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-white/80 shrink-0" />
      </button>
      {open && <CitySheet onClose={() => setOpen(false)} />}
    </>
  );
}

function CitySheet({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: dbCities, isLoading } = useCities();
  const [city, setCity] = useSelectedCity();
  const [search, setSearch] = useState("");
  const [localCities, setLocalCities] = useState<CityItem[]>(() => getStoredCities(true));

  // Sincroniza em tempo real caso um novo destino seja cadastrado no Console Admin
  useEffect(() => {
    const handleCitiesChanged = () => {
      setLocalCities(getStoredCities(true));
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    };
    window.addEventListener("borapass:cities-changed", handleCitiesChanged);
    return () => window.removeEventListener("borapass:cities-changed", handleCitiesChanged);
  }, [queryClient]);

  const citiesToDisplay = useMemo(() => {
    const source = dbCities && dbCities.length > 0 ? dbCities : localCities;
    if (!search.trim()) return source;
    const term = search.toLowerCase();
    return source.filter(
      (c) =>
        c.name.toLowerCase().includes(term) || (c.state && c.state.toLowerCase().includes(term)),
    );
  }, [dbCities, localCities, search]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card p-6 pb-24 sm:pb-8 shadow-2xl border-t sm:border border-border space-y-4 animate-slideUp"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Escolha sua cidade</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Destinos cadastrados no Bora Pass. Selecione para filtrar a experiência.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input de Pesquisa de Cidades */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cidade ou estado..."
            className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 pb-4">
          {city && (
            <button
              onClick={() => {
                setCity(null);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary transition"
            >
              <span className="text-foreground font-bold">📍 Todas as cidades</span>
            </button>
          )}

          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando destinos...</p>
          ) : (
            citiesToDisplay.map((c) => {
              const active = city?.id === c.id || city?.name === c.name;
              return (
                <button
                  key={c.id || c.name}
                  onClick={() => {
                    setCity({ id: c.id, name: c.name, state: c.state });
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm transition bg-background",
                    active
                      ? "border-primary bg-primary/10 text-primary font-extrabold"
                      : "border-border hover:bg-secondary text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="text-left">
                      <p className="font-extrabold text-sm text-foreground">{c.name}</p>
                      {c.state && (
                        <p className="text-[11px] font-semibold text-muted-foreground">{c.state}</p>
                      )}
                    </div>
                  </div>
                  {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })
          )}
          {!isLoading && citiesToDisplay.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhuma cidade encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
