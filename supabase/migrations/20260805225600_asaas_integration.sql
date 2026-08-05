-- =====================================================
-- MIGRAÇÃO: Tabelas de integração Asaas - Bora Pass
-- =====================================================

-- 1. ASAAS CUSTOMERS: Mapeamento user -> cliente Asaas
CREATE TABLE IF NOT EXISTS public.asaas_customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_customer_id TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(asaas_customer_id)
);

-- 2. PAYMENTS: Histórico de cobranças
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id          TEXT,
  payment_id_asaas  TEXT UNIQUE,
  customer_id       TEXT,
  billing_type      TEXT NOT NULL CHECK (billing_type IN ('PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED')),
  description       TEXT,
  value             NUMERIC(10, 2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'REFUND_IN_PROGRESS', 'DELETED', 'AWAITING_RISK_ANALYSIS', 'CANCELLED')),
  pix_qrcode        TEXT,
  pix_copy_paste    TEXT,
  invoice_url       TEXT,
  payment_date      DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SUBSCRIPTIONS: Assinaturas do Premium
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id_asaas  TEXT UNIQUE,
  plan                   TEXT NOT NULL DEFAULT 'bora_pass_premium',
  value                  NUMERIC(10, 2) NOT NULL DEFAULT 19.90,
  cycle                  TEXT NOT NULL DEFAULT 'MONTHLY',
  status                 TEXT NOT NULL DEFAULT 'ACTIVE'
                         CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
  next_due_date          DATE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ASAAS LOGS: Logs de integração e webhooks
CREATE TABLE IF NOT EXISTS public.asaas_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  payload     JSONB,
  response    JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_logs ENABLE ROW LEVEL SECURITY;

-- asaas_customers: usuário vê apenas o seu
CREATE POLICY "Users can view own customer" ON public.asaas_customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customer" ON public.asaas_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- payments: usuário vê apenas os seus
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.payments
  FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions: usuário vê apenas as suas
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- asaas_logs: usuário vê apenas os seus (ou sem user_id = webhook)
CREATE POLICY "Users can view own logs" ON public.asaas_logs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- ÍNDICES para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_asaas_customers_user_id ON public.asaas_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id ON public.payments(payment_id_asaas);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_id ON public.subscriptions(subscription_id_asaas);
CREATE INDEX IF NOT EXISTS idx_asaas_logs_event ON public.asaas_logs(event_type);

-- =====================================================
-- TRIGGER: atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
