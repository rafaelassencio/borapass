/**
 * Edge Function: get-payment-status
 * Consulta o status de um pagamento pelo ID do Asaas.
 * Usado pelo frontend para polling do status PIX.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { getPaymentStatus } from "../_shared/asaas-client.ts";

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

    // Aceita payment_id via query string ou body
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("payment_id");

    if (!paymentId && req.method === "POST") {
      const body = await req.json();
      paymentId = body.payment_id;
    }

    if (!paymentId) throw new Error("payment_id é obrigatório");

    // 1. Verificar que o pagamento pertence ao usuário
    const { data: localPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("payment_id_asaas", paymentId)
      .eq("user_id", user.id)
      .single();

    if (!localPayment) throw new Error("Pagamento não encontrado ou sem permissão");

    // 2. Consultar Asaas
    const { data: payment, error } = await getPaymentStatus(paymentId);
    if (error || !payment) throw new Error(error ?? "Pagamento não encontrado no Asaas");

    // 3. Atualizar status no banco se mudou
    if (payment.status !== localPayment.status) {
      await supabase.from("payments")
        .update({
          status: payment.status,
          payment_date: (payment.status === "RECEIVED" || payment.status === "CONFIRMED")
            ? new Date().toISOString().split("T")[0]
            : null,
        })
        .eq("payment_id_asaas", paymentId);
    }

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status: payment.status,
        value: payment.value,
        billing_type: payment.billingType,
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
