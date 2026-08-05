/**
 * Edge Function: create-card-payment
 * Processa pagamento com cartão de crédito via Asaas.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { createCreditCardPayment } from "../_shared/asaas-client.ts";

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
      value,
      description,
      order_id,
      credit_card,
      credit_card_holder_info,
      installment_count,
    } = await req.json();

    if (!customer_id || !value || !credit_card || !credit_card_holder_info) {
      throw new Error("Dados incompletos para pagamento no cartão");
    }

    // 1. Processar pagamento no Asaas
    const { data: payment, error: paymentError } = await createCreditCardPayment({
      customerId: customer_id,
      value: Number(value),
      description: description ?? "Bora Pass",
      creditCard: credit_card,
      creditCardHolderInfo: credit_card_holder_info,
      installmentCount: installment_count ?? 1,
    });
    if (paymentError || !payment) throw new Error(paymentError ?? "Pagamento recusado. Verifique os dados do cartão.");

    // 2. Salvar no banco
    await supabase.from("payments").insert({
      user_id: user.id,
      order_id: order_id ?? null,
      payment_id_asaas: payment.id,
      customer_id,
      billing_type: "CREDIT_CARD",
      description: description ?? "Bora Pass",
      value: Number(value),
      status: payment.status,
      invoice_url: payment.invoiceUrl ?? null,
      payment_date: payment.status === "CONFIRMED" ? new Date().toISOString().split("T")[0] : null,
    });

    // 3. Se confirmado de imediato, liberar Premium
    if (payment.status === "CONFIRMED" || payment.status === "RECEIVED") {
      await supabase.from("user_roles").upsert({
        user_id: user.id,
        role: "premium",
      });
    }

    // 4. Log
    await supabase.from("asaas_logs").insert({
      user_id: user.id,
      event_type: "CARD_PAYMENT_CREATED",
      payload: { customer_id, value, description, installment_count },
      response: { payment_id: payment.id, status: payment.status },
    });

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status: payment.status,
        invoice_url: payment.invoiceUrl,
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
