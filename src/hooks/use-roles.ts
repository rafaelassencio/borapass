import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "support" | "partner" | "user" | "premium";

export function useRoles(userId?: string) {
  const [roles, setRoles] = useState<AppRole[]>(["user"]);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("borapass:simulated-role");
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Listen for role simulation changes across tabs or components
  useEffect(() => {
    function handleStorage() {
      if (typeof window !== "undefined") {
        setSimulatedRole(localStorage.getItem("borapass:simulated-role"));
      }
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("borapass:role-changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("borapass:role-changed", handleStorage);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchRoles() {
      try {
        let currentEmail = "";
        let currentUid = userId || "";

        // 1. Check local session
        if (typeof window !== "undefined") {
          try {
            const saved = localStorage.getItem("borapass:local-session");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.email) currentEmail = parsed.email.toLowerCase();
              if (parsed.id) currentUid = parsed.id;
            }
          } catch {
            /* fallback */
          }
        }

        // 2. Check Supabase active session
        if (!currentEmail) {
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user?.email) {
              currentEmail = userData.user.email.toLowerCase();
              if (!currentUid) currentUid = userData.user.id;
            }
          } catch {
            /* fallback */
          }
        }

        // Superadmin account check (rafael.assencio12@gmail.com, rafaelassencio@gmail.com, etc.)
        const isRealAdmin =
          currentUid === "u-admin-1" ||
          currentEmail.includes("rafael.assencio") ||
          currentEmail.includes("rafaelassencio") ||
          currentEmail === "ansysardasilva@gmail.com" ||
          currentEmail === "admin@borapass.com" ||
          currentEmail === "admin@borapass.com.br";

        let userRoles: AppRole[] = ["user"];

        if (isRealAdmin) {
          userRoles = ["admin", "support", "partner", "user", "premium"];
        } else if (currentUid) {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUid);

          if (!error && data && data.length > 0) {
            const dbRoles = data.map((r) => r.role as AppRole);
            userRoles = Array.from(new Set([...userRoles, ...dbRoles]));
          }
        }

        if (isMounted) {
          setRoles(userRoles);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setRoles(["user"]);
          setLoading(false);
        }
      }
    }

    fetchRoles();

    const handleAuthChanged = () => {
      fetchRoles();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("borapass:auth-changed", handleAuthChanged);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("borapass:auth-changed", handleAuthChanged);
      }
    };
  }, [userId]);

  const isRealAdmin = roles.includes("admin");

  // Determine effective roles based on simulation
  let effectiveRoles = [...roles];
  if (isRealAdmin && simulatedRole && simulatedRole !== "all") {
    if (simulatedRole === "user") effectiveRoles = ["user"];
    else if (simulatedRole === "premium") effectiveRoles = ["user", "premium"];
    else if (simulatedRole === "partner") effectiveRoles = ["partner", "user"];
    else if (simulatedRole === "support") effectiveRoles = ["support", "user"];
    else if (simulatedRole === "admin")
      effectiveRoles = ["admin", "support", "partner", "user", "premium"];
  }

  const isAdmin = effectiveRoles.includes("admin");
  const isSupport = effectiveRoles.includes("support");
  const isPartner = effectiveRoles.includes("partner");
  const isPremium = effectiveRoles.includes("premium");
  const isStaff = isAdmin || isSupport;

  const setRoleSimulation = (role: string | null) => {
    if (typeof window !== "undefined") {
      if (role && role !== "all") {
        localStorage.setItem("borapass:simulated-role", role);
      } else {
        localStorage.removeItem("borapass:simulated-role");
      }
      window.dispatchEvent(new Event("borapass:role-changed"));
    }
  };

  return {
    roles: effectiveRoles,
    realRoles: roles,
    simulatedRole: isRealAdmin ? simulatedRole : null,
    loading,
    isAdmin,
    isSupport,
    isStaff,
    isPartner,
    isPremium,
    setRoleSimulation,
  };
}
