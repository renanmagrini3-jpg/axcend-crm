"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  TrendingUp,
  Calendar,
  Check,
  Zap,
  Crown,
  Star,
} from "lucide-react";
import { Card, Badge, Button, useToast } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface OrgData {
  plan: string;
  name: string;
}

interface PlanInfo {
  key: string;
  name: string;
  price: string;
  description: string;
  icon: typeof Star;
  features: string[];
  highlighted?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    price: "R$ 0",
    description: "Para começar a organizar suas vendas",
    icon: Star,
    features: [
      "Até 2 usuários",
      "1 pipeline",
      "100 contatos",
      "Campos padrão",
      "Suporte por e-mail",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "R$ 197/mês",
    description: "Para equipes que querem escalar resultados",
    icon: Zap,
    highlighted: true,
    features: [
      "Até 10 usuários",
      "Pipelines ilimitados",
      "Contatos ilimitados",
      "Campos customizados",
      "Distribuição de leads",
      "Integrações",
      "Suporte prioritário",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Sob consulta",
    description: "Para operações complexas e alto volume",
    icon: Crown,
    features: [
      "Usuários ilimitados",
      "Tudo do Pro",
      "API dedicada",
      "SSO / SAML",
      "Gerente de conta",
      "SLA de uptime 99.9%",
      "Onboarding personalizado",
    ],
  },
];

export function SubscriptionTab() {
  const { toast } = useToast();
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/current");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar dados", "error");
        return;
      }
      setOrgData({
        plan: (json.plan as string) || "free",
        name: json.name as string,
      });
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Carregando assinatura…
      </div>
    );
  }

  const currentPlan = orgData?.plan || "free";
  const currentPlanInfo = PLANS.find((p) => p.key === currentPlan) || PLANS[0];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Assinatura</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Gerencie seu plano e veja os recursos disponíveis.
        </p>
      </div>

      {/* Current plan card */}
      <Card hoverable={false} className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15">
              <TrendingUp size={22} className="text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Axcend {currentPlanInfo.name}
                </h3>
                <Badge variant="success" size="sm">
                  Ativo
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {currentPlanInfo.price}
                {currentPlan !== "enterprise" && currentPlan !== "free" && " por usuário"}
              </p>
            </div>
          </div>
        </div>

        {currentPlan !== "free" && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-4 py-3">
            <Calendar size={16} className="text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Gerenciamento de assinatura disponível em breve via Stripe.
            </span>
          </div>
        )}
      </Card>

      {/* Plan comparison */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Comparação de Planos
        </h3>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.key === currentPlan;

            return (
              <motion.div key={plan.key} variants={staggerChild}>
                <Card
                  hoverable={false}
                  className={cn(
                    "flex flex-col gap-4 h-full",
                    plan.highlighted &&
                      "ring-1 ring-orange-500/40",
                    isCurrent && "ring-1 ring-orange-500",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          isCurrent
                            ? "bg-orange-500/15 text-orange-500"
                            : "bg-neutral-500/15 text-[var(--text-muted)]",
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {plan.name}
                      </h4>
                    </div>
                    {isCurrent && (
                      <Badge variant="success" size="sm">
                        Atual
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {plan.price}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-orange-500"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] cursor-not-allowed"
                      >
                        Plano atual
                      </button>
                    ) : (
                      <Button
                        variant={plan.highlighted ? "primary" : "secondary"}
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          toast(
                            "Upgrade via Stripe será disponibilizado em breve.",
                            "info",
                          )
                        }
                      >
                        {plan.key === "enterprise"
                          ? "Falar com vendas"
                          : "Fazer upgrade"}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
