import { useState } from "react";
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Store,
  Tag,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  Users,
  Clock,
} from "lucide-react";
import { getStoredPartners, type PartnerStore } from "@/lib/partners";
import PartnerMapPicker from "./PartnerMapPicker";
import { toast } from "sonner";

export type ListingOffer = {
  id: string;
  title: string;
  category: "passeios" | "hoteis" | "restaurantes" | "cupons";
  partner_id: string;
  partner_name: string;
  partner_phone: string;
  city: string;
  store_price: number;
  traveler_price: number;
  premium_price: number;
  expiration_date: string;
  discount_seal: string;
  image_url: string;
  description: string;
  lat: number;
  lng: number;
  status: "approved" | "pending" | "rejected";
  active: boolean;
  // Category specific optional fields
  trail_name?: string;
  room_name?: string;
  guest_capacity?: string;
  check_in_time?: string;
  check_out_time?: string;
  created_at: string;
};

const DISCOUNT_SEALS = [
  { id: "seal-1", label: "🔥 IMPERDÍVEL", color: "bg-red-600 text-white" },
  { id: "seal-2", label: "⭐ EXCLUSIVO PREMIUM", color: "bg-purple-600 text-white" },
  { id: "seal-3", label: "🎁 2X1 (COMPRE 1 LEVE 2)", color: "bg-emerald-600 text-white" },
  { id: "seal-4", label: "⚡ OFERTA RELÂMPAGO", color: "bg-amber-500 text-black font-extrabold" },
  { id: "seal-5", label: "🎟️ CORTESIA ESPECIAL", color: "bg-sky-600 text-white" },
  { id: "seal-6", label: "💰 15% OFF", color: "bg-emerald-500 text-white" },
  { id: "seal-7", label: "💰 20% OFF", color: "bg-emerald-600 text-white" },
  { id: "seal-8", label: "💰 30% OFF", color: "bg-emerald-700 text-white" },
  { id: "seal-9", label: "💰 50% OFF", color: "bg-red-700 text-white" },
];

export default function NewListingWizardModal({
  isAdmin = false,
  currentUserPartnerId = null,
  onClose,
  onSaveListing,
}: {
  isAdmin?: boolean;
  currentUserPartnerId?: string | null;
  onClose: () => void;
  onSaveListing: (listing: ListingOffer) => void;
}) {
  const partners = getStoredPartners();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const defaultPartner = partners.find((p) => p.id === currentUserPartnerId) || partners[0] || null;
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    currentUserPartnerId || (defaultPartner ? defaultPartner.id : ""),
  );
  const [category, setCategory] = useState<"passeios" | "hoteis" | "restaurantes" | "cupons">(
    "passeios",
  );

  // Common Offer State
  const [title, setTitle] = useState("");
  const [storePrice, setStorePrice] = useState<string>("100");
  const [travelerPrice, setTravelerPrice] = useState<string>("85");
  const [premiumPrice, setPremiumPrice] = useState<string>("70");
  const [expirationDate, setExpirationDate] = useState<string>("2026-12-31");
  const [discountSeal, setDiscountSeal] = useState<string>("🔥 IMPERDÍVEL");

  // Category Specific State:
  // Passeio:
  const [trailName, setTrailName] = useState("");

  // Hospedagem:
  const [roomName, setRoomName] = useState("");
  const [guestCapacity, setGuestCapacity] = useState("2 pessoas");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");

  // Location coordinates
  const [lat, setLat] = useState<number>(defaultPartner?.lat || -22.9068);
  const [lng, setLng] = useState<number>(defaultPartner?.lng || -43.1729);

  // Step 3 State
  const [imageUrl, setImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  );
  const [description, setDescription] = useState("");

  const activePartner = partners.find((p) => p.id === selectedPartnerId) || defaultPartner;

  function handleNextStep() {
    if (step === 1) {
      if (!selectedPartnerId) {
        return toast.error("Selecione um parceiro válido para continuar.");
      }
      setStep(2);
    } else if (step === 2) {
      if (category === "passeios" && !trailName.trim()) {
        return toast.error("Informe o Nome da Trilha ou Rota.");
      }
      if (category === "hoteis" && !roomName.trim()) {
        return toast.error("Informe o Nome do Quarto ou Suíte.");
      }
      if (!title.trim()) {
        setTitle(
          category === "passeios"
            ? trailName.trim()
            : category === "hoteis"
              ? roomName.trim()
              : "Oferta Especial",
        );
      }
      setStep(3);
    }
  }

  function handleSubmit() {
    if (!activePartner) return toast.error("Selecione o parceiro.");
    if (!description.trim()) {
      return toast.error("Preencha a descrição detalhada.");
    }

    const finalTitle =
      title.trim() ||
      (category === "passeios"
        ? `Passeio: ${trailName}`
        : category === "hoteis"
          ? `Hospedagem: ${roomName}`
          : "Oferta Especial");

    const newOffer: ListingOffer = {
      id: `offer-${Date.now()}`,
      title: finalTitle,
      category,
      partner_id: activePartner.id,
      partner_name: activePartner.store_name,
      partner_phone: activePartner.phone,
      city: activePartner.city,
      store_price: parseFloat(storePrice) || 0,
      traveler_price: parseFloat(travelerPrice) || 0,
      premium_price: parseFloat(premiumPrice) || 0,
      expiration_date: expirationDate,
      discount_seal: discountSeal,
      image_url:
        imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      description: description.trim(),
      lat,
      lng,
      status: isAdmin ? "approved" : "pending",
      active: isAdmin ? true : false,
      trail_name: category === "passeios" ? trailName.trim() : undefined,
      room_name: category === "hoteis" ? roomName.trim() : undefined,
      guest_capacity: category === "hoteis" ? guestCapacity : undefined,
      check_in_time: category === "hoteis" ? checkInTime : undefined,
      check_out_time: category === "hoteis" ? checkOutTime : undefined,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const savedRaw = localStorage.getItem("borapass:custom-listings");
        const current = savedRaw ? JSON.parse(savedRaw) : [];
        localStorage.setItem("borapass:custom-listings", JSON.stringify([newOffer, ...current]));
      } catch {
        /* fallback */
      }
    }

    onSaveListing(newOffer);
    toast.success(`🎉 Oferta "${newOffer.title}" cadastrada com sucesso!`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-y-auto max-h-[92vh] rounded-3xl bg-background p-6 shadow-elevated border border-border"
      >
        {/* Header with Step Indicator */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              Etapa {step} de 3
            </span>
            <h2 className="text-base font-extrabold text-foreground">
              {step === 1 && "1. Identificação do Parceiro & Categoria"}
              {step === 2 &&
                `2. Detalhes de ${category === "passeios" ? "Passeio" : category === "hoteis" ? "Hospedagem" : category === "restaurantes" ? "Gastronomia" : "Cupom"}`}
              {step === 3 && "3. Fotos, Detalhes & Publicação"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-brand transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: PARCEIRO & CATEGORIA */}
        {step === 1 && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Parceiro Anunciante
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
                  {activePartner?.logo_url ? (
                    <img
                      src={activePartner.logo_url}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-white font-bold">
                      🏪
                    </div>
                  )}
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

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                Categoria da Oferta
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "passeios", label: "Passeio", emoji: "🎢" },
                  { id: "hoteis", label: "Hospedagem", emoji: "🏨" },
                  { id: "restaurantes", label: "Gastronomia", emoji: "🍽️" },
                  { id: "cupons", label: "Cupom Grátis", emoji: "🎟️" },
                ].map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`flex items-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition shadow-sm ${
                        active
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                          : "border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span> {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY SPECIFIC FIELDS */}
        {step === 2 && (
          <div className="mt-5 space-y-4">
            {/* 1. PASSEIO FIELDS */}
            {category === "passeios" && (
              <div className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Nome da Trilha ou Rota do Passeio
                  </label>
                  <input
                    type="text"
                    required
                    value={trailName}
                    onChange={(e) => {
                      setTrailName(e.target.value);
                      setTitle(e.target.value);
                    }}
                    placeholder="ex: Trilha da Pedra da Gávea ou Rota das 12 Ilhas de Angra"
                    className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary shadow-soft"
                  />
                </div>

                <div>
                  <PartnerMapPicker
                    initialLat={lat}
                    initialLng={lng}
                    onSelectCoords={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                  />
                </div>
              </div>
            )}

            {/* 2. HOSPEDAGEM FIELDS */}
            {category === "hoteis" && (
              <div className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Nome do Quarto ou Suíte
                  </label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      setTitle(e.target.value);
                    }}
                    placeholder="ex: Suíte Master Vista Mar com Hidro"
                    className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary shadow-soft"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                      Capacidade
                    </label>
                    <select
                      value={guestCapacity}
                      onChange={(e) => setGuestCapacity(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-2 py-2 text-xs outline-none"
                    >
                      <option value="1 pessoa">1 pessoa</option>
                      <option value="2 pessoas (Casal)">2 pessoas</option>
                      <option value="3 pessoas">3 pessoas</option>
                      <option value="4 pessoas (Família)">4 pessoas</option>
                      <option value="5+ pessoas">5+ pessoas</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                      Check-in
                    </label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-2 py-2 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                      Check-out
                    </label>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-2 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <PartnerMapPicker
                    initialLat={lat}
                    initialLng={lng}
                    onSelectCoords={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                  />
                </div>
              </div>
            )}

            {/* COMMON PRICING & DISCOUNT SEALS FOR ALL CATEGORIES */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                Tabela de Preços Diferenciados (R$)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="mb-1 block text-[10px] font-extrabold uppercase text-muted-foreground">
                    Preço da Loja
                  </span>
                  <input
                    type="number"
                    value={storePrice}
                    onChange={(e) => setStorePrice(e.target.value)}
                    placeholder="100.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] font-extrabold uppercase text-sky-600 dark:text-sky-400">
                    Viajante Comum
                  </span>
                  <input
                    type="number"
                    value={travelerPrice}
                    onChange={(e) => setTravelerPrice(e.target.value)}
                    placeholder="85.00"
                    className="w-full rounded-xl border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-xs font-black text-sky-600 dark:text-sky-400 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400">
                    Viajante Premium
                  </span>
                  <input
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                    placeholder="70.00"
                    className="w-full rounded-xl border border-purple-500/50 bg-purple-500/10 px-3 py-2 text-xs font-black text-purple-600 dark:text-purple-400 outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Data em que a Oferta Expira
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>

            {/* Discount Seals */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                Selo de Desconto Promocional
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DISCOUNT_SEALS.map((seal) => {
                  const active = discountSeal === seal.label;
                  return (
                    <button
                      key={seal.id}
                      type="button"
                      onClick={() => setDiscountSeal(seal.label)}
                      className={`rounded-full px-3 py-1 text-[11px] font-black transition shadow-sm ${
                        seal.color
                      } ${active ? "ring-2 ring-primary scale-105" : "opacity-75 hover:opacity-100"}`}
                    >
                      {seal.label} {active && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FOTOS, DETALHES & PUBLICAÇÃO */}
        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Foto Principal (Enviar do Computador ou URL)
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
                            toast.success("Foto do computador carregada com sucesso!");
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
                      Clique aqui para selecionar uma foto no seu computador 🖥️
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
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full rounded-2xl border border-border bg-card px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
                  />
                </div>

                {/* Live Preview */}
                {imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-border h-40 bg-slate-900 group">
                    <img
                      src={imageUrl}
                      alt="Pré-visualização da foto"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white">
                      📷 Pré-visualização da Foto
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

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Descrição Completa da Oferta / Ambiente
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva itens inclusos, regras de uso, facilidades, fotos adicionais..."
                className="w-full rounded-2xl border border-border bg-card p-3 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>

            {/* Summary Preview Box */}
            <div className="rounded-2xl border border-border bg-secondary/50 p-3.5 space-y-1.5 text-xs">
              <p className="font-extrabold text-foreground flex items-center justify-between">
                <span>
                  {title ||
                    (category === "passeios"
                      ? trailName
                      : category === "hoteis"
                        ? roomName
                        : "Oferta Especial")}
                </span>
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary">
                  {discountSeal}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Parceiro: <strong>{activePartner?.store_name}</strong> · {activePartner?.city}
              </p>

              {category === "hoteis" && (
                <p className="text-[11px] text-primary font-semibold">
                  🛏️ {roomName} · {guestCapacity} · Check-in: {checkInTime} / Out: {checkOutTime}
                </p>
              )}

              {category === "passeios" && (
                <p className="text-[11px] text-primary font-semibold">
                  🎢 Trilha/Rota: {trailName}
                </p>
              )}

              <div className="flex gap-3 text-[11px] pt-1 border-t border-border/50">
                <span>
                  Balcão:{" "}
                  <strong className="line-through text-muted-foreground">R$ {storePrice}</strong>
                </span>
                <span>
                  Viajante: <strong className="text-sky-600 font-bold">R$ {travelerPrice}</strong>
                </span>
                <span>
                  Premium: <strong className="text-purple-600 font-bold">R$ {premiumPrice}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand active:scale-95"
            >
              Avançar <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-brand px-6 py-2.5 text-xs font-black text-white shadow-brand active:scale-95"
            >
              <Check className="h-4 w-4" /> Publicar Oferta ✨
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
