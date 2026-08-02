import { Bell, Check, X, Settings, MapPin, Sparkles, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useNotifications,
  markAllRead,
  requestPushPermission,
  useLivePushNotifications,
  useAutoGenerateAlerts,
} from "@/lib/notifications";
import { useSelectedCity } from "@/hooks/use-city";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCities } from "@/lib/cities";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type NotificationPref = {
  preferredCities: string[]; // max 3 city names
  notifyEvents: boolean;
  notifyAds: boolean;
  frequencyIndex: number; // 0 = 1d, 1 = 3d, 2 = 7d, 3 = 15d
};

const FREQUENCY_STEPS = [
  { days: 1, label: "Diariamente" },
  { days: 3, label: "A cada 3 dias" },
  { days: 7, label: "A cada 7 dias" },
  { days: 15, label: "A cada 15 dias" },
];

export function NotificationsBell({
  isOpen,
  onClose,
  initialTab = "list",
  hideTrigger = false,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: "list" | "settings";
  hideTrigger?: boolean;
} = {}) {
  const { user } = useAuth();
  const [city] = useSelectedCity();
  const [internalOpen, setInternalOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "settings">(initialTab);

  const open = isOpen !== undefined ? isOpen : internalOpen;

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const { data: dbCities } = useCities(true);
  const qc = useQueryClient();
  useAutoGenerateAlerts(user?.id, city?.id ?? null);
  const { data } = useNotifications(user?.id, city?.id ?? null);
  useLivePushNotifications(data);
  const unread = (data ?? []).filter((n) => !n.read_at).length;

  function setOpenState(val: boolean) {
    if (onClose && !val) {
      onClose();
    }
    setInternalOpen(val);
  }

  // Preferences state
  const [prefs, setPrefs] = useState<NotificationPref>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:notif-prefs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* fallback */
        }
      }
    }
    return {
      preferredCities: ["Rio de Janeiro"],
      notifyEvents: true,
      notifyAds: true,
      frequencyIndex: 0,
    };
  });

  async function handleOpen() {
    setOpenState(true);
    setTab("list");
    await requestPushPermission();
    if (user && unread > 0) {
      await markAllRead(user.id);
      qc.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  }

  function handleSavePrefs() {
    localStorage.setItem("borapass:notif-prefs", JSON.stringify(prefs));
    toast.success("Preferências de notificação salvas!");
    setTab("list");
  }

  function toggleCity(cityName: string) {
    setPrefs((prev) => {
      const exists = prev.preferredCities.includes(cityName);
      if (exists) {
        return { ...prev, preferredCities: prev.preferredCities.filter((c) => c !== cityName) };
      }
      if (prev.preferredCities.length >= 3) {
        toast.warning("Você pode cadastrar no máximo 3 cidades preferidas.");
        return prev;
      }
      return { ...prev, preferredCities: [...prev.preferredCities, cityName] };
    });
  }

  return (
    <>
      {!hideTrigger && (
        <button
          aria-label="Notificações"
          onClick={handleOpen}
          className="relative rounded-full bg-white/15 p-2.5 backdrop-blur transition hover:bg-white/25"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16"
          onClick={() => setOpenState(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-[92%] max-w-md overflow-y-auto rounded-3xl bg-background p-5 shadow-elevated"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {tab === "list" ? "Notificações" : "Configurar Alertas"}
                </h2>
                {tab === "settings" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Preferências
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTab(tab === "list" ? "settings" : "list")}
                  className={`rounded-full p-2 transition ${tab === "settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                  title={tab === "list" ? "Configurações" : "Ver Notificações"}
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpenState(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* List Tab */}
            {tab === "list" ? (
              <div>
                {!user ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Entre para receber alertas de cupons e eventos.
                  </p>
                ) : (data ?? []).length === 0 ? (
                  <div className="mt-6 text-center py-4">
                    <Bell className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-foreground">Nada por aqui ainda</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Assim que houver novos eventos ou anúncios nas suas cidades preferidas, você
                      receberá aqui.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {(data ?? []).map((n) => (
                      <li key={n.id} className="rounded-2xl border border-border p-3 shadow-soft">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                            {n.type.startsWith("listing_") ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground">{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {user && (
                  <div className="mt-4 border-t border-border/60 pt-3 text-center">
                    <button
                      onClick={() => setTab("settings")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Settings className="h-3.5 w-3.5" /> Personalizar cidades e frequência
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Settings Tab */
              <div className="mt-4 space-y-5">
                {/* 1. Preferred Cities (Max 3) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> Cidades Preferidas (Máx 3)
                    </label>
                    <span className="text-[11px] font-bold text-primary">
                      {prefs.preferredCities.length}/3 selecionadas
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Você receberá alertas exclusivos das cidades marcadas abaixo.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(dbCities ?? []).map((c) => {
                      const selected = prefs.preferredCities.includes(c.name);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCity(c.name)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                            selected
                              ? "bg-gradient-brand text-white shadow-brand"
                              : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Notification Types (Events & Ads) */}
                <div className="rounded-2xl border border-border bg-card p-3 space-y-3 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Novos Eventos</p>
                        <p className="text-[10px] text-muted-foreground">
                          Notificar quando novos eventos forem criados
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={prefs.notifyEvents}
                      onCheckedChange={(val) => setPrefs({ ...prefs, notifyEvents: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Novos Anúncios & Cupons</p>
                        <p className="text-[10px] text-muted-foreground">
                          Notificar sobre novas ofertas e anúncios
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={prefs.notifyAds}
                      onCheckedChange={(val) => setPrefs({ ...prefs, notifyAds: val })}
                    />
                  </div>
                </div>

                {/* 3. Frequency Slider */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wide text-foreground">
                      Frequência de Notificações
                    </label>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary">
                      {FREQUENCY_STEPS[prefs.frequencyIndex].label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Com que frequência deseja receber seus resumos de notificações?
                  </p>
                  <div className="mt-3 px-1">
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={prefs.frequencyIndex}
                      onChange={(e) =>
                        setPrefs({ ...prefs, frequencyIndex: parseInt(e.target.value) })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                    />
                    <div className="mt-2 flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>Diariamente</span>
                      <span>3 dias</span>
                      <span>7 dias</span>
                      <span>15 dias</span>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSavePrefs}
                  className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition hover:opacity-95"
                >
                  Salvar Preferências
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
