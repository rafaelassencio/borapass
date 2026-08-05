import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  CreditCard,
  Lock,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PaymentModal } from "@/components/PaymentModal";
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

  const [plan, setPlan] = useState<"mensal" | "anual">("mensal");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const planValue = plan === "anual" ? 199.00 : 19.90;
  const planLabel = plan === "anual" ? "Bora Pass Premium Anual" : "Bora Pass Premium Mensal";

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

        {/* Botão de Checkout */}
        <div className="pb-6 space-y-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-sm font-bold text-white shadow-brand transition active:scale-95"
          >
            <Lock className="h-4 w-4" />
            Assinar Agora por {plan === "anual" ? "R$ 199,00/ano" : "R$ 19,90/mês"}
          </button>
          <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Pagamento 100% Seguro via Asaas · SSL 256 bits
          </p>
        </div>
      </div>

      {/* Modal de Pagamento Asaas */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        value={planValue}
        description={planLabel}
        type="subscription"
        onSuccess={() => {
          setShowPaymentModal(false);
          navigate({ to: "/perfil" });
        }}
      />
    </AppShell>
  );
}
