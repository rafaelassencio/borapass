/**
 * Edge Function: create-subscription
 * Cria assinatura mensal do Bora Pass Premium (R$ 19,90/mês).
 * Suporta PIX e Cartão de Crédito.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { createSubscription } from "../_shared/asaas-client.ts";

const PREMIUM_PRICE = Number(Deno.env.get("PREMIUM_PRICE") ?? "19.90");
const PLAN_NAME = "Bora Pass Premium";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Token inválido");

    const {
      customer_id,
      billing_type = "PIX",
      credit_card,
      credit_card_holder_info,
    } = await req.json();

    if (!customer_id) throw new Error("customer_id é obrigatório");
    if (billing_type === "CREDIT_CARD" && (!credit_card || !credit_card_holder_info)) {
      throw new Error("Dados do cartão são obrigatórios para pagamento no cartão");
    }

    // Calcular próxima data de vencimento (hoje + 1 dia)
    const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];

    // 1. Criar assinatura no Asaas
    const { data: subscription, error: subError } = await createSubscription({
      customerId: customer_id,
      billingType: billing_type,
      value: PREMIUM_PRICE,
      nextDueDate,
      description: `${PLAN_NAME} - Mensal`,
      cycle: "MONTHLY",
      ...(credit_card ? { creditCard: credit_card } : {}),
      ...(credit_card_holder_info ? { creditCardHolderInfo: credit_card_holder_info } : {}),
    });
    if (subError || !subscription) throw new Error(subError ?? "Falha ao criar assinatura");

    // 2. Salvar assinatura no banco
    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      subscription_id_asaas: subscription.id,
      plan: "bora_pass_premium",
      value: PREMIUM_PRICE,
      cycle: "MONTHLY",
      status: subscription.status === "ACTIVE" ? "ACTIVE" : "ACTIVE",
      next_due_date: nextDueDate,
    });

    // 3. Se for cartão e confirmou de imediato, liberar Premium
    if (billing_type === "CREDIT_CARD") {
      await supabase.from("user_roles").upsert({
        user_id: user.id,
        role: "premium",
      });
    }

    // 4. Log
    await supabase.from("asaas_logs").insert({
      user_id: user.id,
      event_type: "SUBSCRIPTION_CREATED",
      payload: { customer_id, billing_type, plan: PLAN_NAME },
      response: { subscription_id: subscription.id, status: subscription.status },
    });

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        status: subscription.status,
        next_due_date: subscription.nextDueDate,
        value: PREMIUM_PRICE,
        // Para PIX, o primeiro pagamento cria uma cobrança separada — o frontend deve chamar create-pix-payment
        billing_type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
