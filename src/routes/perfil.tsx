import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Bell, Globe, Heart, LogOut, Settings, Ticket, Plane, ChevronRight, Moon, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Bora Pass" }] }),
  component: Perfil,
});

function Perfil() {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const profile = useProfile(user?.id);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta");
    navigate({ to: "/login" });
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Visitante";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <PageHeader title="Perfil" />
      <div className="px-5 pt-4">
        <div className="rounded-3xl bg-gradient-hero p-6 text-white shadow-brand">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-white/40">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold">{displayName}</h2>
              <p className="truncate text-sm opacity-90">
                {user?.email || (loading ? "Carregando..." : "Faça login para salvar suas viagens")}
              </p>
            </div>
          </div>
          {user && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat n={0} label="Favoritos" />
              <Stat n={0} label="Cupons" />
              <Stat n={0} label="Viagens" />
            </div>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <Row icon={<Heart className="h-4 w-4 text-accent" />} label="Meus favoritos" to="/favoritos" />
          <Row icon={<Ticket className="h-4 w-4 text-primary" />} label="Cupons utilizados" />
          <Row icon={<Plane className="h-4 w-4 text-primary" />} label="Viagens realizadas" />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <Row icon={<Bell className="h-4 w-4" />} label="Notificações" />
          <Row icon={<Globe className="h-4 w-4" />} label="Idioma" value="Português (BR)" />
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4" />
              <span className="text-sm font-medium">Modo escuro</span>
            </div>
            <Switch
              checked={dark}
              onCheckedChange={(v) => {
                setDark(v);
                document.documentElement.classList.toggle("dark", v);
              }}
            />
          </div>
          <Row icon={<Settings className="h-4 w-4" />} label="Configurações" />
        </div>

        {user ? (
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-destructive shadow-soft"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        ) : (
          <Link
            to="/login"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <LogIn className="h-4 w-4" /> Entrar / Criar conta
          </Link>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">Bora Pass v1.0 · Feito com ❤ para viajantes</p>
      </div>
    </AppShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
      <div className="text-xl font-extrabold">{n}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-90">{label}</div>
    </div>
  );
}

function Row({ icon, label, value, to }: { icon: React.ReactNode; label: string; value?: string; to?: string }) {
  const inner = (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-3.5 first:border-t-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {value}
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <button className="w-full text-left">{inner}</button>;
}
