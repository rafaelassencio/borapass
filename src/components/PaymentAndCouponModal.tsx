import { useState } from "react";
import {
  X,
  CheckCircle2,
  Ticket,
  QrCode,
  Copy,
  CreditCard,
  Sparkles,
  Calendar,
  Plus,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  findTripForCity,
  addActivityToTrip,
  createQuickTripPlan,
  getSavedTrips,
} from "@/lib/trip-helper";

import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

type ListingItem = {
  id: string;
  title: string;
  category: string;
  city?: string | null;
  city_id?: string | null;
  price?: number | null;
  store_price?: number | null;
  traveler_price?: number | null;
  premium_price?: number | null;
  discount?: string | null;
  image_url?: string | null;
  description?: string | null;
  address?: string | null;
  offer_type?: "price" | "perk";
  expires_at?: string | null;
  partner_id?: string;
  partner_name?: string;
};

interface Props {
  listing: ListingItem;
  mode: "pay" | "coupon" | "add_to_trip";
  onClose: () => void;
}

export function PaymentAndCouponModal({ listing, mode: initialMode, onClose }: Props) {
  const { user } = useAuth();
  const { isPremium } = useRoles(user?.id);
  const [mode, setMode] = useState<"pay" | "coupon" | "add_to_trip">(initialMode);
  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [success, setSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const navigate = useNavigate();

  // EXIGÊNCIA: O usuário deve estar logado para resgatar cupons ou efetuar compras
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
        <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 space-y-5 text-center shadow-elevated">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <ShieldCheck className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-foreground">Login Necessário</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para resgatar cupons, comprar ingressos ou adicionar experiências à sua viagem, você
              precisa estar conectado à sua conta.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border bg-background py-3 text-xs font-bold text-foreground hover:bg-secondary transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onClose();
                toast.info("🔒 Por favor, faça login para continuar!");
                navigate({ to: "/login" });
              }}
              className="flex-1 rounded-2xl bg-gradient-brand py-3 text-xs font-black text-white shadow-brand transition hover:opacity-95"
            >
              Entrar ou Cadastrar-se 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find existing trip for city
  const cityName = listing.city || "Sua Cidade";
  const existingTrip = findTripForCity(listing.city, listing.city_id);

  const priceValue =
    listing.traveler_price ??
    listing.price ??
    (listing.store_price ? listing.store_price * 0.8 : 0);
  const isFree = priceValue === 0 || listing.offer_type === "perk" || listing.category === "cupom";

  function generatePassCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PASS-${code}`;
  }

  function handleRedeemFreeCoupon() {
    // Regra: Viajante comum pode emitir apenas 1 cupom por dia. Viajante Premium não tem limite!
    if (!isPremium && typeof window !== "undefined") {
      const savedRaw = localStorage.getItem("borapass:redeemed-coupons");
      const current = savedRaw ? JSON.parse(savedRaw) : [];
      const todayStr = new Date().toISOString().split("T")[0];

      const redeemedToday = current.filter((item: any) => {
        if (!item.redeemed_at) return false;
        return new Date(item.redeemed_at).toISOString().split("T")[0] === todayStr;
      });

      if (redeemedToday.length >= 1) {
        toast.error(
          "🔒 Limite diário atingido! Usuários do plano gratuito podem emitir apenas 1 cupom por dia. Assine o Bora Pass Premium para resgatar sem limites!",
        );
        return;
      }
    }

    const code = generatePassCode();
    setCouponCode(code);

    // Save to local storage redeemed coupons
    if (typeof window !== "undefined") {
      const savedRaw = localStorage.getItem("borapass:redeemed-coupons");
      const current = savedRaw ? JSON.parse(savedRaw) : [];
      const item = {
        id: `redeem-${Date.now()}`,
        listing_id: listing.id,
        partner_id: listing.partner_id,
        partner_name: listing.partner_name || listing.city || "Estabelecimento Parceiro",
        title: listing.title,
        city: listing.city,
        code,
        discount: listing.discount || "Cortesia Grátis",
        status: "valid",
        redeemed_at: new Date().toISOString(),
      };
      localStorage.setItem("borapass:redeemed-coupons", JSON.stringify([item, ...current]));
    }

    setSuccess(true);
    toast.success("🎉 Cupom grátis resgatado com sucesso!");
  }

  function handleConfirmPayment() {
    const ticketCode = generatePassCode();
    setCouponCode(ticketCode);

    // Save to local storage purchased tickets
    if (typeof window !== "undefined") {
      const savedRaw = localStorage.getItem("borapass:purchased-tickets");
      const current = savedRaw ? JSON.parse(savedRaw) : [];
      const item = {
        id: `ticket-${Date.now()}`,
        listing_id: listing.id,
        title: listing.title,
        city: listing.city,
        price: priceValue,
        code: ticketCode,
        purchased_at: new Date().toISOString(),
      };
      localStorage.setItem("borapass:purchased-tickets", JSON.stringify([item, ...current]));
    }

    setSuccess(true);
    toast.success("✅ Pagamento confirmado! Ingresso emitido.");
  }

  function handleAddToExistingTrip() {
    if (!existingTrip) return;
    const added = addActivityToTrip(existingTrip.id, listing, selectedDay);
    if (added) {
      toast.success(
        `🎉 "${listing.title}" adicionado ao Dia ${selectedDay} da sua viagem para ${cityName}!`,
      );
      onClose();
    }
  }

  function handleCreateQuickTrip() {
    const newTrip = createQuickTripPlan(cityName, {
      id: listing.id,
      title: listing.title,
      category: listing.category,
      price: priceValue,
      image: listing.image_url,
    });
    toast.success(`🎉 Viagem criada! Passeio adicionado ao Dia 1 do seu roteiro em ${cityName}.`);
    onClose();
  }

  function handleGoToPlanner() {
    onClose();
    navigate({ to: "/planejar" });
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(couponCode || "BORA-PASS-VOUCHER")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            {mode === "pay" ? (
              <CreditCard className="h-5 w-5 text-primary" />
            ) : mode === "coupon" ? (
              <Ticket className="h-5 w-5 text-accent" />
            ) : (
              <Calendar className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-bold text-foreground">
              {mode === "pay"
                ? "Pagamento Seguro"
                : mode === "coupon"
                  ? "Resgatar Cupom Grátis"
                  : "Adicionar à Viagem"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SUCCESS SCREEN */}
        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500 shadow-brand">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground">
                {mode === "pay" ? "Ingresso Confirmado!" : "Cupom Resgatado!"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Apresente este QR Code no estabelecimento parceiro em {cityName}.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-hero p-5 text-white shadow-brand text-center space-y-2">
              <img
                src={qrUrl}
                alt="Voucher QR Code"
                className="mx-auto h-44 w-44 rounded-2xl bg-white p-3 border-2 border-white/40 shadow-brand"
              />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200 pt-1">
                CÓDIGO OFICIAL DO CUPOM
              </p>
              <div className="rounded-2xl bg-black/30 py-2 px-4 backdrop-blur border border-white/20 inline-block">
                <p className="font-mono text-3xl font-black tracking-widest text-white drop-shadow-md select-all">
                  {couponCode}
                </p>
              </div>
            </div>

            {/* Prompt to add tour to trip plan after purchase */}
            <div className="rounded-2xl bg-secondary/50 p-3.5 space-y-2 border border-border">
              <p className="text-xs font-bold text-foreground">
                Deseja adicionar esta atração ao seu roteiro de viagem?
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setMode("add_to_trip");
                }}
                className="w-full rounded-xl bg-gradient-brand py-2 text-xs font-bold text-white shadow-brand"
              >
                🎒 Adicionar ao Roteiro em {cityName}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Item Card Summary */}
            <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
              {listing.image_url && (
                <img
                  src={listing.image_url}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{listing.title}</p>
                {cityName && <p className="text-xs text-muted-foreground">📍 {cityName}</p>}
                {isFree ? (
                  <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                    🎁 Gratuito / Cortesia
                  </span>
                ) : (
                  <p className="mt-1 text-sm font-black text-primary">
                    R$ {priceValue.toFixed(2)}
                    {listing.store_price && listing.store_price > priceValue && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                        R$ {listing.store_price.toFixed(2)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* MODE: PAY (PAGAMENTO) */}
            {mode === "pay" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod("pix")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition border ${
                        payMethod === "pix"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      <QrCode className="h-4 w-4" /> Pix Instantâneo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod("card")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition border ${
                        payMethod === "card"
                          ? "bg-gradient-brand text-white border-transparent shadow-brand"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" /> Cartão de Crédito
                    </button>
                  </div>
                </div>

                {payMethod === "pix" ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-3">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ⚡ Pagamento via Pix com Desconto Exclusivo
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-border inline-block mx-auto">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=BORAPASS-PIX-${listing.id}`}
                        alt="Pix QR"
                        className="h-32 w-32 mx-auto"
                      />
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `00020126580014br.gov.bcb.pix0136borapass-pix-${listing.id}`,
                        );
                        setPixCopied(true);
                        toast.success("Chave Pix copiada!");
                        setTimeout(() => setPixCopied(false), 3000);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-card border border-border py-2 text-xs font-bold text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />{" "}
                      {pixCopied ? "Copiado!" : "Copiar Chave Pix Copia e Cola"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
                    <input
                      type="text"
                      placeholder="Número do Cartão (0000 0000 0000 0000)"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Pagamento 100% seguro com garantia de reembolso Bora Pass</span>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-extrabold text-white shadow-brand transition active:scale-95"
                >
                  Confirmar Pagamento R$ {priceValue.toFixed(2)}
                </button>
              </div>
            )}

            {/* MODE: FREE COUPON (RETIRAR CUPOM GRATUITO) */}
            {mode === "coupon" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-2">
                  <span className="text-2xl">🎁</span>
                  <h4 className="text-sm font-bold text-foreground">Cupom Gratuito Bora Pass</h4>
                  <p className="text-xs text-muted-foreground">
                    Você tem direito a resgatar esta cortesia/desconto sem custo algum.
                  </p>
                </div>

                <button
                  onClick={handleRedeemFreeCoupon}
                  className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-extrabold text-white shadow-brand transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Ticket className="h-4 w-4" /> Retirar Cupom Grátis Agora
                </button>
              </div>
            )}

            {/* MODE: ADD TO TRIP (ADICIONAR À VIAGEM EM PLANEJAR) */}
            {mode === "add_to_trip" && (
              <div className="space-y-4">
                {existingTrip ? (
                  <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                      <Sparkles className="h-4 w-4" /> Viagem Encontrada em {cityName}!
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Você possui a viagem <strong>"{existingTrip.destinationCity}"</strong> (
                      {existingTrip.daysCount} dias) salva no Bora Pass.
                    </p>

                    <label className="block text-xs font-bold text-foreground">
                      Escolha o dia do roteiro:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: existingTrip.daysCount || 3 }, (_, i) => i + 1).map(
                        (d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDay(d)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                              selectedDay === d
                                ? "bg-gradient-brand text-white border-transparent shadow-brand"
                                : "bg-card border-border text-foreground hover:bg-secondary"
                            }`}
                          >
                            Dia {d}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      onClick={handleAddToExistingTrip}
                      className="mt-2 w-full rounded-xl bg-gradient-brand py-2.5 text-xs font-bold text-white shadow-brand"
                    >
                      ➕ Confirmar no Dia {selectedDay} do Roteiro
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-4 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 font-bold text-xl">
                      🗺️
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Nenhuma viagem planejada para {cityName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Você ainda não criou um roteiro de viagem para {cityName}. O que deseja fazer?
                    </p>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleCreateQuickTrip}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-xs font-bold text-white shadow-brand"
                      >
                        <Sparkles className="h-4 w-4" /> Criar Roteiro Rápido em {cityName}
                      </button>

                      <button
                        onClick={handleGoToPlanner}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-bold text-foreground hover:bg-secondary"
                      >
                        <Calendar className="h-4 w-4" /> Ir para Planejar Viagem Completa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
