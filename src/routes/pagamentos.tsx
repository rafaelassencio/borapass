/**
 * /pagamentos — Histórico Financeiro do Usuário
 * Mostra pagamentos e assinaturas reais do Asaas via Supabase.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  CreditCard, QrCode, Sparkles, CheckCircle2, Clock, XCircle,
  RotateCcw, ChevronLeft, Wallet, AlertCircle, CalendarDays, RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getStatusLabel, formatCurrency, type PaymentStatus } from "@/lib/asaas";
import { PaymentModal } from "@/components/PaymentModal";
import { cancelSubscription } from "@/lib/asaas";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamentos")({
  head: () => ({ meta: [{ title: "Histórico Financeiro — Bora Pass" }] }),
  component: PagamentosPage,
});

interface Payment {
  id: string;
  payment_id_asaas: string;
  billing_type: string;
  description: string;
  value: number;
  status: PaymentStatus;
  payment_date: string | null;
  created_at: string;
  invoice_url: string | null;
}

interface Subscription {
  id: string;
  subscription_id_asaas: string;
  plan: string;
  value: number;
  cycle: string;
  status: string;
  next_due_date: string | null;
  created_at: string;
}

export function PagamentosPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"payments" | "subscriptions">("subscriptions");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    // Cast to any because payments/subscriptions tables are new and not yet in auto-generated types.ts
    // They will be added automatically when Supabase applies the migration.
    const db = supabase as any;
    const [paymentsRes, subscriptionsRes] = await Promise.all([
      db
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
    ]);
    setPayments((paymentsRes.data ?? []) as Payment[]);
    setSubscriptions((subscriptionsRes.data ?? []) as Subscription[]);
    setLoading(false);
  }

  async function handleCancelSubscription(subId: string) {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura Premium?")) return;
    setCancelling(true);
    const { error } = await cancelSubscription();
    setCancelling(false);
    if (error) {
      toast.error(`Erro ao cancelar: ${error}`);
    } else {
      toast.success("Assinatura cancelada. Acesso Premium mantido até fim do período.");
      fetchData();
    }
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Histórico Financeiro" />
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Faça login para ver seu histórico financeiro.</p>
          <Link to="/login" className="inline-block rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white">
            Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  const activeSubscription = subscriptions.find(s => s.status === "ACTIVE");
  const totalPaid = payments
    .filter(p => p.status === "RECEIVED" || p.status === "CONFIRMED")
    .reduce((sum, p) => sum + p.value, 0);

  return (
    <AppShell>
      <PageHeader
        title="Histórico Financeiro"
        subtitle="Seus pagamentos e assinatura Bora Pass"
      />

      <div className="px-5 pt-4 pb-24 space-y-5">
        {/* Banner de assinatura ativa */}
        {activeSubscription ? (
          <div className="rounded-3xl bg-gradient-hero p-5 text-white shadow-brand relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200">
                      Assinatura Ativa
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg font-black">Bora Pass Premium ✨</h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    {formatCurrency(activeSubscription.value)}/mês • Próximo pagamento:{" "}
                    {activeSubscription.next_due_date
                      ? new Date(activeSubscription.next_due_date).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur text-2xl">
                  👑
                </div>
              </div>
              <button
                onClick={() => handleCancelSubscription(activeSubscription.subscription_id_asaas)}
                disabled={cancelling}
                className="mt-3 text-[10px] font-bold text-white/60 underline hover:text-white/90"
              >
                {cancelling ? "Cancelando..." : "Cancelar assinatura"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-amber-500/40 bg-amber-500/5 p-5 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
            <div>
              <p className="font-extrabold text-foreground">Sem assinatura ativa</p>
              <p className="text-xs text-muted-foreground mt-0.5">Assine o Premium por R$ 19,90/mês</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 text-xs font-black text-black shadow-brand"
            >
              ✨ Assinar Premium
            </button>
          </div>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Pagamentos</p>
            <p className="text-2xl font-black text-foreground mt-1">{payments.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Pago</p>
            <p className="text-xl font-black text-primary mt-1">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["subscriptions", "payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tab === "subscriptions" ? "📋 Assinaturas" : "💳 Pagamentos"}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        )}

        {/* Tab: Subscriptions */}
        {!loading && activeTab === "subscriptions" && (
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Nenhuma assinatura encontrada.
              </div>
            ) : subscriptions.map((sub) => (
              <div key={sub.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-sm font-extrabold text-foreground">Bora Pass Premium</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    sub.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {sub.status === "ACTIVE" ? "✅ Ativa" : "✖ Inativa"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {formatCurrency(sub.value)}/mês</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />
                    Desde: {new Date(sub.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {sub.next_due_date && (
                    <span className="flex items-center gap-1 col-span-2"><Clock className="h-3 w-3" />
                      Próximo vencimento: {new Date(sub.next_due_date).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Payments */}
        {!loading && activeTab === "payments" && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Nenhum pagamento encontrado.
              </div>
            ) : payments.map((payment) => {
              const statusInfo = getStatusLabel(payment.status);
              return (
                <div key={payment.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {payment.billing_type === "PIX" ? (
                        <QrCode className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {payment.description || "Pagamento Bora Pass"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {payment.billing_type === "PIX" ? "PIX" : "Cartão"} •{" "}
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleDateString("pt-BR")
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-foreground">{formatCurrency(payment.value)}</p>
                      <span className={`text-[10px] font-bold ${statusInfo.color}`}>
                        {statusInfo.emoji} {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  {payment.invoice_url && (
                    <a
                      href={payment.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary underline"
                    >
                      Ver comprovante ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botão atualizar */}
        {!loading && (
          <button
            onClick={fetchData}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary py-2.5 text-xs font-bold text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        )}
      </div>

      {/* Modal de pagamento */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        value={19.90}
        description="Bora Pass Premium"
        type="subscription"
        onSuccess={() => {
          setShowPaymentModal(false);
          fetchData();
        }}
      />
    </AppShell>
  );
}
