import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useCities } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, LogIn, ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/parceiro")({
  head: () => ({ meta: [{ title: "Painel do Parceiro — Bora Pass" }] }),
  component: PartnerPanel,
});

type Listing = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  city: string | null;
  city_id: string | null;
  address: string | null;
  discount: string | null;
  active: boolean;
  status: string;
  owner_id: string;
};

const CATEGORIES = [
  { value: "passeio", label: "Passeio" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "restaurante", label: "Restaurante" },
  { value: "evento", label: "Evento" },
  { value: "cupom", label: "Cupom" },
];

const listingSchema = z.object({
  category: z.enum(["passeio", "hospedagem", "restaurante", "evento", "cupom"]),
  title: z.string().trim().min(2, "Título muito curto").max(120),
  description: z.string().trim().max(1000).optional(),
  image_url: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1000000).optional(),
  city_id: z.string().uuid().optional().or(z.literal("")),
  address: z.string().trim().max(200).optional(),
  discount: z.string().trim().max(30).optional(),
});

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"><CheckCircle2 className="h-3 w-3" /> Aprovado</span>;
  if (status === "rejected")
    return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive"><XCircle className="h-3 w-3" /> Rejeitado</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600"><Clock className="h-3 w-3" /> Pendente</span>;
}

function PartnerPanel() {
  const { user, loading: authLoading } = useAuth();
  const { isPartner, isAdmin, isSupport, loading: rolesLoading } = useRoles(user?.id);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isStaff = isAdmin || isSupport;
  const authorized = isPartner || isStaff;

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const q = supabase.from("listings").select("*").order("created_at", { ascending: false });
    const { data, error } = isStaff ? await q : await q.eq("owner_id", user.id);
    if (error) toast.error(error.message);
    setListings((data ?? []) as Listing[]);
    setLoading(false);
  }

  useEffect(() => {
    if (user && authorized) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authorized, isStaff]);

  async function toggleActive(l: Listing) {
    const { error } = await supabase.from("listings").update({ active: !l.active }).eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success(l.active ? "Anúncio ocultado" : "Anúncio publicado");
    refresh();
  }

  async function remove(l: Listing) {
    if (!confirm(`Excluir "${l.title}"?`)) return;
    const { error } = await supabase.from("listings").delete().eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Anúncio excluído");
    refresh();
  }

  if (authLoading || rolesLoading) {
    return (
      <AppShell>
        <PageHeader title="Painel do Parceiro" />
        <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Painel do Parceiro" />
        <div className="p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Entre para acessar o painel do parceiro.</p>
          <Link to="/login" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!authorized) {
    return (
      <AppShell>
        <PageHeader title="Painel do Parceiro" />
        <div className="p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sua conta ainda não é um parceiro. Solicite acesso à equipe Bora Pass ou peça a um admin para conceder o papel <b>partner</b>.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Painel do Parceiro"
        subtitle={isStaff ? "Modo staff — vendo todos os anúncios" : "Gerencie seus anúncios (aguardam aprovação)"}
        right={
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-brand"
          >
            <Plus className="h-3.5 w-3.5" /> Novo
          </button>
        }
      />

      <div className="space-y-3 p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando anúncios...</p>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum anúncio ainda. Toque em <b>Novo</b> para criar o primeiro.
          </div>
        ) : (
          listings.map((l) => (
            <div key={l.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
              {l.image_url ? (
                <img src={l.image_url} alt="" className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">sem foto</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{l.category}</p>
                    <h3 className="truncate text-sm font-bold">{l.title}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.city ?? "—"} {l.price ? `· R$ ${l.price}` : ""} {l.discount ? `· ${l.discount}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={l.status} />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {l.active ? "Visível" : "Oculto"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => { setEditing(l); setShowForm(true); }} className="rounded-lg border border-border p-1.5 hover:bg-secondary" title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleActive(l)} className="rounded-lg border border-border p-1.5 hover:bg-secondary" title={l.active ? "Ocultar" : "Publicar"}>
                    {l.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => remove(l)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <ListingForm
          userId={user.id}
          isStaff={isStaff}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh(); }}
        />
      )}
    </AppShell>
  );
}

function ListingForm({
  userId,
  isStaff,
  initial,
  onClose,
  onSaved,
}: {
  userId: string;
  isStaff: boolean;
  initial: Listing | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { data: cities } = useCities();
  const [form, setForm] = useState({
    category: initial?.category ?? "passeio",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    price: initial?.price?.toString() ?? "",
    city_id: initial?.city_id ?? "",
    address: initial?.address ?? "",
    discount: initial?.discount ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const parsed = listingSchema.parse({
        ...form,
        price: form.price === "" ? undefined : form.price,
      });
      const cityName = cities?.find((c) => c.id === parsed.city_id)?.name ?? null;
      const payload: Record<string, unknown> = {
        owner_id: userId,
        category: parsed.category,
        title: parsed.title,
        description: parsed.description || null,
        image_url: parsed.image_url || null,
        price: parsed.price ?? null,
        city_id: parsed.city_id || null,
        city: cityName,
        address: parsed.address || null,
        discount: parsed.discount || null,
      };
      // Partners revert their listing to pending on any edit; staff keep status
      if (!isStaff) payload.status = "pending";

      const res = initial
        ? await supabase.from("listings").update(payload).eq("id", initial.id)
        : await supabase.from("listings").insert(payload as never);
      if (res.error) throw res.error;
      toast.success(isStaff ? "Anúncio salvo" : "Enviado para aprovação");
      onSaved();
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Editar anúncio" : "Novo anúncio"}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground">Cancelar</button>
        </div>
        {!isStaff && (
          <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
            Todo anúncio criado ou editado é revisado pela equipe antes de aparecer publicamente.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Categoria">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Título">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Descrição">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="URL da imagem">
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço (R$)">
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Desconto (ex: 20%)">
              <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <Field label="Cidade">
            <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              {(cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}{c.state ? ` - ${c.state}` : ""}</option>)}
            </select>
          </Field>
          <Field label="Endereço">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </Field>
          <button type="submit" disabled={saving} className="mt-2 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
