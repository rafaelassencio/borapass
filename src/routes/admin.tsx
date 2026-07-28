import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useRoles, type AppRole } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { LogIn, ShieldAlert, Shield, Store, User as UserIcon, Trash2, Check, X, Plus, MapPin, Users, Image as ImageIcon, Sparkles } from "lucide-react";
import { useCities, type City } from "@/lib/cities";
import { useHomeBanners, useHomeHighlights, type HomeBanner, type HomeHighlight } from "@/lib/home-content";
import { useQueryClient } from "@tanstack/react-query";

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

const ROLES: AppRole[] = ["admin", "support", "partner", "user", "premium"];
const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  support: "Suporte",
  partner: "Parceiro",
  user: "Viajante",
  premium: "Viajante Premium",
};

type Tab = "users" | "listings" | "approvals" | "cities" | "banners" | "highlights";

function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSupport, loading: rolesLoading, roles } = useRoles(user?.id);
  const isStaff = isAdmin || isSupport;
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [listingsCount, setListingsCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [tab, setTab] = useState<Tab>("users");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [allListings, setAllListings] = useState<Array<{ id: string; title: string; category: string; owner_id: string; active: boolean; status: string; city: string | null }>>([]);
  const [pending, setPending] = useState<Array<{ id: string; title: string; category: string; owner_id: string; city: string | null; image_url: string | null; description: string | null }>>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [uRes, rRes, cRes, pRes] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    if (uRes.error) toast.error(uRes.error.message);
    setUsers((uRes.data ?? []) as UserRow[]);
    const grouped: Record<string, AppRole[]> = {};
    for (const r of (rRes.data ?? []) as RoleRow[]) {
      (grouped[r.user_id] ??= []).push(r.role);
    }
    setRolesByUser(grouped);
    setListingsCount(cRes.count ?? 0);
    setPendingCount(pRes.count ?? 0);
    setLoading(false);
  }, []);

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase.from("listings").select("id, title, category, owner_id, active, status, city").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAllListings((data ?? []) as typeof allListings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPending = useCallback(async () => {
    const { data, error } = await supabase.from("listings").select("id, title, category, owner_id, city, image_url, description").eq("status", "pending").order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setPending((data ?? []) as typeof pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStaff) refresh();
  }, [isStaff, refresh]);

  useEffect(() => {
    if (!isStaff) return;
    if (tab === "listings") loadListings();
    if (tab === "approvals") loadPending();
  }, [isStaff, tab, loadListings, loadPending]);

  async function toggleRole(userId: string, role: AppRole, has: boolean) {
    if (!isAdmin && role === "admin") return toast.error("Apenas admins podem gerenciar admins");
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Papéis atualizados");
    refresh();
  }

  async function reviewListing(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("listings").update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Aprovado" : "Rejeitado");
    loadPending();
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

  if (!isStaff) {
    return (
      <AppShell>
        <PageHeader title="Admin" />
        <div className="p-6 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Você não tem acesso de administrador ou suporte.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Papéis atuais: {roles.length ? roles.map((r) => ROLE_LABEL[r]).join(", ") : "Viajante"}</p>
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

  const filteredUsers = roleFilter === "all"
    ? users
    : users.filter((u) => (rolesByUser[u.id] ?? []).includes(roleFilter));

  return (
    <AppShell>
      <PageHeader title="Painel Admin" subtitle={isAdmin ? "Administrador" : "Suporte"} />
      <div className="grid grid-cols-4 gap-2 px-5 pt-4">
        <Stat icon={<UserIcon className="h-4 w-4" />} label="Usuários" n={users.length} />
        <Stat icon={<Store className="h-4 w-4" />} label="Anúncios" n={listingsCount} />
        <Stat icon={<Shield className="h-4 w-4" />} label="Pendentes" n={pendingCount} />
        <Stat icon={<Shield className="h-4 w-4" />} label="Admins" n={Object.values(rolesByUser).filter((r) => r.includes("admin")).length} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 px-5">
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-3.5 w-3.5" />}>Usuários</TabBtn>
        <TabBtn active={tab === "approvals"} onClick={() => setTab("approvals")} icon={<Check className="h-3.5 w-3.5" />}>Aprovações{pendingCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 py-0 text-[10px] text-white">{pendingCount}</span>}</TabBtn>
        <TabBtn active={tab === "listings"} onClick={() => setTab("listings")} icon={<Store className="h-3.5 w-3.5" />}>Anúncios</TabBtn>
        <TabBtn active={tab === "cities"} onClick={() => setTab("cities")} icon={<MapPin className="h-3.5 w-3.5" />}>Cidades</TabBtn>
        <TabBtn active={tab === "banners"} onClick={() => setTab("banners")} icon={<ImageIcon className="h-3.5 w-3.5" />}>Banners</TabBtn>
        <TabBtn active={tab === "highlights"} onClick={() => setTab("highlights")} icon={<Sparkles className="h-3.5 w-3.5" />}>Destaques</TabBtn>
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : tab === "users" ? (
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <FilterChip active={roleFilter === "all"} onClick={() => setRoleFilter("all")}>Todos</FilterChip>
              {ROLES.map((r) => (
                <FilterChip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>{ROLE_LABEL[r]}</FilterChip>
              ))}
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => {
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
                        const disabled = !isAdmin && r === "admin";
                        return (
                          <button
                            key={r}
                            disabled={disabled}
                            onClick={() => toggleRole(u.id, r, has)}
                            className={`rounded-full px-3 py-1 text-[11px] font-bold transition disabled:opacity-40 ${has ? "bg-gradient-brand text-white shadow-brand" : "border border-border bg-background text-muted-foreground hover:bg-secondary"}`}
                          >
                            {ROLE_LABEL[r]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário com esse papel.</p>}
            </div>
          </div>
        ) : tab === "approvals" ? (
          <div className="space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum anúncio aguardando aprovação. ✨</p>
            ) : (
              pending.map((l) => (
                <div key={l.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                  <div className="flex gap-3">
                    {l.image_url ? (
                      <img src={l.image_url} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-muted text-[10px] text-muted-foreground">sem foto</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-primary">{l.category}</p>
                      <p className="truncate text-sm font-bold">{l.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{l.description ?? "—"}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{l.city ?? "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => reviewListing(l.id, "approved")} className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-brand">
                      <Check className="mr-1 inline h-3.5 w-3.5" /> Aprovar
                    </button>
                    <button onClick={() => reviewListing(l.id, "rejected")} className="flex-1 rounded-xl border border-destructive/50 py-2 text-xs font-bold text-destructive hover:bg-destructive/10">
                      <X className="mr-1 inline h-3.5 w-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === "listings" ? (
          <div className="space-y-2">
            {allListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum anúncio ainda.</p>
            ) : (
              allListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-soft">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-primary">{l.category}</p>
                    <p className="truncate text-sm font-bold">{l.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.city ?? "—"} · {l.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {l.active ? "Visível" : "Oculto"}
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
        ) : (
          <CitiesTab />
        )}
      </div>
    </AppShell>
  );
}

function CitiesTab() {
  const { data: cities, isLoading, refetch } = useCities(true);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);

  async function toggleActive(c: City) {
    const { error } = await supabase.from("cities").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refetch();
    qc.invalidateQueries({ queryKey: ["cities"] });
  }

  async function remove(c: City) {
    if (!confirm(`Excluir "${c.name}"?`)) return;
    const { error } = await supabase.from("cities").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    refetch();
    qc.invalidateQueries({ queryKey: ["cities"] });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{(cities ?? []).length} cidades</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-brand">
          <Plus className="h-3.5 w-3.5" /> Nova cidade
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (cities ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma cidade.</p>
      ) : (
        <div className="space-y-2">
          {(cities ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-soft">
              <div>
                <p className="text-sm font-bold">{c.name}{c.state ? ` — ${c.state}` : ""}</p>
                <p className="text-[11px] text-muted-foreground">/{c.slug} · ordem {c.sort_order}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(c)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {c.active ? "Ativa" : "Oculta"}
                </button>
                <button onClick={() => { setEditing(c); setShowForm(true); }} className="rounded-lg border border-border p-1.5 text-xs">Editar</button>
                <button onClick={() => remove(c)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <CityForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); qc.invalidateQueries({ queryKey: ["cities"] }); }}
        />
      )}
    </div>
  );
}

function CityForm({ initial, onClose, onSaved }: { initial: City | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    state: initial?.state ?? "",
    slug: initial?.slug ?? "",
    sort_order: initial?.sort_order ?? 0,
    active: initial?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.name);
    const payload = {
      name: form.name.trim(),
      state: form.state.trim() || null,
      slug,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    };
    const res = initial
      ? await supabase.from("cities").update(payload).eq("id", initial.id)
      : await supabase.from("cities").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Editar cidade" : "Nova cidade"}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground">Cancelar</button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Nome</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">UF</span>
              <input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Ordem</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Slug (opcional)</span>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex: rio-de-janeiro" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Cidade ativa (aparece no seletor)
          </label>
          <button type="submit" disabled={saving} className="mt-2 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
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

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? "bg-gradient-brand text-white shadow-brand" : "border border-border bg-background text-muted-foreground"}`}>
      {icon}{children}
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${active ? "bg-primary/10 text-primary" : "border border-border bg-background text-muted-foreground hover:bg-secondary"}`}>
      {children}
    </button>
  );
}
