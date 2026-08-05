/**
 * src/lib/asaas.ts
 * Cliente frontend para chamar as Edge Functions do Asaas.
 * A API Key do Asaas NUNCA é exposta aqui — apenas o token JWT do usuário.
 */
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// Tipos de resposta das Edge Functions
// ─────────────────────────────────────────────

export interface AsaasCustomerResponse {
  customer_id: string;
}

export interface AsaasPixPaymentResponse {
  payment_id: string;
  status: PaymentStatus;
  pix_qrcode: string;       // Base64
  pix_copy_paste: string;   // Copia e Cola
  expiration_date: string;
  invoice_url?: string;
}

export interface AsaasCardPaymentResponse {
  payment_id: string;
  status: PaymentStatus;
  invoice_url?: string;
}

export interface AsaasSubscriptionResponse {
  subscription_id: string;
  status: string;
  next_due_date: string;
  value: number;
  billing_type: string;
}

export interface AsaasPaymentStatusResponse {
  payment_id: string;
  status: PaymentStatus;
  value: number;
  billing_type: string;
  invoice_url?: string;
}

export type PaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "REFUND_IN_PROGRESS"
  | "DELETED"
  | "AWAITING_RISK_ANALYSIS"
  | "CANCELLED";

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

// ─────────────────────────────────────────────
// Helper interno: invocar Edge Function
// ─────────────────────────────────────────────

async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    body,
  });

  if (error) {
    // Extrai mensagem amigável do erro
    let message = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) message = parsed.error;
    } catch { /* não é JSON */ }
    return { data: null, error: message };
  }

  // Verifica se a resposta contém um erro da Edge Function
  if (data && typeof data === "object" && "error" in data) {
    return { data: null, error: (data as { error: string }).error };
  }

  return { data, error: null };
}

// ─────────────────────────────────────────────
// Funções públicas
// ─────────────────────────────────────────────

/**
 * Cria ou recupera um cliente Asaas para o usuário logado.
 */
export async function createAsaasCustomer(params: {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
}) {
  return invokeFunction<AsaasCustomerResponse>("create-customer", params);
}

/**
 * Cria cobrança PIX e retorna QR Code + Copia e Cola.
 */
export async function createPixPayment(params: {
  customer_id: string;
  value: number;
  description: string;
  order_id?: string;
}) {
  return invokeFunction<AsaasPixPaymentResponse>("create-pix-payment", params);
}

/**
 * Cria pagamento com cartão de crédito.
 */
export async function createCardPayment(params: {
  customer_id: string;
  value: number;
  description: string;
  credit_card: CreditCardData;
  credit_card_holder_info: CreditCardHolderInfo;
  installment_count?: number;
  order_id?: string;
}) {
  return invokeFunction<AsaasCardPaymentResponse>("create-card-payment", params);
}

/**
 * Cria assinatura mensal do Bora Pass Premium.
 */
export async function createSubscription(params: {
  customer_id: string;
  billing_type: "PIX" | "CREDIT_CARD";
  credit_card?: CreditCardData;
  credit_card_holder_info?: CreditCardHolderInfo;
}) {
  return invokeFunction<AsaasSubscriptionResponse>("create-subscription", params);
}

/**
 * Cancela a assinatura ativa do usuário.
 */
export async function cancelSubscription() {
  return invokeFunction<{ cancelled: boolean; message: string }>("cancel-subscription");
}

/**
 * Consulta o status de um pagamento pelo ID.
 */
export async function getPaymentStatus(paymentId: string) {
  return invokeFunction<AsaasPaymentStatusResponse>("get-payment-status", {
    payment_id: paymentId,
  });
}

/**
 * Retorna label amigável para o status do pagamento.
 */
export function getStatusLabel(status: PaymentStatus | string): {
  label: string;
  color: string;
  emoji: string;
} {
  const map: Record<string, { label: string; color: string; emoji: string }> = {
    PENDING: { label: "Aguardando", color: "text-amber-600", emoji: "⏳" },
    RECEIVED: { label: "Recebido", color: "text-emerald-600", emoji: "✅" },
    CONFIRMED: { label: "Confirmado", color: "text-emerald-600", emoji: "✅" },
    OVERDUE: { label: "Vencido", color: "text-red-500", emoji: "❌" },
    REFUNDED: { label: "Reembolsado", color: "text-blue-500", emoji: "↩️" },
    REFUND_IN_PROGRESS: { label: "Reembolso em andamento", color: "text-blue-400", emoji: "🔄" },
    DELETED: { label: "Cancelado", color: "text-muted-foreground", emoji: "🗑️" },
    AWAITING_RISK_ANALYSIS: { label: "Em análise", color: "text-orange-500", emoji: "🔍" },
    CANCELLED: { label: "Cancelado", color: "text-muted-foreground", emoji: "✖️" },
  };
  return map[status] ?? { label: status, color: "text-foreground", emoji: "💳" };
}

/**
 * Formata valores Asaas para exibição.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
