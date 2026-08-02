import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Lock,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Assinar Bora Pass Premium — Checkout" }] }),
  component: CheckoutPage,
});

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // EXIGÊNCIA: O usuário deve estar logado para assinar ou comprar no app
  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Assinar Bora Pass Premium" />
        <div className="p-8 text-center space-y-5 animate-fadeIn">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Lock className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-foreground">Faça login para assinar</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Para assinar o Bora Pass Premium e desbloquear descontos exclusivos em passeios,
              hospedagens e cupons, você precisa estar conectado.
            </p>
          </div>
          <button
            onClick={() => {
              toast.info("🔒 Por favor, faça login ou cadastre-se!");
              navigate({ to: "/login" });
            }}
            className="rounded-2xl bg-gradient-brand px-6 py-3.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition"
          >
            Entrar ou Cadastrar-se 🚀
          </button>
        </div>
      </AppShell>
    );
  }

  const [plan, setPlan] = useState<"mensal" | "anual">("anual");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [processing, setProcessing] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);

    try {
      if (user) {
        // Upgrade user metadata in Supabase Auth
        await supabase.auth.updateUser({
          data: { is_premium: true, role: "premium" },
        });

        // Insert role in user_roles
        await supabase.from("user_roles").upsert({
          user_id: user.id,
          role: "premium",
        });
      }

      // Persist local state
      localStorage.setItem("borapass:user-premium", "true");

      toast.success("Parabéns! Sua assinatura Bora Pass Premium foi ativada com sucesso! 🌟");
      navigate({ to: "/cupons" });
    } catch {
      toast.error("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Checkout Premium 🌟"
        subtitle="Desbloqueie todos os cupons VIP e vantagens exclusivas"
      />

      <div className="px-5 pt-4 space-y-5">
        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-hero p-6 text-white shadow-brand relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Membro Viajante Premium
          </div>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight">
            Economize em todos os seus passeios e refeições
          </h2>
          <p className="mt-1.5 text-xs text-white/85">
            Acesso ilimitado a todos os cupons VIPs, descontos em restaurantes parceiros e
            hospedagens selecionadas.
          </p>
        </div>

        {/* Seleção do Plano */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Escolha seu Plano
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setPlan("mensal")}
              className={`cursor-pointer rounded-2xl border p-4 shadow-soft transition ${
                plan === "mensal"
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Plano Mensal
              </span>
              <div className="mt-1 text-xl font-extrabold text-foreground">
                R$ 19,90 <span className="text-xs font-normal text-muted-foreground">/mês</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Cancele a qualquer momento.</p>
            </div>

            <div
              onClick={() => setPlan("anual")}
              className={`cursor-pointer relative rounded-2xl border p-4 shadow-soft transition ${
                plan === "anual"
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <span className="absolute -top-2.5 right-3 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold text-white shadow-brand">
                ECONOMIZE 20%
              </span>
              <span className="text-[11px] font-bold text-primary uppercase">Plano Anual</span>
              <div className="mt-1 text-xl font-extrabold text-foreground">
                R$ 199,00 <span className="text-xs font-normal text-muted-foreground">/ano</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Equivalente a R$ 16,58/mês.</p>
            </div>
          </div>
        </div>

        {/* Benefícios Inclusos */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            Incluso na Assinatura:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Acesso a <strong>Cupons Exclusivos Premium</strong> com até 50% OFF
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Descontos especiais em Hospedagens e Pousadas</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Alertas diários personalizados no Planejador de Viagem</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Suporte Prioritário 24/7</span>
            </div>
          </div>
        </div>

        {/* Formulário de Pagamento */}
        <form
          onSubmit={handleCheckout}
          className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
        >
          <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
            Forma de Pagamento
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border transition ${
                paymentMethod === "pix"
                  ? "bg-primary text-white border-primary shadow-brand"
                  : "bg-background text-foreground border-border"
              }`}
            >
              <QrCode className="h-4 w-4" /> Pix Instantâneo
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border transition ${
                paymentMethod === "card"
                  ? "bg-primary text-white border-primary shadow-brand"
                  : "bg-background text-foreground border-border"
              }`}
            >
              <CreditCard className="h-4 w-4" /> Cartão de Crédito
            </button>
          </div>

          {paymentMethod === "pix" ? (
            <div className="rounded-2xl bg-secondary p-4 text-center space-y-2">
              <QrCode className="mx-auto h-12 w-12 text-primary" />
              <p className="text-xs font-bold text-foreground">
                Aprovação Imediata via QR Code Pix
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ao clicar no botão abaixo, a sua chave Pix será gerada para pagamento rápido.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                  Nome Impresso no Cartão
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="NOME COMO NO CARTÃO"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/AA"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-bold text-white shadow-brand transition active:scale-95 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />{" "}
            {processing
              ? "Processando..."
              : `Confirmar Assinatura (${plan === "anual" ? "R$ 199,00/ano" : "R$ 199,00/mês"})`}
          </button>

          <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Pagamento 100% Seguro ·
            Criptografia SSL 256 bits
          </p>
        </form>
      </div>
    </AppShell>
  );
}
