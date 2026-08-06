import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useCities } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  LogIn,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Store,
  Tag,
  Calendar,
  Sparkles,
  Send,
  X,
  Upload,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { z } from "zod";
import { getStoredPartners, type PartnerStore } from "@/lib/partners";
import PartnerFormModal from "@/components/PartnerFormModal";
import NewListingWizardModal from "@/components/NewListingWizardModal";
import NewEventWizardModal from "@/components/NewEventWizardModal";
import { CategoryListingWizardModal } from "@/components/CategoryListingWizardModal";
import { getStoredPartnerOffers } from "@/lib/listings";

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
  store_price?: number | null;
  traveler_price?: number | null;
  premium_price?: number | null;
  offer_type?: "price" | "perk";
  traveler_perk?: string | null;
  premium_perk?: string | null;
  city: string | null;
  city_id: string | null;
  address: string | null;
  location_url?: string | null;
  discount: string | null;
  active: boolean;
  status: string;
  owner_id: string;
  created_at?: string;
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
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
        <CheckCircle2 className="h-3 w-3" /> Aprovado
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
        <XCircle className="h-3 w-3" /> Rejeitado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
      <Clock className="h-3 w-3" /> Pendente
    </span>
  );
}

function PartnerPanel() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPartner, isAdmin, isSupport, isRealAdmin, simulatedRole, loading: rolesLoading } = useRoles(user?.id, user?.email);
  const isPurePartner = isPartner && !isRealAdmin && (!simulatedRole || simulatedRole === "partner");

  useEffect(() => {
    if (!authLoading && !rolesLoading && isPurePartner) {
      navigate({ to: "/validar-cupom", replace: true });
    }
  }, [authLoading, rolesLoading, isPurePartner, navigate]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [partnerStoreList, setPartnerStoreList] = useState<PartnerStore[]>(() =>
    getStoredPartners(),
  );
  const currentPartner =
    partnerStoreList.find((p) => p.user_id === user?.id) || partnerStoreList[0] || null;

  const [showPartnerFormModal, setShowPartnerFormModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showEventWizardModal, setShowEventWizardModal] = useState(false);
  const [cmsWizardModal, setCmsWizardModal] = useState<{
    isOpen: boolean;
    category: any;
    initialData?: any;
  }>({ isOpen: false, category: "hospedagem" });
  const [activatedCoupons, setActivatedCoupons] = useState<any[]>([]);

  const isStaff = isAdmin || isSupport;
  const authorized = isPartner || isStaff;

  function loadActivatedCoupons() {
    if (typeof window !== "undefined") {
      const savedRaw = localStorage.getItem("borapass:redeemed-coupons");
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          // ONLY show activated coupons for partner
          const activated = parsed.filter((c: any) => c.status === "used");
          setActivatedCoupons(activated);
          return;
        } catch {
          /* fallback */
        }
      }
    }
    setActivatedCoupons([
      {
        id: "demo-2",
        code: "PASS-89F3K1",
        title: "Cortesia de Sobremesa Especial",
        discount: "Gratuito 🎁",
        redeemed_at: new Date(Date.now() - 86400000).toISOString(),
        status: "used",
        used_at: new Date(Date.now() - 40000000).toISOString(),
        user_email: "rafael.assencio12@gmail.com",
      },
    ]);
  }

  async function refresh() {
    if (!user) return;
    setLoading(true);
    loadActivatedCoupons();

    const q = supabase.from("listings").select("*").order("created_at", { ascending: false });
    const { data } = isStaff ? await q : await q.eq("owner_id", user.id);

    const storedOffers = getStoredPartnerOffers();

    const mergedMap = new Map<string, Listing>();
    for (const item of (data ?? []) as Listing[]) {
      mergedMap.set(item.id, item);
    }
    for (const item of storedOffers) {
      mergedMap.set(item.id, item);
    }

    setListings(Array.from(mergedMap.values()));
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
        <PageHeader title="Portal do Parceiro" />
        <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
      </AppShell>
    );
  }

  // TELA DE NÃO-PARCEIRO (Conforme a estrutura e texto solicitados pelo usuário)
  if (!user || !authorized) {
    return (
      <AppShell>
        <PageHeader title="Portal do Parceiro" subtitle="Divulgue seu negócio no Bora Pass" />
        <div className="p-6">
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-elevated">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand">
              <Building2 className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-foreground">
              Área Exclusiva para Parceiros
            </h2>
            <p className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              Ainda não encontramos uma conta de parceiro vinculada ao seu perfil.
            </p>

            <p className="mt-4 text-xs text-muted-foreground leading-relaxed text-left">
              O Portal do Parceiro é destinado a empresas, hotéis, restaurantes, atrações e
              prestadores de serviços que desejam divulgar seus negócios, criar promoções e
              acompanhar resultados dentro do Bora Pass.
            </p>

            <div className="mt-5 rounded-2xl border border-border/80 bg-secondary/30 p-4 text-left space-y-2.5 text-xs">
              <p className="font-extrabold text-foreground uppercase tracking-wide text-[10px]">
                O que você pode fazer?
              </p>

              <div className="flex items-start gap-2 text-muted-foreground">
                <span className="text-base leading-none">📝</span>
                <span className="font-semibold text-foreground">
                  Solicitar o cadastro como parceiro.
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <span className="text-base leading-none">📩</span>
                <span className="font-semibold text-foreground">
                  Entrar em contato com nossa equipe.
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <span className="text-base leading-none">🔐</span>
                <span className="font-semibold text-foreground">
                  Fazer login com uma conta de parceiro, caso já possua uma.
                </span>
              </div>
            </div>

            {/* BOTÕES SOLICITADOS */}
            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => setShowPartnerModal(true)}
                className="w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand transition active:scale-95"
              >
                Quero ser parceiro
              </button>

              <Link
                to="/ajuda"
                className="inline-block w-full rounded-2xl border border-border bg-background py-3 text-sm font-bold text-foreground hover:bg-secondary transition text-center"
              >
                Entrar em contato
              </Link>

              {!user && (
                <Link
                  to="/login"
                  className="inline-block w-full text-center text-xs font-semibold text-muted-foreground hover:text-primary pt-2"
                >
                  🔐 Já possui conta? Fazer login
                </Link>
              )}
            </div>
          </div>
        </div>

        {showPartnerModal && <PartnerRequestModal onClose={() => setShowPartnerModal(false)} />}
      </AppShell>
    );
  }

  // PAINEL DO PARCEIRO (Eventos, Cupons e Anúncios Cadastrados)
  const filteredListings =
    categoryFilter === "all" ? listings : listings.filter((l) => l.category === categoryFilter);

  const totalEvents = listings.filter((l) => l.category === "evento").length;
  const totalCoupons = listings.filter((l) => l.category === "cupom").length;
  const totalListings = listings.filter((l) =>
    ["passeio", "hospedagem", "restaurante"].includes(l.category),
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="Painel do Parceiro 🏢"
        subtitle={
          isStaff ? "Modo Staff — Gerenciamento Geral" : "Gerencie seus Eventos, Cupons e Anúncios"
        }
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setShowEventWizardModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-hero px-3.5 py-1.5 text-xs font-black text-white shadow-brand transition active:scale-95"
            >
              + Cadastrar Evento 🎉
            </button>
            <button
              onClick={() => setCmsWizardModal({ isOpen: true, category: "hospedagem" })}
              className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-3.5 py-1.5 text-xs font-black text-white shadow-brand transition active:scale-95"
            >
              <Plus className="h-4 w-4" /> Criar Anúncio ✨
            </button>
          </div>
        }
      />

      <div className="p-5 space-y-4">
        {/* Clean Store Profile Card */}
        {currentPartner && (
          <div className="rounded-3xl border border-border bg-card p-4 shadow-elevated space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {currentPartner.logo_url ? (
                  <img
                    src={currentPartner.logo_url}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover shadow-soft border border-border"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-white font-black text-2xl">
                    🏪
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-foreground">
                      {currentPartner.store_name}
                    </h2>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary border border-primary/20">
                      {currentPartner.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />{" "}
                    {currentPartner.address} — {currentPartner.city}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>
                      CNPJ:{" "}
                      <strong className="font-mono text-foreground">{currentPartner.cnpj}</strong>
                    </span>
                    <span>
                      • Resp:{" "}
                      <strong className="text-foreground">{currentPartner.owner_name}</strong>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPartnerFormModal(true)}
                  className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary transition flex items-center gap-1 shadow-sm"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar Loja
                </button>
                <button
                  onClick={() => setShowEventWizardModal(true)}
                  className="rounded-2xl bg-gradient-hero px-3.5 py-2 text-xs font-black text-white shadow-brand transition active:scale-95 flex items-center gap-1"
                >
                  + Cadastrar Evento 🎉
                </button>
                <button
                  onClick={() => setCmsWizardModal({ isOpen: true, category: "hospedagem" })}
                  className="rounded-2xl bg-gradient-brand px-3.5 py-2 text-xs font-black text-white shadow-brand transition active:scale-95 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Criar Anúncio ✨
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ativar Cupons Quick Banner */}
        <Link to="/validar-cupom" className="block">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-hero p-4 text-white shadow-brand hover:opacity-95 transition">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur text-xl">
                🎟️
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Validador Oficial
                </p>
                <p className="text-sm font-extrabold text-white">
                  Ativar & Invalidar Cupons dos Clientes
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              Validar ➔
            </span>
          </div>
        </Link>

        {/* LISTA EXCLUSIVA DE CUPONS ATIVADOS NO ESTABELECIMENTO */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-soft space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                ✅
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Cupons Ativados no Estabelecimento ({activatedCoupons.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Exibindo somente cupons validados e ativados após o viajante fornecer o código.
                </p>
              </div>
            </div>
            <Link
              to="/validar-cupom"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              + Validar Código
            </Link>
          </div>

          {activatedCoupons.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground bg-background/50">
              Nenhum cupom ativado ainda. Quando um cliente apresentar o código e você ativar no
              sistema, ele aparecerá aqui!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activatedCoupons.map((c: any) => (
                <div
                  key={c.id || c.code}
                  className="rounded-2xl border border-emerald-500/20 bg-card p-3 shadow-soft space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-primary select-all">
                      {c.code}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ✅ ATIVADO & UTILIZADO
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-foreground truncate">{c.title}</h4>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                    <span>
                      Benefício: <strong className="text-accent font-bold">{c.discount}</strong>
                    </span>
                    {c.used_at && (
                      <span>Em: {new Date(c.used_at).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-soft text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Anúncios</p>
            <p className="mt-1 text-lg font-extrabold text-foreground">{totalListings}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-soft text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Eventos</p>
            <p className="mt-1 text-lg font-extrabold text-primary">{totalEvents}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-soft text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Cupons</p>
            <p className="mt-1 text-lg font-extrabold text-accent">{totalCoupons}</p>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === "all"
                ? "bg-gradient-brand text-white shadow-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            Todos ({listings.length})
          </button>
          <button
            onClick={() => setCategoryFilter("evento")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === "evento"
                ? "bg-gradient-brand text-white shadow-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            🎉 Eventos ({totalEvents})
          </button>
          <button
            onClick={() => setCategoryFilter("cupom")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === "cupom"
                ? "bg-gradient-brand text-white shadow-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            🎟️ Cupons ({totalCoupons})
          </button>
          <button
            onClick={() => setCategoryFilter("passeio")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === "passeio"
                ? "bg-gradient-brand text-white shadow-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            🎢 Passeios
          </button>
          <button
            onClick={() => setCategoryFilter("hospedagem")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === "hospedagem"
                ? "bg-gradient-brand text-white shadow-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            🏨 Hospedagens
          </button>
          <button
            onClick={() => setCategoryFilter("restaurante")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === "restaurante"
                ? "bg-gradient-brand text-white shadow-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            🍽️ Restaurantes
          </button>
        </div>

        {/* Listings / Events / Coupons List */}
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Carregando seus cadastros...
          </p>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground space-y-3">
            <Store className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Nenhum cadastro encontrado para esta categoria.</p>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow-brand"
            >
              <Plus className="h-4 w-4" /> Criar Novo Cadastro
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((l) => (
              <div
                key={l.id}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft hover:shadow-elevated transition"
              >
                {l.image_url ? (
                  <img
                    src={l.image_url}
                    alt=""
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-xl bg-gradient-brand text-white font-bold text-xs">
                    {l.category}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {l.category}
                      </span>
                      <h3 className="truncate text-sm font-bold text-foreground mt-1">{l.title}</h3>

                      <div className="mt-1 space-y-0.5">
                        {l.offer_type === "perk" ? (
                          <div className="text-xs">
                            <p className="text-accent font-bold">
                              🎁 Viajante: {l.traveler_perk ?? "Cortesia Básica"}
                            </p>
                            <p className="text-amber-500 font-extrabold">
                              ⭐ Premium: {l.premium_perk ?? "Cortesia VIP"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {l.store_price && (
                              <span className="line-through text-muted-foreground text-[11px]">
                                Loja: R$ {l.store_price}
                              </span>
                            )}
                            <span className="font-bold text-foreground">
                              Viajante: R$ {l.traveler_price ?? l.price ?? "—"}
                            </span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                              ⭐ Premium: R$ {l.premium_price ?? "—"}
                            </span>
                            {l.discount && (
                              <span className="font-bold text-primary text-[11px]">
                                {l.discount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={l.status} />
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {l.active ? "Visível" : "Oculto"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between border-t border-border/50 pt-2 text-xs gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0 flex-1">
                      <span className="truncate">
                        📍 {l.address || l.city || "Sem endereço específico"}
                      </span>
                      {l.location_url && (
                        <a
                          href={l.location_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 font-extrabold text-primary hover:underline"
                        >
                          GPS 🗺️
                        </a>
                      )}
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setCmsWizardModal({
                            isOpen: true,
                            category: (l.category as any) || "hospedagem",
                            initialData: l,
                          });
                        }}
                        className="rounded-lg border border-border p-1.5 hover:bg-secondary"
                        title="Editar Anúncio no CMS"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(l)}
                        className="rounded-lg border border-border p-1.5 hover:bg-secondary"
                        title={l.active ? "Ocultar" : "Publicar"}
                      >
                        {l.active ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => remove(l)}
                        className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cmsWizardModal.isOpen && (
        <CategoryListingWizardModal
          isOpen={cmsWizardModal.isOpen}
          initialCategory={cmsWizardModal.category}
          initialData={cmsWizardModal.initialData}
          onClose={() => setCmsWizardModal((prev) => ({ ...prev, isOpen: false }))}
          onSave={(savedListing) => {
            const newOffer = {
              id: savedListing.id || `po-${Date.now()}`,
              title: savedListing.title,
              category: savedListing.category || "hospedagem",
              partner_id: currentPartner?.id || "p-101",
              partner_name: currentPartner?.store_name || "Parceiro Bora Pass",
              partner_phone: currentPartner?.phone || "(54) 99999-8888",
              city: savedListing.city || "Gramado",
              store_price: savedListing.store_price || 350,
              traveler_price: savedListing.traveler_price || 290,
              premium_price: savedListing.premium_price || 245,
              expiration_date: "2026-12-31",
              discount_seal: savedListing.badge_seal || "🔥 OFERTA",
              image_url: savedListing.image_url,
              description: savedListing.description,
              lat: savedListing.lat || -29.3746,
              lng: savedListing.lng || -50.8764,
              status: savedListing.status || "approved",
              active: savedListing.active !== false,
              created_at: new Date().toISOString().split("T")[0],
              ...savedListing,
            };

            try {
              const savedRaw = localStorage.getItem("borapass:partner-offers");
              const parsed = savedRaw ? JSON.parse(savedRaw) : [];
              const filtered = parsed.filter((item: any) => item.id !== newOffer.id);
              localStorage.setItem(
                "borapass:partner-offers",
                JSON.stringify([newOffer, ...filtered]),
              );
            } catch {
              /* fallback */
            }

            try {
              const savedRaw = localStorage.getItem("borapass:custom-listings");
              const parsed = savedRaw ? JSON.parse(savedRaw) : [];
              const filtered = parsed.filter((item: any) => item.id !== newOffer.id);
              localStorage.setItem(
                "borapass:custom-listings",
                JSON.stringify([newOffer, ...filtered]),
              );
            } catch {
              /* fallback */
            }

            toast.success(`Anúncio "${newOffer.title}" salvo com sucesso! 🎉`);
            refresh();
          }}
        />
      )}

      {showForm && (
        <ListingForm
          userId={user.id}
          isStaff={isStaff}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {showPartnerFormModal && (
        <PartnerFormModal
          partner={currentPartner}
          onClose={() => setShowPartnerFormModal(false)}
          onSave={() => setPartnerStoreList(getStoredPartners())}
        />
      )}

      {showWizardModal && (
        <NewListingWizardModal
          isAdmin={isStaff}
          currentUserPartnerId={currentPartner?.id}
          onClose={() => setShowWizardModal(false)}
          onSaveListing={() => refresh()}
        />
      )}

      {showEventWizardModal && (
        <NewEventWizardModal
          isAdmin={isStaff}
          currentUserPartnerId={currentPartner?.id}
          onClose={() => setShowEventWizardModal(false)}
          onSaveEvent={() => refresh()}
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(initial?.image_url ?? "");
  const { data: cities } = useCities();

  const [form, setForm] = useState({
    category: initial?.category ?? "passeio",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    offer_type: (initial?.offer_type ?? "price") as "price" | "perk",
    price: initial?.price?.toString() ?? "",
    store_price: initial?.store_price?.toString() ?? "",
    traveler_price: initial?.traveler_price?.toString() ?? "",
    premium_price: initial?.premium_price?.toString() ?? "",
    traveler_perk: initial?.traveler_perk ?? "",
    premium_perk: initial?.premium_perk ?? "",
    city_id: initial?.city_id ?? "",
    address: initial?.address ?? "",
    location_url: initial?.location_url ?? "",
    discount: initial?.discount ?? "",
    expires_at: (initial as any)?.expires_at ?? "",
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      return toast.error("A foto deve ter no máximo 8MB.");
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setForm((prev) => ({ ...prev, image_url: result }));
      setUploadingImage(false);
      toast.success("Foto carregada com sucesso!");
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast.error("Erro ao ler o arquivo de foto.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const cityName = cities?.find((c) => c.id === form.city_id)?.name ?? null;
      const storeP = form.store_price ? parseFloat(form.store_price) : null;
      const travelerP = form.traveler_price ? parseFloat(form.traveler_price) : null;
      const premiumP = form.premium_price ? parseFloat(form.premium_price) : null;

      // Safe DB payload using ONLY standard columns existing in Supabase schema
      const dbPayload: Record<string, unknown> = {
        owner_id: userId,
        category: form.category,
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        price: travelerP ?? (form.price ? parseFloat(form.price) : null),
        city_id: form.city_id || null,
        city: cityName,
        address: form.address || null,
        discount: form.discount || null,
      };

      if (!isStaff) dbPayload.status = "pending";

      // Attempt Supabase insert/update silently
      try {
        if (initial) {
          await supabase
            .from("listings")
            .update(dbPayload as never)
            .eq("id", initial.id);
        } else {
          await supabase.from("listings").insert(dbPayload as never);
        }
      } catch (err) {
        console.warn("Supabase insert error (using local backup):", err);
      }

      // Full listing object with custom extra fields
      const newListingObj: Listing = {
        id: initial?.id ?? `custom-${Date.now()}`,
        owner_id: userId,
        category: form.category,
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        offer_type: form.offer_type,
        price: travelerP ?? (form.price ? parseFloat(form.price) : null),
        store_price: storeP,
        traveler_price: travelerP,
        premium_price: premiumP,
        traveler_perk: form.traveler_perk || null,
        premium_perk: form.premium_perk || null,
        city_id: form.city_id || null,
        city: cityName,
        address: form.address || null,
        location_url: form.location_url || null,
        discount: form.discount || null,
        expires_at: form.expires_at || null,
        active: initial?.active ?? true,
        status: isStaff ? "approved" : "pending",
        created_at: initial?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        partner_id: null,
        lat: null,
        lng: null,
      } as unknown as Listing;

      // Always persist to local custom storage so saving NEVER fails
      if (typeof window !== "undefined") {
        const savedCustomRaw = localStorage.getItem("borapass:custom-listings");
        const customListings: Listing[] = savedCustomRaw ? JSON.parse(savedCustomRaw) : [];
        const existingIdx = customListings.findIndex((l) => l.id === newListingObj.id);
        if (existingIdx >= 0) {
          customListings[existingIdx] = newListingObj;
        } else {
          customListings.unshift(newListingObj);
        }
        localStorage.setItem("borapass:custom-listings", JSON.stringify(customListings));
      }

      toast.success(
        isStaff
          ? "Anúncio e foto salvos com sucesso!"
          : "Anúncio e foto salvos! Enviado para aprovação do Admin.",
      );
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar cadastro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-elevated border border-border">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground">
              {initial ? "Editar Cadastro" : "Novo Anúncio / Evento / Cupom"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Preencha a localização exata, preços e benefícios
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isStaff && (
          <p className="mt-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            ⏳ Todo anúncio criado ou editado é revisado pela equipe Bora Pass antes de ser
            publicado.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-card text-foreground">
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cidade">
              <select
                value={form.city_id}
                onChange={(e) => setForm({ ...form, city_id: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" className="bg-card text-foreground">
                  Selecione...
                </option>
                {(cities ?? []).map((c) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.name} {c.state ? `(${c.state})` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Título do Anúncio / Evento / Cupom">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Passeio de Escuna VIP ou Cupom 30% OFF Burger"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Descrição Detalhada">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Descreva o que está incluso no anúncio, horários e regras..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          {/* Foto do Anúncio (Upload de Arquivo ou URL) */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase text-muted-foreground">
              Foto do Anúncio / Evento
            </label>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-soft">
              {imagePreview ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setForm((prev) => ({ ...prev, image_url: "" }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid aspect-video w-full place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40 p-4 text-center">
                  <div className="space-y-1">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-xs font-bold text-foreground">
                      Envie uma foto do seu dispositivo
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      PNG, JPG, WEBP até 8MB
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer rounded-xl bg-gradient-brand py-2.5 text-center text-xs font-bold text-white shadow-brand hover:opacity-95 transition">
                  {uploadingImage ? "Carregando foto..." : "📸 Enviar Foto do Celular / Computador"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-1">
                <span className="text-[10px] text-muted-foreground block font-semibold">
                  Ou cole a URL da imagem da internet:
                </span>
                <input
                  value={form.image_url}
                  onChange={(e) => {
                    setForm({ ...form, image_url: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Oferta: Preço em R$ ou Produtos / Cortesias */}
          <div>
            <label className="mb-1 block text-xs font-extrabold uppercase text-muted-foreground">
              Tipo de Oferta do Cadastro
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, offer_type: "price" })}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  form.offer_type === "price"
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💵 Preço / Desconto em R$
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, offer_type: "perk" })}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  form.offer_type === "perk"
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🎁 Produto / Cortesia
              </button>
            </div>
          </div>

          {/* Configuração de Preços ou Cortesias */}
          {form.offer_type === "price" ? (
            <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-soft">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
                💰 Preços Diferenciados por Nível
              </p>
              <div>
                <Field label="Preço da Loja (Balcão / Sem Desconto)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.store_price}
                    onChange={(e) => setForm({ ...form, store_price: e.target.value })}
                    placeholder="Ex: 100.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Preço pro Viajante (Comum)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.traveler_price}
                    onChange={(e) => setForm({ ...form, traveler_price: e.target.value })}
                    placeholder="Ex: 80.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Preço pro Viajante Premium ⭐">
                  <input
                    type="number"
                    step="0.01"
                    value={form.premium_price}
                    onChange={(e) => setForm({ ...form, premium_price: e.target.value })}
                    placeholder="Ex: 50.00"
                    className="w-full rounded-xl border border-amber-500/50 bg-amber-500/5 px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </Field>
              </div>
              <Field label="Selo de Desconto (ex: 20% OFF ou 2x1)">
                <input
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  placeholder="Ex: 30% OFF Exclusivo"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-soft">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-accent">
                🎁 Produtos & Cortesias Gratuitas
              </p>
              <Field label="Cortesia para Viajante (Comum)">
                <input
                  value={form.traveler_perk}
                  onChange={(e) => setForm({ ...form, traveler_perk: e.target.value })}
                  placeholder="Ex: 1 Expresso grátis na compra da refeição"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Cortesia para Viajante Premium ⭐">
                <input
                  value={form.premium_perk}
                  onChange={(e) => setForm({ ...form, premium_perk: e.target.value })}
                  placeholder="Ex: Entrada VIP + Sobremesa especial + Taça de espumante grátis"
                  className="w-full rounded-xl border border-amber-500/50 bg-amber-500/5 px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-amber-500"
                />
              </Field>
            </div>
          )}

          {/* Data de Validade / Expiração */}
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-soft space-y-1">
            <Field label="⏰ Data de Expiração / Validade do Cupom ou Oferta">
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>
            <p className="text-[10px] text-muted-foreground font-medium">
              Defina a data limite para expiração deste cupom ou promoção.
            </p>
          </div>

          {/* Localização Exata & GPS */}
          <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-soft">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
              📍 Localização Exata & Link GPS
            </p>
            <Field label="Endereço Completo do Local / Evento">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex: Av. Atlântica, 1702, Copacabana, Rio de Janeiro - RJ"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>
            <Field label="Link da Localização Exata (Google Maps / Waze / GPS)">
              <input
                value={form.location_url}
                onChange={(e) => setForm({ ...form, location_url: e.target.value })}
                placeholder="Ex: https://maps.google.com/?q=-22.9698,-43.1802"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border bg-background py-3 text-xs font-bold text-foreground hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-gradient-brand py-3 text-xs font-bold text-white shadow-brand transition active:scale-95 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar Cadastro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function PartnerRequestModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [responsibleName, setResponsibleName] = useState(user?.user_metadata?.full_name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Rio de Janeiro");
  const [category, setCategory] = useState("restaurante");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim() || !contactEmail.trim()) {
      return toast.error("Por favor, preencha o nome da empresa e o e-mail de contato.");
    }

    setSending(true);

    const ticketId = `TK-PARCERIA-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toLocaleString("pt-BR");

    const description = `🏢 SOLICITAÇÃO DE PARCERIA COMERCIAL\n\n- Nome da Empresa: ${businessName.trim()}\n- Responsável: ${responsibleName.trim()}\n- E-mail: ${contactEmail.trim()}\n- Telefone / WhatsApp: ${phone.trim() || "Não informado"}\n- Cidade: ${city}\n- Categoria de Atuação: ${category}\n\nDetalhes / Mensagem:\n${notes.trim() || "Desejo cadastrar minha empresa no Bora Pass."}`;

    const newTicket = {
      id: ticketId,
      userId: user?.id || `user-guest-${Date.now()}`,
      userName: responsibleName.trim() || businessName.trim(),
      userEmail: contactEmail.trim(),
      subject: `🏢 Parceria Comercial: ${businessName.trim()} (${city})`,
      category: "Solicitação de Parceria",
      status: "aberto" as const,
      description,
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: "user" as const,
          senderName: responsibleName.trim() || businessName.trim(),
          text: description,
          timestamp: nowStr,
        },
      ],
      createdAt: nowStr,
    };

    if (typeof window !== "undefined") {
      const savedRaw = localStorage.getItem("borapass:support-tickets");
      const current = savedRaw ? JSON.parse(savedRaw) : [];
      localStorage.setItem("borapass:support-tickets", JSON.stringify([newTicket, ...current]));
    }

    setSending(false);
    toast.success(
      "🎉 Sua solicitação de parceria foi enviada ao nosso suporte! Nossa equipe entrará em contato em breve.",
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-6 shadow-elevated sm:rounded-3xl border border-border"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Solicitar Cadastro de Parceiro</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Preencha os dados da sua empresa abaixo. As informações serão enviadas diretamente para
            nossa equipe no <strong>Painel de Suporte</strong> para análise e resposta rápida.
          </p>

          <Field label="Nome da Empresa / Estabelecimento">
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Pousada Costa do Sol / Restaurante Sabor Mar"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Nome do Responsável">
              <input
                type="text"
                required
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>

            <Field label="WhatsApp / Telefone">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (21) 99887-6655"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>
          </div>

          <Field label="E-mail Corporativo / Contato">
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Ex: contato@empresa.com.br"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Cidade do Estabelecimento">
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Armação dos Búzios - RJ"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>

            <Field label="Categoria do Negócio">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="restaurante">🍽️ Gastronomia / Restaurante</option>
                <option value="hospedagem">🏨 Hospedagem / Hotel / Pousada</option>
                <option value="passeio">🎢 Passeio / Atração Turística</option>
                <option value="evento">🎉 Evento / Festas</option>
                <option value="compras">🛍️ Compras & Serviços</option>
              </select>
            </Field>
          </div>

          <Field label="Apresentação do Negócio / Proposta (Opcional)">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva brevemente seu estabelecimento ou a promoção que deseja oferecer aos viajantes..."
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border bg-background py-3 text-xs font-bold text-foreground hover:bg-secondary"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={sending}
              className="flex-1 rounded-2xl bg-gradient-brand py-3 text-xs font-bold text-white shadow-brand transition active:scale-95 disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Enviar Solicitação ao Suporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
