import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Bora Pass" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-14 text-white">
        <div>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">🌴</div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">Bora Pass</h1>
          <p className="mt-2 text-white/85">Seu passe para viver o melhor de cada destino.</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }}
          className="mt-10 space-y-3 rounded-3xl bg-white p-6 text-foreground shadow-elevated"
        >
          <h2 className="text-lg font-bold">Entrar</h2>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="voce@email.com" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Senha</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="••••••••" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </div>
          </label>
          <button type="submit" className="mt-2 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand">
            Entrar
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou continue com <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SocialBtn label="Google">G</SocialBtn>
            <SocialBtn label="Apple">&#xF8FF;</SocialBtn>
            <SocialBtn label="Facebook">f</SocialBtn>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Novo por aqui? <Link to="/" className="font-semibold text-primary">Criar conta</Link>
          </p>
        </form>

        <div className="mt-auto pt-6 text-center text-xs text-white/70">
          Ao continuar você aceita nossos Termos e Política de Privacidade.
        </div>
      </div>
    </div>
  );
}

function SocialBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button type="button" aria-label={label} className="flex h-11 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold hover:bg-secondary">
      {children}
    </button>
  );
}
