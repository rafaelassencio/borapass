import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-3">
        <span className="text-6xl">🧭</span>
        <h1 className="text-5xl font-extrabold text-foreground">404</h1>
        <h2 className="text-lg font-bold text-foreground">Página não encontrada</h2>
        <p className="text-xs text-muted-foreground">
          A página que você está procurando não existe ou mudou de endereço.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
          >
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root ErrorComponent caught:", error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-3">
        <span className="text-5xl">⚡</span>
        <h1 className="text-lg font-extrabold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="text-xs text-muted-foreground">
          {error?.message ||
            "Ocorreu uma instabilidade temporária. Você pode tentar recarregar ou voltar para a página inicial."}
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-brand px-4 py-2.5 text-xs font-bold text-white shadow-brand transition active:scale-95"
          >
            Tentar Novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition"
          >
            Página Inicial
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Bora Pass — Seu passe para viver o melhor de cada destino" },
      {
        name: "description",
        content:
          "Cupons, passeios, hospedagens, restaurantes e eventos das melhores cidades em um só app.",
      },
      { name: "theme-color", content: "#0EA5E9" },
      { property: "og:title", content: "Bora Pass — Turismo inteligente" },
      {
        property: "og:description",
        content: "Descubra, economize e viva o melhor de cada destino com o Bora Pass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const { loading, isLoaded } = useAuthContext();
  const [maxTimeoutReached, setMaxTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMaxTimeoutReached(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if ((loading || !isLoaded) && !maxTimeoutReached) {
    return <SplashScreen />;
  }

  return (
    <>
      <Outlet />
      <Toaster position="top-center" richColors />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
