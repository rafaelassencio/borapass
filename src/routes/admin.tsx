import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useRoles, type AppRole } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { LogIn, ShieldAlert, Shield, Store, User as UserIcon, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Bora Pass" }] }),
  component: AdminPanel,
});

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
};

type RoleRow = { user_id: string; role: AppRole };

const ROLES: AppRole[] = ["admin", "partner", "user"];

function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading, roles } = useRoles(user?.id);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [listingsCount, setListingsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [tab, setTab] = useState<"users" | "listings">("users");
  const [allListings, setAllListings] = useState<Array<{ id: string; title: string; category: string; owner_id: string; active: boolean; city: string | null }>>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: uData, error: uErr }, { data: rData }, { count }] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("listings").select("*", { count: "exact", head: true }),
    ]);
    if (uErr) toast.error(uErr.message);
    setUsers((uData ?? []) as UserRow[]);
    const grouped: Record<string, AppRole[]> = {};
    for (const r of (rData ?? []) as RoleRow[]) {
      (grouped[r.user_id] ??= []).push(r.role);
    }
    setRolesByUser(grouped);
    setListingsCount(count ?? 0);
    setLoading(false);
  }, []);

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase.from("listings").select("id, title, category, owner_id, active, city").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAllListings((data ?? []) as typeof allListings);
  }, []);

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin, refresh]);

  useEffect(() => {
    if (isAdmin && tab === "listings") loadListings();
  }, [isAdmin, tab, loadListings]);

  async function toggleRole(userId: string, role: AppRole, has: boolean) {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Roles atualizados");
    refresh();
  }

  async function claimAdmin() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) return toast.error(error.message);
    if (data === true) {
      toast.success("Você agora é admin!");
      window.location.reload();
    } else {
      toast.error("Já existe um administrador. Peça acesso a ele.");
    }
  }

  if (authLoading || rolesLoading) {
    return (
      <AppShell>
        <PageHeader title="Admin" />
        <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Admin" />
        <div className="p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Faça login para acessar o painel administrativo.</p>
          <Link to="/login" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <PageHeader title="Admin" />
        <div className="p-6 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Você não tem acesso de administrador.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Papéis atuais: {roles.length ? roles.join(", ") : "user"}</p>
          <button
            onClick={claimAdmin}
            disabled={claiming}
            className="mt-6 rounded-2xl bg-gradient-ember px-5 py-2.5 text-sm font-bold text-white shadow-ember disabled:opacity-60"
          >
            {claiming ? "Verificando..." : "Reivindicar 1º admin"}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">Só funciona enquanto não houver nenhum admin cadastrado.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Painel Admin" subtitle="Gerencie usuários, papéis e anúncios" />
      <div className="grid grid-cols-3 gap-2 px-5 pt-4">
        <Stat icon={<UserIcon className="h-4 w-4" />} label="Usuários" n={users.length} />
        <Stat icon={<Store className="h-4 w-4" />} label="Anúncios" n={listingsCount} />
        <Stat icon={<Shield className="h-4 w-4" />} label="Admins" n={Object.values(rolesByUser).filter((r) => r.includes("admin")).length} />
      </div>

      <div className="mt-4 flex gap-2 px-5">
        <TabBtn active={tab === "users"} onClick={() => setTab("users")}>Usuários</TabBtn>
        <TabBtn active={tab === "listings"} onClick={() => setTab("listings")}>Anúncios</TabBtn>
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : tab === "users" ? (
          <div className="space-y-2">
            {users.map((u) => {
              const userRoles = rolesByUser[u.id] ?? [];
              return (
                <div key={u.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                        {(u.full_name ?? u.email)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{u.full_name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ROLES.map((r) => {
                      const has = userRoles.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => toggleRole(u.id, r, has)}
                          className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${has ? "bg-gradient-brand text-white shadow-brand" : "border border-border bg-background text-muted-foreground hover:bg-secondary"}`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {allListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum anúncio ainda.</p>
            ) : (
              allListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-soft">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-primary">{l.category}</p>
                    <p className="truncate text-sm font-bold">{l.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.city ?? "—"} · owner {l.owner_id.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {l.active ? "Ativo" : "Oculto"}
                    </span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Excluir "${l.title}"?`)) return;
                        const { error } = await supabase.from("listings").delete().eq("id", l.id);
                        if (error) return toast.error(error.message);
                        toast.success("Excluído");
                        loadListings();
                        refresh();
                      }}
                      className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, n }: { icon: React.ReactNode; label: string; n: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div>
      <p className="mt-1 text-2xl font-extrabold">{n}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${active ? "bg-gradient-brand text-white shadow-brand" : "border border-border bg-background text-muted-foreground"}`}>
      {children}
    </button>
  );
}
