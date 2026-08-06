import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Hotel,
  Plane,
  Bus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  X,
  Plus,
  Sparkles,
  MapPin,
  FileText,
} from "lucide-react";
import { BookingService, type BookingRecord, type BookingType } from "@/lib/gecko-services";

export const Route = createFileRoute("/minhas-viagens")({
  head: () => ({ meta: [{ title: "Minhas Viagens & Vouchers — Bora Pass" }] }),
  component: MinhasViagensPage,
});

export function MinhasViagensPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<BookingType | "all">("all");
  const [selectedVoucher, setSelectedVoucher] = useState<BookingRecord | null>(null);

  const loadBookings = () => {
    setBookings(BookingService.getUserBookings());
  };

  useEffect(() => {
    loadBookings();
    window.addEventListener("borapass:bookings-changed", loadBookings);
    return () => window.removeEventListener("borapass:bookings-changed", loadBookings);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    return b.type === activeTab;
  });

  const handleAddToItinerary = (booking: BookingRecord) => {
    toast.success(`🎉 Reserva "${booking.title}" adicionada ao seu Cronograma de Viagem no BoraPass!`);
  };

  return (
    <AppShell>
      {/* HEADER DE MINHAS VIAGENS */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white px-5 pt-7 pb-6 shadow-elevated border-b border-white/10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Central de Reservas Integrada
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
            Minhas Viagens & <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-sky-400 bg-clip-text text-transparent">
              Vouchers de Reserva
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Gerencie suas hospedagens, voos e ônibus emitidos via GeckoAPI com QR Codes seguros.
          </p>

          {/* TABS DE SELEÇÃO */}
          <div className="pt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-t border-white/10">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "all" ? "bg-gradient-brand text-white shadow-brand" : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              Todas ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab("hotel")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "hotel" ? "bg-gradient-brand text-white shadow-brand" : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Hotel className="h-4 w-4" /> Hospedagens
            </button>

            <button
              onClick={() => setActiveTab("flight")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "flight" ? "bg-gradient-brand text-white shadow-brand" : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Plane className="h-4 w-4" /> Voos
            </button>

            <button
              onClick={() => setActiveTab("bus")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "bus" ? "bg-gradient-brand text-white shadow-brand" : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Bus className="h-4 w-4" /> Ônibus
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 pb-28 max-w-4xl mx-auto space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3 animate-fadeIn">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-extrabold text-foreground">Nenhuma reserva encontrada.</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Pesquise por hotéis, passagens aéreas ou rodoviárias para emitir sua primeira reserva no Bora Pass.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => navigate({ to: "/hospedagens" })}
                className="rounded-2xl bg-gradient-brand px-4 py-2.5 text-xs font-black text-white shadow-brand"
              >
                Buscar Hotéis
              </button>
              <button
                onClick={() => navigate({ to: "/passagens" })}
                className="rounded-2xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground"
              >
                Buscar Passagens
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 animate-fadeIn">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                      {b.type === "hotel" ? "🏨" : b.type === "flight" ? "✈️" : "🚌"}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground">{b.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono">Localizador: {b.bookingCode}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                      b.status === "confirmed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : b.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {b.status === "confirmed" ? "🟢 Confirmada" : b.status === "pending" ? "🟡 Pendente" : "🔴 Cancelada"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">{b.subtitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Emissão: {new Date(b.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-muted-foreground block font-bold">Valor Total</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      R$ {b.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <button
                    onClick={() => handleAddToItinerary(b)}
                    className="rounded-xl border border-border bg-background hover:bg-secondary px-3.5 py-2 text-xs font-bold text-foreground transition flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar ao Roteiro BoraPass
                  </button>

                  <button
                    onClick={() => setSelectedVoucher(b)}
                    className="rounded-xl bg-gradient-brand px-4 py-2 text-xs font-black text-white shadow-brand hover:opacity-95 transition flex items-center gap-1.5"
                  >
                    <QrCode className="h-4 w-4" /> Ver Voucher com QR Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE VOUCHER DETALHADO */}
      {selectedVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-3xl p-6 shadow-elevated border border-border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Voucher Oficial Bora Pass
              </h3>
              <button onClick={() => setSelectedVoucher(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-background p-4 rounded-2xl border border-border text-center space-y-3">
              <img src={selectedVoucher.voucherQrCode} alt="QR Code Voucher" className="h-40 w-40 mx-auto rounded-xl border shadow-sm" />
              <div>
                <h4 className="font-black text-sm text-foreground">{selectedVoucher.title}</h4>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">Localizador: {selectedVoucher.bookingCode}</p>
              </div>

              <div className="bg-secondary/60 p-3 rounded-xl text-left text-xs space-y-1">
                <p>
                  <strong>Detalhes:</strong> {selectedVoucher.subtitle}
                </p>
                <p>
                  <strong>Status:</strong> {selectedVoucher.status === "confirmed" ? "Confirmada" : "Pendente"}
                </p>
                <p>
                  <strong>Valor Pago:</strong> R$ {selectedVoucher.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  BookingService.cancelBooking(selectedVoucher.id);
                  loadBookings();
                  setSelectedVoucher(null);
                  toast.info("Reserva cancelada com sucesso.");
                }}
                className="flex-1 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive font-bold py-2.5 text-xs transition"
              >
                Cancelar Reserva
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 rounded-2xl bg-gradient-brand py-2.5 text-xs font-black text-white shadow-brand"
              >
                Imprimir Voucher 🖨️
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
