/**
 * src/components/PixQrCode.tsx
 * Componente visual do QR Code PIX com copia e cola e polling de status.
 */
import { useState } from "react";
import { QrCode, Copy, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getStatusLabel, type PaymentStatus } from "@/lib/asaas";

interface PixQrCodeProps {
  qrcodeBase64: string;    // Base64 da imagem do QR Code
  copyPaste: string;       // Texto copia e cola
  expirationDate?: string;
  status: PaymentStatus | null;
  onRefresh?: () => void;
}

export function PixQrCode({
  qrcodeBase64,
  copyPaste,
  expirationDate,
  status,
  onRefresh,
}: PixQrCodeProps) {
  const [copied, setCopied] = useState(false);
  const statusInfo = status ? getStatusLabel(status) : null;
  const isConfirmed = status === "RECEIVED" || status === "CONFIRMED";
  const isExpired = status === "OVERDUE" || status === "DELETED";

  function handleCopy() {
    navigator.clipboard.writeText(copyPaste).then(() => {
      setCopied(true);
      toast.success("✅ Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <div className="space-y-4">
      {/* Status badge */}
      {statusInfo && (
        <div className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${
          isConfirmed
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
            : isExpired
              ? "border-red-500/40 bg-red-500/10 text-red-500"
              : "border-amber-500/40 bg-amber-500/10 text-amber-600"
        }`}>
          <span>{statusInfo.emoji}</span>
          <span>{statusInfo.label}</span>
          {!isConfirmed && !isExpired && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          )}
        </div>
      )}

      {/* QR Code */}
      {!isConfirmed && !isExpired && (
        <div className="flex flex-col items-center gap-3">
          <div className={`relative rounded-3xl border-4 p-3 shadow-elevated transition-all ${
            isConfirmed
              ? "border-emerald-500"
              : "border-primary/60"
          }`}>
            {qrcodeBase64 ? (
              <img
                src={`data:image/png;base64,${qrcodeBase64}`}
                alt="QR Code PIX"
                className="h-48 w-48 rounded-2xl object-cover"
              />
            ) : (
              <div className="h-48 w-48 flex items-center justify-center bg-secondary rounded-2xl">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Expiração */}
          {expirationDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Expira em: {new Date(expirationDate).toLocaleString("pt-BR")}</span>
            </div>
          )}
        </div>
      )}

      {/* Confirmação visual */}
      {isConfirmed && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 border-2 border-emerald-500">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-foreground">Pagamento Confirmado! 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">Seu acesso Premium foi ativado com sucesso.</p>
          </div>
        </div>
      )}

      {/* Expirado */}
      {isExpired && onRefresh && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-red-500 font-bold">QR Code expirado</p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-bold text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Gerar novo QR Code
          </button>
        </div>
      )}

      {/* Copia e Cola */}
      {!isConfirmed && !isExpired && copyPaste && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ou copie o código PIX:
          </p>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary p-3">
            <p className="flex-1 truncate font-mono text-[11px] text-foreground">
              {copyPaste.slice(0, 40)}...
            </p>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Abra o app do seu banco → PIX → Copia e Cola
          </p>
        </div>
      )}
    </div>
  );
}
