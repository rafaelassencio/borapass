import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  Hotel,
  UtensilsCrossed,
  Compass,
  Calendar,
  Map,
  CreditCard,
  TrendingUp,
  Star,
  Headphones,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  CheckSquare,
  Trash2,
  X as XIcon,
  Sun,
  Moon,
  Crown,
} from "lucide-react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { hasModulePermission, type ModuleKey } from "@/lib/rbac";
import { toast } from "sonner";

export type AdminTab =
  | "dashboard"
  | "subscribers"
  | "approvals"
  | "active_listings"
  | "users"
  | "partners"
  | "cities"
  | "coupons"
  | "hotels"
  | "restaurants"
  | "tours"
  | "events"
  | "itineraries"
  | "payments"
  | "reports"
  | "reviews"
  | "trash"
  | "support"
  | "settings"
  | "rbac";

export function AdminLayout({
  activeTab,
  onTabChange,
  children,
  title = "Painel Administrativo",
  subtitle = "Gestão global do Bora Pass",
}: {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  const { simulatedRole, realRoles, setRoleSimulation, isAdmin } = useRoles(user?.id, user?.email);
  const isRealAdmin = realRoles.includes("admin");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showTestModal, setShowTestModal] = useState(false);
  const [adminTheme, setAdminTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:admin-theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  const isLight = adminTheme === "light";

  const toggleTheme = () => {
    const nextTheme = adminTheme === "dark" ? "light" : "dark";
    setAdminTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:admin-theme", nextTheme);
    }
    toast.success(
      nextTheme === "light"
        ? "☀️ Modo Claro ativado no Console!"
        : "🌙 Modo Escuro ativado no Console!",
    );
  };

  const menuItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      id: "subscribers",
      label: "Assinantes",
      icon: <Crown className="h-4 w-4 text-amber-400" />,
      badge: "Planos",
    },
    {
      id: "approvals",
      label: "Aprovação de Ofertas",
      icon: <CheckSquare className="h-4 w-4 text-emerald-400" />,
      badge: "Revisão",
    },
    {
      id: "active_listings",
      label: "Anúncios Ativos",
      icon: <Sparkles className="h-4 w-4 text-sky-400" />,
      badge: "Categorias",
    },
    {
      id: "users",
      label: "Gestão da Equipe & Parceiros",
      icon: <Users className="h-4 w-4 text-purple-400" />,
      badge: "Staff",
    },
    { id: "partners", label: "Parceiros", icon: <Building2 className="h-4 w-4" /> },
    {
      id: "cities",
      label: "Destinos",
      icon: <Map className="h-4 w-4 text-amber-400" />,
      badge: "Novo",
    },
    { id: "payments", label: "Pagamentos", icon: <CreditCard className="h-4 w-4" /> },
    { id: "reports", label: "Relatórios", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "reviews", label: "Avaliações", icon: <Star className="h-4 w-4" /> },
    {
      id: "trash",
      label: "Lixeira",
      icon: <Trash2 className="h-4 w-4 text-rose-400" />,
      badge: "Lixeira",
    },
    { id: "support", label: "Suporte", icon: <Headphones className="h-4 w-4" />, badge: "Zendesk" },
    { id: "settings", label: "Configurações", icon: <Settings className="h-4 w-4" /> },
    {
      id: "rbac",
      label: "Perfis e Permissões",
      icon: <ShieldCheck className="h-4 w-4 text-purple-400" />,
      badge: "RBAC",
    },
  ];

  const TAB_TO_MODULE: Record<AdminTab, ModuleKey> = {
    dashboard: "dashboard",
    subscribers: "users",
    approvals: "listings",
    active_listings: "listings",
    users: "users",
    partners: "partners",
    cities: "categories",
    coupons: "coupons",
    hotels: "hotels",
    restaurants: "restaurants",
    tours: "tours",
    events: "events",
    itineraries: "itineraries",
    payments: "payments",
    reports: "reports",
    reviews: "reviews",
    trash: "listings",
    support: "support",
    settings: "settings",
    rbac: "settings",
  };

  const hasCurrentTabAccess = hasModulePermission(
    realRoles,
    simulatedRole,
    TAB_TO_MODULE[activeTab] || "dashboard",
    "view",
    user?.id,
  );

  const currentLabel = menuItems.find((m) => m.id === activeTab)?.label ?? title;

  return (
    <div
      className={`min-h-screen flex font-sans antialiased transition-colors duration-300 ${
        isLight ? "admin-light-mode bg-slate-100 text-slate-900" : "bg-slate-900 text-slate-100"
      }`}
    >
      {/* 1. SIDEBAR FIXA À ESQUERDA (DESKTOP) */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between h-screen sticky top-0 z-40">
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-brand transition group-hover:scale-105">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
                  Bora Pass{" "}
                  <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono uppercase">
                    PRO
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-semibold leading-none">
                  Console de Gestão
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Navegação Principal
            </div>

            {menuItems
              .filter((item) =>
                hasModulePermission(
                  realRoles,
                  simulatedRole,
                  TAB_TO_MODULE[item.id] || "dashboard",
                  "view",
                  user?.id,
                ),
              )
              .map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "support") {
                        navigate({ to: "/suporte-painel" });
                      } else {
                        onTabChange(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? "bg-sky-600 text-white shadow-brand font-bold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded-full border border-slate-700 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition border border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao App Móvel</span>
          </Link>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("borapass:local-session");
                window.dispatchEvent(new Event("borapass:auth-changed"));
              }
              try {
                supabase.auth.signOut();
              } catch {
                /* fallback */
              }
              toast.info("Você saiu do console de administração.");
              navigate({ to: "/login" });
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL COM HEADER FIXO (DESKTOP) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Superior Fixo */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Administração</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-bold text-white">{currentLabel}</span>
          </div>

          {/* Header Controls: Live Search + Theme Switcher + Profile + Role Simulation */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-56 hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Pesquisa global..."
                className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Botão de Alternar Modo Claro / Modo Escuro */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold transition-all border shadow-sm active:scale-95 ${
                isLight
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/40 hover:bg-amber-500/20"
                  : "bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700"
              }`}
              title="Alternar entre Modo Claro e Modo Escuro no Console"
            >
              {isLight ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="hidden md:inline font-extrabold text-amber-700">
                    Modo Claro ☀️
                  </span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-amber-300 fill-amber-300" />
                  <span className="hidden md:inline font-extrabold text-amber-300">
                    Modo Escuro 🌙
                  </span>
                </>
              )}
            </button>

            {/* Botão de Testar Experiência do Usuário */}
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black px-3.5 py-2 text-xs shadow-md hover:brightness-110 transition active:scale-95 animate-pulse"
            >
              <span>🧪 Testar Experiência</span>
            </button>

            {/* Simulated Role Badge Switcher */}
            {isRealAdmin && simulatedRole && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-xs">
                <span className="text-amber-400 font-bold">Simulado: {simulatedRole}</span>
                <button
                  onClick={() => {
                    setRoleSimulation(null);
                    toast.success("Restaurado ao perfil de Administrador!");
                  }}
                  className="text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-0.5 rounded font-black uppercase transition"
                >
                  Restaurar Admin
                </button>
              </div>
            )}

            {/* Admin Avatar Profile — dados do perfil do app móvel */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 rounded-xl shadow-md border-2 border-sky-600/40">
                  <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={profile?.full_name || user?.email || "Admin"}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl bg-sky-600 text-white font-bold text-sm">
                    {(profile?.full_name || user?.email || "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-[160px]">
                  {profile?.full_name || user?.email?.split("@")[0] || "Administrador"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {isAdmin ? "👑 Super Admin" : "🛡️ Gestor"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Banner de título da página */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Conteúdo Principal (Max width 1440px) */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {hasCurrentTabAccess ? (
            children
          ) : (
            <div className="rounded-3xl border border-rose-500/30 bg-slate-950 p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xl">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white">
                  Acesso Negado — Permissão Insuficiente
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seu perfil ou permissões atuais não possuem autorização para visualizar o módulo{" "}
                  <strong className="text-rose-400">{currentLabel}</strong>.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => onTabChange("dashboard")}
                  className="rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-brand transition"
                >
                  Voltar ao Dashboard 📊
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE AMBIENTE DE TESTES / SIMULADOR DE EXPERIÊNCIA DO USUÁRIO */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    🧪 Ambiente de Testes & Simulação de Usuário
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vivencie o aplicativo como viajante comum, assinante VIP, parceiro ou suporte.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Viajante */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 hover:border-sky-500/50 transition group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🧳</span>
                      <span className="text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase">
                        Público Geral
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white mt-2">Viajante</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Preços cheios nas atrações, cupons regulares e anúncios promocionais da
                      assinatura Bora Pass.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRoleSimulation("user");
                      setShowTestModal(false);
                      toast.info("🎭 Perfil de Viajante ativado!");
                      navigate({ to: "/" });
                    }}
                    className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 text-xs transition shadow-sm"
                  >
                    Simular & Ir para a Home 🚀
                  </button>
                </div>

                {/* 2. Viajante Premium */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 hover:border-amber-500/60 transition group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">💎</span>
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase">
                        Assinante VIP
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-amber-300 mt-2">Viajante Premium</h4>
                    <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                      Preços descontados ativados em todas as ofertas, confirmação VIP e sem avisos
                      de assinatura.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRoleSimulation("premium");
                      setShowTestModal(false);
                      toast.success("💎 Perfil de Viajante Premium ativado!");
                      navigate({ to: "/" });
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-extrabold py-2 text-xs transition shadow-md"
                  >
                    Simular & Ir para a Home 💎
                  </button>
                </div>

                {/* 3. Parceiro Comercial */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 hover:border-purple-500/50 transition group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏢</span>
                      <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase">
                        Lojista Credenciado
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white mt-2">Parceiro Comercial</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Gestão do próprio estabelecimento, criação de ofertas, cupons e histórico de
                      reservas de clientes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRoleSimulation("partner");
                      setShowTestModal(false);
                      toast.info("🏢 Perfil de Parceiro Comercial ativado!");
                      navigate({ to: "/parceiro" });
                    }}
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 text-xs transition shadow-sm"
                  >
                    Simular & Painel Parceiro 🏢
                  </button>
                </div>

                {/* 4. Atendente de Suporte */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 hover:border-emerald-500/50 transition group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎧</span>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                        Zendesk & Chat
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white mt-2">Atendente de Suporte</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Atendimento a chamados em tempo real, validação presencial de QR Codes e ajuda
                      a viajantes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRoleSimulation("support");
                      setShowTestModal(false);
                      toast.info("🎧 Perfil de Suporte ao Cliente ativado!");
                      navigate({ to: "/suporte-painel" });
                    }}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 text-xs transition shadow-sm"
                  >
                    Simular & Painel Suporte 🎧
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                O modo simulado altera instantaneamente as telas em tempo real.
              </span>
              <button
                onClick={() => {
                  setRoleSimulation(null);
                  setShowTestModal(false);
                  toast.success("👑 Modo Super Admin restaurado!");
                }}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 text-xs transition"
              >
                Restaurar Super Admin 👑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
