import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Bell,
  Globe,
  Heart,
  LogOut,
  Settings,
  Ticket,
  Plane,
  ChevronRight,
  Moon,
  LogIn,
  Shield,
  Store,
  MapPin,
  Plus,
  X,
  Calendar,
  User as UserIcon,
  HelpCircle,
  Headphones,
  Lock,
  Mail,
  Key,
  Eye,
  CheckCircle2,
  Sparkles,
  Wallet,
  CreditCard,
  TrendingUp,
  DollarSign,
  Receipt,
  Search,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useFavorites } from "@/lib/favorites";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCities } from "@/lib/cities";
import { NotificationsBell } from "@/components/NotificationsBell";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Bora Pass" }] }),
  component: Perfil,
});

type VisitedCity = {
  id: string;
  city: string;
  state?: string;
  date: string;
};

type TripPlanDetails = {
  id: string;
  destinationCity: string;
  startDate: string;
  daysCount: number;
  hotelName?: string;
  dailySchedule?: Record<
    number,
    { id: string; title: string; category: string; time?: string; price?: number }[]
  >;
  redeemedCoupons?: { id: string; title: string; discount: string; saved: number }[];
};

export function getTripStatus(
  startDateStr: string,
  daysCount: number = 1,
): {
  status: "Realizada" | "Visitando" | "Próximo Destino";
  badgeClass: string;
  emoji: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start: Date;
  if (!startDateStr) {
    start = new Date();
  } else if (startDateStr.includes("/")) {
    const [d, m, y] = startDateStr.split("/").map(Number);
    start = new Date(y, m - 1, d);
  } else if (startDateStr.includes("-")) {
    const [y, m, d] = startDateStr.split("-").map(Number);
    start = new Date(y, m - 1, d);
  } else {
    start = new Date();
  }
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, daysCount) - 1);
  end.setHours(23, 59, 59, 999);

  if (today > end) {
    return {
      status: "Realizada",
      badgeClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold",
      emoji: "✓",
    };
  } else if (today >= start && today <= end) {
    return {
      status: "Visitando",
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black animate-pulse",
      emoji: "✈️",
    };
  } else {
    return {
      status: "Próximo Destino",
      badgeClass:
        "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-extrabold",
      emoji: "📅",
    };
  }
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function Perfil() {
  const [dark, setDark] = useState(false);
  const [showTrips, setShowTrips] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripPlanDetails | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifsModal, setShowNotifsModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyPolicyText, setPrivacyPolicyText] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("borapass:privacy-policy") ||
        `POLÍTICA DE PRIVACIDADE E TERMOS DE USO DO BORA PASS\n\n1. INTRODUÇÃO\nBem-vindo ao Bora Pass! A sua privacidade e a segurança dos seus dados pessoais são fundamentais para nós.\n\n2. COLETA DE DADOS PESSOAIS\nColetamos apenas os dados essenciais para o seu cadastro e uso dos benefícios: Nome, E-mail, Telefone, CPF e localização.\n\n3. USO DOS CUPONS E BENEFÍCIOS\nOs cupons disponibilizados por nossos parceiros credenciados são válidos conforme os termos especificados em cada oferta.\n\n4. COMPARTILHAMENTO DE DADOS\nNão vendemos seus dados para terceiros. O compartilhamento ocorre estritamente para validação dos benefícios.\n\n5. DIREITOS DO USUÁRIO E SUPORTE\nVocê pode solicitar a alteração, exportação ou exclusão dos seus dados a qualquer momento.`
      );
    }
    return "";
  });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const profile = useProfile(user?.id);
  const { isAdmin, isSupport, isPartner, isPremium } = useRoles(user?.id);
  const { favorites } = useFavorites(user?.id);
  const { data: dbCities } = useCities(true);

  // Profile data form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [homeState, setHomeState] = useState("RJ");
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar state & ref
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("borapass:user-avatar") || "";
    }
    return "";
  });

  function handleAvatarFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newUrl = ev.target.result as string;
          setAvatarUrl(newUrl);
          if (typeof window !== "undefined") {
            localStorage.setItem("borapass:user-avatar", newUrl);
          }
          if (user) {
            supabase.auth.updateUser({
              data: { avatar_url: newUrl },
            });
            supabase.from("profiles").upsert({
              id: user.id,
              avatar_url: newUrl,
              updated_at: new Date().toISOString(),
            });
          }
          toast.success("Foto do perfil atualizada com sucesso!");
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Email and Password update state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingAuth, setUpdatingAuth] = useState(false);

  useEffect(() => {
    if (user || profile) {
      const full = profile?.full_name || user?.user_metadata?.full_name || "";
      const parts = full.trim().split(" ");
      setFirstName(user?.user_metadata?.first_name || parts[0] || "");
      setLastName(user?.user_metadata?.last_name || parts.slice(1).join(" ") || "");
      setCpf(user?.user_metadata?.cpf || (profile as any)?.cpf || "");
      setPhone(user?.user_metadata?.phone || (profile as any)?.phone || "");
      setBirthDate(user?.user_metadata?.birth_date || "1995-06-15");
      const rawCity = profile?.city || user?.user_metadata?.city || "Rio de Janeiro";
      setHomeCity(rawCity.split(" - ")[0].trim());
      setHomeState(user?.user_metadata?.state || "RJ");
    }
  }, [user, profile]);

  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:visited-cities");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* fallback */
        }
      }
    }
    return [
      { id: "1", city: "Rio de Janeiro", state: "RJ", date: "2026-01-15" },
      { id: "2", city: "Armação dos Búzios", state: "RJ", date: "2025-11-20" },
      { id: "3", city: "Angra dos Reis", state: "RJ", date: "2025-08-10" },
    ];
  });

  const [newCityName, setNewCityName] = useState("");
  const [newTripDate, setNewTripDate] = useState(new Date().toISOString().split("T")[0]);

  // Combine created trip plans from /planejar AND manually added visited cities
  const allTripsList = useMemo(() => {
    const list: TripPlanDetails[] = [];

    // 1. Read trip plans created in /planejar
    if (typeof window !== "undefined") {
      const savedPlansRaw = localStorage.getItem("borapass:trip-plans");
      if (savedPlansRaw) {
        try {
          const plans: TripPlanDetails[] = JSON.parse(savedPlansRaw);
          plans.forEach((p) => {
            list.push({
              ...p,
              destinationCity: p.destinationCity || "Armação dos Búzios",
              startDate: p.startDate || "2026-08-10",
              daysCount: p.daysCount || 3,
            });
          });
        } catch {
          /* fallback */
        }
      }
    }

    // 2. Merge manually added visited cities if not already in list
    visitedCities.forEach((vc) => {
      if (!list.some((item) => item.destinationCity.toLowerCase() === vc.city.toLowerCase())) {
        list.push({
          id: vc.id,
          destinationCity: vc.city,
          startDate: vc.date,
          daysCount: 2,
          dailySchedule: {
            1: [
              {
                id: "v1",
                title: `Passeio de Boas-vindas em ${vc.city}`,
                category: "passeio",
                time: "10:00",
                price: 120,
              },
            ],
            2: [
              {
                id: "v2",
                title: `Experiência Gastronômica em ${vc.city}`,
                category: "restaurante",
                time: "13:30",
                price: 90,
              },
            ],
          },
          redeemedCoupons: [
            { id: "c1", title: "Cupom 20% OFF Gastronomia", discount: "20% OFF", saved: 35 },
          ],
        });
      }
    });

    return list;
  }, [visitedCities]);

  const userCouponsCount = useMemo(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:redeemed-coupons");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed.length;
        } catch {
          /* fallback */
        }
      }
    }
    return 3;
  }, []);

  function handleAddTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!newCityName.trim()) return;

    // Create a new trip plan in localStorage
    const newPlan: TripPlanDetails = {
      id: `trip-${Date.now()}`,
      destinationCity: newCityName.trim(),
      startDate: newTripDate,
      daysCount: 3,
      dailySchedule: {
        1: [
          {
            id: `act-1`,
            title: `Passeio pela cidade de ${newCityName.trim()}`,
            category: "passeio",
            time: "10:00",
            price: 150,
          },
        ],
        2: [
          {
            id: `act-2`,
            title: `Jantar em Restaurante Parceiro`,
            category: "restaurante",
            time: "19:30",
            price: 100,
          },
        ],
      },
      redeemedCoupons: [
        {
          id: `cp-${Date.now()}`,
          title: "Cupom Boas-Vindas Bora Pass",
          discount: "30% OFF",
          saved: 45,
        },
      ],
    };

    if (typeof window !== "undefined") {
      const savedRaw = localStorage.getItem("borapass:trip-plans");
      const current: TripPlanDetails[] = savedRaw ? JSON.parse(savedRaw) : [];
      localStorage.setItem("borapass:trip-plans", JSON.stringify([newPlan, ...current]));
    }

    const item: VisitedCity = {
      id: Date.now().toString(),
      city: newCityName.trim(),
      date: newTripDate,
    };
    const updated = [item, ...visitedCities];
    setVisitedCities(updated);
    localStorage.setItem("borapass:visited-cities", JSON.stringify(updated));

    setNewCityName("");
    toast.success(`Viagem para ${item.city} registrada no seu perfil!`);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      return toast.error("Por favor, preencha o nome.");
    }
    setSavingProfile(true);

    const full_name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const cleanCity = homeCity.split(" - ")[0].trim();
    const cityWithState = homeState ? `${cleanCity} - ${homeState}` : cleanCity;

    try {
      if (user) {
        await supabase.auth.updateUser({
          data: {
            full_name,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            cpf,
            phone,
            birth_date: birthDate,
            city: cleanCity,
            state: homeState,
          },
        });

        await supabase.from("profiles").upsert({
          id: user.id,
          full_name,
          city: cityWithState,
          updated_at: new Date().toISOString(),
        });
      }

      setHomeCity(cleanCity);

      localStorage.setItem(
        "borapass:user-profile",
        JSON.stringify({
          full_name,
          firstName,
          lastName,
          cpf,
          phone,
          birthDate,
          homeCity: cleanCity,
          homeState,
        }),
      );

      toast.success("Dados pessoais atualizados com sucesso!");
      setShowEditProfile(false);
    } catch {
      toast.error("Erro ao salvar dados pessoais.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      return toast.error("Por favor, digite um e-mail válido.");
    }
    setUpdatingAuth(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success(`E-mail de confirmação enviado para ${newEmail.trim()}`);
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar e-mail.");
    } finally {
      setUpdatingAuth(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }
    setUpdatingAuth(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha.");
    } finally {
      setUpdatingAuth(false);
    }
  }

  async function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("borapass:local-session");
      window.dispatchEvent(new Event("borapass:auth-changed"));
    }
    try {
      await supabase.auth.signOut();
    } catch {
      /* fallback */
    }
    toast.success("Você saiu da sua conta");
    navigate({ to: "/login" });
  }

  const displayName =
    profile?.full_name ||
    `${firstName} ${lastName}`.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Visitante";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <PageHeader title="Perfil" />
      <div className="px-5 pt-4">
        <div className="rounded-3xl bg-gradient-hero p-6 text-white shadow-brand relative">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => avatarInputRef.current?.click()}
              title="Clique para enviar/alterar sua foto de perfil do computador"
            >
              <Avatar className="h-16 w-16 border-4 border-white/40 shadow-soft transition group-hover:scale-105">
                {(avatarUrl || profile?.avatar_url) && (
                  <AvatarImage src={avatarUrl || profile?.avatar_url || ""} alt="Foto do perfil" />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-white shadow-md border-2 border-white transition group-hover:scale-110">
                <Camera className="h-3.5 w-3.5" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold">{displayName}</h2>
                {isPremium ? (
                  <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-[10px] font-black text-black shadow-sm">
                    ⭐ Viajante Premium
                  </span>
                ) : isAdmin ? (
                  <span className="shrink-0 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black shadow-sm">
                    👑 Admin
                  </span>
                ) : isPartner ? (
                  <span className="shrink-0 rounded-full bg-blue-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                    🏢 Parceiro
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm backdrop-blur">
                    🧳 Viajante
                  </span>
                )}
              </div>
              <p className="truncate text-sm opacity-90 mt-0.5">
                {user?.email || (loading ? "Carregando..." : "Faça login para salvar suas viagens")}
              </p>
              {homeCity && (
                <p className="truncate text-xs opacity-75 mt-0.5">
                  📍 {homeCity.split(" - ")[0].trim()}
                  {homeState ? ` - ${homeState}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Economia em Viagens Widget */}
          {user && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/20 p-3.5 backdrop-blur border border-white/25 shadow-brand">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-brand font-bold text-lg">
                  💰
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/85">
                    Economia em Viagens
                  </p>
                  <p className="text-base font-extrabold text-white">Você economizou R$ 340,00</p>
                </div>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold text-amber-200">
                {userCouponsCount} {userCouponsCount === 1 ? "cupom salvo" : "cupons salvos"}
              </span>
            </div>
          )}

          {user && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat n={favorites.length} label="Favoritos" to="/favoritos" />
              <Stat n={userCouponsCount} label="Cupons" to="/cupons" />
              <Stat n={allTripsList.length} label="Viagens" onClick={() => setShowTrips(true)} />
            </div>
          )}
        </div>

        {/* Console Access Banner - Exclusivo para Admin e Suporte */}
        {(isAdmin || isSupport) && (
          <div className="mt-4 rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4 shadow-elevated text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white">Console Corporativo</h3>
                  <p className="text-[10px] text-slate-400">
                    {isAdmin
                      ? "Gestão Global & Administração"
                      : "Central de Atendimento ao Cliente"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Acesso Gestor
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/admin"
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 px-3 text-xs font-bold text-white shadow-brand transition active:scale-95"
              >
                <Shield className="h-4 w-4" />
                <span>Painel Admin</span>
              </Link>
              <Link
                to="/suporte-painel"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 px-3 text-xs font-bold text-sky-300 border border-slate-700 transition active:scale-95"
              >
                <Headphones className="h-4 w-4" />
                <span>Central Suporte</span>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {user && (
            <Row
              icon={<UserIcon className="h-4 w-4 text-primary" />}
              label="Meus dados pessoais"
              onClick={() => setShowEditProfile(true)}
            />
          )}
          <Row
            icon={<Heart className="h-4 w-4 text-accent" />}
            label="Meus favoritos"
            to="/favoritos"
          />
          <Row
            icon={<Ticket className="h-4 w-4 text-primary" />}
            label="Cupons utilizados"
            to="/cupons"
          />
          <Row
            icon={<Plane className="h-4 w-4 text-primary" />}
            label="Viagens"
            value={`${allTripsList.length} viagens`}
            onClick={() => setShowTrips(true)}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <Row
            icon={<Bell className="h-4 w-4" />}
            label="Notificações & Preferências"
            onClick={() => setShowNotifsModal(true)}
          />
          <Row icon={<Globe className="h-4 w-4" />} label="Idioma" value="Português (BR)" />
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4" />
              <span className="text-sm font-medium">Modo escuro</span>
            </div>
            <Switch
              checked={dark}
              onCheckedChange={(v) => {
                setDark(v);
                document.documentElement.classList.toggle("dark", v);
              }}
            />
          </div>
          <Row
            icon={<Wallet className="h-4 w-4 text-emerald-500" />}
            label="Financeiro"
            value={isAdmin || isSupport ? "Receita & Gestão" : "Pagamentos & Economia"}
            onClick={() => setShowFinancialModal(true)}
          />
        </div>

        <NotificationsBell
          isOpen={showNotifsModal}
          onClose={() => setShowNotifsModal(false)}
          initialTab="settings"
          hideTrigger={true}
        />

        {user && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <Row
              icon={<ShieldCheck className="h-4 w-4 text-sky-500" />}
              label="Termos de Privacidade & Uso"
              value="Ler Termos"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const saved = localStorage.getItem("borapass:privacy-policy");
                  if (saved) setPrivacyPolicyText(saved);
                }
                setShowPrivacyModal(true);
              }}
            />
            <Row
              icon={<HelpCircle className="h-4 w-4 text-emerald-500" />}
              label="Ajuda & Suporte ao Cliente"
              value="Abrir Chamado"
              to="/ajuda"
            />
            {(isPartner || isAdmin) && (
              <Row
                icon={<Store className="h-4 w-4 text-primary" />}
                label="Painel do parceiro"
                to="/parceiro"
              />
            )}
            {!isPartner && !isAdmin && !isSupport && (
              <Row icon={<Store className="h-4 w-4" />} label="Quero ser parceiro" to="/parceiro" />
            )}
          </div>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-destructive shadow-soft"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        ) : (
          <Link
            to="/login"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <LogIn className="h-4 w-4" /> Entrar / Criar conta
          </Link>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bora Pass v1.0 · Feito com ❤ para viajantes
        </p>

        {/* Modal Termos de Privacidade & Uso */}
        {showPrivacyModal && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setShowPrivacyModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-sky-500" />
                  <h2 className="text-base font-bold text-foreground">
                    Termos de Privacidade & Uso
                  </h2>
                </div>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-card/70 p-4 rounded-2xl border border-border text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans max-h-[50vh] overflow-y-auto">
                {privacyPolicyText}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-brand"
                >
                  Ciente e De Acordo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Dados Pessoais */}
        {showEditProfile && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setShowEditProfile(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Meus Dados & Segurança</h2>
                </div>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                {/* Seção Foto de Perfil */}
                <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3 shadow-soft">
                  <label className="block text-xs font-bold uppercase text-muted-foreground">
                    Foto do Perfil
                  </label>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-primary/30 shrink-0">
                      {(avatarUrl || profile?.avatar_url) && (
                        <AvatarImage
                          src={avatarUrl || profile?.avatar_url || ""}
                          alt="Foto do perfil"
                        />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="w-full rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-primary/20"
                      >
                        <Camera className="h-4 w-4" /> Enviar Foto do Computador 🖥️
                      </button>

                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("borapass:user-avatar", e.target.value);
                          }
                        }}
                        placeholder="Ou cole a URL da imagem..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Seu sobrenome"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      Telefone / Celular
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 90000-0000"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      Cidade onde mora
                    </label>
                    <input
                      type="text"
                      value={homeCity}
                      onChange={(e) => setHomeCity(e.target.value)}
                      placeholder="ex: Rio de Janeiro"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      UF
                    </label>
                    <select
                      value={homeState}
                      onChange={(e) => setHomeState(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-2 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    >
                      {[
                        "AC",
                        "AL",
                        "AP",
                        "AM",
                        "BA",
                        "CE",
                        "DF",
                        "ES",
                        "GO",
                        "MA",
                        "MT",
                        "MS",
                        "MG",
                        "PA",
                        "PB",
                        "PR",
                        "PE",
                        "PI",
                        "RJ",
                        "RN",
                        "RS",
                        "RO",
                        "RR",
                        "SC",
                        "SP",
                        "SE",
                        "TO",
                      ].map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition hover:opacity-95 disabled:opacity-50"
                >
                  {savingProfile ? "Salvando..." : "Salvar Dados Pessoais"}
                </button>
              </form>

              <div className="mt-6 border-t border-border pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Segurança da Conta
                  </h3>
                </div>

                <form
                  onSubmit={handleChangeEmail}
                  className="rounded-2xl border border-border bg-card p-3.5 space-y-2.5 shadow-soft"
                >
                  <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Alterar E-mail de Acesso
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    E-mail atual: {user?.email || "—"}
                  </p>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Novo e-mail"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={updatingAuth || !newEmail}
                    className="w-full rounded-xl bg-secondary py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    {updatingAuth ? "Enviando..." : "Atualizar E-mail"}
                  </button>
                </form>

                <form
                  onSubmit={handleChangePassword}
                  className="rounded-2xl border border-border bg-card p-3.5 space-y-2.5 shadow-soft"
                >
                  <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" /> Alterar Senha de Acesso
                  </label>
                  <div className="space-y-2">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha (mín. 6 caracteres)"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updatingAuth || !newPassword}
                    className="w-full rounded-xl bg-gradient-brand py-2 text-xs font-bold text-white shadow-brand disabled:opacity-50"
                  >
                    {updatingAuth ? "Atualizando..." : "Atualizar Senha"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Viagens Realizadas (Sincronizado com /planejar) */}
        {showTrips && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setShowTrips(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Minhas Viagens</h2>
                </div>
                <button
                  onClick={() => setShowTrips(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Add Trip Form */}
              <form
                onSubmit={handleAddTrip}
                className="mt-4 rounded-2xl border border-border bg-card p-3.5 shadow-soft space-y-3"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" /> Registrar Nova Viagem
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
                  >
                    <option value="">Selecione a cidade...</option>
                    {(dbCities ?? []).map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newTripDate}
                    onChange={(e) => setNewTripDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newCityName}
                  className="w-full flex items-center justify-center gap-1 rounded-xl bg-gradient-brand py-2.5 text-xs font-bold text-white shadow-brand disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Roteiro de Viagem
                </button>
              </form>

              {/* Visited Cities & Trip Plans List */}
              <div className="mt-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                  <span>Todas as Viagens ({allTripsList.length})</span>
                  <span className="text-[10px] text-primary lowercase font-semibold">
                    clique para ver detalhes e economia
                  </span>
                </p>
                {allTripsList.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Nenhuma viagem planejada ou registrada ainda.
                  </p>
                ) : (
                  allTripsList.map((item) => {
                    const totalActs = item.dailySchedule
                      ? Object.values(item.dailySchedule).reduce(
                          (sum, list) => sum + list.length,
                          0,
                        )
                      : 2;

                    const totalSaved =
                      (item.redeemedCoupons ?? []).reduce((sum, c) => sum + c.saved, 0) ||
                      Object.values(item.dailySchedule || {})
                        .flat()
                        .reduce((sum, act) => sum + Math.round((act.price || 90) * 0.2), 50);

                    const statusInfo = getTripStatus(item.startDate, item.daysCount);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTripDetails(item)}
                        className="cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/50 hover:shadow-elevated space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-white shadow-brand font-bold text-sm">
                              📍
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-foreground">
                                {item.destinationCity}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1 font-medium">
                                  <Calendar className="h-3 w-3" /> {item.startDate}
                                </span>
                                <span>· {item.daysCount} dias</span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.status} {statusInfo.emoji}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                          <span className="font-semibold text-muted-foreground">
                            🎒 {totalActs} atividades realizadas
                          </span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                            💰 R$ {totalSaved},00 economizados
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* DETALHES COMPLETOS DA VIAGEM E ECONOMIA MODAL */}
        {selectedTripDetails && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
            onClick={() => setSelectedTripDetails(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl border border-border"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      📍 {selectedTripDetails.destinationCity}
                    </span>
                    {(() => {
                      const st = getTripStatus(
                        selectedTripDetails.startDate,
                        selectedTripDetails.daysCount,
                      );
                      return (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] ${st.badgeClass}`}>
                          {st.status} {st.emoji}
                        </span>
                      );
                    })()}
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold text-foreground">
                    Resumo Completo da Viagem
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTripDetails(null)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* BANNER DE ECONOMIA OBTIDA NA VIAGEM */}
                {(() => {
                  const totalSaved =
                    (selectedTripDetails.redeemedCoupons ?? []).reduce(
                      (sum, c) => sum + c.saved,
                      0,
                    ) ||
                    Object.values(selectedTripDetails.dailySchedule || {})
                      .flat()
                      .reduce((sum, act) => sum + Math.round((act.price || 90) * 0.2), 50);

                  return (
                    <div className="rounded-2xl bg-gradient-hero p-4 text-white shadow-brand relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                            🎉 Economia Total nesta Viagem
                          </p>
                          <p className="mt-1 text-2xl font-black">
                            R$ {totalSaved},00 Economizados!
                          </p>
                          <p className="mt-0.5 text-xs text-white/90">
                            Você aproveitou descontos e cortesias exclusivas Bora Pass.
                          </p>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
                          💰
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* HOSPEDAGEM */}
                {selectedTripDetails.hotelName && (
                  <div className="rounded-2xl border border-border bg-card p-3.5 shadow-soft">
                    <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                      🏨 Hospedagem Escolhida
                    </p>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {selectedTripDetails.hotelName}
                    </p>
                  </div>
                )}

                {/* CUPONS E CORTESIAS RESGATADAS NA VIAGEM */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2.5">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                    <Ticket className="h-4 w-4 text-primary" /> Cupons & Benefícios Resgatados
                  </p>
                  {(selectedTripDetails.redeemedCoupons &&
                  selectedTripDetails.redeemedCoupons.length > 0
                    ? selectedTripDetails.redeemedCoupons
                    : [
                        {
                          id: "c1",
                          title: "Desconto Exclusivo Restaurante Parceiro",
                          discount: "20% OFF",
                          saved: 40,
                        },
                        {
                          id: "c2",
                          title: "Cortesia de Sobremesa / Expresso Especial",
                          discount: "Grátis 🎁",
                          saved: 25,
                        },
                      ]
                  ).map((cp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-secondary/50 p-2.5 text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-foreground">{cp.title}</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        -{cp.discount} (R$ {cp.saved} off)
                      </span>
                    </div>
                  ))}
                </div>

                {/* ROTEIRO E PASSEIOS REALIZADOS DIA A DIA */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> Atividades & Passeios do Roteiro
                  </p>
                  {Array.from({ length: selectedTripDetails.daysCount || 3 }, (_, i) => i + 1).map(
                    (dayNum) => {
                      const items = selectedTripDetails.dailySchedule?.[dayNum] || [];
                      return (
                        <div
                          key={dayNum}
                          className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-foreground border-b border-border/50 pb-1.5">
                            <span>Dia {dayNum}</span>
                            <span className="text-muted-foreground">{items.length} atrações</span>
                          </div>
                          {items.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">
                              Dia livre para explorar a cidade
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
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
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FINANCEIRO */}
        {showFinancialModal && (
          <FinancialModal
            isStaff={isAdmin || isSupport}
            isPremium={isPremium}
            user={user}
            onClose={() => setShowFinancialModal(false)}
          />
        )}
      </div>
    </AppShell>
  );
}

function FinancialModal({
  isStaff,
  isPremium,
  user,
  onClose,
}: {
  isStaff: boolean;
  isPremium: boolean;
  user: any;
  onClose: () => void;
}) {
  const [filterType, setFilterType] = useState<"all" | "sub" | "ticket">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Customer transactions for Admin & Support
  const staffTransactions = [
    {
      id: "tx-101",
      customer_name: "Rafael Assencio",
      customer_email: "rafael.assencio12@gmail.com",
      is_premium: true,
      type: "sub",
      title: "Plano Bora Pass Premium (Mensal)",
      amount: 29.9,
      app_commission: 29.9,
      method: "Pix",
      date: "2026-07-28 14:32",
      status: "Concluído",
    },
    {
      id: "tx-102",
      customer_name: "Juliana Costa",
      customer_email: "juliana.costa@gmail.com",
      is_premium: true,
      type: "ticket",
      title: "Ingresso Parapente Pedra Bonita",
      partner_name: "Asas do Rio Voo Livre",
      amount: 280.0,
      app_commission: 28.0,
      method: "Cartão de Crédito",
      date: "2026-07-25 11:15",
      status: "Concluído",
    },
    {
      id: "tx-103",
      customer_name: "Carlos Eduardo",
      customer_email: "carlos.ed@gmail.com",
      is_premium: false,
      type: "ticket",
      title: "Reserva Hospedagem Pousada Gramado",
      partner_name: "Pousada Doce Sonho",
      amount: 210.0,
      app_commission: 21.0,
      method: "Pix",
      date: "2026-07-22 09:45",
      status: "Concluído",
    },
    {
      id: "tx-104",
      customer_name: "Fernanda Lima",
      customer_email: "fernanda.lima@outlook.com",
      is_premium: true,
      type: "sub",
      title: "Plano Bora Pass Premium (Anual)",
      amount: 299.0,
      app_commission: 299.0,
      method: "Cartão de Crédito",
      date: "2026-07-20 18:20",
      status: "Concluído",
    },
    {
      id: "tx-105",
      customer_name: "Lucas Martins",
      customer_email: "lucas.m@gmail.com",
      is_premium: false,
      type: "ticket",
      title: "Combo Gastronômico Colonial",
      partner_name: "Café Colonial Gramado",
      amount: 150.0,
      app_commission: 15.0,
      method: "Pix",
      date: "2026-07-15 20:10",
      status: "Concluído",
    },
  ];

  // User payments & savings history
  const userTransactions = [
    {
      id: "utx-1",
      title: "Assinatura Bora Pass Premium",
      type: "sub",
      amount: 29.9,
      saved: 0,
      method: "Pix",
      date: "28/07/2026",
      status: "Ativo",
    },
    {
      id: "utx-2",
      title: "Ingresso Voo Parapente Pedra Bonita",
      type: "ticket",
      amount: 280.0,
      saved: 70.0,
      method: "Pix",
      date: "25/07/2026",
      status: "Concluído",
    },
    {
      id: "utx-3",
      title: "Reserva Pousada Gramado com Desconto",
      type: "ticket",
      amount: 210.0,
      saved: 50.0,
      method: "Cartão de Crédito",
      date: "20/07/2026",
      status: "Concluído",
    },
    {
      id: "utx-4",
      title: "Resgate Cupom 20% OFF Gastronomia",
      type: "coupon",
      amount: 0.0,
      saved: 40.0,
      method: "Cupom Grátis",
      date: "15/07/2026",
      status: "Concluído",
    },
  ];

  const filteredStaffTx = staffTransactions.filter((tx) => {
    const typeOk = filterType === "all" || tx.type === filterType;
    const queryOk =
      !searchQuery.trim() ||
      tx.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase());
    return typeOk && queryOk;
  });

  const totalAppRevenue = 14850.0;
  const totalSubscriptionsRevenue = 5980.0;
  const totalCommissionsRevenue = 8870.0;

  const totalUserSaved = userTransactions.reduce((acc, curr) => acc + curr.saved, 0) + 180;
  const totalUserInvested = userTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background p-6 shadow-elevated border border-border space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                {isStaff ? "Financeiro — Receita & Gestão do App" : "Painel Financeiro & Histórico"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isStaff
                  ? "Faturamento por assinaturas, comissões de parceiros e pagamentos por cliente"
                  : "Acompanhe seus pagamentos no aplicativo e a economia total realizada no Bora Pass"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTÉUDO PARA STAFF (ADMIN / SUPER ADMIN / SUPORTE) */}
        {isStaff ? (
          <div className="space-y-4">
            {/* Top Revenue Summary Cards */}
            {/* Top Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-gradient-hero p-4 text-white shadow-brand">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                  Receita Bruta Total
                </p>
                <p className="text-2xl font-black mt-1">
                  R$ {totalAppRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-white/80 mt-0.5">
                  📈 +18% em relação ao mês anterior
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Assinaturas Premium
                </p>
                <p className="text-xl font-extrabold text-foreground mt-1">
                  R${" "}
                  {totalSubscriptionsRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ⭐ 200 assinantes ativos (R$ 29,90/mês)
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Comissões & Reservas
                </p>
                <p className="text-xl font-extrabold text-foreground mt-1">
                  R$ {totalCommissionsRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  🎟️ Taxas de intermediação das lojas
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border text-xs">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${filterType === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType("sub")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${filterType === "sub" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
                >
                  ⭐ Assinaturas
                </button>
                <button
                  onClick={() => setFilterType("ticket")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${filterType === "ticket" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
                >
                  🎟️ Compras/Reservas
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Client Transactions Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wide text-foreground">
                Pagamentos Realizados por Clientes ({filteredStaffTx.length})
              </h3>

              {filteredStaffTx.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                  Nenhum registro de pagamento encontrado para os filtros selecionados.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStaffTx.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-2xl border border-border bg-card p-3.5 shadow-soft space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                            {tx.type === "sub" ? "⭐" : "🎟️"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-foreground">
                                {tx.customer_name}
                              </h4>
                              {tx.is_premium && (
                                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-black">
                                  PREMIUM
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{tx.customer_email}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-foreground">
                            R$ {tx.amount.toFixed(2)}
                          </span>
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Comissão App: R$ {tx.app_commission.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/50">
                        <span>{tx.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Forma: {tx.method}</span>
                          <span>·</span>
                          <span>{tx.date}</span>
                          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-bold text-emerald-600">
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CONTÉUDO PARA VIAJANTE E VIAJANTE PREMIUM */
          <div className="space-y-4">
            {/* Top Cards: Total Saved & Invested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-hero p-4 text-white shadow-brand">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                      🎉 Sua Economia Total Acumulada
                    </p>
                    <p className="text-2xl font-black mt-0.5">
                      R$ {totalUserSaved.toFixed(2)} Economizados!
                    </p>
                    <p className="text-[10px] text-white/90 mt-0.5">
                      Valores economizados em tarifas promocionais e cupons
                    </p>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
                    💰
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Status da Sua Conta
                  </span>
                  {isPremium ? (
                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-[10px] font-black text-black">
                      ⭐ Viajante Premium
                    </span>
                  ) : (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                      Plano Gratuito
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground">
                  {isPremium
                    ? "Assinatura Ativa (R$ 29,90/mês)"
                    : "Economia limitada a 1 cupom/dia"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isPremium
                    ? "Você tem acesso ilimitado a todos os cupons, descontos VIPs e cashback exclusivo!"
                    : "Seja Premium para desbloquear resgates de cupons ilimitados e descontos maiores."}
                </p>
              </div>
            </div>

            {/* List of Payments and Purchases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-primary" /> Histórico de Pagamentos & Compras
                </h3>
                <span className="text-[11px] font-bold text-muted-foreground">
                  Total investido: R$ {totalUserInvested.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                {userTransactions.map((utx) => (
                  <div
                    key={utx.id}
                    className="rounded-2xl border border-border bg-card p-3.5 shadow-soft space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                          {utx.type === "sub" ? "⭐" : utx.type === "coupon" ? "🎟️" : "💳"}
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground">{utx.title}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            {utx.date} · Forma: {utx.method}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-foreground">
                          {utx.amount > 0 ? `R$ ${utx.amount.toFixed(2)}` : "Gratuito"}
                        </span>
                        {utx.saved > 0 && (
                          <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Economizou: R$ {utx.saved.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  n,
  label,
  to,
  onClick,
}: {
  n: number;
  label: string;
  to?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur hover:bg-white/25 transition active:scale-95 cursor-pointer shadow-sm">
      <div className="text-xl font-extrabold">{n}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-90">{label}</div>
    </div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }
  return content;
}

function Row({
  icon,
  label,
  value,
  to,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-3.5 first:border-t-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {value}
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return (
    <button onClick={onClick} className="w-full text-left">
      {inner}
    </button>
  );
}
