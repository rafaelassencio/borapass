/**
 * Edge Function: create-customer
 * Cria ou recupera um cliente no Asaas para o usuário autenticado.
 * Nunca expõe a API Key ao frontend.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { createCustomer, findCustomerByCpf } from "../_shared/asaas-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    // 1. Autenticar usuário
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

    // 2. Verificar se já existe customer cadastrado
    const { data: existing } = await supabase
      .from("asaas_customers")
      .select("asaas_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existing?.asaas_customer_id) {
      return new Response(
        JSON.stringify({ customer_id: existing.asaas_customer_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Obter dados do body
    const { name, cpfCnpj, email, phone } = await req.json();
    if (!name || !cpfCnpj || !email) {
      throw new Error("Nome, CPF e e-mail são obrigatórios");
    }

    // 4. Verificar se CPF já existe no Asaas
    const { data: existingAsaas } = await findCustomerByCpf(cpfCnpj);
    let customerId: string;

    if (existingAsaas?.data && existingAsaas.data.length > 0) {
      customerId = existingAsaas.data[0].id;
    } else {
      // 5. Criar cliente no Asaas
      const { data: newCustomer, error: asaasError } = await createCustomer({
        name, cpfCnpj, email, phone,
      });
      if (asaasError || !newCustomer) throw new Error(asaasError ?? "Falha ao criar cliente no Asaas");
      customerId = newCustomer.id;
    }

    // 6. Salvar no banco
    await supabase.from("asaas_customers").insert({
      user_id: user.id,
      asaas_customer_id: customerId,
    });

    // 7. Log
    await supabase.from("asaas_logs").insert({
      user_id: user.id,
      event_type: "CUSTOMER_CREATED",
      payload: { name, email, cpfCnpj: cpfCnpj.slice(0, 3) + "***" },
      response: { customer_id: customerId },
    });

    return new Response(
      JSON.stringify({ customer_id: customerId }),
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
