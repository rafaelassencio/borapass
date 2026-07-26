import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing } from "@/lib/listings";
import { ArrowLeft, Share2, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/cupons/$id")({
  head: () => ({ meta: [{ title: "Cupom — Bora Pass" }] }),
  component: CuponDetail,
});

function CuponDetail() {
  const { id } = Route.useParams();
  const { data: coupon, isLoading } = useListing(id);
  const [resgatado, setResgatado] = useState(false);
  const code = useMemo(() => (coupon ? `BORA-${coupon.id.slice(0, 8).toUpperCase()}` : ""), [coupon]);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(code)}`;

  if (isLoading) {
    return <AppShell><div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div></AppShell>;
  }
  if (!coupon) throw notFound();

  return (
    <AppShell>
      <div className="relative h-40 w-full bg-gradient-ember">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white">
          <Link to="/cupons" className="rounded-full bg-white/20 p-2 backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
          <button className="rounded-full bg-white/20 p-2 backdrop-blur"><Share2 className="h-5 w-5" /></button>
        </div>
        <div className="absolute inset-x-0 bottom-4 px-5 text-white">
          {coupon.city && <p className="text-xs font-bold uppercase tracking-wider opacity-90">{coupon.city}</p>}
          <h1 className="text-2xl font-extrabold">{coupon.title}</h1>
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-elevated">
          {coupon.discount && (
            <>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Desconto</p>
              <p className="mt-1 bg-gradient-brand bg-clip-text text-5xl font-extrabold text-transparent">{coupon.discount}</p>
            </>
          )}
          {coupon.description && <p className="mt-3 text-sm text-muted-foreground">{coupon.description}</p>}
          {coupon.address && <p className="mt-2 text-xs text-muted-foreground">Local: {coupon.address}</p>}

          {resgatado ? (
            <div className="mt-6">
              <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl border border-border bg-white p-3" />
              <p className="mt-3 font-mono text-lg font-bold tracking-widest">{code}</p>
              <p className="text-xs text-muted-foreground">Apresente este código no estabelecimento</p>
              <button className="mt-4 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-brand">Usar cupom agora</button>
            </div>
          ) : (
            <button onClick={() => setResgatado(true)} className="mt-6 w-full rounded-2xl bg-gradient-ember py-3.5 text-sm font-bold text-white shadow-ember transition active:scale-95">
              Resgatar cupom
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
