import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { toast } from "sonner";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { simulatedRole, realRoles, setRoleSimulation } = useRoles(user?.id, user?.email);
  const isRealAdmin = realRoles.includes("admin");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Banner with Simulated Role for Admin Testing */}
      {isRealAdmin && (
        <div className="sticky top-0 z-50 bg-slate-950 border-b border-amber-500/30 px-3 py-2 text-xs font-bold text-white shadow-elevated flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider">
              🧪 MODO TESTE:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
              <button
                onClick={() => {
                  setRoleSimulation("user");
                  toast.info("🎭 Simulando experiência de Viajante");
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                  simulatedRole === "user"
                    ? "bg-sky-500 text-white shadow-sm ring-1 ring-white/50"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🧳 Viajante
              </button>

              <button
                onClick={() => {
                  setRoleSimulation("premium");
                  toast.success("💎 Simulando experiência de Viajante Premium");
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                  simulatedRole === "premium"
                    ? "bg-amber-500 text-black shadow-sm ring-1 ring-white/50"
                    : "bg-slate-800 text-amber-300 hover:bg-slate-700"
                }`}
              >
                💎 Viajante Premium
              </button>

              <button
                onClick={() => {
                  setRoleSimulation("partner");
                  toast.info("🏢 Simulando experiência de Parceiro Credenciado");
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                  simulatedRole === "partner"
                    ? "bg-purple-600 text-white shadow-sm ring-1 ring-white/50"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🏢 Parceiro
              </button>

              <button
                onClick={() => {
                  setRoleSimulation("support");
                  toast.info("🎧 Simulando experiência de Atendente de Suporte");
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                  simulatedRole === "support"
                    ? "bg-emerald-600 text-white shadow-sm ring-1 ring-white/50"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🎧 Suporte
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {simulatedRole && (
              <button
                onClick={() => {
                  setRoleSimulation(null);
                  toast.success("👑 Perfil Super Admin restaurado!");
                }}
                className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 text-[10px] font-black uppercase hover:bg-amber-500/30 transition"
              >
                Restaurar Admin 👑
              </button>
            )}
            <a
              href="/admin"
              className="rounded-full bg-sky-600 text-white px-3 py-1 text-[10px] font-black hover:bg-sky-500 transition shadow-sm"
            >
              ⚙️ Voltar ao Console
            </a>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl">{children}</div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
