import { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Headphones,
  DollarSign,
  Building2,
  Megaphone,
  Activity,
  Shield,
  MessageSquare,
  Briefcase,
  Eye,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit,
  Check,
  X,
  Sparkles,
  History,
  Lock,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  useRBAC,
  ALL_ACTIONS,
  ALL_MODULES,
  emptyPermissions,
  type ProfileItem,
  type ModuleKey,
  type PermissionAction,
} from "@/lib/rbac";
import { useAuth } from "@/hooks/use-auth";

const ICON_MAP: Record<string, any> = {
  ShieldAlert,
  ShieldCheck,
  Headphones,
  DollarSign,
  Building2,
  Megaphone,
  Activity,
  Shield,
  MessageSquare,
  Briefcase,
  Eye,
};

const COLOR_OPTIONS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#34d399", // Green
  "#94a3b8", // Slate
];

export function RBACManagementView() {
  const { user } = useAuth();
  const adminEmail = user?.email || "admin@borapass.com";
  const { profiles, auditLogs, addOrUpdateProfile, deleteProfile, duplicateProfile } = useRBAC();

  const [activeSubTab, setActiveSubTab] = useState<"profiles" | "audit">("profiles");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<ProfileItem | null>(null);
  const [duplicateName, setDuplicateName] = useState("");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [profiles, search, statusFilter]);

  function handleStartNew() {
    const newProf: ProfileItem = {
      id: `p-custom-${Date.now()}`,
      name: "",
      description: "",
      status: "active",
      color: "#3b82f6",
      icon: "ShieldCheck",
      permissions: emptyPermissions(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingProfile(newProf);
    setIsNewModalOpen(true);
  }

  function handleDuplicateConfirm() {
    if (!duplicateSource || !duplicateName.trim()) return;
    try {
      duplicateProfile(duplicateSource.id, duplicateName.trim(), adminEmail);
      toast.success(`Perfil '${duplicateName}' duplicado com sucesso!`);
      setDuplicateSource(null);
      setDuplicateName("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao duplicar perfil.");
    }
  }

  function handleDeleteConfirm(p: ProfileItem) {
    if (p.is_system_default) {
      toast.error("Perfis padrão do sistema não podem ser excluídos!");
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o perfil '${p.name}'?`)) {
      try {
        deleteProfile(p.id, adminEmail);
        toast.success(`Perfil '${p.name}' removido.`);
      } catch (err: any) {
        toast.error(err.message || "Erro ao excluir perfil.");
      }
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total de Perfis</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{profiles.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">11 Perfis Padrão + Personalizados</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Perfis Ativos</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            {profiles.filter((p) => p.status === "active").length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Em execução no RBAC</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Módulos Protegidos</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-sky-400">{ALL_MODULES.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Matriz Granular de Ações</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Logs de Auditoria</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
              <History className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{auditLogs.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Registros de alterações</p>
        </div>
      </div>

      {/* 2. TAB CONTROLS & MAIN CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab("profiles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === "profiles"
                ? "bg-sky-600 text-white shadow-brand font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Gestão de Perfis ({profiles.length})
          </button>
          <button
            onClick={() => setActiveSubTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === "audit"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4" /> Auditoria ({auditLogs.length})
          </button>
        </div>

        {activeSubTab === "profiles" && (
          <button
            onClick={handleStartNew}
            className="rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Perfil Personalizado
          </button>
        )}
      </div>

      {/* 3. PROFILES TAB */}
      {activeSubTab === "profiles" && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar perfis por nome ou descrição..."
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition font-bold"
            >
              <option value="all">Status: Todos</option>
              <option value="active">Status: Ativos</option>
              <option value="inactive">Status: Inativos</option>
            </select>
          </div>

          {/* Profiles Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Perfil</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Módulos Concedidos</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredProfiles.map((p) => {
                    const IconComponent = ICON_MAP[p.icon] || ShieldCheck;
                    const activePermCount = Object.values(p.permissions).filter(
                      (arr) => arr.length > 0,
                    ).length;

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                              style={{ backgroundColor: p.color }}
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-white flex items-center gap-2">
                                {p.name}
                              </span>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {p.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {p.is_system_default ? (
                            <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-sky-400">
                              🛡️ Padrão do Sistema
                            </span>
                          ) : (
                            <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                              ✨ Personalizado
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              p.status === "active"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {p.status === "active" ? "🟢 Ativo" : "🔴 Inativo"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-300">
                          <span className="font-bold text-white">{activePermCount}</span> de{" "}
                          {ALL_MODULES.length} módulos com acesso
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingProfile(p);
                                setIsNewModalOpen(false);
                              }}
                              className="rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition"
                              title="Editar Perfil & Permissões"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => {
                                setDuplicateSource(p);
                                setDuplicateName(`Cópia de ${p.name}`);
                              }}
                              className="rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-purple-400 hover:text-purple-300 transition"
                              title="Duplicar Perfil"
                            >
                              <Copy className="h-4 w-4" />
                            </button>

                            {!p.is_system_default && (
                              <button
                                onClick={() => handleDeleteConfirm(p)}
                                className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 p-2 text-rose-400 transition"
                                title="Excluir Perfil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhum perfil encontrado para esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDIT TAB */}
      {activeSubTab === "audit" && (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-soft">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <History className="h-4 w-4 text-amber-400" /> Logs de Auditoria de Permissões
            </h3>
            <span className="text-xs text-slate-400">Registro histórico completo de ações</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Data / Hora</th>
                  <th className="py-3.5 px-4">Administrador</th>
                  <th className="py-3.5 px-4">IP</th>
                  <th className="py-3.5 px-4">Alvo Afetado</th>
                  <th className="py-3.5 px-4">Alterações Realizadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-sky-400">{log.performedBy}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{log.ip}</td>
                    <td className="py-3.5 px-4 font-extrabold text-amber-300">{log.target}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.changes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL DE EDIÇÃO / CRIAÇÃO DE PERFIL E MATRIZ DE PERMISSÕES */}
      {editingProfile && (
        <ProfileFormModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={(updatedProfile) => {
            try {
              addOrUpdateProfile(updatedProfile, adminEmail);
              toast.success(`Perfil '${updatedProfile.name}' salvo com sucesso!`);
              setEditingProfile(null);
            } catch (err: any) {
              toast.error(err.message || "Erro ao salvar perfil.");
            }
          }}
        />
      )}

      {/* 6. MODAL DE DUPLICAÇÃO DE PERFIL */}
      {duplicateSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Copy className="h-4 w-4 text-purple-400" /> Duplicar Perfil
              </h3>
              <button
                onClick={() => setDuplicateSource(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copiar todas as permissões de <strong>{duplicateSource.name}</strong> para criar um
              novo perfil.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Nome do Novo Perfil</label>
              <input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Ex: Suporte Nível 2"
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateSource(null)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicateConfirm}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2 text-xs shadow-md"
              >
                Confirmar Duplicação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Form Modal with Modern Matrix Table & Quick Presets
function ProfileFormModal({
  profile,
  onClose,
  onSave,
}: {
  profile: ProfileItem;
  onClose: () => void;
  onSave: (p: ProfileItem) => void;
}) {
  const [formData, setFormData] = useState<ProfileItem>({ ...profile });

  // Toggle single action in matrix
  function togglePermission(moduleKey: ModuleKey, action: PermissionAction) {
    setFormData((prev) => {
      const currentActions = prev.permissions[moduleKey] || [];
      const exists = currentActions.includes(action);
      const newActions = exists
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: newActions,
        },
      };
    });
  }

  // Column header toggle (Select/Unselect action across all modules)
  function toggleColumnAction(action: PermissionAction) {
    setFormData((prev) => {
      // Check if all modules have this action
      const allHave = ALL_MODULES.every((m) => (prev.permissions[m.key] || []).includes(action));
      const newPerms = { ...prev.permissions };

      ALL_MODULES.forEach((m) => {
        const current = newPerms[m.key] || [];
        if (allHave) {
          newPerms[m.key] = current.filter((a) => a !== action);
        } else {
          if (!current.includes(action)) newPerms[m.key] = [...current, action];
        }
      });

      return { ...prev, permissions: newPerms };
    });
  }

  // Row header toggle (Select/Unselect all actions for a single module)
  function toggleRowModule(moduleKey: ModuleKey) {
    setFormData((prev) => {
      const current = prev.permissions[moduleKey] || [];
      const allHave = ALL_ACTIONS.every((a) => current.includes(a.key));
      const newPerms = { ...prev.permissions };

      if (allHave) {
        newPerms[moduleKey] = [];
      } else {
        newPerms[moduleKey] = ALL_ACTIONS.map((a) => a.key);
      }

      return { ...prev, permissions: newPerms };
    });
  }

  // Quick Preset Handlers (Seleção Rápida)
  function applyPreset(type: "all" | "clear" | "readonly" | "operational" | "finance" | "support") {
    setFormData((prev) => {
      const newPerms = emptyPermissions();

      if (type === "all") {
        ALL_MODULES.forEach((m) => {
          newPerms[m.key] = ALL_ACTIONS.map((a) => a.key);
        });
      } else if (type === "readonly") {
        ALL_MODULES.forEach((m) => {
          newPerms[m.key] = ["view"];
        });
      } else if (type === "operational") {
        ALL_MODULES.forEach((m) => {
          if (["dashboard", "tours", "hotels", "events", "itineraries", "map"].includes(m.key)) {
            newPerms[m.key] = ["view", "create", "edit", "approve"];
          } else {
            newPerms[m.key] = ["view"];
          }
        });
      } else if (type === "finance") {
        ALL_MODULES.forEach((m) => {
          if (["payments", "finance", "reports"].includes(m.key)) {
            newPerms[m.key] = ["view", "create", "edit", "export", "approve", "manage"];
          } else {
            newPerms[m.key] = ["view"];
          }
        });
      } else if (type === "support") {
        ALL_MODULES.forEach((m) => {
          if (["support", "reviews", "users", "coupons"].includes(m.key)) {
            newPerms[m.key] = ["view", "create", "edit", "approve"];
          } else {
            newPerms[m.key] = ["view"];
          }
        });
      }

      return { ...prev, permissions: newPerms };
    });
    toast.success(`Preset aplicado com sucesso!`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-md font-bold"
              style={{ backgroundColor: formData.color }}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {formData.name ? `Editar Perfil: ${formData.name}` : "Criar Novo Perfil"}
              </h3>
              <p className="text-xs text-slate-400">
                Configure os metadados e a matriz de permissões granulares.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nome do Perfil *
              </label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Gestor Regional"
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="active">🟢 Ativo</option>
                <option value="inactive">🔴 Inativo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Cor de Destaque</label>
              <div className="flex items-center gap-1.5 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`h-6 w-6 rounded-full transition transform ${
                      formData.color === c
                        ? "scale-125 ring-2 ring-white"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-slate-300 block mb-1">Descrição</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva as responsabilidades e alcance deste perfil..."
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Quick Selection Presets Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" /> Seleção Rápida (Presets)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className="rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 text-xs font-bold transition"
              >
                ⚡ Selecionar Tudo
              </button>
              <button
                type="button"
                onClick={() => applyPreset("clear")}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 text-xs font-bold transition"
              >
                🧹 Limpar Tudo
              </button>
              <button
                type="button"
                onClick={() => applyPreset("readonly")}
                className="rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-3 py-1.5 text-xs font-bold transition"
              >
                👁️ Somente Leitura
              </button>
              <button
                type="button"
                onClick={() => applyPreset("operational")}
                className="rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold transition"
              >
                ⚙️ Operacional
              </button>
              <button
                type="button"
                onClick={() => applyPreset("finance")}
                className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-bold transition"
              >
                💰 Financeiro
              </button>
              <button
                type="button"
                onClick={() => applyPreset("support")}
                className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold transition"
              >
                🎧 Suporte
              </button>
            </div>
          </div>

          {/* Modern Matrix Table */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Matriz de Permissões Granulares por Módulo
            </span>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="w-full text-left text-xs border-collapse sticky-header">
                  <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 z-10">
                    <tr className="text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[160px]">Módulo</th>
                      {ALL_ACTIONS.map((act) => (
                        <th key={act.key} className="py-3 px-3 text-center min-w-[80px]">
                          <button
                            type="button"
                            onClick={() => toggleColumnAction(act.key)}
                            className="hover:text-white transition flex flex-col items-center gap-1 mx-auto"
                            title={`Alternar '${act.label}' em todos os módulos`}
                          >
                            <span>{act.label}</span>
                            <span className="text-[9px] text-sky-400 font-normal underline">
                              Todos
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-200">
                    {ALL_MODULES.map((mod) => {
                      const modPerms = formData.permissions[mod.key] || [];
                      const allChecked = ALL_ACTIONS.every((a) => modPerms.includes(a.key));

                      return (
                        <tr key={mod.key} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-4">
                            <button
                              type="button"
                              onClick={() => toggleRowModule(mod.key)}
                              className="font-bold text-white hover:text-sky-400 transition text-left flex items-center gap-2"
                              title="Alternar todas as ações deste módulo"
                            >
                              <span>{mod.label}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({mod.group})
                              </span>
                            </button>
                          </td>

                          {ALL_ACTIONS.map((act) => {
                            const isChecked = modPerms.includes(act.key);
                            return (
                              <td key={act.key} className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => togglePermission(mod.key, act.key)}
                                  className={`grid h-6 w-6 mx-auto place-items-center rounded-lg transition ${
                                    isChecked
                                      ? "bg-sky-500 text-white shadow-sm"
                                      : "bg-slate-900 border border-slate-800 text-slate-600 hover:border-slate-700"
                                  }`}
                                >
                                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {Object.values(formData.permissions).flat().length} permissões individuais ativadas.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!formData.name.trim()) {
                  toast.error("O nome do perfil é obrigatório!");
                  return;
                }
                onSave(formData);
              }}
              className="rounded-xl bg-gradient-brand px-6 py-2 text-xs font-black text-white shadow-brand hover:opacity-95"
            >
              Salvar Perfil 💾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
