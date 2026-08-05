import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Zap,
  Ticket,
  Map,
  Heart,
  Bot,
  Star,
  Clock,
  ArrowRight,
  Check,
  Building2,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { PaymentModal } from "@/components/PaymentModal";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "Conheça o Viajante Premium — Bora Pass" }] }),
  component: PremiumPage,
});

export function PremiumPage() {
  const { user } = useAuth();
  const { isPremium } = useRoles(user?.id);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <AppShell>
      <PageHeader
        title="Conheça o Viajante Premium"
        subtitle="Aproveite ao máximo suas viagens com acesso ilimitado"
      />

      <div className="px-5 pt-4 space-y-6">
        {/* Banner Hero Premium */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-slate-950 p-6 text-white shadow-elevated">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-500/40">
              <Crown className="h-4 w-4 fill-amber-300" />
              Plano de Experiência Definitiva
            </div>

            <h1 className="text-2xl font-black text-white leading-tight">
              Sua viagem sem limites nem restrições
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Desbloqueie resgates ilimitados de cupons, crie roteiros sem restrição, utilize a IA
              Bora Planeja no WhatsApp e tenha acesso a ofertas exclusivas.
            </p>

            {isPremium ? (
              <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-4 text-center text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Você já possui a assinatura Viajante Premium ativa!
              </div>
            ) : user ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-5 py-4 text-xs font-black uppercase tracking-wider text-black shadow-elevated hover:brightness-110 active:scale-95 transition"
              >
                <Sparkles className="h-4 w-4 fill-black" />
                ✨ Assinar Viajante Premium — R$ 19,90/mês
              </button>
            ) : (
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-5 py-4 text-xs font-black uppercase tracking-wider text-black shadow-elevated"
              >
                Fazer login para assinar
              </Link>
            )}
          </div>
        </div>

        {/* Tabela Comparativa de Planos */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <span>📊</span> Tabela Comparativa de Planos
          </h2>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-extrabold uppercase">
                  <th className="py-3 px-3">Funcionalidade</th>
                  <th className="py-3 px-2 text-center w-24">Viajante</th>
                  <th className="py-3 px-2 text-center w-28 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Premium ✨
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Cupons por dia</td>
                  <td className="py-3 px-2 text-center text-muted-foreground">1</td>
                  <td className="py-3 px-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                    Ilimitado
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Viagens simultâneas</td>
                  <td className="py-3 px-2 text-center text-muted-foreground">1</td>
                  <td className="py-3 px-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                    Ilimitadas
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Experiências por dia</td>
                  <td className="py-3 px-2 text-center text-muted-foreground">3</td>
                  <td className="py-3 px-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                    Ilimitadas
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Favoritos</td>
                  <td className="py-3 px-2 text-center text-muted-foreground">30</td>
                  <td className="py-3 px-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                    Ilimitados
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">IA Bora Planeja</td>
                  <td className="py-3 px-2 text-center text-rose-500">
                    <XCircle className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-500 bg-amber-500/5">
                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Cupons exclusivos</td>
                  <td className="py-3 px-2 text-center text-rose-500">
                    <XCircle className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-500 bg-amber-500/5">
                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">
                    Atendimento prioritário
                  </td>
                  <td className="py-3 px-2 text-center text-rose-500">
                    <XCircle className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-500 bg-amber-500/5">
                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Campanhas exclusivas</td>
                  <td className="py-3 px-2 text-center text-rose-500">
                    <XCircle className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-500 bg-amber-500/5">
                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground">Histórico completo</td>
                  <td className="py-3 px-2 text-center text-rose-500">
                    <XCircle className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-500 bg-amber-500/5">
                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chamada Final */}
        {!isPremium && user && (
          <div className="pb-6">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-brand hover:brightness-110 active:scale-95 transition"
            >
              <Sparkles className="h-4 w-4" />
              Quero me Tornar Viajante Premium
            </button>
          </div>
        )}
      </div>

      {/* Modal de Pagamento Asaas */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        value={19.90}
        description="Bora Pass Premium"
        type="subscription"
        onSuccess={() => setShowPaymentModal(false)}
      />
    </AppShell>
  );
}
