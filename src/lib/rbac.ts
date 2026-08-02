import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

export type PermissionAction =
  "view" | "create" | "edit" | "delete" | "export" | "import" | "approve" | "publish" | "manage";

export type ModuleKey =
  | "dashboard"
  | "users"
  | "partners"
  | "listings"
  | "coupons"
  | "hotels"
  | "restaurants"
  | "tours"
  | "events"
  | "itineraries"
  | "map"
  | "categories"
  | "reviews"
  | "support"
  | "payments"
  | "finance"
  | "reports"
  | "notifications"
  | "marketing"
  | "settings"
  | "logs"
  | "api"
  | "integrations"
  | "backup";

export const ALL_ACTIONS: Array<{ key: PermissionAction; label: string }> = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
  { key: "export", label: "Exportar" },
  { key: "import", label: "Importar" },
  { key: "approve", label: "Aprovar" },
  { key: "publish", label: "Publicar" },
  { key: "manage", label: "Gerenciar" },
];

export const ALL_MODULES: Array<{ key: ModuleKey; label: string; group: string }> = [
  { key: "dashboard", label: "Dashboard", group: "Geral" },
  { key: "users", label: "Usuários", group: "Gestão" },
  { key: "partners", label: "Parceiros", group: "Gestão" },
  { key: "listings", label: "Ofertas", group: "Catálogo" },
  { key: "coupons", label: "Cupons", group: "Catálogo" },
  { key: "hotels", label: "Hospedagens", group: "Catálogo" },
  { key: "restaurants", label: "Restaurantes", group: "Catálogo" },
  { key: "tours", label: "Passeios", group: "Catálogo" },
  { key: "events", label: "Eventos", group: "Catálogo" },
  { key: "itineraries", label: "Roteiros", group: "Catálogo" },
  { key: "map", label: "Mapa", group: "Ferramentas" },
  { key: "categories", label: "Categorias", group: "Configuração" },
  { key: "reviews", label: "Avaliações", group: "Qualidade" },
  { key: "support", label: "Suporte", group: "Atendimento" },
  { key: "payments", label: "Pagamentos", group: "Financeiro" },
  { key: "finance", label: "Financeiro", group: "Financeiro" },
  { key: "reports", label: "Relatórios", group: "Inteligência" },
  { key: "notifications", label: "Notificações", group: "Engajamento" },
  { key: "marketing", label: "Marketing", group: "Engajamento" },
  { key: "settings", label: "Configurações", group: "Sistema" },
  { key: "logs", label: "Logs", group: "Auditoria" },
  { key: "api", label: "API", group: "Técnico" },
  { key: "integrations", label: "Integrações", group: "Técnico" },
  { key: "backup", label: "Backup", group: "Técnico" },
];

export type ProfileItem = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  color: string;
  icon: string;
  is_system_default?: boolean;
  permissions: Record<ModuleKey, PermissionAction[]>;
  created_at: string;
  updated_at: string;
};

export type UserRoleOverride = {
  userId: string;
  profileId: string;
  additionalPermissions: Partial<Record<ModuleKey, PermissionAction[]>>;
  removedPermissions: Partial<Record<ModuleKey, PermissionAction[]>>;
};

export type PermissionAuditLog = {
  id: string;
  timestamp: string;
  performedBy: string;
  target: string;
  ip: string;
  changes: string;
};

// Helper: build full permissions object for all actions
function fullPermissions(): Record<ModuleKey, PermissionAction[]> {
  const actionsList: PermissionAction[] = [
    "view",
    "create",
    "edit",
    "delete",
    "export",
    "import",
    "approve",
    "publish",
    "manage",
  ];
  const obj = {} as Record<ModuleKey, PermissionAction[]>;
  ALL_MODULES.forEach((m) => {
    obj[m.key] = [...actionsList];
  });
  return obj;
}

// Helper: build read-only permissions
function readOnlyPermissions(): Record<ModuleKey, PermissionAction[]> {
  const obj = {} as Record<ModuleKey, PermissionAction[]>;
  ALL_MODULES.forEach((m) => {
    obj[m.key] = ["view"];
  });
  return obj;
}

// Helper: empty permissions
export function emptyPermissions(): Record<ModuleKey, PermissionAction[]> {
  const obj = {} as Record<ModuleKey, PermissionAction[]>;
  ALL_MODULES.forEach((m) => {
    obj[m.key] = [];
  });
  return obj;
}

// Default 11 Profiles requested by user
export const DEFAULT_PROFILES: ProfileItem[] = [
  {
    id: "p-super-admin",
    name: "Super Administrador",
    description: "Acesso irrestrito a todos os módulos, configurações de sistema e chaves de API.",
    status: "active",
    color: "#8b5cf6",
    icon: "ShieldAlert",
    is_system_default: true,
    permissions: fullPermissions(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-admin",
    name: "Administrador",
    description: "Gestão operacional e administrativa completa da plataforma.",
    status: "active",
    color: "#3b82f6",
    icon: "ShieldCheck",
    is_system_default: true,
    permissions: (() => {
      const p = fullPermissions();
      p.backup = ["view"];
      p.logs = ["view", "export"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-support",
    name: "Suporte",
    description: "Atendimento a chamados, resolução de dúvidas e moderação de tickets.",
    status: "active",
    color: "#10b981",
    icon: "Headphones",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.support = ["view", "create", "edit", "approve"];
      p.users = ["view", "edit"];
      p.coupons = ["view", "edit"];
      p.reviews = ["view", "edit", "approve"];
      p.dashboard = ["view"];
      p.map = ["view"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-finance",
    name: "Financeiro",
    description: "Controle de transações, repasses a parceiros, estornos e relatórios fiscais.",
    status: "active",
    color: "#f59e0b",
    icon: "DollarSign",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.payments = ["view", "edit", "export", "approve", "manage"];
      p.finance = ["view", "create", "edit", "export", "approve"];
      p.reports = ["view", "export"];
      p.dashboard = ["view", "export"];
      p.partners = ["view"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-partners",
    name: "Parceiros",
    description: "Gestão de estabelecimentos parceiros, contratos e aprovação de novos cadastros.",
    status: "active",
    color: "#ec4899",
    icon: "Building2",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.partners = ["view", "create", "edit", "approve", "export"];
      p.listings = ["view", "create", "edit", "approve"];
      p.hotels = ["view", "create", "edit", "approve"];
      p.restaurants = ["view", "create", "edit", "approve"];
      p.tours = ["view", "create", "edit", "approve"];
      p.events = ["view", "create", "edit", "approve"];
      p.dashboard = ["view"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-marketing",
    name: "Marketing",
    description:
      "Criação de campanhas de notificação, cupons promocionais e relatórios de métricas.",
    status: "active",
    color: "#06b6d4",
    icon: "Megaphone",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.marketing = ["view", "create", "edit", "publish", "export"];
      p.notifications = ["view", "create", "edit", "publish"];
      p.coupons = ["view", "create", "edit", "publish"];
      p.events = ["view", "create", "edit", "publish"];
      p.reports = ["view", "export"];
      p.dashboard = ["view"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-operational",
    name: "Operacional",
    description: "Acompanhamento de roteiros, mapa interativo, passeios e status de serviços.",
    status: "active",
    color: "#6366f1",
    icon: "Activity",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.dashboard = ["view"];
      p.listings = ["view", "create", "edit", "approve"];
      p.tours = ["view", "create", "edit"];
      p.hotels = ["view", "create", "edit"];
      p.events = ["view", "create", "edit"];
      p.itineraries = ["view", "create", "edit"];
      p.map = ["view", "manage"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-moderator",
    name: "Moderador",
    description: "Análise de avaliações dos usuários, filtro de conteúdo e denúncias.",
    status: "active",
    color: "#f97316",
    icon: "Shield",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.reviews = ["view", "edit", "delete", "approve"];
      p.listings = ["view", "edit"];
      p.categories = ["view"];
      p.support = ["view", "edit"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-attendant",
    name: "Atendimento",
    description: "Recepção de usuários, verificação de bilhetes e suporte básico no chat.",
    status: "active",
    color: "#14b8a6",
    icon: "MessageSquare",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.support = ["view", "edit"];
      p.users = ["view"];
      p.coupons = ["view"];
      p.dashboard = ["view"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-manager",
    name: "Gestor",
    description:
      "Visão estratégica de indicadores, desempenho de parceiros e relatórios de receita.",
    status: "active",
    color: "#34d399",
    icon: "Briefcase",
    is_system_default: true,
    permissions: (() => {
      const p = emptyPermissions();
      p.dashboard = ["view", "export"];
      p.reports = ["view", "export"];
      p.partners = ["view", "export"];
      p.listings = ["view", "export"];
      p.finance = ["view", "export"];
      p.payments = ["view", "export"];
      return p;
    })(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-viewer",
    name: "Visualizador",
    description:
      "Acesso somente leitura para auditoria e consultas de dados sem permissão de alteração.",
    status: "active",
    color: "#94a3b8",
    icon: "Eye",
    is_system_default: true,
    permissions: readOnlyPermissions(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Persistence helpers
export function getStoredProfiles(): ProfileItem[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("borapass:rbac-profiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        /* fallback */
      }
    }
  }
  return DEFAULT_PROFILES;
}

export function saveStoredProfiles(profiles: ProfileItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:rbac-profiles", JSON.stringify(profiles));
    window.dispatchEvent(new Event("borapass:rbac-changed"));
  }
}

export function getStoredUserOverrides(): Record<string, UserRoleOverride> {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("borapass:rbac-user-overrides");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* fallback */
      }
    }
  }
  return {};
}

export function saveStoredUserOverrides(overrides: Record<string, UserRoleOverride>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:rbac-user-overrides", JSON.stringify(overrides));
    window.dispatchEvent(new Event("borapass:rbac-changed"));
  }
}

export function getStoredAuditLogs(): PermissionAuditLog[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("borapass:rbac-audit-logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fallback */
      }
    }
  }
  return [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 3600000).toLocaleString("pt-BR"),
      performedBy: "rafael.assencio12@gmail.com",
      target: "Perfil Suporte Nível 2 (Criado via Duplicação)",
      ip: "189.40.12.88",
      changes: "Criação do perfil com permissões estendidas em Suporte, Usuários e Avaliações.",
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 86400000).toLocaleString("pt-BR"),
      performedBy: "rafael.assencio12@gmail.com",
      target: "Perfil Financeiro",
      ip: "189.40.12.88",
      changes: "Concedida permissão de Exportar e Aprovar no módulo de Pagamentos.",
    },
  ];
}

export function logPermissionAudit(performedBy: string, target: string, changes: string) {
  if (typeof window !== "undefined") {
    const current = getStoredAuditLogs();
    const newLog: PermissionAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("pt-BR"),
      performedBy,
      target,
      ip: "177.92.204.14", // simulated IP
      changes,
    };
    const updated = [newLog, ...current];
    localStorage.setItem("borapass:rbac-audit-logs", JSON.stringify(updated));
    window.dispatchEvent(new Event("borapass:rbac-changed"));
  }
}

// React Hook for RBAC State Management
export function useRBAC() {
  const [profiles, setProfiles] = useState<ProfileItem[]>(() => getStoredProfiles());
  const [userOverrides, setUserOverrides] = useState<Record<string, UserRoleOverride>>(() =>
    getStoredUserOverrides(),
  );
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>(() => getStoredAuditLogs());

  useEffect(() => {
    function handleUpdate() {
      setProfiles(getStoredProfiles());
      setUserOverrides(getStoredUserOverrides());
      setAuditLogs(getStoredAuditLogs());
    }
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("borapass:rbac-changed", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("borapass:rbac-changed", handleUpdate);
    };
  }, []);

  const addOrUpdateProfile = (profile: ProfileItem, adminEmail: string) => {
    const isEdit = profiles.some((p) => p.id === profile.id);
    let updated: ProfileItem[];
    if (isEdit) {
      updated = profiles.map((p) => (p.id === profile.id ? profile : p));
    } else {
      updated = [profile, ...profiles];
    }
    saveStoredProfiles(updated);
    logPermissionAudit(
      adminEmail,
      `Perfil: ${profile.name}`,
      isEdit ? `Atualizadas permissões do perfil` : `Criado novo perfil personalizado`,
    );
  };

  const deleteProfile = (profileId: string, adminEmail: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return;
    if (target.is_system_default) {
      throw new Error("Perfis padrão do sistema não podem ser excluídos!");
    }
    const updated = profiles.filter((p) => p.id !== profileId);
    saveStoredProfiles(updated);
    logPermissionAudit(adminEmail, `Perfil: ${target.name}`, `Perfil excluído do sistema`);
  };

  const duplicateProfile = (profileId: string, newName: string, adminEmail: string) => {
    const source = profiles.find((p) => p.id === profileId);
    if (!source) return;

    const copy: ProfileItem = {
      ...source,
      id: `p-${Date.now()}`,
      name: newName,
      description: `Cópia duplicada de ${source.name}`,
      is_system_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [copy, ...profiles];
    saveStoredProfiles(updated);
    logPermissionAudit(
      adminEmail,
      `Perfil: ${copy.name}`,
      `Duplicado a partir do perfil original '${source.name}'`,
    );
    return copy;
  };

  const setUserOverride = (override: UserRoleOverride, adminEmail: string, userEmail: string) => {
    const current = getStoredUserOverrides();
    current[override.userId] = override;
    saveStoredUserOverrides(current);
    logPermissionAudit(
      adminEmail,
      `Usuário: ${userEmail}`,
      `Permissões específicas atualizadas (sobrescrevendo o perfil)`,
    );
  };

  return {
    profiles,
    userOverrides,
    auditLogs,
    addOrUpdateProfile,
    deleteProfile,
    duplicateProfile,
    setUserOverride,
  };
}

// Check if a user has permission for a specific module and action
export function hasModulePermission(
  userRoles: string[],
  simulatedRole: string | null,
  moduleKey: ModuleKey,
  action: PermissionAction = "view",
  userId?: string,
): boolean {
  // If user is real admin and no simulation is active (or simulation is admin), full access
  const isSuperAdmin = userRoles.includes("admin") && (!simulatedRole || simulatedRole === "admin");
  if (isSuperAdmin) return true;

  const profiles = getStoredProfiles();
  const overrides = getStoredUserOverrides();

  // 1. Check user specific override if exists
  if (userId && overrides[userId]) {
    const ov = overrides[userId];
    // Check if explicitly removed
    if (ov.removedPermissions[moduleKey]?.includes(action)) {
      return false;
    }
    // Check if explicitly granted
    if (ov.additionalPermissions[moduleKey]?.includes(action)) {
      return true;
    }
  }

  // 2. Map role/simulation to profile
  let activeRole = simulatedRole || userRoles[0] || "user";
  if (activeRole === "user") activeRole = "p-viewer";
  if (activeRole === "premium") activeRole = "p-viewer";
  if (activeRole === "partner") activeRole = "p-partners";
  if (activeRole === "support") activeRole = "p-support";

  const profile = profiles.find(
    (p) =>
      p.id === activeRole ||
      p.name.toLowerCase() === activeRole.toLowerCase() ||
      (activeRole === "p-viewer" && p.id === "p-viewer"),
  );

  if (!profile) return false;

  const modulePerms = profile.permissions[moduleKey] || [];
  return modulePerms.includes(action) || modulePerms.includes("manage");
}
