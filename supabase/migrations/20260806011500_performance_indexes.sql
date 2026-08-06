-- =====================================================
-- MIGRAÇÃO DE PERFORMANCE & ÍNDICES - BORA PASS
-- Otimiza a velocidade de consulta do perfil, papéis e assinaturas
-- =====================================================

-- Índices para buscas ultrarrápidas por user_id e status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON public.subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON public.subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id 
  ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS idx_payments_status 
  ON public.payments (status);

CREATE INDEX IF NOT EXISTS idx_asaas_customers_user_id 
  ON public.asaas_customers (user_id);
