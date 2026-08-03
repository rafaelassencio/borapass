import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { AdminPanelPage } from "./admin";

export const Route = createFileRoute("/corporate")({
  head: () => ({ meta: [{ title: "Console Corporativo | Bora Pass" }] }),
  component: CorporateAliasRoute,
});

function CorporateAliasRoute() {
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
