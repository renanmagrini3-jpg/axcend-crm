"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Bell,
  Mail,
  Globe,
  Handshake,
  ArrowRightLeft,
  ListChecks,
  AlertTriangle,
  UserPlus,
  Trophy,
  ThumbsDown,
} from "lucide-react";
import { useToast } from "@/components/ui";
import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface NotificationPrefs {
  notify_deal_assigned: boolean;
  notify_deal_stage_changed: boolean;
  notify_task_due: boolean;
  notify_task_overdue: boolean;
  notify_new_contact: boolean;
  notify_deal_won: boolean;
  notify_deal_lost: boolean;
  email_notifications: boolean;
  browser_notifications: boolean;
}

const DEFAULTS: NotificationPrefs = {
  notify_deal_assigned: true,
  notify_deal_stage_changed: true,
  notify_task_due: true,
  notify_task_overdue: true,
  notify_new_contact: false,
  notify_deal_won: true,
  notify_deal_lost: true,
  email_notifications: true,
  browser_notifications: false,
};

type PrefKey = keyof NotificationPrefs;

interface ToggleGroup {
  title: string;
  icon: typeof Bell;
  items: { key: PrefKey; label: string; icon: typeof Bell }[];
}

const GROUPS: ToggleGroup[] = [
  {
    title: "Deals",
    icon: Handshake,
    items: [
      { key: "notify_deal_assigned", label: "Deal atribuído a mim", icon: Handshake },
      { key: "notify_deal_stage_changed", label: "Mudança de etapa", icon: ArrowRightLeft },
      { key: "notify_deal_won", label: "Deal ganho", icon: Trophy },
      { key: "notify_deal_lost", label: "Deal perdido", icon: ThumbsDown },
    ],
  },
  {
    title: "Tarefas",
    icon: ListChecks,
    items: [
      { key: "notify_task_due", label: "Tarefa próxima do vencimento", icon: ListChecks },
      { key: "notify_task_overdue", label: "Tarefa atrasada", icon: AlertTriangle },
    ],
  },
  {
    title: "Contatos",
    icon: UserPlus,
    items: [
      { key: "notify_new_contact", label: "Novo contato criado", icon: UserPlus },
    ],
  },
];

const CHANNELS: { key: PrefKey; label: string; description: string; icon: typeof Mail }[] = [
  {
    key: "email_notifications",
    label: "E-mail",
    description: "Receba notificações por e-mail",
    icon: Mail,
  },
  {
    key: "browser_notifications",
    label: "Navegador",
    description: "Notificações push no navegador",
    icon: Globe,
  },
];

export function NotificationsTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notification-preferences");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar preferências", "error");
        return;
      }
      const data = json as Record<string, unknown>;
      const loaded: NotificationPrefs = { ...DEFAULTS };
      for (const key of Object.keys(DEFAULTS) as PrefKey[]) {
        if (data[key] !== undefined) {
          loaded[key] = !!data[key];
        }
      }
      setPrefs(loaded);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = useCallback(
    async (key: PrefKey) => {
      const next = !prefs[key];
      setPrefs((prev) => ({ ...prev, [key]: next }));
      setSavingKey(key);
      try {
        const res = await fetch("/api/notification-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: next }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao salvar", "error");
          setPrefs((prev) => ({ ...prev, [key]: !next }));
        }
      } catch {
        toast("Erro de conexão", "error");
        setPrefs((prev) => ({ ...prev, [key]: !next }));
      } finally {
        setSavingKey(null);
      }
    },
    [prefs, toast],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Carregando preferências…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notificações</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure quais notificações você deseja receber.
        </p>
      </div>

      {GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.title}>
            <div className="mb-3 flex items-center gap-2">
              <GroupIcon size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {group.title}
              </h3>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <ItemIcon
                        size={16}
                        className="shrink-0 text-[var(--text-muted)]"
                      />
                      <span className="text-sm text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      disabled={savingKey === item.key}
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                        prefs[item.key] ? "bg-orange-500" : "bg-neutral-700",
                        savingKey === item.key && "opacity-50",
                      )}
                      aria-label={`Alternar ${item.label}`}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          prefs[item.key] && "translate-x-4",
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Bell size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Canais de Notificação
          </h3>
        </div>
        <div className="space-y-1">
          {CHANNELS.map((channel) => {
            const ChannelIcon = channel.icon;
            return (
              <div
                key={channel.key}
                className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <ChannelIcon
                    size={16}
                    className="shrink-0 text-[var(--text-muted)]"
                  />
                  <div>
                    <span className="text-sm text-[var(--text-primary)]">
                      {channel.label}
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(channel.key)}
                  disabled={savingKey === channel.key}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    prefs[channel.key] ? "bg-orange-500" : "bg-neutral-700",
                    savingKey === channel.key && "opacity-50",
                  )}
                  aria-label={`Alternar ${channel.label}`}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                      prefs[channel.key] && "translate-x-4",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
