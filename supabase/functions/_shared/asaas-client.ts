/**
 * _shared/asaas-client.ts
 * Cliente tipado para a API do Asaas.
 * A API Key nunca é exposta no frontend — fica apenas aqui, na Edge Function.
 */

const ASAAS_BASE_URL = Deno.env.get("ASAAS_BASE_URL") ?? "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY") ?? "";

if (!ASAAS_API_KEY) {
  console.warn("[AsaasClient] ASAAS_API_KEY não configurada. Configure em Supabase Dashboard > Settings > Edge Functions > Secrets.");
}

// ─────────────────────────────────────────────
// Tipos da API Asaas
// ─────────────────────────────────────────────

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  dateCreated?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO" | "UNDEFINED";
  value: number;
  dueDate: string;
  description?: string;
  status: string;
  invoiceUrl?: string;
  pixQrCodeId?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;  // Base64 do QR Code
  payload: string;       // Copia e Cola
  expirationDate: string;
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolder {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
  description?: string;
}

// ─────────────────────────────────────────────
// Funções da API
// ─────────────────────────────────────────────

async function asaasFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
        ...(options?.headers ?? {}),
      },
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMsg = json?.errors?.[0]?.description ?? json?.message ?? `HTTP ${response.status}`;
      return { data: null, error: errorMsg };
    }

    return { data: json as T, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido na API Asaas";
    return { data: null, error: msg };
  }
}

/**
 * Cria um cliente no Asaas
 */
export async function createCustomer(params: {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
}) {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      cpfCnpj: params.cpfCnpj.replace(/\D/g, ""),
      email: params.email,
      mobilePhone: params.phone?.replace(/\D/g, ""),
      notificationDisabled: false,
    }),
  });
}

/**
 * Busca clientes por CPF/CNPJ (para verificar duplicatas)
 */
export async function findCustomerByCpf(cpf: string) {
  const cleaned = cpf.replace(/\D/g, "");
  return asaasFetch<{ data: AsaasCustomer[] }>(`/customers?cpfCnpj=${cleaned}`);
}

/**
 * Cria cobrança PIX
 */
export async function createPixPayment(params: {
  customerId: string;
  value: number;
  description: string;
  dueDate?: string;
}) {
  const dueDate = params.dueDate ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "PIX",
      value: params.value,
      dueDate,
      description: params.description,
    }),
  });
}

/**
 * Busca QR Code PIX de uma cobrança
 */
export async function getPixQrCode(paymentId: string) {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

/**
 * Cria cobrança no cartão de crédito
 */
export async function createCreditCardPayment(params: {
  customerId: string;
  value: number;
  description: string;
  creditCard: AsaasCreditCard;
  creditCardHolderInfo: AsaasCreditCardHolder;
  installmentCount?: number;
}) {
  const dueDate = new Date().toISOString().split("T")[0];

  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "CREDIT_CARD",
      value: params.value,
      dueDate,
      description: params.description,
      creditCard: params.creditCard,
      creditCardHolderInfo: params.creditCardHolderInfo,
      installmentCount: params.installmentCount ?? 1,
    }),
  });
}

/**
 * Cria assinatura recorrente
 */
export async function createSubscription(params: {
  customerId: string;
  billingType: "PIX" | "CREDIT_CARD";
  value: number;
  nextDueDate: string;
  description: string;
  cycle?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolder;
}) {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: params.billingType,
      value: params.value,
      nextDueDate: params.nextDueDate,
      description: params.description,
      cycle: params.cycle ?? "MONTHLY",
      ...(params.creditCard ? { creditCard: params.creditCard } : {}),
      ...(params.creditCardHolderInfo ? { creditCardHolderInfo: params.creditCardHolderInfo } : {}),
    }),
  });
}

/**
 * Cancela assinatura
 */
export async function cancelSubscription(subscriptionId: string) {
  return asaasFetch<{ deleted: boolean }>(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

/**
 * Consulta status de um pagamento
 */
export async function getPaymentStatus(paymentId: string) {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}
