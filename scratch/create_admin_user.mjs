import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yddpieerhlpgjcgcjhhc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ffclUJzJy34PXJ6iIvRUyg_cCpuDtlJ";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const email = "rafael.assencio12@gmail.com";
  const password = "Peniel12/";

  console.log(`Tentando autenticar / cadastrar o usuário Admin: ${email}...`);

  // 1. Tentar Login
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signinData?.user) {
    console.log("Login realizado com sucesso! Usuário já existe:", signinData.user.id);
    await grantAdminRoles(signinData.user.id);
    return;
  }

  // 2. Se falhou o login, criar a conta
  console.log("Tentando cadastrar a nova conta...", signinError?.message);
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Rafael Assêncio",
        first_name: "Rafael",
        last_name: "Assêncio",
        city: "Rio de Janeiro",
        state: "RJ",
      },
    },
  });

  if (signupError) {
    console.error("Erro no cadastro:", signupError.message);
  } else if (signupData?.user) {
    console.log("Conta criada com sucesso! User ID:", signupData.user.id);
    await grantAdminRoles(signupData.user.id);
  }
}

async function grantAdminRoles(userId) {
  console.log(`Atribuindo papéis de admin, suporte e parceiro para ${userId}...`);
  const roles = ["admin", "support", "partner", "user"];
  for (const role of roles) {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role });
    if (error) {
      console.log(`Aviso ao atribuir papel ${role}:`, error.message);
    } else {
      console.log(`Papel ${role} atribuído com sucesso.`);
    }
  }

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: "Rafael Assêncio",
    city: "Rio de Janeiro - RJ",
    updated_at: new Date().toISOString(),
  });
  console.log("Perfil e permissões configurados!");
}

main().catch(console.error);
