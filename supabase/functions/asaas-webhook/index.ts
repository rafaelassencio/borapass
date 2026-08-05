/**
 * Edge Function: asaas-webhook
 * Recebe notificações do Asaas sobre pagamentos e assinaturas.
 * 
 * Configure no Asaas Dashboard:
 *   URL: https://yddpieerhlpgjcgcjhhc.supabase.co/functions/v1/asaas-webhook
 *   Token: valor de ASAAS_WEBHOOK_TOKEN (configurar em Supabase Secrets)
 * 
 * Eventos tratados:
 *   PAYMENT_RECEIVED / PAYMENT_CONFIRMED → libera Premium
 *   PAYMENT_OVERDUE → registra log
 *   PAYMENT_REFUNDED → remove Premium se assinatura
 *   SUBSCRIPTION_CANCELLED → remove Premium
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

serve(async (req: Request) => {
  // Webhook não usa CORS normal — aceita POST direto do Asaas
  if (req.method === "GET") {
    return new Response("Bora Pass Asaas Webhook ativo ✅", {
      headers: { "Content-Type": "text/plain" }
    });
  }

  // Validar token de segurança (opcional mas recomendado)
  if (WEBHOOK_TOKEN) {
    const token = req.headers.get("asaas-access-token") ?? req.headers.get("authorization");
    if (token !== WEBHOOK_TOKEN && token !== `Bearer ${WEBHOOK_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = body.event as string;
  const payment = body.payment as Record<string, unknown> | undefined;
  const subscription = body.subscription as Record<string, unknown> | undefined;

  console.log(`[Webhook] Evento recebido: ${event}`);

  // Log do webhook
  await supabase.from("asaas_logs").insert({
    event_type: `WEBHOOK_${event}`,
    payload: body,
    response: null,
  });

  try {
    // ─────────────────────────────────────────────
    // PAGAMENTO RECEBIDO / CONFIRMADO
    // ─────────────────────────────────────────────
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      const paymentId = payment?.id as string;
      if (!paymentId) return new Response("ok", { status: 200 });

      // Atualizar status no banco
      const { data: localPayment } = await supabase
        .from("payments")
        .update({
          status: event === "PAYMENT_RECEIVED" ? "RECEIVED" : "CONFIRMED",
          payment_date: new Date().toISOString().split("T")[0],
        })
        .eq("payment_id_asaas", paymentId)
        .select("user_id, order_id")
        .single();

      if (localPayment?.user_id) {
        // Liberar Premium automaticamente
        await supabase.from("user_roles").upsert({
          user_id: localPayment.user_id,
          role: "premium",
        });

        console.log(`[Webhook] Premium liberado para user_id: ${localPayment.user_id}`);
      }
    }

    // ─────────────────────────────────────────────
    // PAGAMENTO CRIADO
    // ─────────────────────────────────────────────
    else if (event === "PAYMENT_CREATED") {
      // Já registrado pelo create-pix-payment, apenas loga
      console.log(`[Webhook] Pagamento criado: ${payment?.id}`);
    }

    // ─────────────────────────────────────────────
    // PAGAMENTO VENCIDO
    // ─────────────────────────────────────────────
    else if (event === "PAYMENT_OVERDUE") {
      const paymentId = payment?.id as string;
      if (paymentId) {
        await supabase.from("payments")
          .update({ status: "OVERDUE" })
          .eq("payment_id_asaas", paymentId);
      }
    }

    // ─────────────────────────────────────────────
    // PAGAMENTO REEMBOLSADO
    // ─────────────────────────────────────────────
    else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_REFUND_IN_PROGRESS") {
      const paymentId = payment?.id as string;
      if (paymentId) {
        await supabase.from("payments")
          .update({ status: "REFUNDED" })
          .eq("payment_id_asaas", paymentId);
      }
    }

    // ─────────────────────────────────────────────
    // PAGAMENTO DELETADO
    // ─────────────────────────────────────────────
    else if (event === "PAYMENT_DELETED") {
      const paymentId = payment?.id as string;
      if (paymentId) {
        await supabase.from("payments")
          .update({ status: "DELETED" })
          .eq("payment_id_asaas", paymentId);
      }
    }

    // ─────────────────────────────────────────────
    // ASSINATURA CRIADA / ATUALIZADA
    // ─────────────────────────────────────────────
    else if (event === "SUBSCRIPTION_CREATED" || event === "SUBSCRIPTION_UPDATED") {
      const subId = subscription?.id as string;
      if (subId) {
        await supabase.from("subscriptions")
          .update({
            status: "ACTIVE",
            next_due_date: (subscription?.nextDueDate as string) ?? null,
          })
          .eq("subscription_id_asaas", subId);
      }
    }

    // ─────────────────────────────────────────────
    // ASSINATURA CANCELADA
    // ─────────────────────────────────────────────
    else if (event === "SUBSCRIPTION_CANCELLED") {
      const subId = subscription?.id as string;
      if (subId) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .update({ status: "INACTIVE" })
          .eq("subscription_id_asaas", subId)
          .select("user_id")
          .single();

        if (sub?.user_id) {
          // Remover role Premium
          await supabase.from("user_roles")
            .delete()
            .eq("user_id", sub.user_id)
            .eq("role", "premium");

          console.log(`[Webhook] Premium removido para user_id: ${sub.user_id}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error(`[Webhook] Erro processando evento ${event}:`, message);

    await supabase.from("asaas_logs").insert({
      event_type: `WEBHOOK_ERROR`,
      payload: body,
      error: message,
    });

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
