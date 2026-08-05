/**
 * Edge Function: cancel-subscription
 * Cancela a assinatura Premium do usuário no Asaas e atualiza o banco.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { cancelSubscription } from "../_shared/asaas-client.ts";

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

    // 1. Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("subscription_id_asaas")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .single();

    if (subError || !subscription?.subscription_id_asaas) {
      throw new Error("Nenhuma assinatura ativa encontrada");
    }

    // 2. Cancelar no Asaas
    const { error: cancelError } = await cancelSubscription(subscription.subscription_id_asaas);
    if (cancelError) throw new Error(cancelError);

    // 3. Atualizar banco
    await supabase.from("subscriptions")
      .update({ status: "INACTIVE" })
      .eq("user_id", user.id)
      .eq("subscription_id_asaas", subscription.subscription_id_asaas);

    // 4. Remover role Premium
    await supabase.from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .eq("role", "premium");

    // 5. Log
    await supabase.from("asaas_logs").insert({
      user_id: user.id,
      event_type: "SUBSCRIPTION_CANCELLED",
      payload: { subscription_id: subscription.subscription_id_asaas },
      response: { cancelled: true },
    });

    return new Response(
      JSON.stringify({ cancelled: true, message: "Assinatura cancelada com sucesso." }),
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
