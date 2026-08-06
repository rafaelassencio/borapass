/**
 * src/hooks/use-roles.ts
 * Hook unificado que consome o AuthContext global para resposta de 0ms sem flash de perfil.
 */
import { useAuthContext, type AppRole } from "@/context/AuthContext";

export type { AppRole };

export function useRoles(_userId?: string, _userEmail?: string) {
  const {
    roles,
    realRoles,
    simulatedRole,
    isRealAdmin,
    isAdmin,
    isSupport,
    isStaff,
    isPartner,
    isPremium,
    isPurePartner,
    primaryRole,
    loading,
    setRoleSimulation,
    refetchPermissions,
  } = useAuthContext();

  return {
    roles,
    realRoles,
    simulatedRole,
    isRealAdmin,
    isAdmin,
    isSupport,
    isStaff,
    isPartner,
    isPremium,
    isPurePartner,
    primaryRole,
    loading,
    setRoleSimulation,
    refresh: refetchPermissions,
  };
}
