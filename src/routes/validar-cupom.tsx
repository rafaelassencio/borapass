import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect } from "react";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ticket,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { getStoredPartners } from "@/lib/partners";

export const Route = createFileRoute("/validar-cupom")({
  head: () => ({ meta: [{ title: "Ativar Cupons — Bora Pass" }] }),
  component: ValidarCupomPage,
});

type RedeemedCoupon = {
  id: string;
  listing_id?: string;
  partner_id?: string;
  partner_name?: string;
  title: string;
  city?: string | null;
  code: string;
  discount: string;
  redeemed_at: string;
  status?: "valid" | "used";
  used_at?: string | null;
  user_email?: string;
};

export function ValidarCupomPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPartner, isAdmin, loading: rolesLoading } = useRoles(user?.id);
  const isLoading = authLoading || rolesLoading;
  const isAuthorized = isPartner || isAdmin;

  useEffect(() => {
    if (!isLoading && (!user || !isAuthorized)) {
      navigate({ to: "/", replace: true });
    }
  }, [isLoading, user, isAuthorized, navigate]);

  if (isLoading || !user || !isAuthorized) {
    return null;
  }
  const [searchCode, setSearchCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<RedeemedCoupon | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const partners = getStoredPartners();
  const currentPartnerStore = partners.find((p) => p.user_id === user?.id) || partners[0] || null;

  const [couponsList, setCouponsList] = useState<RedeemedCoupon[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:redeemed-coupons");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* fallback */
        }
      }
    }
    return [
      {
        id: "demo-1",
        code: "PASS-12A452",
        title: "20% OFF Almoço Típico em Gramado",
        partner_name: "Churrascaria Serra Gaúcha",
        discount: "20% OFF",
        redeemed_at: new Date(Date.now() - 3600000).toISOString(),
        status: "valid",
        user_email: "viajante@gmail.com",
      },
      {
        id: "demo-2",
        code: "PASS-89F3K1",
        title: "Cortesia de Sobremesa Especial",
        partner_name: "Café Colonial Gramado",
        discount: "Gratuito 🎁",
        redeemed_at: new Date(Date.now() - 86400000).toISOString(),
        status: "used",
        used_at: new Date(Date.now() - 40000000).toISOString(),
        user_email: "rafael.assencio12@gmail.com",
      },
    ];
  });

  const [filter, setFilter] = useState<"all" | "valid" | "used">("all");

  function saveCoupons(updated: RedeemedCoupon[]) {
    setCouponsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:redeemed-coupons", JSON.stringify(updated));
    }
  }

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSearchError(null);
    setActiveCoupon(null);

    const clean = searchCode.trim().toUpperCase();
    if (!clean) {
      return toast.error("Digite o código do cupom para buscar.");
    }

    const found = couponsList.find((c) => c.code.toUpperCase() === clean);
    if (!found) {
      setSearchError(`Código "${clean}" não encontrado na base de dados de cupons.`);
      toast.error("Cupom não encontrado.");
      return;
    }

    setActiveCoupon(found);
  }

  function handleActivateCoupon(coupon: RedeemedCoupon) {
    if (coupon.status === "used") {
      return toast.error("Este cupom já foi utilizado e invalidado.");
    }

    // Regra: O cupom só pode ser ativado pela loja à qual pertence!
    if (!isAdmin && currentPartnerStore) {
      if (coupon.partner_id && coupon.partner_id !== currentPartnerStore.id) {
        return toast.error("⚠️ Esse cupom não pode ser ativado nesse estabelecimento.");
      }
      if (
        coupon.partner_name &&
        coupon.partner_name.toLowerCase().trim() !==
          currentPartnerStore.store_name.toLowerCase().trim()
      ) {
        return toast.error("⚠️ Esse cupom não pode ser ativado nesse estabelecimento.");
      }
    }

    const now = new Date().toISOString();
    const updated = couponsList.map((c) => {
      if (c.code === coupon.code || c.id === coupon.id) {
        return { ...c, status: "used" as const, used_at: now };
      }
      return c;
    });

    saveCoupons(updated);
    setActiveCoupon({ ...coupon, status: "used", used_at: now });
    toast.success(
      `🎉 Cupom "${coupon.code}" foi ATIVADO com sucesso por ${currentPartnerStore?.store_name || "seu estabelecimento"}!`,
    );
  }

  const filteredCoupons = couponsList.filter((c) => {
    if (filter === "valid") return c.status !== "used";
    if (filter === "used") return c.status === "used";
    return true;
  });

  return (
    <AppShell>
      <PageHeader
        title="Ativar Cupons"
        subtitle="Validação e baixa de cupons resgatados por clientes"
      />

      <div className="px-5 pt-4 space-y-5">
        {/* Banner Informativo para o Parceiro */}
        <div className="rounded-2xl bg-gradient-hero p-4 text-white shadow-brand relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
              🎟️
            </div>
            <div>
              <h2 className="text-base font-extrabold">Validador de Cupons dos Clientes</h2>
              <p className="text-xs text-white/90 mt-0.5">
                Digite ou escaneie o código apresentado pelo viajante para dar baixa e invalidar o
                cupom.
              </p>
            </div>
          </div>
        </div>

        {/* Buscador de Código de Cupom */}
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3"
        >
          <label className="block text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-primary" /> Digitar ou Escanear Código do Cupom
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Ex: PASS-12A452"
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono font-bold uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand hover:opacity-95 transition"
            >
              Verificar
            </button>
          </div>
        </form>

        {/* MENSAGEM DE ERRO NA BUSCA */}
        {searchError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
            <XCircle className="h-5 w-5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* CARD DO CUPOM SELECIONADO / BUSCADO */}
        {activeCoupon && (
          <div
            className={`rounded-2xl border p-4 shadow-elevated space-y-3 ${
              activeCoupon.status === "used"
                ? "border-red-500/40 bg-red-500/5"
                : "border-emerald-500/40 bg-emerald-500/5"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-primary drop-shadow-sm select-all">
                {activeCoupon.code}
              </span>
              {activeCoupon.status === "used" ? (
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-black text-red-600 dark:text-red-400 border border-red-500/30">
                  🚫 JÁ UTILIZADO / INVALIDADO
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  🟢 VÁLIDO PARA USO
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-foreground">{activeCoupon.title}</h3>
              <p className="text-xs font-bold text-accent mt-0.5">
                Benefício: {activeCoupon.discount}
              </p>
            </div>

            <div className="rounded-xl bg-background/80 p-3 text-xs space-y-1 border border-border">
              {activeCoupon.user_email && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Cliente:{" "}
                  <strong className="text-foreground">{activeCoupon.user_email}</strong>
                </p>
              )}
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Resgatado em:{" "}
                <strong className="text-foreground">
                  {new Date(activeCoupon.redeemed_at).toLocaleString("pt-BR")}
                </strong>
              </p>
              {activeCoupon.status === "used" && activeCoupon.used_at && (
                <p className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Invalidado em:{" "}
                  {new Date(activeCoupon.used_at).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            {/* AÇÃO DO PARCEIRO: ATIVAR E INVALIDAR */}
            {activeCoupon.status === "used" ? (
              <div className="rounded-xl bg-red-500/15 p-3 text-center text-xs font-bold text-red-600 dark:text-red-400">
                ⚠️ Este cupom já foi ativado anteriormente e não pode ser reaproveitado.
              </div>
            ) : (
              <button
                onClick={() => handleActivateCoupon(activeCoupon)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-brand hover:bg-emerald-700 transition active:scale-95"
              >
                <CheckCircle2 className="h-5 w-5" /> ATIVAR E INVALIDAR CUPOM AGORA
              </button>
            )}
          </div>
        )}

        {/* LISTA DE CUPONS DO ESTABELECIMENTO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-primary" /> Cupons Resgatados pelos Clientes (
              {filteredCoupons.length})
            </h3>

            {/* Filtros */}
            <div className="flex gap-1 text-[11px] font-bold">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === "all" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter("valid")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === "valid"
                    ? "bg-emerald-600 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                Válidos
              </button>
              <button
                onClick={() => setFilter("used")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === "used" ? "bg-red-600 text-white" : "bg-secondary text-muted-foreground"
                }`}
              >
                Invalidados
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredCoupons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                Nenhum cupom encontrado nesta categoria.
              </div>
            ) : (
              filteredCoupons.map((item) => (
                <div
                  key={item.id || item.code}
                  className={`rounded-2xl border bg-card p-3.5 shadow-soft space-y-2 ${
                    item.status === "used" ? "border-red-500/30 opacity-75" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{item.code}</span>
                    {item.status === "used" ? (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[9px] font-extrabold text-red-600 dark:text-red-400">
                        Invalidado ✓
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        Válido
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-foreground">{item.title}</p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>{new Date(item.redeemed_at).toLocaleDateString("pt-BR")}</span>

                    {item.status !== "used" && (
                      <button
                        onClick={() => handleActivateCoupon(item)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition"
                      >
                        Ativar & Invalidar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
