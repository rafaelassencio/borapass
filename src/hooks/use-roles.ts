import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "support" | "partner" | "user" | "premium";

export function useRoles(userId: string | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as AppRole));
        setLoading(false);
      });
  }, [userId]);

  const isAdmin = roles.includes("admin");
  const isSupport = roles.includes("support");
  return {
    roles,
    loading,
    isAdmin,
    isSupport,
    isStaff: isAdmin || isSupport,
    isPartner: roles.includes("partner"),
    isPremium: roles.includes("premium"),
  };
}
