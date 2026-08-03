import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Headphones,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Shield,
  Filter,
  User,
  Image as ImageIcon,
  X,
  Paperclip,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Zap,
  Star,
  FileText,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { toast } from "sonner";
import type { SupportTicket, TicketMessage } from "./ajuda";

export const Route = createFileRoute("/suporte-painel")({
  head: () => ({ meta: [{ title: "Console de Suporte — Zendesk Style | Bora Pass" }] }),
  component: SupportWorkspacePage,
});

const QUICK_RESPONSES = [
  "Olá! Sou do Suporte Bora Pass e já estou verificando sua solicitação com o parceiro.",
  "Seu cupom foi ativado manualmente no sistema. Pode apresentar o código na loja!",
  "A reserva foi confirmada com sucesso. Enviamos os detalhes para seu e-mail.",
  "Solicitação de reembolso processada com sucesso. O estorno ocorrerá em até 2 dias úteis.",
];

export function SupportWorkspacePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isStaff, isAdmin, loading: rolesLoading } = useRoles(user?.id);
  const isLoading = authLoading || rolesLoading;

  useEffect(() => {
    if (!isLoading && (!user || !isStaff)) {
      navigate({ to: "/", replace: true });
    }
  }, [isLoading, user, isStaff, navigate]);

  // Tickets state stored in localStorage
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:support-tickets");
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
        id: "TK-1001",
        userId: "u-demo-1",
        userName: "Rafael Assêncio",
        userEmail: "rafael.assencio12@gmail.com",
        subject: "Dúvida sobre resgate do cupom de restaurante",
        category: "Cupons & Ofertas",
        status: "aberto",
        description: "Não consegui visualizar o código QR no estabelecimento Sabor da Terra.",
        messages: [
          {
            id: "m1",
            sender: "user",
            senderName: "Rafael Assêncio",
            text: "Não consegui visualizar o código QR no estabelecimento Sabor da Terra.",
            timestamp: "2026-07-28 14:30",
          },
        ],
        createdAt: "2026-07-28 14:30",
      },
      {
        id: "TK-1002",
        userId: "u-demo-2",
        userName: "Carlos Eduardo Silva",
        userEmail: "carlos.silva@email.com",
        subject: "Atraso no atendimento e problema na reserva",
        category: "Hospedagens",
        status: "em_atendimento",
        description: "Fiquei mais de 2 horas aguardando confirmação da reserva na pousada.",
        messages: [
          {
            id: "m1",
            sender: "user",
            senderName: "Carlos Eduardo",
            text: "Demorou muito para responderem sobre a pousada Vista Mar.",
            timestamp: "2026-07-27 10:00",
          },
          {
            id: "m2",
            sender: "support",
            senderName: "Suporte Bora Pass",
            text: "Estamos em contato direto com a recepção da pousada para liberar sua entrada.",
            timestamp: "2026-07-27 10:15",
          },
        ],
        createdAt: "2026-07-27 10:00",
      },
      {
        id: "TK-1003",
        userId: "u-demo-3",
        userName: "Mariana Souza",
        userEmail: "mariana.souza@email.com",
        subject: "Confirmação de voucher de passeio em Gramado",
        category: "Passeios",
        status: "resolvido",
        description: "Voucher ativado com sucesso.",
        messages: [
          {
            id: "m1",
            sender: "user",
            senderName: "Mariana Souza",
            text: "Tudo certo com o passeio!",
            timestamp: "2026-07-26 15:20",
          },
        ],
        createdAt: "2026-07-26 15:20",
        rating: 5,
        ratingComment: "Excelente suporte! Responderam em menos de 5 minutos.",
        ratedAt: "2026-07-26 15:30",
      },
    ];
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string>("TK-1001");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todas");
  const [search, setSearch] = useState("");

  const [replyText, setReplyText] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:support-tickets", JSON.stringify(tickets));
    }
  }, [tickets]);

  // Scroll chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages?.length]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = filterStatus === "todos" || t.status === filterStatus;
      const matchCategory = filterCategory === "todas" || t.category === filterCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q);

      return matchStatus && matchCategory && matchSearch;
    });
  }, [tickets, filterStatus, filterCategory, search]);

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() && !attachmentPreview) return;
    if (!activeTicket) return;

    const newMsg: TicketMessage = {
      id: `m-${Date.now()}`,
      sender: "support",
      senderName: "Atendimento Bora Pass",
      text: replyText.trim(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      imageUrl: attachmentPreview || undefined,
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          return {
            ...t,
            status: "em_atendimento",
            messages: [...(t.messages || []), newMsg],
          };
        }
        return t;
      }),
    );

    setReplyText("");
    setAttachmentPreview(null);
    toast.success("Resposta enviada ao cliente!");
  }

  function handleUpdateStatus(newStatus: "aberto" | "em_atendimento" | "resolvido") {
    if (!activeTicket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? { ...t, status: newStatus } : t)),
    );
    toast.success(`Status alterado para "${newStatus.replace("_", " ")}"`);
  }

  function handleAttachmentSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachmentPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (isLoading || !user || !isStaff) {
    return null;
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden">
      {/* 1. TOP HEADER DE NAVEGAÇÃO ZENDESK */}
      <header className="h-16 shrink-0 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-brand">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              Console de Suporte{" "}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase font-mono">
                Zendesk Desk
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Central unificada de atendimento ao cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Painel Admin
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            App Turista
          </Link>
        </div>
      </header>

      {/* 2. ÁREA DE TRABALHO MULTI-COLUNAS (DESKTOP) */}
      <div className="flex-1 flex min-h-0 divide-x divide-slate-800">
        {/* ========================================================= */}
        {/* COLUNA 1: FILTROS E LISTA DE TICKETS (340px)              */}
        {/* ========================================================= */}
        <div className="w-80 shrink-0 bg-slate-900 flex flex-col justify-between overflow-hidden">
          {/* Top Search & Filter Headers */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar chamados..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
              {["todos", "aberto", "em_atendimento", "resolvido"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`capitalize px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    filterStatus === st
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {filteredTickets.map((t: SupportTicket) => {
              const active = t.id === activeTicket?.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition space-y-2 ${
                    active
                      ? "bg-sky-600/15 border border-sky-500/40 shadow-sm"
                      : "hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-sky-400">{t.id}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.status === "aberto"
                          ? "bg-rose-500/20 text-rose-300"
                          : t.status === "em_atendimento"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{t.subject}</h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {t.userName} ({t.userEmail})
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>{t.category}</span>
                    <span>{t.createdAt}</span>
                  </div>
                </button>
              );
            })}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <AlertCircle className="h-6 w-6 mx-auto text-slate-600" />
                <p>Nenhum chamado encontrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUNA 2: THREAD CENTRAL E CHAT ATIVO                     */}
        {/* ========================================================= */}
        {activeTicket ? (
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
            {/* Header do Chamado Selecionado */}
            <div className="h-16 shrink-0 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-sky-400">
                    {activeTicket.id}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                    {activeTicket.category}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white truncate max-w-xl">
                  {activeTicket.subject}
                </h2>
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-bold">Status:</label>
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as any)}
                  className="rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white px-3 py-1.5 focus:outline-none focus:border-sky-500"
                >
                  <option value="aberto">🔴 Aberto</option>
                  <option value="em_atendimento">🟡 Em Atendimento</option>
                  <option value="resolvido">🟢 Resolvido</option>
                </select>
              </div>
            </div>

            {/* Histórico de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-white">Mensagem Inicial do Cliente</span>
                  <span>{activeTicket.createdAt}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{activeTicket.description}</p>
              </div>

              {activeTicket.messages?.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs space-y-2 ${
                        isUser
                          ? "bg-slate-900 border border-slate-800 text-slate-200"
                          : "bg-sky-600 text-white shadow-brand"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 pb-1 border-b border-white/10">
                        <span className="font-bold">{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Anexo"
                          className="mt-2 h-40 w-full object-cover rounded-xl border border-white/20"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Canned Responses Toolbar */}
            <div className="border-t border-slate-800 bg-slate-900/60 px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs">
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                Respostas Rápidas:
              </span>
              {QUICK_RESPONSES.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => setReplyText(qr)}
                  className="shrink-0 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 border border-slate-700 truncate max-w-[220px]"
                  title={qr}
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Composer Box */}
            <form
              onSubmit={handleSendReply}
              className="p-4 border-t border-slate-800 bg-slate-900 space-y-3"
            >
              {attachmentPreview && (
                <div className="relative inline-block">
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-xl border border-sky-500"
                  />
                  <button
                    onClick={() => setAttachmentPreview(null)}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva a resposta para o cliente..."
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                <label className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition border border-slate-700">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAttachmentSelect}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-brand transition flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" /> Enviar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
            <p className="text-sm">
              Selecione um chamado na barra lateral para visualizar o atendimento.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* COLUNA 3: PAINEL DIREITO — DADOS DO CLIENTE (300px)       */}
        {/* ========================================================= */}
        {activeTicket && (
          <div className="w-72 shrink-0 bg-slate-900 p-6 space-y-6 overflow-y-auto hidden xl:block">
            <div className="text-center space-y-2 pb-6 border-b border-slate-800">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-sky-600/20 text-sky-400 font-extrabold text-xl mx-auto border border-sky-500/30">
                {activeTicket.userName.charAt(0)}
              </div>
              <h3 className="text-sm font-bold text-white">{activeTicket.userName}</h3>
              <p className="text-xs text-slate-400 font-mono">{activeTicket.userEmail}</p>
              <span className="inline-block rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-0.5 text-[10px] font-bold">
                ⭐ Cliente Premium
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Metadados do Chamado
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">ID Chamado</span>
                  <span className="font-mono text-sky-400 font-bold">{activeTicket.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Categoria</span>
                  <span className="text-white font-bold">{activeTicket.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Criação</span>
                  <span className="text-slate-300">{activeTicket.createdAt}</span>
                </div>
              </div>

              {activeTicket.rating && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Avaliação do Cliente</span>
                    <span className="text-xs font-bold text-amber-400">
                      ⭐ {activeTicket.rating}/5
                    </span>
                  </div>
                  {activeTicket.ratingComment && (
                    <p className="text-[11px] text-amber-200/90 italic">
                      "{activeTicket.ratingComment}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
