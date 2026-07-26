import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Bora Pass" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-14 text-white">
        <h1 className="text-3xl font-extrabold">Nova senha</h1>
        <p className="mt-2 text-white/85">Escolha uma senha nova para sua conta.</p>
        <form onSubmit={handleSubmit} className="mt-10 space-y-3 rounded-3xl bg-white p-6 text-foreground shadow-elevated">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Nova senha</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </div>
          </label>
          <button type="submit" disabled={loading} className="mt-2 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
