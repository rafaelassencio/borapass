import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { SupportWorkspacePage } from "./suporte-painel";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Console de Suporte | Bora Pass" }] }),
  component: SupportAliasRoute,
});

function SupportAliasRoute() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading: rolesLoading } = useRoles(user?.id);
  const isLoading = authLoading || rolesLoading;

  useEffect(() => {
    if (!isLoading && (!user || !isStaff)) {
      navigate({ to: "/", replace: true });
    }
  }, [isLoading, user, isStaff, navigate]);

  if (isLoading || !user || !isStaff) {
    return null;
  }

  return <SupportWorkspacePage />;
}
