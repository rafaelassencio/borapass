import { Sparkles, CheckCircle2, ShieldCheck, Zap, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface UpgradePremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  featureContext?: string;
}

export function UpgradePremiumModal({
  isOpen,
  onClose,
  title = "Este recurso faz parte do Viajante Premium.",
  description = "Tenha acesso a cupons ilimitados, roteiros sem limites, IA Bora Planeja e muito mais.",
  featureContext,
}: UpgradePremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/40 bg-slate-950 p-6 text-white shadow-elevated">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Badge Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            Viajante Premium
          </span>
          {featureContext && (
            <span className="text-[11px] text-slate-400 font-semibold">• {featureContext}</span>
          )}
        </div>

        {/* Main Title & Description */}
        <h2 className="text-xl font-extrabold tracking-tight text-white leading-snug">{title}</h2>
        <p className="mt-2 text-xs text-slate-300 leading-relaxed">{description}</p>

        {/* Highlights List */}
        <div className="mt-5 space-y-2.5 rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Resgates de Cupons & Promoções **Ilimitados**</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Criador de Viagens & Experiências **Sem Limites**</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Acesso Total à **IA Bora Planeja** & WhatsApp</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Badge **Viajante Premium** & Atendimento Prioritário</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <Link
            to="/premium"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-elevated hover:brightness-110 active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4 fill-black" />✨ Assinar Premium
          </Link>

          <button
            onClick={onClose}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition py-2"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
