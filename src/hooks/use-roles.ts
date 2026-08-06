/**
 * src/hooks/use-roles.ts
 * Hook otimizado para gerenciamento de papéis e assinaturas em tempo real.
 * Carrega permissões e plano Premium de forma instantânea sem "flash" de papel incorreto.
 */
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "support" | "partner" | "user" | "premium";

const CACHE_KEY_ROLES = "borapass:cached-roles";
const CACHE_KEY_SIMULATED = "borapass:simulated-role";

// Memory cache global para sobrevivência entre renderizações de componentes
let memoryRolesCache: AppRole[] | null = null;

export function useRoles(userId?: string, userEmail?: string) {
  // 1. Inicialização síncrona instantânea (0ms) via memória ou localStorage
  const [roles, setRoles] = useState<AppRole[]>(() => {
    if (memoryRolesCache) return memoryRolesCache;

    let currentEmail = (userEmail || "").toLowerCase();

    // Tenta recuperar do localStorage se o usuário tiver sessão salva
    if (typeof window !== "undefined") {
      try {
        const savedSession = localStorage.getItem("borapass:local-session");
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.email) currentEmail = parsed.email.toLowerCase();
        }
      } catch { /* fallback */ }
    }

    // Detecção instantânea síncrona para o Super Admin principal
    const isSuperAdminEmail =
      currentEmail.includes("rafael.assencio") ||
      currentEmail.includes("rafaelassencio") ||
      currentEmail === "ansysardasilva@gmail.com" ||
      currentEmail === "admin@borapass.com" ||
      currentEmail === "admin@borapass.com.br";

    if (isSuperAdminEmail) {
      const adminRoles: AppRole[] = ["admin", "support", "partner", "user", "premium"];
      memoryRolesCache = adminRoles;
      return adminRoles;
    }

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEY_ROLES);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryRolesCache = parsed;
            return parsed;
          }
        }
      } catch { /* fallback */ }
    }

    return ["user"];
  });

  const [simulatedRole, setSimulatedRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CACHE_KEY_SIMULATED);
    }
    return null;
  });

  const [loading, setLoading] = useState(() => !memoryRolesCache);

  // Escuta eventos de simulação de papel
  useEffect(() => {
    function handleStorage() {
      if (typeof window !== "undefined") {
        setSimulatedRole(localStorage.getItem(CACHE_KEY_SIMULATED));
      }
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("borapass:role-changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("borapass:role-changed", handleStorage);
    };
  }, []);

  // Busca e sincroniza papéis em paralelo (Promise.all)
  useEffect(() => {
    let isMounted = true;

    async function fetchRoles() {
      try {
        let currentEmail = (userEmail || "").toLowerCase();
        let currentUid = userId || "";

        // 1. Obter usuário autenticado
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.email) {
            currentEmail = userData.user.email.toLowerCase();
            if (!currentUid) currentUid = userData.user.id;
          }
        } catch { /* fallback */ }

        // 2. Tentar recuperar da sessão local
        if (!currentEmail && typeof window !== "undefined") {
          try {
            const saved = localStorage.getItem("borapass:local-session");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.email) currentEmail = parsed.email.toLowerCase();
              if (parsed.id && !currentUid) currentUid = parsed.id;
            }
          } catch { /* fallback */ }
        }

        const isSuperAdminEmail =
          currentEmail.includes("rafael.assencio") ||
          currentEmail.includes("rafaelassencio") ||
          currentEmail === "ansysardasilva@gmail.com" ||
          currentEmail === "admin@borapass.com" ||
          currentEmail === "admin@borapass.com.br";

        const isSuperAdminUid = currentUid === "u-admin-1" || currentUid === "u-1";

        let calculatedRoles: AppRole[] = ["user"];

        if (isSuperAdminEmail || isSuperAdminUid) {
          calculatedRoles = ["admin", "support", "partner", "user", "premium"];
          if (currentUid && currentUid.length > 20) {
            supabase
              .from("user_roles")
              .upsert({ user_id: currentUid, role: "admin" })
              .then();
          }
        } else if (currentUid) {
          // Consultas em PARALELO: user_roles e subscriptions
          const [rolesRes, subRes] = await Promise.all([
            supabase.from("user_roles").select("role").eq("user_id", currentUid),
            (supabase as any).from("subscriptions").select("status").eq("user_id", currentUid).eq("status", "ACTIVE").limit(1)
          ]);

          if (!rolesRes.error && rolesRes.data) {
            const dbRoles = rolesRes.data.map((r) => r.role as AppRole);
            calculatedRoles = Array.from(new Set([...calculatedRoles, ...dbRoles]));
          }

          if (!subRes.error && subRes.data && subRes.data.length > 0) {
            if (!calculatedRoles.includes("premium")) {
              calculatedRoles.push("premium");
            }
          }
        }

        memoryRolesCache = calculatedRoles;
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY_ROLES, JSON.stringify(calculatedRoles));
        }

        if (isMounted) {
          setRoles(calculatedRoles);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
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
  }, [userId, userEmail]);

  const isRealAdmin = useMemo(() => roles.includes("admin"), [roles]);

  // Papéis efetivos considerando simulação
  const effectiveRoles = useMemo(() => {
    let list = [...roles];
    if (isRealAdmin && simulatedRole && simulatedRole !== "all") {
      if (simulatedRole === "user") list = ["user"];
      else if (simulatedRole === "premium") list = ["user", "premium"];
      else if (simulatedRole === "partner") list = ["partner", "user"];
      else if (simulatedRole === "support") list = ["support", "user"];
      else if (simulatedRole === "admin")
        list = ["admin", "support", "partner", "user", "premium"];
    }
    return list;
  }, [roles, isRealAdmin, simulatedRole]);

  const isAdmin = useMemo(() => effectiveRoles.includes("admin"), [effectiveRoles]);
  const isSupport = useMemo(() => effectiveRoles.includes("support"), [effectiveRoles]);
  const isPartner = useMemo(() => effectiveRoles.includes("partner"), [effectiveRoles]);
  const isPremium = useMemo(() => effectiveRoles.includes("premium"), [effectiveRoles]);
  const isStaff = useMemo(() => isAdmin || isSupport, [isAdmin, isSupport]);

  const setRoleSimulation = useCallback((role: string | null) => {
    if (typeof window !== "undefined") {
      if (role && role !== "all") {
        localStorage.setItem(CACHE_KEY_SIMULATED, role);
      } else {
        localStorage.removeItem(CACHE_KEY_SIMULATED);
      }
      window.dispatchEvent(new Event("borapass:role-changed"));
    }
  }, []);

  return {
    roles: effectiveRoles,
    realRoles: roles,
    simulatedRole: isRealAdmin ? simulatedRole : null,
    loading,
    isAdmin,
    isRealAdmin,
    isSupport,
    isStaff,
    isPartner,
    isPremium,
    setRoleSimulation,
  };
}
