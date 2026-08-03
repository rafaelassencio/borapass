import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { AdminPanelPage } from "./admin";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Corporativo | Bora Pass" }] }),
  component: DashboardAliasRoute,
});

function DashboardAliasRoute() {
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

  return <AdminPanelPage />;
}
