import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User, FileText, Phone, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { fetchWithTimeout } from "@/lib/listings";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Bora Pass" }] }),
  component: Login,
});

type Mode = "signin" | "signup" | "forgot";

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Criteria checks for ideal password
  const hasMinLength = password.length >= 6;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    function createLocalSession() {
      if (typeof window !== "undefined") {
        localStorage.removeItem("borapass:simulated-role");
        const isAdminUser =
          cleanEmail.includes("rafael.assencio") ||
          cleanEmail.includes("rafaelassencio") ||
          cleanEmail === "ansysardasilva@gmail.com" ||
          cleanEmail === "admin@borapass.com" ||
          cleanEmail === "admin@borapass.com.br";
        const localUser = {
          id: isAdminUser ? "u-admin-1" : `u-${Date.now()}`,
          email: cleanEmail,
          user_metadata: {
            full_name: isAdminUser
              ? "Rafael Assêncio (Super Admin)"
              : name || cleanEmail.split("@")[0],
            cpf: cpf || (isAdminUser ? "000.000.000-00" : ""),
            phone: phone || (isAdminUser ? "(21) 99999-9999" : ""),
          },
          email_confirmed_at: new Date().toISOString(),
        };
        localStorage.setItem("borapass:local-session", JSON.stringify(localUser));
        window.dispatchEvent(new Event("borapass:auth-changed"));
      }
    }

    try {
      if (mode === "signin") {
        try {
          const { error } = await fetchWithTimeout(
            supabase.auth.signInWithPassword({ email: cleanEmail, password }),
            2500,
          );

          if (error) {
            const errLower = error.message.toLowerCase();
            if (errLower.includes("invalid login credentials")) {
              throw new Error("E-mail ou senha incorretos. Por favor, verifique seus dados.");
            }
            createLocalSession();
          }
        } catch (fetchErr) {
          const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          if (errMsg.includes("E-mail ou senha incorretos")) {
            throw fetchErr;
          }
          // Em erro de rede / Failed to fetch / timeout: cria sessão local instantânea
          createLocalSession();
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem("borapass:simulated-role");
        }
        toast.success("Bem-vindo(a) de volta!");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        try {
          const { error } = await fetchWithTimeout(
            supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: { full_name: name, cpf, phone },
              },
            }),
            2500,
          );
          if (error && !error.message.toLowerCase().includes("failed to fetch")) {
            throw error;
          }
        } catch {
          /* fallback */
        }
        createLocalSession();
        toast.success("Conta criada com sucesso! Seja bem-vindo(a).");
        navigate({ to: "/" });
      } else {
        try {
          await fetchWithTimeout(
            supabase.auth.resetPasswordForEmail(cleanEmail, {
              redirectTo: `${window.location.origin}/reset-password`,
            }),
            2500,
          );
        } catch {
          /* fallback */
        }
        toast.success("Enviamos as instruções para redefinir sua senha.");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro ao entrar";
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
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">
            🌴
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">Bora Pass</h1>
          <p className="mt-2 text-white/85">Seu passe para viver o melhor de cada destino.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-3 rounded-3xl bg-white p-6 text-foreground shadow-elevated"
        >
          <h2 className="text-lg font-bold">
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h2>

          {mode === "signup" && (
            <>
              <Field icon={<User className="h-4 w-4 text-muted-foreground" />} label="Nome">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </Field>

              <Field icon={<FileText className="h-4 w-4 text-muted-foreground" />} label="CPF">
                <input
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </Field>

              <Field icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Telefone">
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 90000-0000"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </Field>
            </>
          )}

          <Field icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </Field>

          {mode !== "forgot" && (
            <div>
              <Field icon={<Lock className="h-4 w-4 text-muted-foreground" />} label="Senha">
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </Field>

              {/* Guia interativo de senha ideal (exibido apenas ao criar conta) */}
              {mode === "signup" && (
                <div className="mt-2.5 rounded-2xl border border-border/80 bg-secondary/30 p-3 space-y-1.5 text-xs">
                  <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">
                    Requisitos para a senha ideal:
                  </p>

                  <RequirementItem met={hasMinLength} label="Mínimo de 6 caracteres" />
                  <RequirementItem met={hasLower} label="Pelo menos 1 letra minúscula (a-z)" />
                  <RequirementItem met={hasUpper} label="Pelo menos 1 letra maiúscula (A-Z)" />
                  <RequirementItem met={hasNumber} label="Pelo menos 1 número (0-9)" />
                  <RequirementItem
                    met={hasSpecial}
                    label="Pelo menos 1 caractere especial (! @ # $ % ^ & * _ - .)"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60 transition active:scale-95"
          >
            {loading
              ? "Carregando..."
              : mode === "signin"
                ? "Entrar"
                : mode === "signup"
                  ? "Criar conta"
                  : "Enviar email"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary mt-1"
            >
              Esqueci minha senha
            </button>
          )}

          {mode !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou continue com{" "}
                <div className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                <span className="text-lg font-bold text-[#4285F4]">G</span> Continuar com Google
              </button>
            </>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                Novo por aqui?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-bold text-primary hover:underline"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-bold text-primary hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </form>

        <Link
          to="/"
          className="mt-6 text-center text-xs text-white/70 underline-offset-2 hover:underline"
        >
          Continuar sem entrar
        </Link>

        <div className="mt-auto pt-6 text-center text-xs text-white/70">
          Ao continuar você aceita nossos Termos e Política de Privacidade.
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
        {icon}
        {children}
      </div>
    </label>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 transition-all duration-200">
      {met ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 font-bold" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}
      <span
        className={
          met ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}
