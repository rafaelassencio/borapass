import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext, type AppRole } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requireAdmin?: boolean;
  requirePartner?: boolean;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAdmin,
  requirePartner,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, roles, isAdmin, isPurePartner, primaryRole, loading, isLoaded } = useAuthContext();

  useEffect(() => {
    if (loading || !isLoaded) return;

    // Se o usuário não estiver autenticado
    if (!user && (requireAdmin || requirePartner || allowedRoles)) {
      navigate({ to: "/login", replace: true });
      return;
    }

    // Se for um Parceiro puro tentando acessar rotas que não pertencem ao parceiro
    if (isPurePartner && !requirePartner && primaryRole === "Parceiro") {
      navigate({ to: "/validar-cupom", replace: true });
      return;
    }

    // Se exigir Admin e o usuário não for Admin
    if (requireAdmin && !isAdmin) {
      navigate({ to: "/", replace: true });
      return;
    }

    // Se houver papéis permitidos específicos
    if (allowedRoles && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.some((r) => roles.includes(r));
      if (!hasPermission) {
        if (isPurePartner) {
          navigate({ to: "/validar-cupom", replace: true });
        } else {
          navigate({ to: "/", replace: true });
        }
      }
    }
  }, [user, roles, isAdmin, isPurePartner, primaryRole, loading, isLoaded, requireAdmin, requirePartner, allowedRoles, navigate]);

  if (loading || !isLoaded) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
