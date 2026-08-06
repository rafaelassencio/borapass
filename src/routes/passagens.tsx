import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Plane,
  Bus,
  Search,
  Calendar,
  Users,
  MapPin,
  Clock,
  Filter,
  ArrowRightLeft,
  Briefcase,
  Heart,
  History,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  Luggage,
} from "lucide-react";
import {
  searchFlights,
  searchBusTickets,
  getStoredSearchHistory,
  clearSearchHistory,
  getStoredFavoriteRoutes,
  toggleFavoriteRoute,
  type FlightTicket,
  type BusTicket,
  type SearchHistoryItem,
  type FavoriteRoute,
} from "@/lib/passagens-api";
import { useAuthContext } from "@/context/AuthContext";

export const Route = createFileRoute("/passagens")({
  head: () => ({ meta: [{ title: "Passagens Aéreas e Rodoviárias — Bora Pass" }] }),
  component: PassagensPage,
});

type PassagemTabMode = "aereo" | "rodoviario" | "historico" | "favoritos";

const POPULAR_AIRPORTS = [
  { code: "RIO", name: "Rio de Janeiro (Todos - GIG/SDU)" },
  { code: "SÃO", name: "São Paulo (Todos - GRU/CGH/VCP)" },
  { code: "BSB", name: "Brasília (BSB)" },
  { code: "SSA", name: "Salvador (SSA)" },
  { code: "FLN", name: "Florianópolis (FLN)" },
  { code: "FOR", name: "Fortaleza (FOR)" },
  { code: "CWB", name: "Curitiba (CWB)" },
  { code: "REC", name: "Recife (REC)" },
];

const POPULAR_BUS_CITIES = [
  "Rio de Janeiro, RJ",
  "São Paulo, SP",
  "Búzios, RJ",
  "Paraty, RJ",
  "Angra dos Reis, RJ",
  "Cabo Frio, RJ",
  "Belo Horizonte, MG",
  "Curitiba, PR",
  "Florianópolis, SC",
  "Campos do Jordão, SP",
  "Gramado, RS",
];

export function PassagensPage() {
  const { user } = useAuthContext();

  // Tab ativa
  const [activeTab, setActiveTab] = useState<PassagemTabMode>("aereo");

  // FORMULARIO AÉREO
  const [flightOrigin, setFlightOrigin] = useState("RIO");
  const [flightDestination, setFlightDestination] = useState("SÃO");
  const [flightDepartureDate, setFlightDepartureDate] = useState("2026-08-15");
  const [flightReturnDate, setFlightReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<"economy" | "premium_economy" | "business" | "first">("economy");

  // FORMULARIO RODOVIÁRIO
  const [busOrigin, setBusOrigin] = useState("Rio de Janeiro, RJ");
  const [busDestination, setBusDestination] = useState("Búzios, RJ");
  const [busDepartureDate, setBusDepartureDate] = useState("2026-08-15");
  const [busPassengers, setBusPassengers] = useState(1);

  // ESTADOS DE RESULTADO E LOADING
  const [flightResults, setFlightResults] = useState<FlightTicket[]>([]);
  const [busResults, setBusResults] = useState<BusTicket[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // FILTROS AÉREOS
  const [flightMaxPrice, setFlightMaxPrice] = useState<number>(2000);
  const [flightAirlineFilter, setFlightAirlineFilter] = useState<string>("todos");
  const [flightStopsFilter, setFlightStopsFilter] = useState<string>("todos");

  // FILTROS RODOVIÁRIOS
  const [busMaxPrice, setBusMaxPrice] = useState<number>(500);
  const [busCompanyFilter, setBusCompanyFilter] = useState<string>("todos");
  const [busCategoryFilter, setBusCategoryFilter] = useState<string>("todos");

  // HISTÓRICO E FAVORITOS
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<FlightTicket | BusTicket | null>(null);

  // Carregar histórico e favoritos na montagem
  useEffect(() => {
    setHistory(getStoredSearchHistory());
    setFavorites(getStoredFavoriteRoutes());
  }, []);

  // Executar Pesquisa Aérea (MaxMilhas via Edge Function)
  const handleSearchFlights = useCallback(async () => {
    if (!flightOrigin || !flightDestination || !flightDepartureDate) {
      return toast.error("Preencha a origem, destino e data de partida.");
    }

    setIsSearching(true);
    setHasSearched(true);
    const controller = new AbortController();

    try {
      const res = await searchFlights({
        origin: flightOrigin,
        destination: flightDestination,
        departureDate: flightDepartureDate,
        returnDate: flightReturnDate || undefined,
        adults,
        children,
        infants,
        cabinClass,
        signal: controller.signal,
      });

      setFlightResults(res);
      setHistory(getStoredSearchHistory());
      toast.success(`✈️ ${res.length} voos encontrados via MaxMilhas API!`);
    } catch (err: any) {
      toast.error("Falha ao consultar passagens aéreas. Exibindo rota padrão.");
    } finally {
      setIsSearching(false);
    }
  }, [flightOrigin, flightDestination, flightDepartureDate, flightReturnDate, adults, children, infants, cabinClass]);

  // Executar Pesquisa Rodoviária (ClickBus via Edge Function)
  const handleSearchBus = useCallback(async () => {
    if (!busOrigin || !busDestination || !busDepartureDate) {
      return toast.error("Preencha a origem, destino e data da viagem.");
    }

    setIsSearching(true);
    setHasSearched(true);
    const controller = new AbortController();

    try {
      const res = await searchBusTickets({
        origin: busOrigin,
        destination: busDestination,
        date: busDepartureDate,
        passengers: busPassengers,
        signal: controller.signal,
      });

      setBusResults(res);
      setHistory(getStoredSearchHistory());
      toast.success(`🚌 ${res.length} passagens rodoviárias encontradas via ClickBus API!`);
    } catch (err: any) {
      toast.error("Falha ao consultar passagens rodoviárias.");
    } finally {
      setIsSearching(false);
    }
  }, [busOrigin, busDestination, busDepartureDate, busPassengers]);

  // Filtragem Dinâmica de Voos
  const filteredFlights = useMemo(() => {
    return flightResults.filter((f) => {
      if (f.price > flightMaxPrice) return false;
      if (flightAirlineFilter !== "todos" && !f.airline.toLowerCase().includes(flightAirlineFilter.toLowerCase()))
        return false;
      if (flightStopsFilter === "direto" && f.stops !== 0) return false;
      if (flightStopsFilter === "1escala" && f.stops !== 1) return false;
      return true;
    });
  }, [flightResults, flightMaxPrice, flightAirlineFilter, flightStopsFilter]);

  // Filtragem Dinâmica de Ônibus
  const filteredBus = useMemo(() => {
    return busResults.filter((b) => {
      if (b.price > busMaxPrice) return false;
      if (busCompanyFilter !== "todos" && !b.companyName.toLowerCase().includes(busCompanyFilter.toLowerCase()))
        return false;
      if (busCategoryFilter !== "todos" && b.category.toLowerCase() !== busCategoryFilter.toLowerCase())
        return false;
      return true;
    });
  }, [busResults, busMaxPrice, busCompanyFilter, busCategoryFilter]);

  // Checar e alternar favoritos
  const isCurrentRouteFavorite = useMemo(() => {
    const orig = activeTab === "aereo" ? flightOrigin : busOrigin;
    const dest = activeTab === "aereo" ? flightDestination : busDestination;
    return favorites.some(
      (f) => f.type === activeTab && f.origin.toLowerCase() === orig.toLowerCase() && f.destination.toLowerCase() === dest.toLowerCase(),
    );
  }, [favorites, activeTab, flightOrigin, flightDestination, busOrigin, busDestination]);

  const handleToggleFavorite = () => {
    const orig = activeTab === "aereo" ? flightOrigin : busOrigin;
    const dest = activeTab === "aereo" ? flightDestination : busDestination;
    const updated = toggleFavoriteRoute({ type: activeTab === "aereo" ? "aereo" : "rodoviario", origin: orig, destination: dest });
    setFavorites(updated);
    if (!isCurrentRouteFavorite) {
      toast.success("❤️ Rota adicionada às suas Rotas Favoritas!");
    } else {
      toast.info("Rota removida dos Favoritos.");
    }
  };

  return (
    <AppShell>
      {/* HEADER PRINCIPAL COM DESIGN BORA PASS */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white px-5 pt-7 pb-6 shadow-elevated border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> MaxMilhas & ClickBus Integrados
            </span>

            <button
              onClick={handleToggleFavorite}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isCurrentRouteFavorite
                  ? "bg-rose-500 text-white border-rose-400"
                  : "bg-white/10 text-slate-300 border-white/20 hover:bg-white/20"
              }`}
            >
              <Heart className={`h-4 w-4 ${isCurrentRouteFavorite ? "fill-white" : ""}`} />
              <span>{isCurrentRouteFavorite ? "Favorito" : "Favoritar Rota"}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
            Compare e Economize em <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-sky-400 bg-clip-text text-transparent">
              Passagens Aéreas & Rodoviárias
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Sua viagem completa no Bora Pass com tarifas exclusivas, rotas integradas e garantia de emissão.
          </p>

          {/* TABS DE SELEÇÃO DO MÓDULO */}
          <div className="pt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-t border-white/10">
            <button
              onClick={() => {
                setActiveTab("aereo");
                setHasSearched(false);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === "aereo"
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Plane className="h-4 w-4" /> ✈️ Passagens Aéreas
            </button>

            <button
              onClick={() => {
                setActiveTab("rodoviario");
                setHasSearched(false);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === "rodoviario"
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Bus className="h-4 w-4" /> 🚌 Passagens Rodoviárias
            </button>

            <button
              onClick={() => setActiveTab("historico")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === "historico"
                  ? "bg-amber-400 text-slate-950 font-black shadow-brand"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <History className="h-4 w-4" /> Minhas Pesquisas ({history.length})
            </button>

            <button
              onClick={() => setActiveTab("favoritos")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === "favoritos"
                  ? "bg-rose-500 text-white font-black shadow-brand"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Heart className="h-4 w-4" /> Favoritas ({favorites.length})
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 pb-28 max-w-4xl mx-auto space-y-6">
        {/* ========================================================= */}
        {/* FORMULÁRIO 1: PASSAGENS AÉREAS (MAXMILHAS)                */}
        {/* ========================================================= */}
        {activeTab === "aereo" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Pesquisa de Voos (MaxMilhas API)
                </h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                🔒 Consulta Segura via Edge Function
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* ORIGEM */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Origem (Aeroporto)
                </label>
                <select
                  value={flightOrigin}
                  onChange={(e) => setFlightOrigin(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {POPULAR_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESTINO */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> Destino (Aeroporto)
                </label>
                <select
                  value={flightDestination}
                  onChange={(e) => setFlightDestination(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {POPULAR_AIRPORTS.map((a) => (
                    <option key={`dest-${a.code}`} value={a.code}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATA IDA */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Data de Ida
                </label>
                <input
                  type="date"
                  value={flightDepartureDate}
                  onChange={(e) => setFlightDepartureDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* DATA VOLTA (OPCIONAL) */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Volta (Opcional)
                </label>
                <input
                  type="date"
                  value={flightReturnDate}
                  onChange={(e) => setFlightReturnDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* PASSAGEIROS E CLASSE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px]">Adultos (12+ anos)</label>
                <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-1.5 justify-between">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                  >
                    -
                  </button>
                  <span className="font-black text-sm">{adults}</span>
                  <button
                    onClick={() => setAdults(adults + 1)}
                    className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px]">Crianças (2-11 anos)</label>
                <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-1.5 justify-between">
                  <button
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                  >
                    -
                  </button>
                  <span className="font-black text-sm">{children}</span>
                  <button
                    onClick={() => setChildren(children + 1)}
                    className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px]">Classe da Cabine</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground outline-none"
                >
                  <option value="economy">Econômica</option>
                  <option value="premium_economy">Econômica Premium</option>
                  <option value="business">Executiva (Business)</option>
                  <option value="first">Primeira Classe</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSearchFlights}
              disabled={isSearching}
              className="w-full rounded-2xl bg-gradient-brand py-3.5 text-sm font-black text-white shadow-brand hover:opacity-95 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extraindo voos ao vivo na MaxMilhas via GeckoAPI...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Pesquisar Passagens Aéreas
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMULÁRIO 2: PASSAGENS RODOVIÁRIAS (CLICKBUS)            */}
        {/* ========================================================= */}
        {activeTab === "rodoviario" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Pesquisa de Ônibus (ClickBus API)
                </h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                🔒 Consulta Segura via Edge Function
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* ORIGEM RODOVIÁRIA */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Cidade de Origem
                </label>
                <select
                  value={busOrigin}
                  onChange={(e) => setBusOrigin(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {POPULAR_BUS_CITIES.map((c) => (
                    <option key={`bus-orig-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESTINO RODOVIÁRIO */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> Cidade de Destino
                </label>
                <select
                  value={busDestination}
                  onChange={(e) => setBusDestination(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {POPULAR_BUS_CITIES.map((c) => (
                    <option key={`bus-dest-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATA */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Data da Viagem
                </label>
                <input
                  type="date"
                  value={busDepartureDate}
                  onChange={(e) => setBusDepartureDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* PASSAGEIROS */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" /> Passageiros
                </label>
                <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-1.5 justify-between">
                  <button
                    onClick={() => setBusPassengers(Math.max(1, busPassengers - 1))}
                    className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                  >
                    -
                  </button>
                  <span className="font-black text-sm">{busPassengers}</span>
                  <button
                    onClick={() => setBusPassengers(busPassengers + 1)}
                    className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSearchBus}
              disabled={isSearching}
              className="w-full rounded-2xl bg-gradient-brand py-3.5 text-sm font-black text-white shadow-brand hover:opacity-95 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Consultando ClickBus API...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Pesquisar Passagens Rodoviárias
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* RESULTADOS DA PESQUISA AÉREA                              */}
        {/* ========================================================= */}
        {activeTab === "aereo" && hasSearched && (
          <div className="space-y-4 animate-fadeIn">
            {/* BARRA DE FILTROS AÉREOS */}
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-primary" /> Filtros de Passagens Aéreas
                </h3>
                <span className="text-xs font-bold text-primary">{filteredFlights.length} voos encontrados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                    Preço Máximo: R$ {flightMaxPrice}
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="3000"
                    step="50"
                    value={flightMaxPrice}
                    onChange={(e) => setFlightMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">Companhia Aérea</label>
                  <select
                    value={flightAirlineFilter}
                    onChange={(e) => setFlightAirlineFilter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="todos">Todas as Companhias</option>
                    <option value="latam">LATAM Airlines</option>
                    <option value="gol">GOL Linhas Aéreas</option>
                    <option value="azul">Azul Linhas Aéreas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">Conexões / Escalas</label>
                  <select
                    value={flightStopsFilter}
                    onChange={(e) => setFlightStopsFilter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="todos">Qualquer quantidade</option>
                    <option value="direto">Somente Voo Direto</option>
                    <option value="1escala">Até 1 Escala</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARDS DE RESULTADO AÉREO */}
            <div className="grid gap-3">
              {filteredFlights.map((f) => (
                <div
                  key={f.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={f.airlineLogo}
                        alt={f.airline}
                        className="h-10 w-10 rounded-xl object-cover border border-border shadow-sm"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground">{f.airline}</h4>
                        <span className="text-[11px] font-mono font-bold text-muted-foreground">
                          {f.flightNumber} · Classe: {f.cabinClass}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        f.stops === 0
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {f.stops === 0 ? "⚡ Voo Direto" : `${f.stops} Escala`}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center">
                        <span className="text-lg font-black text-foreground">{f.departureTime}</span>
                        <span className="text-xs font-bold text-muted-foreground block">{f.origin}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground font-bold">{f.duration}</span>
                        <div className="w-full h-0.5 bg-border relative my-1">
                          <Plane className="h-3.5 w-3.5 text-primary absolute left-1/2 -top-1.5 -translate-x-1/2" />
                        </div>
                        {f.stopDetails && <span className="text-[9.5px] text-amber-500 font-bold">{f.stopDetails}</span>}
                      </div>

                      <div className="text-center">
                        <span className="text-lg font-black text-foreground">{f.arrivalTime}</span>
                        <span className="text-xs font-bold text-muted-foreground block">{f.destination}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border">
                      <div className="text-xs text-muted-foreground font-bold">Por passageiro</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        R$ {f.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">+ Taxas R$ {f.taxes.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs border-t border-border/60">
                    <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                      <Luggage className="h-3.5 w-3.5 text-primary" /> {f.baggage}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicketDetails(f)}
                        className="rounded-xl border border-border bg-background hover:bg-secondary px-3.5 py-2 text-xs font-bold text-foreground transition"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() =>
                          toast.success(
                            `🎉 Voo ${f.flightNumber} (${f.airline}) selecionado! Prosseguindo para emissão...`,
                          )
                        }
                        className="rounded-xl bg-gradient-brand px-4 py-2 text-xs font-black text-white shadow-brand hover:opacity-95 transition"
                      >
                        Selecionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RESULTADOS DA PESQUISA RODOVIÁRIA                         */}
        {/* ========================================================= */}
        {activeTab === "rodoviario" && hasSearched && (
          <div className="space-y-4 animate-fadeIn">
            {/* BARRA DE FILTROS RODOVIÁRIOS */}
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-primary" /> Filtros de Passagens Rodoviárias
                </h3>
                <span className="text-xs font-bold text-primary">{filteredBus.length} viagens encontradas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                    Preço Máximo: R$ {busMaxPrice}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={busMaxPrice}
                    onChange={(e) => setBusMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">Viação / Empresa</label>
                  <select
                    value={busCompanyFilter}
                    onChange={(e) => setBusCompanyFilter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="todos">Todas as Viações</option>
                    <option value="1001">Viação 1001</option>
                    <option value="cometa">Viação Cometa</option>
                    <option value="gontijo">Viação Gontijo</option>
                    <option value="catarinense">Viação Catarinense</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">Categoria do Ônibus</label>
                  <select
                    value={busCategoryFilter}
                    onChange={(e) => setBusCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="todos">Todas as Categorias</option>
                    <option value="convencional">Convencional</option>
                    <option value="executivo">Executivo</option>
                    <option value="semi-leito">Semi-Leito</option>
                    <option value="leito">Leito</option>
                    <option value="cama">Cama</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARDS DE RESULTADO RODOVIÁRIO */}
            <div className="grid gap-3">
              {filteredBus.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.companyLogo}
                        alt={b.companyName}
                        className="h-10 w-10 rounded-xl object-cover border border-border shadow-sm"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground">{b.companyName}</h4>
                        <span className="text-[11px] font-mono font-bold text-muted-foreground">
                          Poltronas livres: {b.availableSeats}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                      🚌 {b.category}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center">
                        <span className="text-lg font-black text-foreground">{b.departureTime}</span>
                        <span className="text-xs font-bold text-muted-foreground block truncate max-w-[90px]">
                          {b.origin.split(",")[0]}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground font-bold">{b.duration}</span>
                        <div className="w-full h-0.5 bg-border relative my-1">
                          <Bus className="h-3.5 w-3.5 text-primary absolute left-1/2 -top-1.5 -translate-x-1/2" />
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="text-lg font-black text-foreground">{b.arrivalTime}</span>
                        <span className="text-xs font-bold text-muted-foreground block truncate max-w-[90px]">
                          {b.destination.split(",")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border">
                      <div className="text-xs text-muted-foreground font-bold">Por passageiro</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        R$ {b.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-border/60">
                    <div className="flex flex-wrap gap-1">
                      {b.amenities.map((a, i) => (
                        <span
                          key={i}
                          className="bg-secondary px-2 py-0.5 rounded-md text-[10px] font-bold text-muted-foreground"
                        >
                          {a}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicketDetails(b)}
                        className="rounded-xl border border-border bg-background hover:bg-secondary px-3.5 py-2 text-xs font-bold text-foreground transition"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() =>
                          toast.success(
                            `🎉 Passagem da ${b.companyName} (${b.category}) selecionada! Prosseguindo para assentos...`,
                          )
                        }
                        className="rounded-xl bg-gradient-brand px-4 py-2 text-xs font-black text-white shadow-brand hover:opacity-95 transition"
                      >
                        Selecionar Poltrona
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB HISTÓRICO: MINHAS PESQUISAS                          */}
        {/* ========================================================= */}
        {activeTab === "historico" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Histórico de Buscas Salvas
              </h2>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    clearSearchHistory();
                    setHistory([]);
                    toast.info("Histórico de pesquisas limpo.");
                  }}
                  className="text-xs font-bold text-destructive hover:underline"
                >
                  Limpar Histórico
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma pesquisa realizada recentemente. Suas buscas de voos e ônibus aparecerão aqui.
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl border border-border bg-background flex items-center justify-between gap-4 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                        {h.type === "aereo" ? "✈️" : "🚌"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground">
                          {h.origin} ➔ {h.destination}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          📅 {h.date} · 👥 {h.passengersCount} passageiro(s) · {new Date(h.timestamp).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (h.type === "aereo") {
                          setFlightOrigin(h.origin);
                          setFlightDestination(h.destination);
                          setFlightDepartureDate(h.date);
                          setActiveTab("aereo");
                          handleSearchFlights();
                        } else {
                          setBusOrigin(h.origin);
                          setBusDestination(h.destination);
                          setBusDepartureDate(h.date);
                          setActiveTab("rodoviario");
                          handleSearchBus();
                        }
                      }}
                      className="rounded-xl bg-gradient-brand px-3.5 py-2 text-xs font-bold text-white shadow-brand hover:opacity-95 transition"
                    >
                      Repetir Busca
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB FAVORITOS: ROTAS SALVAS                                */}
        {/* ========================================================= */}
        {activeTab === "favoritos" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4 animate-fadeIn">
            <h2 className="text-sm font-black uppercase text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Rotas Favoritas Salvas
            </h2>

            {favorites.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma rota favoritada. Clique em "Favoritar Rota" no topo durante a pesquisa para salvar suas rotas frequentes.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl border border-border bg-background space-y-3 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        {f.type === "aereo" ? "✈️ Voo Aéreo" : "🚌 Ônibus Rodoviário"}
                      </span>
                      <button
                        onClick={() => {
                          const updated = toggleFavoriteRoute(f);
                          setFavorites(updated);
                        }}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Heart className="h-4 w-4 fill-rose-500" />
                      </button>
                    </div>
                    <h3 className="font-extrabold text-base text-foreground">
                      {f.origin} ➔ {f.destination}
                    </h3>
                    <button
                      onClick={() => {
                        if (f.type === "aereo") {
                          setFlightOrigin(f.origin);
                          setFlightDestination(f.destination);
                          setActiveTab("aereo");
                        } else {
                          setBusOrigin(f.origin);
                          setBusDestination(f.destination);
                          setActiveTab("rodoviario");
                        }
                      }}
                      className="w-full rounded-xl bg-secondary hover:bg-primary hover:text-white text-foreground font-bold py-2 text-xs transition text-center"
                    >
                      Pesquisar nesta Rota
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA PASSAGEM */}
      {selectedTicketDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTicketDetails(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-3xl p-6 shadow-elevated border border-border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Detalhes Completos do Bilhete
              </h3>
              <button onClick={() => setSelectedTicketDetails(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {"flightNumber" in selectedTicketDetails ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <img src={selectedTicketDetails.airlineLogo} className="h-10 w-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{selectedTicketDetails.airline}</h4>
                    <p className="text-muted-foreground">{selectedTicketDetails.flightNumber}</p>
                  </div>
                </div>
                <div className="bg-secondary/50 p-3 rounded-2xl space-y-1">
                  <p>
                    <strong>Origem:</strong> {selectedTicketDetails.origin} às {selectedTicketDetails.departureTime}
                  </p>
                  <p>
                    <strong>Destino:</strong> {selectedTicketDetails.destination} às {selectedTicketDetails.arrivalTime}
                  </p>
                  <p>
                    <strong>Duração:</strong> {selectedTicketDetails.duration} ({selectedTicketDetails.stops === 0 ? "Voo Direto" : `${selectedTicketDetails.stops} Parada(s)`})
                  </p>
                  <p>
                    <strong>Bagagem:</strong> {selectedTicketDetails.baggage}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    Total: R$ {(selectedTicketDetails.price + selectedTicketDetails.taxes).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <img src={selectedTicketDetails.companyLogo} className="h-10 w-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{selectedTicketDetails.companyName}</h4>
                    <p className="text-muted-foreground">Categoria: {selectedTicketDetails.category}</p>
                  </div>
                </div>
                <div className="bg-secondary/50 p-3 rounded-2xl space-y-1">
                  <p>
                    <strong>Origem:</strong> {selectedTicketDetails.origin} às {selectedTicketDetails.departureTime}
                  </p>
                  <p>
                    <strong>Destino:</strong> {selectedTicketDetails.destination} às {selectedTicketDetails.arrivalTime}
                  </p>
                  <p>
                    <strong>Poltronas Disponíveis:</strong> {selectedTicketDetails.availableSeats}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    Total: R$ {(selectedTicketDetails.price + selectedTicketDetails.taxes).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedTicketDetails(null);
                toast.success("Redirecionando para reserva segura...");
              }}
              className="w-full rounded-2xl bg-gradient-brand py-3 text-xs font-black text-white shadow-brand hover:opacity-95 transition"
            >
              Confirmar & Prosseguir
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
