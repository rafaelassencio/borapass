import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Camera,
  RefreshCw,
  X,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { getStoredPartners } from "@/lib/partners";

export const Route = createFileRoute("/validar-cupom")({
  head: () => ({ meta: [{ title: "Ativar Cupom — Portal do Parceiro" }] }),
  component: ValidarCupomPage,
});

type CouponStatus = "valid" | "used" | "expired" | "invalid";

type RedeemedCoupon = {
  id: string;
  code: string;
  title: string;
  partner_name?: string;
  discount: string;
  redeemed_at: string;
  status: CouponStatus;
  used_at?: string | null;
  user_email?: string;
  user_name?: string;
  expiration_date?: string;
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

  const [searchCode, setSearchCode] = useState("");
  const [validatedCoupon, setValidatedCoupon] = useState<RedeemedCoupon | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Histórico apenas da SESSÃO ATUAL
  const [sessionHistory, setSessionHistory] = useState<RedeemedCoupon[]>([]);

  const partners = getStoredPartners();
  const currentPartnerStore = partners.find((p) => p.user_id === user?.id) || partners[0] || null;

  // Base de cupons para validação
  const [couponsList, setCouponsList] = useState<RedeemedCoupon[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:redeemed-coupons");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* fallback */ }
      }
    }
    return [
      {
        id: "c-1",
        code: "PASS-12A452",
        title: "20% OFF Almoço Típico Gaúcho",
        partner_name: currentPartnerStore?.store_name || "Restaurante Parceiro",
        discount: "20% OFF",
        redeemed_at: new Date(Date.now() - 3600000).toISOString(),
        status: "valid",
        user_email: "viajante.premium@gmail.com",
        user_name: "Mariana Silva Santos",
        expiration_date: new Date(Date.now() + 864000000).toISOString(),
      },
      {
        id: "c-2",
        code: "PASS-89F3K1",
        title: "Cortesia de Sobremesa Especial",
        partner_name: currentPartnerStore?.store_name || "Café Colonial Gramado",
        discount: "Gratuito 🎁",
        redeemed_at: new Date(Date.now() - 86400000).toISOString(),
        status: "used",
        used_at: new Date(Date.now() - 40000000).toISOString(),
        user_email: "rafael.assencio12@gmail.com",
        user_name: "Rafael Assêncio",
      },
      {
        id: "c-3",
        code: "PASS-EXP99",
        title: "30% OFF Passeio de Maria Fumaça",
        partner_name: currentPartnerStore?.store_name || "Agência de Turismo",
        discount: "30% OFF",
        redeemed_at: new Date(Date.now() - 864000000).toISOString(),
        status: "expired",
        user_email: "cliente.expirado@hotmail.com",
        user_name: "Carlos Eduardo",
        expiration_date: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  });

  function handleValidateCode(codeToSearch?: string) {
    setValidationError(null);
    setValidatedCoupon(null);

    const clean = (codeToSearch || searchCode).trim().toUpperCase();
    if (!clean) {
      toast.error("Digite ou escaneie o código do cupom.");
      return;
    }

    const found = couponsList.find((c) => c.code.toUpperCase() === clean);

    if (!found) {
      setValidationError(`Código "${clean}" não é um cupom válido no Bora Pass.`);
      toast.error("Cupom inválido!");
      return;
    }

    setValidatedCoupon(found);
    toast.info(`Cupom "${clean}" localizado. Verifique o status abaixo.`);
  }

  function handleConfirmActivation(coupon: RedeemedCoupon) {
    if (coupon.status === "used") {
      return toast.error("Este cupom já foi utilizado e invalidado.");
    }
    if (coupon.status === "expired") {
      return toast.error("Este cupom expirou e não pode ser ativado.");
    }

    const now = new Date().toISOString();
    const updatedCoupon: RedeemedCoupon = {
      ...coupon,
      status: "used",
      used_at: now,
    };

    const updatedList = couponsList.map((c) => (c.code === coupon.code ? updatedCoupon : c));

    setCouponsList(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("borapass:redeemed-coupons", JSON.stringify(updatedList));
    }

    setValidatedCoupon(updatedCoupon);

    // Registra na sessão atual
    setSessionHistory((prev) => [updatedCoupon, ...prev.filter((p) => p.code !== updatedCoupon.code)]);

    toast.success(`🎉 Cupom "${coupon.code}" foi ATIVADO com sucesso!`);
  }

  if (isLoading || !user || !isAuthorized) {
    return null;
  }

  return (
    <AppShell>
      <PageHeader title="Ativar Cupom" subtitle="Validação e baixa rápida de cupons no atendimento" />

      <div className="px-5 pt-4 space-y-5 pb-24">
        {/* BUSCADOR DE CÓDIGO & SCANNER QR */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-elevated space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" /> Código ou QR Code do Cliente
            </label>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Atendimento Parceiro
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Digite o código (ex: PASS-12A452)"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-mono font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/40"
                onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
              />
              {searchCode && (
                <button
                  onClick={() => setSearchCode("")}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => handleValidateCode()}
              className="rounded-2xl bg-gradient-brand px-6 py-3 text-xs font-black text-white shadow-brand hover:opacity-95 transition shrink-0 flex items-center justify-center gap-2"
            >
              Validar Cupom
            </button>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="w-full rounded-2xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 py-3 text-xs font-bold text-primary transition flex items-center justify-center gap-2"
          >
            <Camera className="h-4 w-4" /> Escanear QR Code com a Câmera
          </button>
        </div>

        {/* MENSAGEM DE ERRO (CUPOM INVÁLIDO) */}
        {validationError && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2 shadow-soft">
            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* CARD DE RESULTADO DA VALIDAÇÃO */}
        {validatedCoupon && (
          <div
            className={`rounded-3xl border p-5 shadow-elevated space-y-4 ${
              validatedCoupon.status === "valid"
                ? "border-emerald-500/50 bg-emerald-500/10"
                : validatedCoupon.status === "used"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-red-500/50 bg-red-500/10"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
              <span className="font-mono text-2xl font-black tracking-widest text-foreground select-all">
                {validatedCoupon.code}
              </span>

              {validatedCoupon.status === "valid" && (
                <span className="rounded-full bg-emerald-500 text-slate-950 px-3 py-1 text-[11px] font-black uppercase shadow-sm flex items-center gap-1">
                  🟢 Cupom Válido
                </span>
              )}
              {validatedCoupon.status === "used" && (
                <span className="rounded-full bg-amber-500 text-slate-950 px-3 py-1 text-[11px] font-black uppercase shadow-sm flex items-center gap-1">
                  ⚠️ Cupom Já Utilizado
                </span>
              )}
              {validatedCoupon.status === "expired" && (
                <span className="rounded-full bg-red-500 text-white px-3 py-1 text-[11px] font-black uppercase shadow-sm flex items-center gap-1">
                  ⏰ Cupom Expirado
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-foreground">{validatedCoupon.title}</h3>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                Desconto / Benefício: {validatedCoupon.discount}
              </p>
            </div>

            <div className="rounded-2xl bg-background/80 p-3.5 text-xs space-y-1.5 border border-border/60">
              {validatedCoupon.user_name && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Cliente:{" "}
                  <strong className="text-foreground font-bold">{validatedCoupon.user_name}</strong>
                </p>
              )}
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Resgatado em:{" "}
                <strong className="text-foreground font-mono">
                  {new Date(validatedCoupon.redeemed_at).toLocaleString("pt-BR")}
                </strong>
              </p>
              {validatedCoupon.status === "used" && validatedCoupon.used_at && (
                <p className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Utilizado em:{" "}
                  <span className="font-mono">{new Date(validatedCoupon.used_at).toLocaleString("pt-BR")}</span>
                </p>
              )}
            </div>

            {/* BOTÃO DE CONFIRMAR UTILIZAÇÃO */}
            {validatedCoupon.status === "valid" ? (
              <button
                onClick={() => handleConfirmActivation(validatedCoupon)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-brand hover:bg-emerald-700 transition active:scale-95"
              >
                <CheckCircle2 className="h-5 w-5" /> Confirmar Utilização (Ativar Cupom)
              </button>
            ) : validatedCoupon.status === "used" ? (
              <div className="rounded-2xl bg-amber-500/20 p-3 text-center text-xs font-bold text-amber-300 border border-amber-500/30">
                ⚠️ Este cupom já foi consumido anteriormente e não pode ser reutilizado.
              </div>
            ) : (
              <div className="rounded-2xl bg-red-500/20 p-3 text-center text-xs font-bold text-red-300 border border-red-500/30">
                ⏰ Este cupom ultrapassou a data limite de validade.
              </div>
            )}
          </div>
        )}

        {/* HISTÓRICO APENAS DA SESSÃO ATUAL */}
        {sessionHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-primary" /> Ativações Realizadas nesta Sessão ({sessionHistory.length})
            </h3>
            <div className="space-y-2">
              {sessionHistory.map((item) => (
                <div
                  key={item.code}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs flex items-center justify-between gap-2 shadow-soft"
                >
                  <div>
                    <span className="font-mono font-black text-foreground text-xs block">{item.code}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">{item.title}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    ✅ Ativado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL SCANNER QR CODE */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 space-y-4 shadow-elevated text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <Camera className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">Leitor de QR Code</h3>
            <p className="text-xs text-muted-foreground">
              Aproxime a câmera do smartphone do QR Code apresentado pelo cliente no aplicativo.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setSearchCode("PASS-12A452");
                  setShowQrModal(false);
                  handleValidateCode("PASS-12A452");
                }}
                className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white"
              >
                QR Válido (Simular)
              </button>
              <button
                onClick={() => {
                  setSearchCode("PASS-89F3K1");
                  setShowQrModal(false);
                  handleValidateCode("PASS-89F3K1");
                }}
                className="rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white"
              >
                QR Utilizado (Simular)
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
