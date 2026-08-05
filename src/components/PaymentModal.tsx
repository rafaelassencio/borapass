/**
 * src/components/PaymentModal.tsx
 * Modal completo de pagamento: PIX ou Cartão.
 * Coleta dados do cliente, exibe QR Code, polling em tempo real.
 */
import { useState } from "react";
import {
  X, QrCode, CreditCard, Sparkles, ShieldCheck,
  Loader2, CheckCircle2, ChevronRight, Lock, User, Phone, Mail, MapPin
} from "lucide-react";
import { useAsaas } from "@/hooks/use-asaas";
import { useAuth } from "@/hooks/use-auth";
import { PixQrCode } from "@/components/PixQrCode";
import { formatCurrency, type CreditCardData, type CreditCardHolderInfo } from "@/lib/asaas";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Valor em reais */
  value: number;
  /** Descrição da cobrança */
  description: string;
  /** "subscription" ou "single" */
  type?: "subscription" | "single";
  /** Callback chamado após confirmação do pagamento */
  onSuccess?: () => void;
}

type Step = "method" | "customer" | "pix" | "card" | "success";

export function PaymentModal({
  isOpen,
  onClose,
  value,
  description,
  type = "subscription",
  onSuccess,
}: PaymentModalProps) {
  const { user } = useAuth();
  const asaas = useAsaas();

  const [step, setStep] = useState<Step>("method");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

  // Dados do cliente
  const [customerName, setCustomerName] = useState(user?.user_metadata?.full_name ?? "");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  // Dados do cartão
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardMonth, setCardMonth] = useState("");
  const [cardYear, setCardYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");

  // ID do customer Asaas
  const [customerId, setCustomerId] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleClose() {
    asaas.stopPolling();
    setStep("method");
    onClose();
  }

  async function handleProceedToCustomer() {
    setStep("customer");
  }

  async function handleSubmitCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !cpfCnpj || !email) return;

    const id = await asaas.ensureCustomer({
      name: customerName,
      cpfCnpj,
      email,
      phone,
    });
    if (!id) return;

    setCustomerId(id);
    setStep(paymentMethod === "pix" ? "pix" : "card");

    if (paymentMethod === "pix") {
      // Criar cobrança PIX imediatamente
      if (type === "subscription") {
        const subId = await asaas.subscribePremium({
          customerId: id,
          billingType: "PIX",
        });
        if (subId) {
          // Para assinatura PIX, criar também o primeiro pagamento para exibir QR Code
          await asaas.startPixPayment({
            customerId: id,
            value,
            description,
          });
        }
      } else {
        await asaas.startPixPayment({ customerId: id, value, description });
      }
    }
  }

  async function handleSubmitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;

    const creditCard: CreditCardData = {
      holderName: cardHolder,
      number: cardNumber.replace(/\s/g, ""),
      expiryMonth: cardMonth,
      expiryYear: cardYear,
      ccv: cardCvv,
    };
    const holderInfo: CreditCardHolderInfo = {
      name: customerName,
      email,
      cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      postalCode: postalCode.replace(/\D/g, ""),
      addressNumber,
      phone: phone.replace(/\D/g, ""),
    };

    let confirmed = false;

    if (type === "subscription") {
      const subId = await asaas.subscribePremium({
        customerId,
        billingType: "CREDIT_CARD",
        creditCard,
        holderInfo,
      });
      confirmed = !!subId;
    } else {
      const result = await asaas.startCardPayment({
        customerId,
        value,
        description,
        creditCard,
        holderInfo,
      });
      confirmed = !!result && (result.status === "CONFIRMED" || result.status === "RECEIVED");
    }

    if (confirmed) {
      setStep("success");
      onSuccess?.();
    }
  }

  // Observar confirmação do PIX para avançar ao sucesso
  if (asaas.isPaymentConfirmed && step === "pix") {
    setStep("success");
    onSuccess?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-elevated space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {step === "success" ? "Pagamento Confirmado! 🎉" : description}
            </h2>
            {step !== "success" && (
              <p className="text-xl font-black text-primary mt-0.5">
                {formatCurrency(value)}{type === "subscription" ? "/mês" : ""}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP: Método de pagamento */}
        {step === "method" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Escolha como deseja pagar:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("pix")}
                className={`rounded-2xl border p-4 text-center space-y-2 transition ${
                  paymentMethod === "pix"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border bg-secondary"
                }`}
              >
                <QrCode className={`h-8 w-8 mx-auto ${paymentMethod === "pix" ? "text-emerald-600" : "text-muted-foreground"}`} />
                <p className="text-sm font-extrabold text-foreground">PIX</p>
                <p className="text-[10px] text-muted-foreground">Instantâneo · Sem taxas</p>
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`rounded-2xl border p-4 text-center space-y-2 transition ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary"
                }`}
              >
                <CreditCard className={`h-8 w-8 mx-auto ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-extrabold text-foreground">Cartão</p>
                <p className="text-[10px] text-muted-foreground">Crédito · 1x sem juros</p>
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 p-3 text-[10px] text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Pagamento 100% seguro via <strong>Asaas</strong>. Seus dados são criptografados.</span>
            </div>

            <button
              onClick={handleProceedToCustomer}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-bold text-white shadow-brand active:scale-95 transition"
            >
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP: Dados do cliente */}
        {step === "customer" && (
          <form onSubmit={handleSubmitCustomer} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seus dados para cobrança
            </p>

            {[
              { label: "Nome completo", value: customerName, onChange: setCustomerName, icon: User, placeholder: "Seu nome completo", required: true },
              { label: "CPF ou CNPJ", value: cpfCnpj, onChange: setCpfCnpj, icon: ShieldCheck, placeholder: "000.000.000-00", required: true },
              { label: "E-mail", value: email, onChange: setEmail, icon: Mail, placeholder: "seu@email.com", required: true },
              { label: "Telefone (opcional)", value: phone, onChange: setPhone, icon: Phone, placeholder: "(11) 99999-9999", required: false },
            ].map(({ label, value: val, onChange, icon: Icon, placeholder, required }) => (
              <div key={label} className="space-y-1">
                <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            {asaas.error && (
              <p className="text-xs text-red-500 font-semibold bg-red-500/10 rounded-xl p-3">
                ⚠️ {asaas.error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("method")}
                className="w-1/3 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={asaas.loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60"
              >
                {asaas.loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
                ) : (
                  <>{paymentMethod === "pix" ? "Gerar QR Code PIX" : "Ir para Cartão"} <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP: PIX */}
        {step === "pix" && (
          <div className="space-y-4">
            {asaas.loading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando QR Code PIX...</p>
              </div>
            ) : asaas.pixData ? (
              <PixQrCode
                qrcodeBase64={asaas.pixData.pix_qrcode}
                copyPaste={asaas.pixData.pix_copy_paste}
                expirationDate={asaas.pixData.expiration_date}
                status={asaas.paymentStatus}
                onRefresh={() => {
                  if (customerId) {
                    asaas.startPixPayment({ customerId, value, description });
                  }
                }}
              />
            ) : asaas.error ? (
              <p className="text-xs text-red-500 bg-red-500/10 rounded-xl p-3">⚠️ {asaas.error}</p>
            ) : null}
          </div>
        )}

        {/* STEP: Cartão */}
        {step === "card" && (
          <form onSubmit={handleSubmitCard} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Dados do Cartão
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome no cartão"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())}
                maxLength={19}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="MM" value={cardMonth} onChange={(e) => setCardMonth(e.target.value)} maxLength={2} required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-center outline-none focus:ring-2 focus:ring-primary" />
                <input type="text" placeholder="AAAA" value={cardYear} onChange={(e) => setCardYear(e.target.value)} maxLength={4} required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-center outline-none focus:ring-2 focus:ring-primary" />
                <input type="text" placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4} required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-center outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Endereço do titular
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="CEP" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="Nº" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {asaas.error && (
              <p className="text-xs text-red-500 font-semibold bg-red-500/10 rounded-xl p-3">
                💳 {asaas.error}
              </p>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>Dados criptografados • Processado pela Asaas</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("customer")}
                className="w-1/3 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={asaas.loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60"
              >
                {asaas.loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
                ) : (
                  <>Pagar {formatCurrency(value)}</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP: Sucesso */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-500/15 border-2 border-emerald-500">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">Tudo certo! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {type === "subscription"
                  ? "Seu plano Bora Pass Premium foi ativado com sucesso!"
                  : "Pagamento confirmado! Aproveite sua experiência."}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-2xl bg-gradient-brand px-6 py-3 text-sm font-bold text-white shadow-brand"
            >
              Continuar explorando ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
