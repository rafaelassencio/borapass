import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Calendar,
  CalendarDays,
  Clock,
  Compass,
  Hotel,
  MapPin,
  Plus,
  Sparkles,
  Star,
  Trash2,
  CheckCircle2,
  Bell,
  ArrowRight,
  ChevronRight,
  Search,
  ThumbsUp,
  Utensils,
  Share2,
  Users,
  Ticket,
  ShoppingBag,
  Gift,
  Phone,
  Mail,
  UserPlus,
  ShieldCheck,
  Award,
} from "lucide-react";
import { useState } from "react";
import { useCities } from "@/lib/cities";
import { useListings, fallbackImage } from "@/lib/listings";
import {
  tours as mockTours,
  restaurants as mockRestaurants,
  hotels as mockHotels,
  coupons as mockCoupons,
  events as mockEvents,
} from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { usePlanLimits } from "@/lib/plan-limits";
import { UpgradePremiumModal } from "@/components/UpgradePremiumModal";
import { scheduleTripAlerts } from "@/lib/notifications";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AirbnbCalendar } from "@/components/AirbnbCalendar";

export const Route = createFileRoute("/planejar")({
  head: () => ({ meta: [{ title: "Planejar Viagem — Bora Pass" }] }),
  component: PlanejarPage,
});

export type ActivityCategory =
  "passeio" | "restaurante" | "hospedagem" | "evento" | "cupom" | "compras" | "personalizado";

export type ActivityItem = {
  id: string;
  title: string;
  category: ActivityCategory;
  time?: string;
  image?: string;
  price?: number;
  address?: string;
  discount?: string;
};

export type InvitedCompanion = {
  id: string;
  name: string;
  contact: string;
  avatar?: string;
};

export type TripPlan = {
  id: string;
  destinationCity: string;
  cityId?: string | null;
  startDate: string;
  daysCount: number;
  hotelName?: string;
  hotelAddress?: string;
  dailySchedule: Record<number, ActivityItem[]>;
  invitedCompanions?: InvitedCompanion[];
  hasSharedSeal?: boolean;
  initialDiffDaysAtCreation?: number;
  created_at: string;
};

export function PlanejarPage() {
  const { user } = useAuth();
  const { isPremium } = useRoles(user?.id);
  const { limits } = usePlanLimits();
  const { data: dbCities } = useCities(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<string | undefined>(undefined);

  // Active view: 'list' (Minhas Viagens) or 'wizard' (Criar Nova Viagem)
  const [view, setView] = useState<"list" | "wizard">("wizard");
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Saved trips in localStorage
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:trip-plans");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* fallback */
        }
      }
    }
    return [
      {
        id: "trip-demo-1",
        destinationCity: "Gramado",
        startDate: "2026-08-10",
        daysCount: 3,
        hotelName: "Hotel Alpestre Gramado",
        hotelAddress: "Bairro Portal, Gramado - RS",
        invitedCompanions: [
          { id: "c1", name: "Mariana Souza", contact: "(54) 99881-2233" },
          { id: "c2", name: "Lucas Ferreira", contact: "lucas.f@gmail.com" },
        ],
        hasSharedSeal: true,
        dailySchedule: {
          1: [
            {
              id: "a1",
              title: "Passeio pelo Lago Negro & Pedalinho",
              category: "passeio",
              time: "10:00",
              price: 45,
            },
          ],
          2: [{ id: "a2", title: "Festival de Cinema & Luzes", category: "evento", time: "18:30" }],
          3: [
            {
              id: "a3",
              title: "Cupom Chocolates de Gramado 20% OFF",
              category: "cupom",
              time: "15:00",
              discount: "20% OFF",
            },
          ],
        },
        created_at: new Date().toISOString(),
      },
    ];
  });

  // Wizard state
  const [selectedCityName, setSelectedCityName] = useState("Gramado");
  const selectedCityObj = (dbCities ?? []).find((c) => c.name === selectedCityName);
  const cityId = selectedCityObj?.id ?? null;

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [daysCount, setDaysCount] = useState(3);
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [showMoreHotels, setShowMoreHotels] = useState(false);

  // Convidados state
  const [companionSearch, setCompanionSearch] = useState("");
  const [invitedCompanions, setInvitedCompanions] = useState<InvitedCompanion[]>([]);

  // Daily Schedule state: Record<dayNumber, ActivityItem[]>
  const [dailySchedule, setDailySchedule] = useState<Record<number, ActivityItem[]>>({
    1: [],
    2: [],
    3: [],
  });

  const [currentDay, setCurrentDay] = useState(1);
  const [customActivityTitle, setCustomActivityTitle] = useState("");
  const [customActivityTime, setCustomActivityTime] = useState("10:00");

  // Fetch real listings for selected city
  const { data: dbTours } = useListings("passeio", cityId);
  const { data: dbEvents } = useListings("evento", cityId);
  const { data: dbHotels } = useListings("hospedagem", cityId);
  const { data: dbCoupons } = useListings("cupom", cityId);
  const { data: dbShopping } = useListings("compras", cityId);

  // Recommendations Lists
  const availableHotels =
    dbHotels && dbHotels.length > 0
      ? dbHotels
      : mockHotels.map((h) => ({
          id: h.id,
          title: h.name,
          image_url: h.image,
          price: h.price,
          address: h.address,
          category: "hospedagem" as const,
        }));

  const availableTours =
    dbTours && dbTours.length > 0
      ? dbTours
      : mockTours.map((t) => ({
          id: t.id,
          title: t.name,
          image_url: t.image,
          price: t.price,
          address: t.address,
          category: "passeio" as const,
        }));

  const availableEvents =
    dbEvents && dbEvents.length > 0
      ? dbEvents
      : mockEvents.map((e) => ({
          id: e.id,
          title: e.name,
          image_url: e.image,
          price: e.price,
          address: e.location,
          category: "evento" as const,
        }));

  const availableCoupons =
    dbCoupons && dbCoupons.length > 0
      ? dbCoupons
      : mockCoupons.map((c) => ({
          id: c.id,
          title: c.title,
          image_url: c.image,
          price: 0,
          discount: c.discount,
          address: c.partner,
          category: "cupom" as const,
        }));

  const availableShopping =
    dbShopping && dbShopping.length > 0
      ? dbShopping
      : [
          {
            id: "shop-1",
            title: "Empório de Vinhos & Queijos da Serra",
            image_url:
              "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop",
            price: 0,
            discount: "15% OFF VIP",
            address: "Av. das Hortênsias, Gramado",
            category: "compras" as const,
          },
          {
            id: "shop-2",
            title: "Fabrica de Chocolates Artesanais",
            image_url:
              "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop",
            price: 0,
            discount: "Degustação Grátis",
            address: "Centro, Gramado",
            category: "compras" as const,
          },
        ];

  // Helper to add activity to active day
  function handleAddActivity(activity: ActivityItem) {
    setDailySchedule((prev) => {
      const list = prev[currentDay] || [];
      if (list.some((item) => item.id === activity.id)) {
        toast.warning("Esta atividade já está no roteiro deste dia.");
        return prev;
      }
      toast.success(`'${activity.title}' adicionado ao Dia ${currentDay}!`);
      return { ...prev, [currentDay]: [...list, activity] };
    });
  }

  function handleAddCustomActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!customActivityTitle.trim()) return;
    const item: ActivityItem = {
      id: `custom-${Date.now()}`,
      title: customActivityTitle.trim(),
      category: "personalizado",
      time: customActivityTime,
    };
    handleAddActivity(item);
    setCustomActivityTitle("");
  }

  function handleRemoveActivity(day: number, activityId: string) {
    setDailySchedule((prev) => {
      const list = prev[day] || [];
      return { ...prev, [day]: list.filter((item) => item.id !== activityId) };
    });
    toast.info("Atividade removida do roteiro.");
  }

  // Add Companion by phone or email
  function handleAddCompanion() {
    if (!companionSearch.trim()) return;
    const contact = companionSearch.trim();
    const isEmail = contact.includes("@");
    const newComp: InvitedCompanion = {
      id: `comp-${Date.now()}`,
      name: isEmail ? contact.split("@")[0] : `Convidado (${contact})`,
      contact,
    };
    setInvitedCompanions((prev) => [...prev, newComp]);
    setCompanionSearch("");
    toast.success(`Convite de viagem compartilhada enviado para "${contact}"! 👥✨`);
  }

  function handleRemoveCompanion(id: string) {
    setInvitedCompanions((prev) => prev.filter((c) => c.id !== id));
    toast.info("Convidado removido da viagem compartilhada.");
  }

  // Update days count & adjust schedule map
  function handleDaysChange(newCount: number) {
    const valid = Math.max(1, Math.min(15, newCount));
    setDaysCount(valid);
    setDailySchedule((prev) => {
      const updated = { ...prev };
      for (let i = 1; i <= valid; i++) {
        if (!updated[i]) updated[i] = [];
      }
      return updated;
    });
  }

  // Save complete trip plan
  async function handleSaveTrip() {
    let initialDiffDaysAtCreation = 5;
    if (startDate) {
      const [y, m, d] = startDate.split("-").map(Number);
      if (y && m && d) {
        const now = new Date();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startZero = new Date(y, m - 1, d).getTime();
        initialDiffDaysAtCreation = Math.round((startZero - todayZero) / (1000 * 60 * 60 * 24));
      }
    }

    const newPlan: TripPlan = {
      id: `trip-${Date.now()}`,
      destinationCity: selectedCityName,
      cityId,
      startDate,
      daysCount,
      hotelName,
      hotelAddress,
      invitedCompanions,
      hasSharedSeal: invitedCompanions.length > 0,
      dailySchedule,
      initialDiffDaysAtCreation,
      created_at: new Date().toISOString(),
    };

    const updated = [newPlan, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem("borapass:trip-plans", JSON.stringify(updated));

    toast.success(
      "Roteiro salvo com sucesso! Os alertas de viagem serão acionados automaticamente nas datas e horários corretos.",
    );
    setView("list");
    setActiveStep(1);
  }

  function handleDeleteTrip(tripId: string) {
    const updated = savedTrips.filter((t) => t.id !== tripId);
    setSavedTrips(updated);
    localStorage.setItem("borapass:trip-plans", JSON.stringify(updated));
    toast.info("Roteiro de viagem removido.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Planejar Viagem 🗺️"
        subtitle="Monte seu roteiro dia a dia com passeios, eventos e viagem compartilhada"
        right={
          <button
            onClick={() => setView(view === "wizard" ? "list" : "wizard")}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
          >
            {view === "wizard" ? `Minhas Viagens (${savedTrips.length})` : "+ Nova Viagem"}
          </button>
        }
      />

      <div className="px-5 pt-4 pb-12">
        {/* VIEW: MINHAS VIAGENS */}
        {view === "list" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Roteiros Salvos</h2>
              <button
                onClick={() => {
                  setView("wizard");
                  setActiveStep(1);
                }}
                className="flex items-center gap-1 text-xs font-bold text-primary"
              >
                <Plus className="h-4 w-4" /> Criar Novo Roteiro
              </button>
            </div>

            {savedTrips.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-3 text-base font-bold">Nenhuma viagem planejada ainda</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Crie seu roteiro diário com passeios, hospedagens e lembretes automáticos!
                </p>
                <button
                  onClick={() => {
                    setView("wizard");
                    setActiveStep(1);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand"
                >
                  <Plus className="h-4 w-4" /> Começar a Planejar
                </button>
              </div>
            ) : (
              savedTrips.map((trip) => {
                const totalActivities = Object.values(trip.dailySchedule).reduce(
                  (sum, list) => sum + list.length,
                  0,
                );
                return (
                  <div
                    key={trip.id}
                    className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft space-y-3"
                  >
                    <div className="bg-gradient-hero p-5 text-white">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur">
                          📍 {trip.destinationCity}
                        </span>
                        <div className="flex items-center gap-2">
                          {trip.hasSharedSeal && (
                            <span className="flex items-center gap-1 text-[11px] bg-amber-500/30 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-amber-200 font-extrabold backdrop-blur">
                              👥 Viagem Compartilhada
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="rounded-full p-1 text-white/80 hover:bg-white/20"
                            title="Excluir Roteiro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="mt-3 text-xl font-extrabold">
                        {trip.daysCount} Dias em {trip.destinationCity}
                      </h3>
                      <p className="mt-1 text-xs opacity-90">
                        Início em {trip.startDate} · {totalActivities} atrações agendadas
                      </p>
                      {trip.hotelName && (
                        <p className="mt-2 text-xs font-semibold text-amber-200">
                          🏨 Hospedagem: {trip.hotelName}
                        </p>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Programação por Dia
                      </p>
                      {Array.from({ length: trip.daysCount }, (_, i) => i + 1).map((dayNum) => {
                        const items = trip.dailySchedule[dayNum] || [];
                        return (
                          <div
                            key={dayNum}
                            className="rounded-2xl border border-border/70 bg-background p-3"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                              <span>Dia {dayNum}</span>
                              <span className="text-muted-foreground">{items.length} itens</span>
                            </div>
                            {items.length === 0 ? (
                              <p className="mt-1 text-[11px] text-muted-foreground italic">
                                Dia livre para explorar
                              </p>
                            ) : (
                              <ul className="mt-2 space-y-1.5">
                                {items.map((act) => (
                                  <li
                                    key={act.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="font-semibold text-foreground">
                                      {act.time ? `[${act.time}] ` : ""}
                                      {act.title}
                                    </span>
                                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                                      {act.category}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW: WIZARD NOVA VIAGEM */}
        {view === "wizard" && (
          <div className="space-y-6">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-soft border border-border overflow-x-auto scrollbar-hide">
              {[
                { step: 1, label: "Destino" },
                { step: 2, label: "Hospedagem" },
                { step: 3, label: "Experiências" },
                { step: 4, label: "Cupons & Compras" },
                { step: 5, label: "Convites" },
                { step: 6, label: "Resumo" },
              ].map(({ step, label }) => {
                const isActive = activeStep === step;
                const isPassed = activeStep > step;
                return (
                  <button
                    key={step}
                    onClick={() => setActiveStep(step as any)}
                    className="flex flex-col items-center gap-1 shrink-0 px-2"
                  >
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? "bg-gradient-brand text-white shadow-brand scale-110"
                          : isPassed
                            ? "bg-emerald-500 text-white"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isPassed ? "✓" : step}
                    </div>
                    <span
                      className={`text-[10px] font-medium whitespace-nowrap ${
                        isActive ? "text-primary font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: DESTINO E DATAS */}
            {activeStep === 1 && (
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    Passo 1: Destino & Período
                  </h2>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Cidade de Destino
                  </label>
                  <select
                    value={selectedCityName}
                    onChange={(e) => setSelectedCityName(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card p-3.5 text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    {(dbCities ?? []).map((c) => (
                      <option
                        key={c.id}
                        value={c.name}
                        className="bg-card text-foreground font-bold"
                      >
                        {c.name} {c.state ? `(${c.state})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Calendário Interativo Estilo Airbnb */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    📅 Seleção de Datas da Viagem
                  </label>
                  <AirbnbCalendar
                    startDate={startDate}
                    daysCount={daysCount}
                    onChange={(newStart, newDays) => {
                      setStartDate(newStart);
                      handleDaysChange(newDays);
                    }}
                  />
                </div>

                <button
                  onClick={() => setActiveStep(2)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-bold text-white shadow-brand transition active:scale-95"
                >
                  Avançar para Hospedagem <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 2: HOSPEDAGEM */}
            {activeStep === 2 && (
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    Passo 2: Escolha sua Hospedagem
                  </h2>
                </div>

                <p className="text-xs text-muted-foreground">
                  Hospedagens disponíveis em <strong>{selectedCityName}</strong>:
                </p>

                {/* List of Available Hotels */}
                <div className="space-y-2.5">
                  {(showMoreHotels ? availableHotels : availableHotels.slice(0, 3)).map((h) => {
                    const isSelected = hotelName === h.title;
                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          setHotelName(h.title);
                          setHotelAddress(h.address || selectedCityName);
                        }}
                        className={`flex items-center gap-3 cursor-pointer rounded-2xl border p-3 transition ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-soft"
                            : "border-border bg-card hover:bg-secondary/40"
                        }`}
                      >
                        <img
                          src={h.image_url || fallbackImage("hospedagem")}
                          alt={h.title}
                          className="h-14 w-16 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-foreground truncate">{h.title}</h3>
                          <p className="text-[11px] text-muted-foreground truncate">{h.address}</p>
                          {h.price && (
                            <span className="text-xs font-extrabold text-primary">
                              R$ {h.price} / diária
                            </span>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Botão Ver Mais Recomendações */}
                {availableHotels.length > 3 && (
                  <button
                    onClick={() => setShowMoreHotels(!showMoreHotels)}
                    className="w-full text-center py-2 text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    {showMoreHotels
                      ? "Ver menos recomendações"
                      : `Ver mais recomendações (${availableHotels.length - 3} disponíveis) ➔`}
                  </button>
                )}

                {/* Custom Hotel Input */}
                <div className="border-t border-border pt-4">
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Ou digite o nome do seu hotel / Airbnb
                  </label>
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="ex: Pousada Villa do Mar ou Airbnb Centro"
                    className="w-full rounded-2xl border border-border bg-background p-3.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="w-1/3 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand"
                  >
                    Avançar para Experiências <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EXPERIÊNCIAS (PASSEIOS & EVENTOS) */}
            {activeStep === 3 && (
              <div className="space-y-5">
                {/* Day Selection Bar */}
                <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {Array.from({ length: daysCount }, (_, i) => i + 1).map((dayNum) => {
                    const count = (dailySchedule[dayNum] || []).length;
                    const isActive = currentDay === dayNum;
                    return (
                      <button
                        key={dayNum}
                        onClick={() => setCurrentDay(dayNum)}
                        className={`min-w-[90px] snap-start rounded-2xl p-3 text-center transition-all ${
                          isActive
                            ? "bg-gradient-brand text-white shadow-brand scale-105"
                            : "bg-card border border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        <p className="text-xs font-extrabold">Dia {dayNum}</p>
                        <p
                          className={`text-[10px] ${isActive ? "text-white/80" : "text-muted-foreground"}`}
                        >
                          {count} {count === 1 ? "item" : "itens"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Schedule for Active Day */}
                <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Programação do Dia {currentDay}
                      </h3>
                      <p className="text-xs text-muted-foreground">Em {selectedCityName}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary font-bold">
                      {(dailySchedule[currentDay] || []).length} selecionados
                    </Badge>
                  </div>

                  {/* Scheduled Items List */}
                  <div className="mt-4 space-y-2">
                    {(dailySchedule[currentDay] || []).length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground italic">
                        Nenhuma atração adicionada ao Dia {currentDay}. Adicione passeios ou eventos
                        nas recomendações abaixo!
                      </p>
                    ) : (
                      dailySchedule[currentDay].map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between rounded-2xl border border-border/80 bg-background p-3 shadow-soft"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                              {act.category === "evento"
                                ? "🎉"
                                : act.category === "cupom"
                                  ? "🎟️"
                                  : act.category === "compras"
                                    ? "🛍️"
                                    : "🧭"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{act.title}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">
                                {act.category} {act.time ? `• ${act.time}` : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveActivity(currentDay, act.id)}
                            className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Custom Activity Form */}
                  <form
                    onSubmit={handleAddCustomActivity}
                    className="mt-4 flex gap-2 pt-2 border-t border-border/60"
                  >
                    <input
                      type="text"
                      value={customActivityTitle}
                      onChange={(e) => setCustomActivityTitle(e.target.value)}
                      placeholder="Adicionar nota / atração personalizada..."
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="time"
                      value={customActivityTime}
                      onChange={(e) => setCustomActivityTime(e.target.value)}
                      className="rounded-xl border border-border bg-background px-2 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={!customActivityTitle.trim()}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Recomendações de Passeios & Eventos */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Passeios & Eventos Recomendados
                  </h3>

                  <div className="space-y-2.5">
                    {/* Passeios */}
                    {availableTours.slice(0, 3).map((tour) => (
                      <div
                        key={tour.id}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-soft"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={tour.image_url || fallbackImage("passeio")}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded">
                              🧭 Passeio
                            </span>
                            <h4 className="line-clamp-1 text-xs font-bold text-foreground mt-0.5">
                              {tour.title}
                            </h4>
                            <p className="line-clamp-1 text-[10px] text-muted-foreground">
                              {tour.address || selectedCityName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleAddActivity({
                              id: tour.id,
                              title: tour.title,
                              category: "passeio",
                              price: tour.price ?? undefined,
                            })
                          }
                          className="shrink-0 rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}

                    {/* Eventos */}
                    {availableEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3 shadow-soft"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={evt.image_url || fallbackImage("evento")}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              🎉 Evento
                            </span>
                            <h4 className="line-clamp-1 text-xs font-bold text-foreground mt-0.5">
                              {evt.title}
                            </h4>
                            <p className="line-clamp-1 text-[10px] text-muted-foreground">
                              {evt.address || selectedCityName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleAddActivity({
                              id: evt.id,
                              title: evt.title,
                              category: "evento",
                              price: evt.price ?? undefined,
                            })
                          }
                          className="shrink-0 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="w-1/3 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setActiveStep(4)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand"
                  >
                    Avançar para Cupons <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CUPONS & COMPRAS */}
            {activeStep === 4 && (
              <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-accent" />
                  <h2 className="text-base font-bold text-foreground">
                    Passo 4: Cupons, Compras & Descontos Exclusivos
                  </h2>
                </div>

                <p className="text-xs text-muted-foreground">
                  Selecione cupons de benefícios ou locais de compras para aproveitar durante sua
                  estadia em <strong>{selectedCityName}</strong>:
                </p>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Ticket className="h-4 w-4 text-emerald-500" /> Cupons Recomendados
                  </h3>
                  <div className="space-y-2.5">
                    {availableCoupons.slice(0, 3).map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 shadow-soft"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={cp.image_url || fallbackImage("cupom")}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              🎟️ {cp.discount || "CUPOM DESCONTO"}
                            </span>
                            <h4 className="line-clamp-1 text-xs font-bold text-foreground mt-0.5">
                              {cp.title}
                            </h4>
                            <p className="line-clamp-1 text-[10px] text-muted-foreground">
                              {cp.address || selectedCityName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleAddActivity({
                              id: cp.id,
                              title: cp.title,
                              category: "cupom",
                              discount: cp.discount ?? undefined,
                            })
                          }
                          className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
                        >
                          + Usar Cupom
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-amber-500" /> Compras & Empórios
                  </h3>
                  <div className="space-y-2.5">
                    {availableShopping.map((shop) => (
                      <div
                        key={shop.id}
                        className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 shadow-soft"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={shop.image_url || fallbackImage("compras")}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              🛍️ Compras
                            </span>
                            <h4 className="line-clamp-1 text-xs font-bold text-foreground mt-0.5">
                              {shop.title}
                            </h4>
                            <p className="line-clamp-1 text-[10px] text-muted-foreground">
                              {shop.address}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleAddActivity({
                              id: shop.id,
                              title: shop.title,
                              category: "compras",
                              discount: shop.discount ?? undefined,
                            })
                          }
                          className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="w-1/3 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setActiveStep(5)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand"
                  >
                    Avançar para Convites <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: CONVIDE PESSOAS (VIAGEM COMPARTILHADA) */}
            {activeStep === 5 && (
              <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    Passo 5: Convide Pessoas (Viagem Compartilhada)
                  </h2>
                </div>

                <p className="text-xs text-muted-foreground">
                  Busque usuários pelo número de telefone ou e-mail para compartilhar este roteiro
                  em tempo real com todos os participantes!
                </p>

                {/* Selo de Viagem Compartilhada Badge */}
                <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 p-5 shadow-elevated space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-gradient-brand text-white font-black px-3.5 py-1 text-xs shadow-brand flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-amber-300" /> 👥✨ Selo de Viagem Compartilhada
                    </Badge>
                    <span className="text-[10px] font-extrabold uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Sincronização Ativa
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    Com o <strong>Selo de Viagem Compartilhada</strong>, todos os participantes
                    convidados receberão este roteiro, alertas de horários e os cupons salvos
                    diretamente no app!
                  </p>
                </div>

                {/* Search & Invite Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-muted-foreground">
                    Buscar Usuário por Telefone ou E-mail
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={companionSearch}
                        onChange={(e) => setCompanionSearch(e.target.value)}
                        placeholder="Digite o WhatsApp (ex: 54999887766) ou e-mail..."
                        className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={handleAddCompanion}
                      disabled={!companionSearch.trim()}
                      className="rounded-2xl bg-gradient-brand px-4 py-3 text-xs font-bold text-white shadow-brand disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      <UserPlus className="h-4 w-4" /> Convidar
                    </button>
                  </div>
                </div>

                {/* List of Invited Companions */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Participantes Confirmados ({invitedCompanions.length})
                  </h3>
                  {invitedCompanions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Nenhum participante adicionado ainda. Convide amigos ou familiares pelo
                      telefone ou e-mail acima!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invitedCompanions.map((comp) => (
                        <div
                          key={comp.id}
                          className="flex items-center justify-between rounded-2xl border border-border bg-background p-3 shadow-soft"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white font-extrabold text-xs">
                              {comp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{comp.name}</p>
                              <p className="text-[10px] text-muted-foreground">{comp.contact}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCompanion(comp.id)}
                            className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="w-1/3 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setActiveStep(6)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand"
                  >
                    Ver Resumo Final <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: RESUMO FINAL DO ROTEIRO */}
            {activeStep === 6 && (
              <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-base font-bold text-foreground">
                    Passo 6: Resumo do Roteiro Completo
                  </h2>
                </div>

                {/* Banner de Resumo da Viagem */}
                <div className="rounded-3xl bg-gradient-hero p-5 text-white shadow-brand space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                      Roteiro Bora Pass
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur">
                      {daysCount} Dias
                    </span>
                  </div>
                  <h3 className="text-2xl font-black">{selectedCityName}</h3>
                  <p className="text-xs opacity-90">Início: {startDate}</p>
                  {hotelName && (
                    <p className="text-xs font-semibold text-amber-200">
                      🏨 Hospedagem: {hotelName}
                    </p>
                  )}
                  {invitedCompanions.length > 0 && (
                    <div className="pt-2 border-t border-white/20 flex items-center gap-2 text-xs">
                      <Badge className="bg-amber-400 text-slate-950 font-black">
                        👥✨ Selo de Viagem Compartilhada
                      </Badge>
                      <span>({invitedCompanions.length} participantes)</span>
                    </div>
                  )}
                </div>

                {/* Atividades por Dia */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Programação Completa por Dia
                  </h4>
                  {Array.from({ length: daysCount }, (_, i) => i + 1).map((dayNum) => {
                    const items = dailySchedule[dayNum] || [];
                    return (
                      <div
                        key={dayNum}
                        className="rounded-2xl border border-border bg-background p-3.5 space-y-1.5"
                      >
                        <p className="text-xs font-extrabold text-foreground">Dia {dayNum}</p>
                        {items.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground italic">Livre</p>
                        ) : (
                          <ul className="space-y-1">
                            {items.map((act) => (
                              <li
                                key={act.id}
                                className="text-xs font-medium text-foreground flex items-center justify-between"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  {act.time ? `[${act.time}] ` : ""}
                                  {act.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded">
                                  {act.category}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Participantes da Viagem */}
                {invitedCompanions.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      👥 Participantes da Viagem Compartilhada
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {invitedCompanions.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-foreground border border-border flex items-center gap-1"
                        >
                          👤 {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Bell className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    Ao salvar, o Bora Pass enviará <strong>alertas diários automáticos</strong>{" "}
                    lembrando dos passeios e cupons de cada dia!
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveStep(5)}
                    className="w-1/3 rounded-2xl border border-border py-3.5 text-xs font-bold text-foreground"
                  >
                    Ajustar
                  </button>
                  <button
                    onClick={handleSaveTrip}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-bold text-white shadow-brand transition active:scale-95"
                  >
                    Salvar & Ativar Avisos Diários ✨
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <UpgradePremiumModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureContext={upgradeContext}
        />
      </div>
    </AppShell>
  );
}
