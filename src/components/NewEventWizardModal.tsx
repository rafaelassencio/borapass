import { useState } from "react";
import {
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Tag,
  DollarSign,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { getStoredPartners, type PartnerStore } from "@/lib/partners";
import PartnerMapPicker from "./PartnerMapPicker";
import { toast } from "sonner";

export type EventData = {
  id: string;
  title: string;
  category: "eventos";
  partner_id: string;
  partner_name: string;
  event_style: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_free: boolean;
  ticket_price?: number;
  image_url: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  status: "approved" | "pending" | "rejected";
  active: boolean;
  created_at: string;
};

const EVENT_STYLES = [
  "🎸 Show ao Vivo / Música",
  "🎉 Festa & Balada",
  "🎪 Festival",
  "🎭 Teatro & Cultura",
  "🍷 Gastronômico & Vinhos",
  "⚽ Esportivo & Aventura",
  "🎨 Feira & Exposição",
  "👨‍👩‍👧 Infantil & Família",
];

export default function NewEventWizardModal({
  isAdmin = false,
  currentUserPartnerId = null,
  onClose,
  onSaveEvent,
}: {
  isAdmin?: boolean;
  currentUserPartnerId?: string | null;
  onClose: () => void;
  onSaveEvent: (eventData: EventData) => void;
}) {
  const partners = getStoredPartners();
  const defaultPartner = partners.find((p) => p.id === currentUserPartnerId) || partners[0] || null;

  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    currentUserPartnerId || (defaultPartner ? defaultPartner.id : ""),
  );
  const [title, setTitle] = useState("");
  const [eventStyle, setEventStyle] = useState(EVENT_STYLES[0]);
  const [startDate, setStartDate] = useState("2026-08-15");
  const [startTime, setStartTime] = useState("19:00");
  const [endDate, setEndDate] = useState("2026-08-15");
  const [endTime, setEndTime] = useState("23:30");
  const [isFree, setIsFree] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("50");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  );
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState(defaultPartner?.address || "Centro, Rio de Janeiro");
  const [lat, setLat] = useState<number>(defaultPartner?.lat || -22.9068);
  const [lng, setLng] = useState<number>(defaultPartner?.lng || -43.1729);

  const activePartner = partners.find((p) => p.id === selectedPartnerId) || defaultPartner;

  function handleNextStep() {
    if (!selectedPartnerId) return toast.error("Selecione o parceiro organizador.");
    if (!title.trim()) return toast.error("Digite o nome do evento.");
    setStep(2);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activePartner) return toast.error("Selecione um parceiro válido.");

    const newEvt: EventData = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      category: "eventos",
      partner_id: activePartner.id,
      partner_name: activePartner.store_name,
      event_style: eventStyle,
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      is_free: isFree,
      ticket_price: isFree ? 0 : parseFloat(ticketPrice) || 0,
      image_url:
        imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
      description:
        description.trim() || `Evento incrível promovido por ${activePartner.store_name}`,
      address: address.trim(),
      city: activePartner.city,
      lat,
      lng,
      status: isAdmin ? "approved" : "pending",
      active: isAdmin ? true : false,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const savedRaw = localStorage.getItem("borapass:custom-events");
        const current = savedRaw ? JSON.parse(savedRaw) : [];
        localStorage.setItem("borapass:custom-events", JSON.stringify([newEvt, ...current]));
      } catch {
        /* fallback */
      }
    }

    onSaveEvent(newEvt);
    toast.success(`🎉 Evento "${newEvt.title}" cadastrado com sucesso!`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-6 shadow-elevated border border-border space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <div>
              <span className="text-[10px] font-black uppercase text-primary">
                Cadastro de Eventos
              </span>
              <h2 className="text-base font-extrabold text-foreground">
                {step === 1
                  ? "1. Detalhes & Estilo do Evento"
                  : "2. Ingressos, Fotos & Localização"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3.5">
            {/* Organizer Partner */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Parceiro / Organizador
              </label>
              {isAdmin ? (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-card p-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary shadow-soft"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      🏪 {p.store_name} — {p.city} ({p.phone})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-white font-bold text-lg">
                    🏪
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground">
                      {activePartner?.store_name || "Sua Loja"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      📍 {activePartner?.city || "Cidade"} · {activePartner?.phone || "Telefone"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Event Title */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Nome do Evento
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Festival da Lagosta de Búzios 2026"
                className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>

            {/* Event Style */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Estilo do Evento
              </label>
              <select
                value={eventStyle}
                onChange={(e) => setEventStyle(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary shadow-soft"
              >
                {EVENT_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                  Hora de Início
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                  Hora de Término
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Free vs Paid Toggle */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                Tipo de Entrada
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`rounded-2xl border p-3 text-xs font-black transition flex items-center justify-center gap-2 ${
                    isFree
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  🎁 Gratuito
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`rounded-2xl border p-3 text-xs font-black transition flex items-center justify-center gap-2 ${
                    !isFree
                      ? "border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  🎟️ Pago com Ingresso
                </button>
              </div>
            </div>

            {/* Paid Ticket Alert & Price Input */}
            {!isFree && (
              <div className="space-y-3">
                {/* Fee Notice Banner requested by user */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/15 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Aviso Importante sobre Eventos Pagos:</p>
                    <p className="mt-0.5 text-[11px]">
                      Para ingressos pagos, será cobrada a{" "}
                      <strong>Taxa de Reserva pelo App Bora Pass</strong> no ato da compra pelo
                      viajante.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Valor do Ingresso (R$)
                  </label>
                  <input
                    type="number"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="50.00"
                    className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary shadow-soft"
                  />
                </div>
              </div>
            )}

            {/* Image URL & Local Upload */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Foto Principal do Evento (Enviar do Computador ou URL)
              </label>

              <div className="space-y-3">
                {/* Upload do Computador */}
                <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-2 relative transition hover:border-primary">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setImageUrl(ev.target.result as string);
                            toast.success("Foto do evento carregada com sucesso!");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Clique aqui para selecionar a capa do evento no seu computador 🖥️
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Suporta arquivos JPG, PNG, WEBP ou GIF
                    </p>
                  </div>
                </div>

                {/* Cole URL */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                    Ou cole a URL da imagem:
                  </span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/evento.jpg"
                    className="w-full rounded-2xl border border-border bg-card px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
                  />
                </div>

                {/* Live Preview */}
                {imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-border h-40 bg-slate-900 group">
                    <img
                      src={imageUrl}
                      alt="Pré-visualização do evento"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white">
                      📷 Capa do Evento
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-500 transition"
                      title="Remover foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Address & Interactive Map Picker */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Endereço do Local
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Av. Atlântica, 1500"
                className="w-full rounded-2xl border border-border bg-card px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft mb-2"
              />
              <PartnerMapPicker
                initialLat={lat}
                initialLng={lng}
                onSelectCoords={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Descrição do Evento
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva atrações, line-up de DJs, artistas, dresscode e regras do evento..."
                className="w-full rounded-2xl border border-border bg-card p-3 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-brand py-3 text-xs font-black text-white shadow-brand transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Publicar Evento no Bora Pass 🎉
            </button>
          </form>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-brand px-5 py-2 text-xs font-bold text-white shadow-brand active:scale-95"
            >
              Avançar <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
