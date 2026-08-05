/**
 * src/hooks/use-asaas.ts
 * Hook React com estado para operações de pagamento Asaas.
 * Gerencia loading, erros, e polling de status PIX.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  createAsaasCustomer,
  createPixPayment,
  createCardPayment,
  createSubscription,
  cancelSubscription,
  getPaymentStatus,
  type AsaasPixPaymentResponse,
  type AsaasCardPaymentResponse,
  type CreditCardData,
  type CreditCardHolderInfo,
  type PaymentStatus,
} from "@/lib/asaas";
import { toast } from "sonner";

export interface UseAsaasReturn {
  loading: boolean;
  error: string | null;
  pixData: AsaasPixPaymentResponse | null;
  cardData: AsaasCardPaymentResponse | null;
  paymentStatus: PaymentStatus | null;
  subscriptionId: string | null;
  isPaymentConfirmed: boolean;

  /** Cria ou recupera customer Asaas para o usuário logado */
  ensureCustomer: (params: {
    name: string;
    cpfCnpj: string;
    email: string;
    phone?: string;
  }) => Promise<string | null>;

  /** Cria cobrança PIX + inicia polling */
  startPixPayment: (params: {
    customerId: string;
    value: number;
    description: string;
  }) => Promise<AsaasPixPaymentResponse | null>;

  /** Processa pagamento no cartão */
  startCardPayment: (params: {
    customerId: string;
    value: number;
    description: string;
    creditCard: CreditCardData;
    holderInfo: CreditCardHolderInfo;
  }) => Promise<AsaasCardPaymentResponse | null>;

  /** Cria assinatura Premium */
  subscribePremium: (params: {
    customerId: string;
    billingType: "PIX" | "CREDIT_CARD";
    creditCard?: CreditCardData;
    holderInfo?: CreditCardHolderInfo;
  }) => Promise<string | null>;

  /** Cancela assinatura ativa */
  cancelPremium: () => Promise<boolean>;

  /** Para o polling de status PIX */
  stopPolling: () => void;

  clearError: () => void;
}

const POLL_INTERVAL_MS = 3000; // 3 segundos
const MAX_POLL_ATTEMPTS = 100; // ~5 minutos

export function useAsaas(): UseAsaasReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<AsaasPixPaymentResponse | null>(null);
  const [cardData, setCardData] = useState<AsaasCardPaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      pollAttemptsRef.current = 0;
    }
  }, []);

  /** Inicia polling para verificar status PIX */
  const startPolling = useCallback((paymentId: string) => {
    stopPolling();
    pollAttemptsRef.current = 0;

    pollingRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;

      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        toast.error("⏰ QR Code PIX expirado. Gere um novo pagamento.");
        return;
      }

      const { data, error: statusError } = await getPaymentStatus(paymentId);
      if (statusError || !data) return;

      setPaymentStatus(data.status);

      if (data.status === "RECEIVED" || data.status === "CONFIRMED") {
        stopPolling();
        setIsPaymentConfirmed(true);
        toast.success("🎉 Pagamento confirmado! Seu Premium foi ativado.");

        // Recarregar roles após confirmação
        window.dispatchEvent(new Event("borapass:auth-changed"));
      } else if (data.status === "OVERDUE" || data.status === "DELETED") {
        stopPolling();
        toast.error("❌ PIX expirado ou cancelado. Tente novamente.");
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const ensureCustomer = useCallback(async (params: {
    name: string;
    cpfCnpj: string;
    email: string;
    phone?: string;
  }): Promise<string | null> => {
    if (!user) { setError("Você precisa estar logado."); return null; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await createAsaasCustomer(params);
    setLoading(false);

    if (err) {
      setError(err);
      toast.error(`Erro ao criar perfil de pagamento: ${err}`);
      return null;
    }
    return data?.customer_id ?? null;
  }, [user]);

  const startPixPayment = useCallback(async (params: {
    customerId: string;
    value: number;
    description: string;
  }): Promise<AsaasPixPaymentResponse | null> => {
    if (!user) { setError("Você precisa estar logado."); return null; }
    setLoading(true);
    setError(null);
    setPixData(null);
    setPaymentStatus(null);
    setIsPaymentConfirmed(false);

    const { data, error: err } = await createPixPayment({
      customer_id: params.customerId,
      value: params.value,
      description: params.description,
    });
    setLoading(false);

    if (err || !data) {
      const msg = err ?? "Falha ao gerar PIX";
      setError(msg);
      toast.error(msg);
      return null;
    }

    setPixData(data);
    setPaymentStatus(data.status);
    startPolling(data.payment_id);
    return data;
  }, [user, startPolling]);

  const startCardPayment = useCallback(async (params: {
    customerId: string;
    value: number;
    description: string;
    creditCard: CreditCardData;
    holderInfo: CreditCardHolderInfo;
  }): Promise<AsaasCardPaymentResponse | null> => {
    if (!user) { setError("Você precisa estar logado."); return null; }
    setLoading(true);
    setError(null);
    setCardData(null);
    setIsPaymentConfirmed(false);

    const { data, error: err } = await createCardPayment({
      customer_id: params.customerId,
      value: params.value,
      description: params.description,
      credit_card: params.creditCard,
      credit_card_holder_info: params.holderInfo,
    });
    setLoading(false);

    if (err || !data) {
      const msg = err ?? "Cartão recusado. Verifique os dados.";
      setError(msg);
      toast.error(`💳 ${msg}`);
      return null;
    }

    setCardData(data);
    setPaymentStatus(data.status);

    if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
      setIsPaymentConfirmed(true);
      toast.success("🎉 Pagamento no cartão confirmado!");
      window.dispatchEvent(new Event("borapass:auth-changed"));
    }
    return data;
  }, [user]);

  const subscribePremium = useCallback(async (params: {
    customerId: string;
    billingType: "PIX" | "CREDIT_CARD";
    creditCard?: CreditCardData;
    holderInfo?: CreditCardHolderInfo;
  }): Promise<string | null> => {
    if (!user) { setError("Você precisa estar logado."); return null; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await createSubscription({
      customer_id: params.customerId,
      billing_type: params.billingType,
      ...(params.creditCard ? { credit_card: params.creditCard } : {}),
      ...(params.holderInfo ? { credit_card_holder_info: params.holderInfo } : {}),
    });
    setLoading(false);

    if (err || !data) {
      const msg = err ?? "Falha ao criar assinatura";
      setError(msg);
      toast.error(msg);
      return null;
    }

    setSubscriptionId(data.subscription_id);
    return data.subscription_id;
  }, [user]);

  const cancelPremium = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    setError(null);

    const { data, error: err } = await cancelSubscription();
    setLoading(false);

    if (err || !data?.cancelled) {
      const msg = err ?? "Falha ao cancelar assinatura";
      setError(msg);
      toast.error(msg);
      return false;
    }

    toast.success("Assinatura cancelada. Seu acesso Premium permanece até o fim do período pago.");
    window.dispatchEvent(new Event("borapass:auth-changed"));
    return true;
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    pixData,
    cardData,
    paymentStatus,
    subscriptionId,
    isPaymentConfirmed,
    ensureCustomer,
    startPixPayment,
    startCardPayment,
    subscribePremium,
    cancelPremium,
    stopPolling,
    clearError,
  };
}
