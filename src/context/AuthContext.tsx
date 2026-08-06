import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getStoredPartners, type PartnerStore } from "@/lib/partners";

export type PrimaryRole =
  | "Administrador"
  | "Suporte"
  | "Parceiro"
  | "Viajante Premium"
  | "Viajante";

export type AppRole = "admin" | "support" | "partner" | "user" | "premium";

export type ProfileData = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
};

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  primaryRole: PrimaryRole;
  roles: AppRole[];
  realRoles: AppRole[];
  simulatedRole: string | null;
  isRealAdmin: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isStaff: boolean;
  isPartner: boolean;
  isPremium: boolean;
  isPurePartner: boolean;
  partnerStore: PartnerStore | null;
  subscription: any | null;
  loading: boolean;
  isLoaded: boolean;
  loadTimeMs: number;
  refetchPermissions: () => Promise<void>;
  setRoleSimulation: (role: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_SIMULATED_KEY = "borapass:simulated-role";
const CACHE_LOCAL_SESSION_KEY = "borapass:local-session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [partnerStore, setPartnerStore] = useState<PartnerStore | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [simulatedRole, setSimulatedRoleState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CACHE_SIMULATED_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadTimeMs, setLoadTimeMs] = useState(0);

  // Escuta eventos de simulação de papel
  useEffect(() => {
    function handleStorage() {
      if (typeof window !== "undefined") {
        setSimulatedRoleState(localStorage.getItem(CACHE_SIMULATED_KEY));
      }
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("borapass:role-changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("borapass:role-changed", handleStorage);
    };
  }, []);

  // Função central de carregamento de usuário, permissões, perfil e assinaturas
  const fetchAllPermissions = useCallback(async () => {
    const startTime = performance.now();
    try {
      let activeUser: User | null = null;
      let activeSession: Session | null = null;

      // 1. Obter sessão do Supabase Auth
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (authData?.session) {
          activeSession = authData.session;
          activeUser = authData.session.user;
        }
      } catch {
        /* fallback */
      }

      // 2. Fallback de sessão local caso desconectado sem Auth remoto
      if (!activeUser && typeof window !== "undefined") {
        try {
          const savedLocal = localStorage.getItem(CACHE_LOCAL_SESSION_KEY);
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            if (parsed && parsed.email) {
              activeUser = parsed as User;
              activeSession = { user: parsed } as unknown as Session;
            }
          }
        } catch {
          /* fallback */
        }
      }

      setSession(activeSession);
      setUser(activeUser);

      if (!activeUser) {
        setRoles(["user"]);
        setProfile(null);
        setSubscription(null);
        setPartnerStore(null);
        setIsLoaded(true);
        setLoading(false);
        const endTime = performance.now();
        setLoadTimeMs(Math.round(endTime - startTime));
        return;
      }

      const uid = activeUser.id;
      const email = (activeUser.email || "").toLowerCase();

      // Checagem de Super Admin Principal por e-mail ou ID
      const isSuperAdminEmail =
        email.includes("rafael.assencio") ||
        email.includes("rafaelassencio") ||
        email === "ansysardasilva@gmail.com" ||
        email === "admin@borapass.com" ||
        email === "admin@borapass.com.br";
      const isSuperAdminUid = uid === "u-admin-1" || uid === "u-1";

      // 3. CONSULTA EM PARALELO (Promise.all) - profiles, user_roles, subscriptions, partners
      const [profileRes, rolesRes, subRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, city")
          .eq("id", uid)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
        (supabase as any)
          .from("subscriptions")
          .select("*")
          .eq("user_id", uid)
          .eq("status", "ACTIVE")
          .maybeSingle(),
      ]);

      // Montar objeto de Perfil
      let userProfile: ProfileData | null = null;
      if (profileRes.data) {
        userProfile = {
          id: profileRes.data.id,
          full_name: profileRes.data.full_name,
          avatar_url: profileRes.data.avatar_url,
          city: profileRes.data.city,
          email: activeUser.email || null,
          phone: activeUser.phone || activeUser.user_metadata?.phone || null,
          cpf: activeUser.user_metadata?.cpf || null,
        };
      } else {
        userProfile = {
          id: uid,
          full_name:
            activeUser.user_metadata?.full_name ||
            activeUser.user_metadata?.first_name ||
            email.split("@")[0] ||
            "Viajante",
          avatar_url: activeUser.user_metadata?.avatar_url || null,
          city: null,
          email: activeUser.email || null,
          phone: activeUser.phone || null,
          cpf: null,
        };
      }
      setProfile(userProfile);

      // Calcular Papéis Reais
      let calculatedRoles: AppRole[] = ["user"];

      if (isSuperAdminEmail || isSuperAdminUid) {
        calculatedRoles = ["admin", "support", "partner", "user", "premium"];
        if (uid && uid.length > 20) {
          supabase
            .from("user_roles")
            .upsert({ user_id: uid, role: "admin" })
            .then();
        }
      } else {
        if (!rolesRes.error && rolesRes.data && rolesRes.data.length > 0) {
          const dbRoles = rolesRes.data.map((r) => r.role as AppRole);
          calculatedRoles = Array.from(new Set([...calculatedRoles, ...dbRoles]));
        }

        // Validação da Assinatura Premium ativa
        if (!subRes.error && subRes.data) {
          const sub = subRes.data;
          setSubscription(sub);
          const isNotExpired = !sub.next_due_date || new Date(sub.next_due_date).getTime() >= Date.now();
          if (sub.status === "ACTIVE" && isNotExpired) {
            if (!calculatedRoles.includes("premium")) {
              calculatedRoles.push("premium");
            }
          }
        } else {
          setSubscription(null);
        }
      }

      // Validação de Loja de Parceiro
      const partnerStores = getStoredPartners();
      const matchedStore =
        partnerStores.find((p) => p.user_id === uid) || partnerStores[0] || null;
      setPartnerStore(matchedStore);

      setRoles(calculatedRoles);
      setIsLoaded(true);
      setLoading(false);

      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);
      setLoadTimeMs(elapsed);

      // LOG DE DIAGNÓSTICO PROFISSIONAL
      console.log(
        `[Bora Pass Auth] User: ${email || uid} | Roles: [${calculatedRoles.join(
          ", ",
        )}] | Load Time: ${elapsed}ms`,
      );
    } catch (err) {
      console.error("[Bora Pass Auth Error]", err);
      setIsLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPermissions();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        setSession(s);
        setUser(s.user);
      }
      fetchAllPermissions();
    });

    const handleLocalAuthChange = () => {
      fetchAllPermissions();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("borapass:auth-changed", handleLocalAuthChange);
    }

    return () => {
      authSub.subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("borapass:auth-changed", handleLocalAuthChange);
      }
    };
  }, [fetchAllPermissions]);

  const isRealAdmin = useMemo(() => roles.includes("admin"), [roles]);

  // Papéis Efetivos com base na Simulação do Admin
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
  const isPurePartner = useMemo(
    () => isPartner && !isRealAdmin && (!simulatedRole || simulatedRole === "partner"),
    [isPartner, isRealAdmin, simulatedRole],
  );

  // Determinar o Perfil Principal com base na Hierarquia de Prioridades
  const primaryRole: PrimaryRole = useMemo(() => {
    if (isAdmin) return "Administrador";
    if (isSupport) return "Suporte";
    if (isPartner) return "Parceiro";
    if (isPremium) return "Viajante Premium";
    return "Viajante";
  }, [isAdmin, isSupport, isPartner, isPremium]);

  const setRoleSimulation = useCallback((role: string | null) => {
    if (typeof window !== "undefined") {
      if (role && role !== "all") {
        localStorage.setItem(CACHE_SIMULATED_KEY, role);
      } else {
        localStorage.removeItem(CACHE_SIMULATED_KEY);
      }
      setSimulatedRoleState(role && role !== "all" ? role : null);
      window.dispatchEvent(new Event("borapass:role-changed"));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* fallback */ }
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_LOCAL_SESSION_KEY);
      localStorage.removeItem(CACHE_SIMULATED_KEY);
      localStorage.removeItem("borapass:cached-roles");
      window.dispatchEvent(new Event("borapass:auth-changed"));
    }
    setUser(null);
    setSession(null);
    setRoles(["user"]);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      primaryRole,
      roles: effectiveRoles,
      realRoles: roles,
      simulatedRole: isRealAdmin ? simulatedRole : null,
      isRealAdmin,
      isAdmin,
      isSupport,
      isStaff,
      isPartner,
      isPremium,
      isPurePartner,
      partnerStore,
      subscription,
      loading,
      isLoaded,
      loadTimeMs,
      refetchPermissions: fetchAllPermissions,
      setRoleSimulation,
      logout,
    }),
    [
      session,
      user,
      profile,
      primaryRole,
      effectiveRoles,
      roles,
      isRealAdmin,
      simulatedRole,
      isAdmin,
      isSupport,
      isStaff,
      isPartner,
      isPremium,
      isPurePartner,
      partnerStore,
      subscription,
      loading,
      isLoaded,
      loadTimeMs,
      fetchAllPermissions,
      setRoleSimulation,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de um AuthProvider");
  }
  return context;
}
