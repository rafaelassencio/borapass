import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  Store,
  Tag,
  Calendar,
  Sparkles,
  Send,
  X,
  Upload,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Search,
  Filter,
  MessageSquare,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Bell,
  Clock,
  DollarSign,
  TrendingUp,
  Star,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Share2,
  ShieldCheck,
  ChevronRight,
  Lock,
  Moon,
  HelpCircle,
  LogOut,
  QrCode,
  LayoutGrid,
} from "lucide-react";
import {
  getStoredBookings,
  saveBooking,
  getStoredChatMessages,
  sendChatMessage,
  getStoredNotifications,
  markNotificationAsRead,
  getStoredPartnerDrafts,
  savePartnerDraft,
  type PartnerBooking,
  type ChatMessage,
  type PartnerNotification,
  type PartnerListingDraft,
} from "@/lib/partner-portal";
import { getStoredPartners, type PartnerStore } from "@/lib/partners";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parceiro")({
  head: () => ({ meta: [{ title: "Portal do Parceiro — Bora Pass" }] }),
  component: PartnerPortalPage,
});

type PartnerTab = "dashboard" | "reservas" | "anuncios" | "financeiro" | "perfil";

export function PartnerPortalPage() {
  const navigate = useNavigate();
  const { user, profile, isPurePartner, primaryRole, partnerStore: contextStore, loading, logout } = useAuthContext();

  // Redirecionamento se não for parceiro autorizado
  useEffect(() => {
    if (!loading && (!user || (primaryRole !== "Parceiro" && primaryRole !== "Administrador"))) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, primaryRole, navigate]);

  // Categoria do Estabelecimento Parceiro
  const partnerStore: PartnerStore = useMemo(() => {
    if (contextStore) return contextStore;
    const partners = getStoredPartners();
    return partners.find((p) => p.user_id === user?.id) || partners[0];
  }, [contextStore, user?.id]);

  const rawCat = (partnerStore?.category || "Gastronomia").toLowerCase();
  const isBookingBased =
    rawCat.includes("hospedag") || rawCat.includes("passeio") || rawCat.includes("evento");

  // Tab selecionada (default: dashboard ou reservas para hospedagem/passeio)
  const [activeTab, setActiveTab] = useState<PartnerTab>("dashboard");

  // States de Dados do Portal
  const [bookings, setBookings] = useState<PartnerBooking[]>(() => getStoredBookings());
  const [notifications, setNotifications] = useState<PartnerNotification[]>(() =>
    getStoredNotifications(),
  );
  const [draftListings, setDraftListings] = useState<PartnerListingDraft[]>(() =>
    getStoredPartnerDrafts(),
  );

  // Modais do Portal
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showNewListingModal, setShowNewListingModal] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<PartnerBooking | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<PartnerBooking | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // States de Filtro das Reservas
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<
    "todas" | "hoje" | "confirmada" | "pendente"
  >("todas");

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState("");

  // Efeito para carregar mensagens do Chat ativo
  useEffect(() => {
    if (activeChatBooking) {
      setChatMessages(getStoredChatMessages(activeChatBooking.id));
    }
  }, [activeChatBooking]);

  // Handler de envio de mensagem no Chat
  const handleSendMessage = () => {
    if (!activeChatBooking || !chatInputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      booking_id: activeChatBooking.id,
      sender_type: "partner",
      sender_name: partnerStore?.store_name || "Estabelecimento",
      text: chatInputText.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    const updated = sendChatMessage(activeChatBooking.id, newMsg);
    setChatMessages(updated);
    setChatInputText("");

    // Resposta simulada instantânea do cliente para testar tempo real
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        booking_id: activeChatBooking.id,
        sender_type: "client",
        sender_name: activeChatBooking.client_name,
        text: "Perfeito, muito obrigado pelas informações!",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };
      const finalChat = sendChatMessage(activeChatBooking.id, replyMsg);
      setChatMessages(finalChat);
    }, 1500);
  };

  // Alterar Status da Reserva
  const handleUpdateBookingStatus = (bookingId: string, newStatus: "confirmada" | "cancelada") => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const updated = { ...target, status: newStatus };
    const newList = saveBooking(updated);
    setBookings(newList);

    if (newStatus === "confirmada") {
      toast.success(`Reserva de ${target.client_name} confirmada com sucesso! 🎉`);
    } else {
      toast.info(`Reserva de ${target.client_name} foi cancelada.`);
    }
  };

  // Filtragem de Reservas
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = bookingSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        b.client_name.toLowerCase().includes(q) ||
        b.voucher_code.toLowerCase().includes(q) ||
        b.listing_title.toLowerCase().includes(q) ||
        b.client_phone.includes(q);

      if (!matchesQuery) return false;

      if (bookingStatusFilter === "hoje") {
        const todayStr = new Date().toISOString().split("T")[0];
        return b.date === todayStr;
      }
      if (bookingStatusFilter === "confirmada") return b.status === "confirmada";
      if (bookingStatusFilter === "pendente") return b.status === "pendente";
      return true;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  // Contadores Financeiros do Dashboard (Mercado Livre Style)
  const financialStats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) => b.date === todayStr && b.status !== "cancelada");
    const todayRevenue = todayBookings.reduce((sum, b) => sum + b.total_amount, 0);

    const totalRevenue = bookings
      .filter((b) => b.status !== "cancelada")
      .reduce((sum, b) => sum + b.total_amount, 0);

    const averageTicket =
      bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;

    return {
      todayRevenue,
      todayCount: todayBookings.length,
      totalRevenue,
      totalCount: bookings.length,
      averageTicket,
      unreadNotifs: notifications.filter((n) => !n.read).length,
    };
  }, [bookings, notifications]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* HEADER DO PARCEIRO COM IDENTIDADE BORA PASS */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white px-5 pt-6 pb-5 shadow-elevated border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={partnerStore?.logo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&q=80"}
                alt={partnerStore?.store_name}
                className="h-14 w-14 rounded-2xl object-cover border-2 border-amber-400/60 shadow-brand"
              />
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-md">
                ⭐
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white truncate max-w-[200px] sm:max-w-xs">
                  {partnerStore?.store_name || "Seu Estabelecimento"}
                </h1>
                <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 text-[9.5px] font-black uppercase">
                  {partnerStore?.category || "Parceiro"}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" /> {partnerStore?.city || "Rio de Janeiro"} · CNPJ: {partnerStore?.cnpj}
              </p>
            </div>
          </div>

          {/* Central de Notificações */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/20 transition active:scale-95 shadow-soft"
          >
            <Bell className="h-5 w-5 text-amber-300" />
            {financialStats.unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md animate-pulse">
                {financialStats.unreadNotifs}
              </span>
            )}
          </button>
        </div>

        {/* NAVEGAÇÃO DE TABS SUPERIOR (ESTILO GOOGLE MATERIAL / AIRBNB) */}
        <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide border-t border-white/10 pt-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === "dashboard"
                ? "bg-gradient-brand text-white shadow-brand"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Dashboard
          </button>

          {isBookingBased ? (
            <button
              onClick={() => setActiveTab("reservas")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === "reservas"
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Reservas
            </button>
          ) : (
            <Link
              to="/validar-cupom"
              className="px-4 py-2 rounded-2xl text-xs font-black bg-amber-400 text-slate-950 shadow-brand hover:bg-amber-300 transition flex items-center gap-2 shrink-0 uppercase"
            >
              <QrCode className="h-3.5 w-3.5" /> Ativar Cupom
            </Link>
          )}

          <button
            onClick={() => setActiveTab("anuncios")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === "anuncios"
                ? "bg-gradient-brand text-white shadow-brand"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Anúncios
          </button>

          <button
            onClick={() => setActiveTab("financeiro")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === "financeiro"
                ? "bg-gradient-brand text-white shadow-brand"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" /> Financeiro
          </button>

          <button
            onClick={() => setActiveTab("perfil")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === "perfil"
                ? "bg-gradient-brand text-white shadow-brand"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" /> Perfil
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 pb-28 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD HOME                                     */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fadeIn">
            {/* GRUDE DE CARDS KPI DO HOJE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Receita Hoje</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                    💰
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black text-foreground">
                    R$ {financialStats.todayRevenue.toFixed(2)}
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> +14.2% em relação a ontem
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">
                    {isBookingBased ? "Reservas Hoje" : "Cupons Hoje"}
                  </span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                    🎟️
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black text-foreground">{financialStats.todayCount} ativas</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Atendimento do dia</p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Avaliação Média</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                    ⭐
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black text-foreground">4.9 / 5.0</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Baseado em 128 opiniões</p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Pendências</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-500/10 text-red-500 font-bold">
                    🔔
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black text-foreground">
                    {bookings.filter((b) => b.status === "pendente").length} pendentes
                  </div>
                  <p className="text-[10px] font-bold text-amber-500 mt-0.5">Aguardando confirmação</p>
                </div>
              </div>
            </div>

            {/* ATALHOS RÁPIDOS */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Ações Rápidas do Estabelecimento
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {!isBookingBased && (
                  <Link
                    to="/validar-cupom"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 text-xs shadow-brand transition uppercase tracking-wider"
                  >
                    <QrCode className="h-4 w-4" /> Ativar Cupom
                  </Link>
                )}
                <button
                  onClick={() => setShowNewListingModal(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-white font-bold py-3 text-xs shadow-brand hover:opacity-95 transition"
                >
                  <Plus className="h-4 w-4" /> Criar Anúncio
                </button>
                <button
                  onClick={() => setActiveTab("financeiro")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background hover:bg-secondary text-foreground font-bold py-3 text-xs transition"
                >
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Relatório Financeiro
                </button>
              </div>
            </div>

            {/* LISTA DE RESERVAS DO DIA OU PRÓXIMAS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Atendimentos do Dia ({filteredBookings.length})
                </h3>
                <button
                  onClick={() => setActiveTab("reservas")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Ver Todas <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center space-y-2">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">Nenhuma reserva para o dia de hoje.</p>
                  <p className="text-xs text-muted-foreground">Novas reservas de clientes aparecerão automaticamente aqui.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="rounded-3xl border border-border bg-card p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={b.client_photo}
                          alt={b.client_name}
                          className="h-12 w-12 rounded-2xl object-cover border border-border"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-foreground">{b.client_name}</h4>
                            <span className="font-mono text-[10px] font-black bg-secondary px-2 py-0.5 rounded-md text-primary">
                              {b.voucher_code}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{b.listing_title}</p>
                          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            📅 {b.date} às {b.time} · 👥 {b.guests_count} pessoas · 💰 R$ {b.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveChatBooking(b)}
                          className="rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <MessageSquare className="h-4 w-4" /> Conversar
                        </button>
                        {b.status === "pendente" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "confirmada")}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-black shadow-brand transition"
                          >
                            Confirmar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RESERVAS (AIRBNB STYLE CARD LAYOUT)               */}
        {/* ========================================================= */}
        {activeTab === "reservas" && (
          <div className="space-y-5 animate-fadeIn">
            {/* BARRA DE PESQUISA & FILTROS DE RESERVA */}
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Pesquisar por nome do cliente, telefone ou voucher (ex: BP-98214)..."
                    className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="rounded-2xl border border-border bg-background hover:bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground transition flex items-center gap-1.5 shrink-0"
                >
                  <Calendar className="h-4 w-4 text-primary" /> Calendário
                </button>
              </div>

              {/* FILTER CHIPS */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setBookingStatusFilter("todas")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                    bookingStatusFilter === "todas"
                      ? "bg-gradient-brand text-white shadow-brand"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todas ({bookings.length})
                </button>
                <button
                  onClick={() => setBookingStatusFilter("hoje")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                    bookingStatusFilter === "hoje"
                      ? "bg-gradient-brand text-white shadow-brand"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setBookingStatusFilter("confirmada")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                    bookingStatusFilter === "confirmada"
                      ? "bg-emerald-600 text-white shadow-brand"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Confirmadas ({bookings.filter((b) => b.status === "confirmada").length})
                </button>
                <button
                  onClick={() => setBookingStatusFilter("pendente")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                    bookingStatusFilter === "pendente"
                      ? "bg-amber-500 text-slate-950 font-black shadow-brand"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pendentes ({bookings.filter((b) => b.status === "pendente").length})
                </button>
              </div>
            </div>

            {/* LISTAGEM DE CARDS DE RESERVA (ESTILO AIRBNB / BOOKING) */}
            <div className="grid gap-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.client_photo}
                        alt={b.client_name}
                        className="h-12 w-12 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
                      />
                      <div>
                        <h3 className="font-extrabold text-base text-foreground">{b.client_name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{b.client_phone}</span> · <span>{b.client_email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-xl border border-primary/20">
                        Voucher: {b.voucher_code}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${
                          b.status === "confirmada"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                            : b.status === "pendente"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                              : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/50 p-3.5 rounded-2xl text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-extrabold">Anúncio / Oferta</span>
                      <strong className="text-foreground font-bold truncate block">{b.listing_title}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-extrabold">Data & Horário</span>
                      <strong className="text-foreground font-bold block">{b.date} às {b.time}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-extrabold">Pessoas</span>
                      <strong className="text-foreground font-bold block">{b.guests_count} pessoas</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-extrabold">Valor Total</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold block">R$ {b.total_amount.toFixed(2)}</strong>
                    </div>
                  </div>

                  {b.notes && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" /> Observação do cliente: "{b.notes}"
                    </p>
                  )}

                  {/* AÇÕES DA RESERVA */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedBookingDetails(b)}
                      className="rounded-2xl border border-border bg-background hover:bg-secondary px-4 py-2.5 text-xs font-bold text-foreground transition flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4 text-primary" /> Detalhes
                    </button>
                    <button
                      onClick={() => setActiveChatBooking(b)}
                      className="rounded-2xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" /> Conversar (Chat)
                    </button>
                    {b.status !== "confirmada" && (
                      <button
                        onClick={() => handleUpdateBookingStatus(b.id, "confirmada")}
                        className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-black shadow-brand transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Confirmar
                      </button>
                    )}
                    {b.status !== "cancelada" && (
                      <button
                        onClick={() => handleUpdateBookingStatus(b.id, "cancelada")}
                        className="rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 px-4 py-2.5 text-xs font-bold transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ANÚNCIOS (FACEBOOK MARKETPLACE STYLE GRID)         */}
        {/* ========================================================= */}
        {activeTab === "anuncios" && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-foreground">Catálogo de Anúncios da Loja</h2>
                <p className="text-xs text-muted-foreground">Gerencie suas ofertas, preços, cupons e disponibilidade.</p>
              </div>
              <button
                onClick={() => setShowNewListingModal(true)}
                className="rounded-2xl bg-gradient-brand px-4 py-2.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Novo Anúncio
              </button>
            </div>

            {/* GRID DE ANÚNCIOS (MARKETPLACE STYLE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftListings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden relative group hover:shadow-elevated transition"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={listing.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"}
                      alt={listing.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur border shadow-sm ${
                        listing.status === "approved"
                          ? "bg-emerald-500/80 text-white border-emerald-400"
                          : listing.status === "pending"
                            ? "bg-amber-500/80 text-slate-950 border-amber-300 font-bold"
                            : "bg-slate-900/80 text-slate-200 border-slate-700"
                      }`}
                    >
                      {listing.status === "approved" ? "Aprovado" : listing.status === "pending" ? "Em Análise" : "Rascunho"}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-extrabold text-sm text-foreground truncate">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        R$ {listing.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {listing.category.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FINANCEIRO (MERCADO LIVRE STYLE DASHBOARD)        */}
        {/* ========================================================= */}
        {activeTab === "financeiro" && (
          <div className="space-y-6 animate-fadeIn">
            {/* CARDS DE FATURAMENTO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Receita Total</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  R$ {financialStats.totalRevenue.toFixed(2)}
                </div>
                <span className="text-[10px] text-muted-foreground block">Acumulado do estabelecimento</span>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Receita Hoje</span>
                <div className="text-xl font-black text-foreground">
                  R$ {financialStats.todayRevenue.toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-500 font-bold block">+14% em relação a ontem</span>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Ticket Médio</span>
                <div className="text-xl font-black text-primary">
                  R$ {financialStats.averageTicket.toFixed(2)}
                </div>
                <span className="text-[10px] text-muted-foreground block">Por atendimento</span>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Total de Vendas</span>
                <div className="text-xl font-black text-amber-500">
                  {financialStats.totalCount} transações
                </div>
                <span className="text-[10px] text-muted-foreground block">Reservas e Cupons</span>
              </div>
            </div>

            {/* BOTÕES DE EXPORTAÇÃO */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div>
                <h3 className="text-sm font-black text-foreground">Extrato & Relatório Financeiro</h3>
                <p className="text-xs text-muted-foreground">Exporte suas transações completas para contabilidade.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("📄 Relatório PDF baixado com sucesso!")}
                  className="rounded-2xl border border-border bg-background hover:bg-secondary px-4 py-2.5 text-xs font-bold text-foreground transition flex items-center gap-2 shadow-sm"
                >
                  <Download className="h-4 w-4 text-primary" /> PDF
                </button>
                <button
                  onClick={() => toast.success("📊 Planilha Excel (.xlsx) baixada com sucesso!")}
                  className="rounded-2xl bg-gradient-brand text-white px-4 py-2.5 text-xs font-black shadow-brand hover:opacity-95 transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PERFIL E CONFIGURAÇÕES DA LOJA                      */}
        {/* ========================================================= */}
        {activeTab === "perfil" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
              <div className="flex items-center gap-4 border-b border-border/60 pb-5">
                <img
                  src={partnerStore?.logo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&q=80"}
                  alt={partnerStore?.store_name}
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-primary/30 shadow-brand"
                />
                <div>
                  <h2 className="text-lg font-black text-foreground">{partnerStore?.store_name}</h2>
                  <p className="text-xs font-bold text-primary">{partnerStore?.category} · CNPJ: {partnerStore?.cnpj}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Responsável: {partnerStore?.owner_name || profile?.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-extrabold uppercase text-[10px]">E-mail Comercial</span>
                  <p className="font-mono font-bold text-foreground">{partnerStore?.email || user?.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-extrabold uppercase text-[10px]">Telefone / WhatsApp</span>
                  <p className="font-mono font-bold text-foreground">{partnerStore?.phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-extrabold uppercase text-[10px]">Endereço Completo</span>
                  <p className="font-bold text-foreground">{partnerStore?.address}, {partnerStore?.city}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-extrabold uppercase text-[10px]">Plano do Parceiro</span>
                  <p className="font-black text-amber-500 uppercase">⭐ Bora Pass Partner VIP Pro</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    if (user?.email) {
                      await supabase.auth.resetPasswordForEmail(user.email);
                      toast.success(`E-mail de redefinição enviado para ${user.email}!`);
                    }
                  }}
                  className="rounded-2xl border border-border bg-background hover:bg-secondary px-4 py-2.5 text-xs font-bold text-foreground transition flex items-center gap-2"
                >
                  <Lock className="h-4 w-4 text-amber-500" /> Alterar Senha
                </button>
                <button
                  onClick={logout}
                  className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2.5 text-xs font-bold transition flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sair da Conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL DE CHAT EM TEMPO REAL (ESTILO WHATSAPP)            */}
      {/* ========================================================= */}
      {activeChatBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
          onClick={() => setActiveChatBooking(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-[90vh] sm:h-[650px] bg-slate-950 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20"
          >
            {/* CHAT HEADER */}
            <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeChatBooking.client_photo}
                  alt={activeChatBooking.client_name}
                  className="h-10 w-10 rounded-full object-cover border border-amber-400"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-white">{activeChatBooking.client_name}</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Online · Reserva #{activeChatBooking.voucher_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveChatBooking(null)}
                className="text-slate-400 hover:text-white p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {chatMessages.map((msg) => {
                const isMe = msg.sender_type === "partner";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                        isMe
                          ? "bg-gradient-brand text-white rounded-br-none"
                          : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-80">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="h-3 w-3 text-amber-300" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CHAT INPUT FOOTER */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Digite sua mensagem para o cliente..."
                className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSendMessage}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand hover:opacity-95 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CENTRAL DE NOTIFICAÇÕES                         */}
      {/* ========================================================= */}
      {showNotificationsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowNotificationsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-3xl p-5 shadow-elevated border border-border space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Central de Notificações
              </h3>
              <button onClick={() => setShowNotificationsModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    const updated = markNotificationAsRead(n.id);
                    setNotifications(updated);
                  }}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1 transition cursor-pointer ${
                    !n.read ? "border-primary/40 bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-foreground">{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                  </div>
                  <p className="text-muted-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
