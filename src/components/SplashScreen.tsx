import React from "react";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 px-4 text-white font-sans transition-opacity duration-300">
      {/* Glow e Efeitos Visuais de Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-500/20 via-blue-600/10 to-amber-500/20 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm text-center">
        {/* Logo Bora Pass com efeito glassmorphism e brilho */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-3xl bg-sky-500/30 blur-xl animate-pulse" />
          <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-600 to-amber-500 text-3xl shadow-2xl border border-white/20 transform transition hover:scale-105">
            ✨
          </div>
        </div>

        {/* Nome do Aplicativo & Slogan */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white font-sans uppercase">
            BORA PASS
          </h1>
          <p className="text-xs font-bold text-sky-400/90 tracking-wide">
            Turismo inteligente & Descontos
          </p>
        </div>

        {/* Indicador de Carregamento & Status */}
        <div className="flex flex-col items-center space-y-3 pt-2">
          <div className="flex items-center gap-2.5 rounded-full bg-slate-900/90 border border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 shadow-xl backdrop-blur-md">
            <svg
              className="animate-spin h-4 w-4 text-sky-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span>Carregando sua conta...</span>
          </div>

          <p className="text-[11px] text-slate-400/80 font-medium">
            Verificando permissões no banco de dados...
          </p>
        </div>
      </div>
    </div>
  );
}
