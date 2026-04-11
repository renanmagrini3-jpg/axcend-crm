"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Modal, useToast } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";

type Role = "admin" | "manager" | "seller";

interface Member {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: Role;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
}

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  manager: "Gerente",
  seller: "Vendedor",
};

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

export function TeamsTab() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("seller");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar equipe", "error");
        return;
      }
      setMembers(json as Member[]);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = useCallback(async () => {
    if (!inviteName.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }
    if (!inviteEmail.trim()) {
      toast("Email é obrigatório", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao convidar", "error");
        return;
      }
      toast("Membro adicionado", "success");
      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("seller");
      await load();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [inviteName, inviteEmail, inviteRole, toast, load]);

  const handleRoleChange = useCallback(
    async (memberId: string, role: Role) => {
      try {
        const res = await fetch(`/api/team/${memberId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast(json.error || "Erro ao atualizar role", "error");
          return;
        }
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
        );
        toast("Role atualizada", "success");
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast],
  );

  const handleRemove = useCallback(
    async (member: Member) => {
      if (!window.confirm(`Remover ${member.name} da equipe?`)) return;
      try {
        const res = await fetch(`/api/team/${member.id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao remover", "error");
          return;
        }
        toast("Membro removido", "success");
        await load();
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast, load],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Carregando equipe…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Equipes</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Gerencie os membros da sua organização.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setInviteOpen(true)}>
          Convidar Membro
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhum membro ainda.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {members.map((member) => {
            const pending = !member.joined_at;
            return (
              <motion.div
                key={member.id}
                variants={staggerChild}
                className="flex items-center gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-semibold text-orange-500">
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {member.name}
                    </p>
                    {pending && (
                      <Badge variant="warning" size="sm">
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {member.email}
                  </p>
                </div>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                >
                  {(Object.keys(roleLabels) as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-red-400"
                  aria-label="Remover membro"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convidar Membro"
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Nome completo"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Papel</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className={inputClass}
            >
              {(Object.keys(roleLabels) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            O membro ficará como <strong>Pendente</strong> até se cadastrar com este email.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInviteOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleInvite} loading={saving}>
              Convidar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
