/**
 * Edge Function: create-pix-payment
 * Cria uma cobrança PIX no Asaas e retorna QR Code + copia e cola.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { createPixPayment, getPixQrCode } from "../_shared/asaas-client.ts";

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

    const { customer_id, value, description, order_id } = await req.json();
    if (!customer_id || !value) throw new Error("customer_id e value são obrigatórios");

    // 1. Criar cobrança PIX no Asaas
    const { data: payment, error: paymentError } = await createPixPayment({
      customerId: customer_id,
      value: Number(value),
      description: description ?? "Bora Pass",
    });
    if (paymentError || !payment) throw new Error(paymentError ?? "Falha ao criar cobrança PIX");

    // 2. Buscar QR Code
    const { data: qrCode, error: qrError } = await getPixQrCode(payment.id);
    if (qrError || !qrCode) throw new Error(qrError ?? "Falha ao obter QR Code PIX");

    // 3. Salvar no banco
    await supabase.from("payments").insert({
      user_id: user.id,
      order_id: order_id ?? null,
      payment_id_asaas: payment.id,
      customer_id,
      billing_type: "PIX",
      description: description ?? "Bora Pass",
      value: Number(value),
      status: payment.status,
      pix_qrcode: qrCode.encodedImage,
      pix_copy_paste: qrCode.payload,
      invoice_url: payment.invoiceUrl ?? null,
    });

    // 4. Log
    await supabase.from("asaas_logs").insert({
      user_id: user.id,
      event_type: "PIX_PAYMENT_CREATED",
      payload: { customer_id, value, description },
      response: { payment_id: payment.id, status: payment.status },
    });

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status: payment.status,
        pix_qrcode: qrCode.encodedImage,
        pix_copy_paste: qrCode.payload,
        expiration_date: qrCode.expirationDate,
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
