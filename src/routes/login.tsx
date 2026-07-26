import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Bora Pass" }] }),
  component: Login,
});

type Mode = "signin" | "signup" | "forgot";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo(a) de volta!");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Confira seu email para confirmar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um email para redefinir sua senha.");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Falha ao entrar com Google");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-14 text-white">
        <div>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">🌴</div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">Bora Pass</h1>
          <p className="mt-2 text-white/85">Seu passe para viver o melhor de cada destino.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-3 rounded-3xl bg-white p-6 text-foreground shadow-elevated">
          <h2 className="text-lg font-bold">
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h2>

          {mode === "signup" && (
            <Field icon={<User className="h-4 w-4 text-muted-foreground" />} label="Nome">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </Field>
          )}

          <Field icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="flex-1 bg-transparent text-sm focus:outline-none" />
          </Field>

          {mode !== "forgot" && (
            <Field icon={<Lock className="h-4 w-4 text-muted-foreground" />} label="Senha">
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </Field>
          )}

          <button type="submit" disabled={loading} className="mt-2 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
            {loading ? "Carregando..." : mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar email"}
          </button>

          {mode === "signin" && (
            <button type="button" onClick={() => setMode("forgot")} className="w-full text-center text-xs text-muted-foreground hover:text-primary">
              Esqueci minha senha
            </button>
          )}

          {mode !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou continue com <div className="h-px flex-1 bg-border" />
              </div>
              <button type="button" onClick={handleGoogle} disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-secondary disabled:opacity-60">
                <span className="text-lg font-bold text-[#4285F4]">G</span> Continuar com Google
              </button>
            </>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>Novo por aqui?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary">Criar conta</button>
              </>
            ) : (
              <>Já tem conta?{" "}
                <button type="button" onClick={() => setMode("signin")} className="font-semibold text-primary">Entrar</button>
              </>
            )}
          </p>
        </form>

        <Link to="/" className="mt-6 text-center text-xs text-white/70 underline-offset-2 hover:underline">
          Continuar sem entrar
        </Link>

        <div className="mt-auto pt-6 text-center text-xs text-white/70">
          Ao continuar você aceita nossos Termos e Política de Privacidade.
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
        {icon}
        {children}
      </div>
    </label>
  );
}
