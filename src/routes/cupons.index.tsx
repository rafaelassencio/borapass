import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useListings, fallbackImage } from "@/lib/listings";
import { Loader2, Ticket, QrCode, Copy, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useSelectedCity } from "@/hooks/use-city";
import { toast } from "sonner";

export const Route = createFileRoute("/cupons/")({
  head: () => ({ meta: [{ title: "Cupons & Descontos — Bora Pass" }] }),
  component: CuponsList,
});

type RedeemedItem = {
  id: string;
  listing_id?: string;
  title: string;
  city?: string | null;
  code: string;
  discount: string;
  redeemed_at: string;
  status?: "valid" | "used";
  used_at?: string | null;
};

function CuponsList() {
  const [city] = useSelectedCity();
  const { data, isLoading } = useListings("cupom", city?.id, city?.name);
  const list = data ?? [];

  const [activeTab, setActiveTab] = useState<"available" | "my_coupons">("available");
  const [myCoupons, setMyCoupons] = useState<RedeemedItem[]>([]);
  const [qrModalItem, setQrModalItem] = useState<RedeemedItem | null>(null);

  function loadMyCoupons() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:redeemed-coupons");
      if (saved) {
        try {
          setMyCoupons(JSON.parse(saved));
          return;
        } catch {
          /* fallback */
        }
      }
    }
    // Demo fallback if empty
    setMyCoupons([
      {
        id: "demo-user-1",
        title: "20% OFF Almoço Típico em Gramado",
        code: "PASS-12A452",
        discount: "20% OFF",
        redeemed_at: new Date(Date.now() - 3600000).toISOString(),
        status: "valid",
      },
      {
        id: "demo-user-2",
        title: "Cortesia de Sobremesa Especial",
        code: "PASS-89F3K1",
        discount: "Gratuito 🎁",
        redeemed_at: new Date(Date.now() - 86400000).toISOString(),
        status: "used",
        used_at: new Date(Date.now() - 40000000).toISOString(),
      },
    ]);
  }

  useEffect(() => {
    loadMyCoupons();
  }, []);

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado para a área de transferência!`);
  }

  return (
    <AppShell>
      <PageHeader
        title="Cupons de Desconto"
        subtitle="Economize em restaurantes, passeios e atrações"
      />

      <div className="px-5 pt-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-secondary p-1 border border-border">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === "available"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4 text-accent" /> Cupons Disponíveis ({list.length})
          </button>
          <button
            onClick={() => {
              loadMyCoupons();
              setActiveTab("my_coupons");
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === "my_coupons"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4 text-primary" /> Meus Cupons Emitidos ({myCoupons.length})
          </button>
        </div>

        {/* TAB 1: AVAILABLE COUPONS */}
        {activeTab === "available" && (
          <div className="space-y-3">
            {isLoading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            )}
            {!isLoading && list.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground space-y-2">
                <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="font-bold text-sm text-foreground">
                  Nenhum cupom disponível no momento
                </p>
                <p>Volte em breve para conferir novas ofertas exclusivas!</p>
              </div>
            )}
            {list.map((c) => (
              <Link key={c.id} to="/cupons/$id" params={{ id: c.id }} className="block">
                <div className="flex overflow-hidden rounded-3xl bg-card shadow-soft border border-border transition hover:shadow-elevated">
                  <div className="relative w-28 shrink-0">
                    <img
                      src={c.image_url || fallbackImage("cupom")}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    {c.city && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-accent">
                        {c.city}
                      </p>
                    )}
                    <h3 className="mt-0.5 line-clamp-1 text-sm font-extrabold text-foreground">
                      {c.title}
                    </h3>
                    {c.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                    {c.expires_at && (
                      <p className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        ⏰ Validade até: {c.expires_at}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        Bora Pass
                      </Badge>
                      {c.discount && (
                        <span className="rounded-full bg-gradient-ember px-3 py-1 text-xs font-extrabold text-white shadow-ember">
                          {c.discount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* TAB 2: MY REDEEMED / EMITTED COUPONS */}
        {activeTab === "my_coupons" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-gradient-hero p-4 text-white shadow-brand">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-xl backdrop-blur">
                  🎟️
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Como Usar seu Cupom
                  </h3>
                  <p className="text-xs text-white/90 mt-0.5">
                    Apresente o código ou QR Code ao atendente do estabelecimento. O parceiro irá
                    ativar o cupom na hora!
                  </p>
                </div>
              </div>
            </div>

            {myCoupons.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground space-y-2">
                <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="font-bold text-sm text-foreground">
                  Você ainda não possui cupons emitidos
                </p>
                <p>Navegue pela aba "Cupons Disponíveis" e resgate suas vantagens gratuitas!</p>
              </div>
            ) : (
              myCoupons.map((item) => {
                const isActivated = item.status === "used";

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl border p-4 shadow-soft space-y-3 ${
                      isActivated
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-amber-500/30 bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                              isActivated
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {isActivated
                              ? "✅ Ativado no Estabelecimento"
                              : "⏳ Emitido (Aguardando Validação)"}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-foreground mt-1.5">
                          {item.title}
                        </h4>
                        <p className="text-xs font-bold text-accent">{item.discount}</p>
                      </div>

                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary border border-primary/20">
                        {item.code}
                      </span>
                    </div>

                    {/* CODE CONTAINER */}
                    <div className="rounded-2xl border border-border bg-background p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                          Código de Validação
                        </span>
                        <span className="font-mono text-lg font-black tracking-widest text-primary select-all">
                          {item.code}
                        </span>
                      </div>

                      {isActivated ? (
                        <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Utilizado!
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyCode(item.code)}
                            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition flex items-center gap-1"
                          >
                            <Copy className="h-3.5 w-3.5" /> Copiar
                          </button>
                          <button
                            onClick={() => setQrModalItem(item)}
                            className="rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-extrabold text-white shadow-brand transition active:scale-95 flex items-center gap-1"
                          >
                            <QrCode className="h-3.5 w-3.5" /> QR Code
                          </button>
                        </div>
                      )}
                    </div>

                    {/* FOOTER STATUS TEXT */}
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                      <span>
                        Emitido em: {new Date(item.redeemed_at).toLocaleDateString("pt-BR")}
                      </span>
                      {isActivated && item.used_at ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Utilizado em: {new Date(item.used_at).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          Apresente ao parceiro para ativar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* QR CODE MODAL FOR PRESENTING TO PARTNER */}
      {qrModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setQrModalItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-elevated border border-border text-center space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-extrabold text-foreground">
                Apresentar ao Estabelecimento
              </h3>
              <button
                onClick={() => setQrModalItem(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground">{qrModalItem.title}</p>
              <p className="text-sm font-extrabold text-accent mt-0.5">{qrModalItem.discount}</p>
            </div>

            {/* Simulated QR Code box */}
            <div className="mx-auto grid h-48 w-48 place-items-center rounded-2xl bg-white p-4 shadow-inner border border-gray-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  qrModalItem.code,
                )}`}
                alt="QR Code do Cupom"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                Código de Validação
              </span>
              <span className="font-mono text-2xl font-black tracking-widest text-primary select-all">
                {qrModalItem.code}
              </span>
            </div>

            <button
              onClick={() => handleCopyCode(qrModalItem.code)}
              className="w-full rounded-2xl bg-gradient-brand py-3 text-xs font-extrabold text-white shadow-brand transition active:scale-95"
            >
              Copiar Código ({qrModalItem.code})
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
