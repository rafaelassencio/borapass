import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  HelpCircle,
  MessageSquare,
  Plus,
  Send,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Shield,
  Headphones,
  Image as ImageIcon,
  Camera,
  Paperclip,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ajuda")({
  head: () => ({ meta: [{ title: "Ajuda & Suporte — Bora Pass" }] }),
  component: AjudaPage,
});

export type TicketMessage = {
  id: string;
  sender: "user" | "support" | "system";
  senderName: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  status: "aberto" | "em_atendimento" | "resolvido";
  description: string;
  messages: TicketMessage[];
  createdAt: string;
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
  reviewedByAdmin?: boolean;
};

export function AjudaPage() {
  const { user } = useAuth();
  const profile = useProfile(user?.id);

  const userName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Cliente Bora Pass";
  const userEmail = user?.email || "cliente@borapass.com";

  // Tickets stored in localStorage
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
        userId: user?.id || "u-demo",
        userName: "Rafael Assêncio",
        userEmail: "rafael@borapass.com",
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
          {
            id: "m2",
            sender: "support",
            senderName: "Suporte Bora Pass",
            text: "Olá Rafael! Estamos verificando com o restaurante parceiro.",
            timestamp: "2026-07-28 14:35",
          },
        ],
        createdAt: "2026-07-28 14:30",
      },
    ];
  });

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Cupons & Ofertas");
  const [description, setDescription] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);

  // Chat message input state & photo attachments
  const [replyText, setReplyText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Rating Modal state for resolved ticket
  const [ratingTicket, setRatingTicket] = useState<SupportTicket | null>(null);
  const [stars, setStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:support-tickets", JSON.stringify(tickets));
    }
  }, [tickets]);

  function handleChatImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("Selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("A imagem deve ter no máximo 5MB.");
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSelectedImage(evt.target?.result as string);
      toast.success("Foto anexada! Clique em enviar.");
    };
    reader.readAsDataURL(file);
  }

  function handleModalImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("Selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("A imagem deve ter no máximo 5MB.");
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setTicketImage(evt.target?.result as string);
      toast.success("Foto anexada ao novo chamado!");
    };
    reader.readAsDataURL(file);
  }

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      return toast.error("Por favor, preencha o assunto e a descrição do chamado.");
    }

    const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: user?.id || "guest",
      userName,
      userEmail,
      subject: subject.trim(),
      category,
      status: "aberto",
      description: description.trim(),
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: "user",
          senderName: userName,
          text: description.trim(),
          imageUrl: ticketImage || undefined,
          timestamp: now,
        },
      ],
      createdAt: now,
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    setShowNewTicketModal(false);

    // Reset Form
    setSubject("");
    setDescription("");
    setTicketImage(null);
    toast.success(`Chamado #${ticketId} criado com sucesso! Nossa equipe responderá em breve.`);
    setActiveTicket(newTicket);
  }

  function handleSendUserMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!replyText.trim() && !selectedImage) || !activeTicket) return;

    const now = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const msg: TicketMessage = {
      id: `m-${Date.now()}`,
      sender: "user",
      senderName: userName,
      text: replyText.trim() || (selectedImage ? "📷 Foto enviada" : ""),
      imageUrl: selectedImage || undefined,
      timestamp: now,
    };

    const updatedTickets = tickets.map((t) => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          messages: [...t.messages, msg],
          status: t.status === "resolvido" ? ("aberto" as const) : t.status,
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setActiveTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, msg] } : null));
    setReplyText("");
    setSelectedImage(null);
    toast.success("Mensagem com foto enviada!");
  }

  function handleCloseTicket(ticketId: string) {
    const nowStr = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "resolvido" as const,
          messages: [
            ...t.messages,
            {
              id: `m-${Date.now()}`,
              sender: "system" as const,
              senderName: "Sistema Bora Pass",
              text: "Chamado encerrado pelo usuário.",
              timestamp: nowStr,
            },
          ],
        };
      }
      return t;
    });

    setTickets(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:support-tickets", JSON.stringify(updated));
    }
    const currentT = updated.find((t) => t.id === ticketId) || null;
    setActiveTicket(currentT);
    toast.success("Chamado encerrado com sucesso!");
    if (currentT) {
      setRatingTicket(currentT);
    }
  }

  function handleReopenTicket(ticketId: string) {
    const nowStr = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const msg: TicketMessage = {
      id: `m-${Date.now()}`,
      sender: "system",
      senderName: "Sistema Bora Pass",
      text: "Chamado reaberto pelo usuário. Motivo: O problema ainda não foi solucionado.",
      timestamp: nowStr,
    };

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "aberto" as const,
          messages: [...t.messages, msg],
        };
      }
      return t;
    });

    setTickets(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:support-tickets", JSON.stringify(updated));
    }
    const currentT = updated.find((t) => t.id === ticketId) || null;
    setActiveTicket(currentT);
    toast.info("Chamado reaberto! Nossa equipe de suporte continuará o atendimento.");
  }

  function handleSaveRating(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingTicket) return;

    const nowStr = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

    const updated = tickets.map((t) => {
      if (t.id === ratingTicket.id) {
        return {
          ...t,
          rating: stars,
          ratingComment: ratingComment.trim(),
          ratedAt: nowStr,
          reviewedByAdmin: false,
        };
      }
      return t;
    });

    setTickets(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:support-tickets", JSON.stringify(updated));
    }

    const ratedTicket = updated.find((t) => t.id === ratingTicket.id) || null;
    if (activeTicket?.id === ratingTicket.id) {
      setActiveTicket(ratedTicket);
    }

    if (stars < 3) {
      toast.error(
        `Aviso: Sua avaliação (${stars}/5 ⭐) foi enviada. Devido à pontuação baixa, um alerta foi enviado aos administradores para revisão prioritária!`,
        { duration: 6000 },
      );
    } else {
      toast.success("Obrigado pela sua avaliação!");
    }

    setRatingTicket(null);
  }

  return (
    <AppShell>
      <PageHeader
        title="Ajuda & Suporte 🎧"
        subtitle="Abra chamados e converse em tempo real com nossa equipe"
        right={
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Chamado
          </button>
        }
      />

      <div className="px-5 pt-4">
        {/* TICKET CHAT VIEW */}
        {activeTicket ? (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTicket(null)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              ← Voltar para lista de chamados
            </button>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    {activeTicket.id} · {activeTicket.category}
                  </span>
                  <h2 className="text-base font-bold text-foreground">{activeTicket.subject}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      activeTicket.status === "resolvido"
                        ? "bg-emerald-500/10 text-emerald-600 font-bold"
                        : activeTicket.status === "em_atendimento"
                          ? "bg-amber-500/10 text-amber-600 font-bold"
                          : "bg-blue-500/10 text-blue-600 font-bold"
                    }
                  >
                    {activeTicket.status === "resolvido"
                      ? "Resolvido"
                      : activeTicket.status === "em_atendimento"
                        ? "Em Atendimento"
                        : "Aberto"}
                  </Badge>

                  {activeTicket.status !== "resolvido" ? (
                    <button
                      onClick={() => handleCloseTicket(activeTicket.id)}
                      className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 px-3 py-1 text-xs font-bold transition flex items-center gap-1 shadow-soft"
                      title="Encerrar chamado a qualquer momento"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Encerrar
                    </button>
                  ) : (
                    <button
                      onClick={() => setRatingTicket(activeTicket)}
                      className="rounded-xl bg-emerald-600 text-white px-3 py-1 text-xs font-bold transition flex items-center gap-1 shadow-brand"
                    >
                      <Star className="h-3.5 w-3.5 fill-white text-white" />
                      {activeTicket.rating
                        ? `Avaliado (${activeTicket.rating}★)`
                        : "Avaliar Atendimento"}
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                {activeTicket.messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        <span className="font-bold text-foreground">{m.senderName}</span>
                        <span>· {m.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-soft ${
                          isUser
                            ? "bg-gradient-brand text-white shadow-brand rounded-br-none"
                            : m.sender === "system"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 italic"
                              : "bg-secondary text-foreground rounded-bl-none border border-border"
                        }`}
                      >
                        {m.text && <p>{m.text}</p>}
                        {m.imageUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-white/20">
                            <img
                              src={m.imageUrl}
                              alt="Foto enviada no chat"
                              className="h-auto max-h-56 w-full object-cover cursor-pointer hover:opacity-95 transition"
                              onClick={() => setZoomImage(m.imageUrl!)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Confirmation Card when ticket is resolved and NOT YET rated */}
              {activeTicket.status === "resolvido" && !activeTicket.rating && (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3 shadow-soft text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>
                      O suporte marcou este chamado como resolvido. O seu problema foi realmente
                      solucionado?
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setRatingTicket(activeTicket)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-brand transition flex items-center gap-1.5"
                    >
                      <Star className="h-4 w-4 fill-white text-white" />
                      {activeTicket.rating
                        ? `Sim, foi resolvido! (Avaliado ${activeTicket.rating}★)`
                        : "Sim, foi resolvido! (Avaliar Atendimento)"}
                    </button>

                    <button
                      onClick={() => handleReopenTicket(activeTicket.id)}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-brand transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" /> Não, ainda preciso de ajuda (Reabrir)
                    </button>
                  </div>
                </div>
              )}

              {/* Send Message Input with Photo Attachment */}
              {activeTicket.status !== "resolvido" && (
                <form
                  onSubmit={handleSendUserMessage}
                  className="mt-4 space-y-2 pt-3 border-t border-border"
                >
                  {selectedImage && (
                    <div className="relative inline-flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft">
                      <img
                        src={selectedImage}
                        alt="Anexo"
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div className="text-left text-[11px]">
                        <p className="font-bold text-foreground">Foto anexada</p>
                        <p className="text-muted-foreground">Pronta para envio</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="rounded-full bg-secondary p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleChatImageSelect}
                    />
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition shrink-0"
                      title="Enviar foto"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva sua mensagem ou envie uma foto..."
                      className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() && !selectedImage}
                      className="rounded-xl bg-gradient-brand px-4 py-2.5 text-xs font-bold text-white shadow-brand disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* TICKETS LIST VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Meus Chamados</h2>
              <span className="text-xs font-semibold text-muted-foreground">
                {tickets.length} chamados
              </span>
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-3 text-base font-bold">Nenhum chamado aberto</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Precisa de ajuda com algum cupom, reserva ou dúvida? Abra um chamado diretamente
                  para nosso suporte!
                </p>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand"
                >
                  <Plus className="h-4 w-4" /> Abrir Novo Chamado
                </button>
              </div>
            ) : (
              tickets.map((tk) => (
                <div
                  key={tk.id}
                  onClick={() => setActiveTicket(tk)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-elevated"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary uppercase">
                      {tk.id} · {tk.category}
                    </span>
                    <Badge
                      className={
                        tk.status === "resolvido"
                          ? "bg-emerald-500/10 text-emerald-600 font-bold"
                          : tk.status === "em_atendimento"
                            ? "bg-amber-500/10 text-amber-600 font-bold"
                            : "bg-blue-500/10 text-blue-600 font-bold"
                      }
                    >
                      {tk.status === "resolvido"
                        ? "Resolvido"
                        : tk.status === "em_atendimento"
                          ? "Em Atendimento"
                          : "Aberto"}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-foreground line-clamp-1">
                    {tk.subject}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {tk.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                    <span>Aberto em: {tk.createdAt}</span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {tk.messages.length} mensagens
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODAL NOVO CHAMADO */}
        {showNewTicketModal && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setShowNewTicketModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Abrir Chamado de Suporte</h2>
                </div>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Assunto do Chamado
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="ex: Dúvida sobre cupom ou desconto"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Cupons & Ofertas">Cupons & Ofertas</option>
                    <option value="Dúvida em Passeio">Dúvida em Passeio</option>
                    <option value="Conta & Perfil">Conta & Perfil</option>
                    <option value="Pagamentos">Pagamentos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Descrição Detalhada do Problema
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que ocorreu com detalhes para que nossa equipe possa ajudar..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Anexar Foto / Print (Opcional)
                  </label>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleModalImageSelect}
                  />
                  {ticketImage ? (
                    <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-soft">
                      <img
                        src={ticketImage}
                        alt="Anexo"
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-foreground">Foto anexada ao chamado</p>
                        <p className="text-[11px] text-muted-foreground">
                          Será visualizada pelo suporte
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTicketImage(null)}
                        className="rounded-full bg-secondary p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-3 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Camera className="h-4 w-4 text-primary" /> Anexar Foto da Câmera ou Galeria
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition active:scale-95"
                >
                  Enviar Chamado ao Suporte ✨
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL AVALIAÇÃO DO ATENDIMENTO (CSAT) */}
        {ratingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-elevated text-center">
              <Star className="mx-auto h-10 w-10 text-amber-400 fill-amber-400" />
              <h3 className="mt-3 text-lg font-bold text-foreground">Como foi seu atendimento?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Sua avaliação nos ajuda a melhorar constantemente o suporte do Bora Pass.
              </p>

              {/* Star Selector */}
              <div className="mt-4 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className="p-1 transition hover:scale-125"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        s <= stars ? "text-amber-400 fill-amber-400" : "text-border"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveRating} className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Escreva um comentário opcional sobre o suporte..."
                  className="w-full rounded-xl border border-border bg-card p-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-brand py-2.5 text-xs font-bold text-white shadow-brand"
                >
                  Enviar Avaliação
                </button>
              </form>
            </div>
          </div>
        )}

        {/* LIGHTBOX DE EXPANSÃO DA FOTO DA MENSAGEM */}
        {zoomImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setZoomImage(null)}
          >
            <div
              className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black transition"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={zoomImage}
                alt="Foto ampliada"
                className="h-auto max-h-[85vh] w-full object-contain rounded-3xl"
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
