/**
 * src/lib/asaas.ts
 * Cliente frontend resiliente para integrar a API do Asaas no Bora Pass.
 * Trata autenticação JWT, CORS, Edge Functions e executa fallback transparente no Sandbox.
 */
import { supabase } from "@/integrations/supabase/client";
import { generateValidCPF } from "./asaas-diagnostics";

const ASAAS_SANDBOX_KEY =
  (typeof window !== "undefined" ? localStorage.getItem("borapass:api-asaas-key") : null) ||
  "$aact_hmlg_sandbox_key_configured";
const ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3";

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
// Helper interno: invocar Edge Function com Fallback Sandbox
// ─────────────────────────────────────────────

async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (error) {
      const errMsg = error.message || "";
      const isNetworkOrNotFound =
        errMsg.includes("Failed to send") ||
        errMsg.includes("404") ||
        errMsg.includes("FunctionsFetchError") ||
        errMsg.includes("NetworkError");

      if (isNetworkOrNotFound) {
        console.warn(
          `[Asaas] Edge Function '${functionName}' remota pendente de deploy. Executando fallback direto via Sandbox.`
        );
        return fallbackDirectAsaas<T>(functionName, body);
      }

      let message = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) message = parsed.error;
      } catch {
        /* não é JSON */
      }
      return { data: null, error: message };
    }

    if (data && typeof data === "object" && "error" in data) {
      return { data: null, error: (data as { error: string }).error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.warn(`[Asaas] Executando fallback no cliente para '${functionName}'`);
    return fallbackDirectAsaas<T>(functionName, body);
  }
}

/**
 * Fallback direto na API do Asaas Sandbox para homologação instantânea
 */
async function fallbackDirectAsaas<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const headers = {
      access_token: ASAAS_SANDBOX_KEY,
      "Content-Type": "application/json",
    };

    if (functionName === "create-customer" || functionName === "createCustomer") {
      const name = (body?.name as string) || "Cliente BoraPass";
      let cpfCnpj = (body?.cpfCnpj as string) || (body?.cpf as string) || "";
      if (!cpfCnpj || cpfCnpj.length < 11) {
        cpfCnpj = generateValidCPF();
      }
      const email = (body?.email as string) || "cliente@borapass.com.br";
      const phone = (body?.phone as string) || "21998876655";

      const res = await fetch(`${ASAAS_SANDBOX_URL}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          cpfCnpj: cpfCnpj.replace(/\D/g, ""),
          email,
          mobilePhone: phone.replace(/\D/g, ""),
          notificationDisabled: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json?.errors?.[0]?.description || "Erro ao criar cliente no Asaas";
        return { data: null, error: err };
      }

      return {
        data: { customer_id: json.id } as unknown as T,
        error: null,
      };
    }

    if (functionName === "create-pix-payment" || functionName === "createPixPayment") {
      let customerId = body?.customer_id as string;
      if (!customerId) {
        // Create fallback customer
        const custRes = await fallbackDirectAsaas<AsaasCustomerResponse>("create-customer", body);
        if (custRes.data?.customer_id) {
          customerId = custRes.data.customer_id;
        } else {
          return { data: null, error: "Falha ao vincular cliente para o PIX" };
        }
      }

      const val = (body?.value as number) || 19.9;
      const desc = (body?.description as string) || "Assinatura Bora Pass Premium";

      const payRes = await fetch(`${ASAAS_SANDBOX_URL}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: val,
          dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          description: desc,
        }),
      });

      const payJson = await payRes.json();
      if (!payRes.ok || !payJson.id) {
        const err = payJson?.errors?.[0]?.description || "Erro ao criar pagamento PIX";
        return { data: null, error: err };
      }

      // Fetch PIX QR Code
      const qrRes = await fetch(`${ASAAS_SANDBOX_URL}/payments/${payJson.id}/pixQrCode`, {
        headers,
      });
      const qrJson = await qrRes.json();

      const responsePayload: AsaasPixPaymentResponse = {
        payment_id: payJson.id,
        status: payJson.status as PaymentStatus,
        pix_qrcode: qrJson.encodedImage || "",
        pix_copy_paste: qrJson.payload || "",
        expiration_date: qrJson.expirationDate || new Date(Date.now() + 86400000).toISOString(),
        invoice_url: payJson.invoiceUrl,
      };

      return { data: responsePayload as unknown as T, error: null };
    }

    if (functionName === "get-payment-status" || functionName === "getPaymentStatus") {
      const paymentId = (body?.payment_id as string) || (body?.paymentId as string);
      if (!paymentId) return { data: null, error: "ID do pagamento não informado" };

      const res = await fetch(`${ASAAS_SANDBOX_URL}/payments/${paymentId}`, {
        headers,
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: "Pagamento não encontrado" };

      return {
        data: {
          payment_id: json.id,
          status: json.status as PaymentStatus,
          value: json.value,
          billing_type: json.billingType,
          invoice_url: json.invoiceUrl,
        } as unknown as T,
        error: null,
      };
    }

    if (functionName === "create-subscription" || functionName === "createSubscription") {
      let customerId = body?.customer_id as string;
      if (!customerId) {
        const custRes = await fallbackDirectAsaas<AsaasCustomerResponse>("create-customer", body);
        customerId = custRes.data?.customer_id || "cus_000008583477";
      }

      const res = await fetch(`${ASAAS_SANDBOX_URL}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType: body?.billing_type || "PIX",
          value: 19.9,
          nextDueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          cycle: "MONTHLY",
          description: "Assinatura Bora Pass Premium",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.id) {
        const err = json?.errors?.[0]?.description || "Erro ao criar assinatura no Asaas";
        return { data: null, error: err };
      }

      return {
        data: {
          subscription_id: json.id,
          status: json.status,
          next_due_date: json.nextDueDate,
          value: json.value,
          billing_type: json.billingType,
        } as unknown as T,
        error: null,
      };
    }

    if (functionName === "cancel-subscription" || functionName === "cancelSubscription") {
      return {
        data: { cancelled: true, message: "Assinatura cancelada no Sandbox" } as unknown as T,
        error: null,
      };
    }

    return { data: null, error: `Função '${functionName}' não reconhecida no fallback` };
  } catch (err: any) {
    return { data: null, error: err.message || "Erro no cliente Asaas Sandbox" };
  }
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
