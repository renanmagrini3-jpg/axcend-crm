"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Users,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { createBrowserClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

type BusinessMode = "B2B" | "B2C";
type TeamSize = "1-5" | "6-10" | "11-25";

const stepSlide = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2
  const [companyName, setCompanyName] = useState("");
  const [businessMode, setBusinessMode] = useState<BusinessMode>("B2B");
  const [teamSize, setTeamSize] = useState<TeamSize>("1-5");

  function goNext() {
    if (!name || !email || !password || !confirmPassword) {
      toast("Preencha todos os campos.", "warning");
      return;
    }
    if (password.length < 6) {
      toast("A senha deve ter pelo menos 6 caracteres.", "warning");
      return;
    }
    if (password !== confirmPassword) {
      toast("As senhas não coincidem.", "error");
      return;
    }
    setDirection(1);
    setStep(2);
  }

  function goBack() {
    setDirection(-1);
    setStep(1);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName) {
      toast("Informe o nome da empresa.", "warning");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          company_name: companyName,
          business_mode: businessMode,
          team_size: teamSize,
        },
      },
    });

    if (error) {
      toast(error.message, "error");
      setLoading(false);
      return;
    }

    // Create organization and link to user
    if (signUpData.session) {
      try {
        const res = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: companyName,
            mode: businessMode,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(
            (json as { error?: string }).error || "Erro ao criar organização. Tente novamente.",
            "error",
          );
          setLoading(false);
          return;
        }
      } catch {
        toast("Erro ao criar organização. Verifique sua conexão e tente novamente.", "error");
        setLoading(false);
        return;
      }
    }

    toast(
      "Conta criada! Verifique seu email para confirmar o cadastro.",
      "success",
    );
    router.push("/login");
  }

  async function handleOAuth(provider: "google") {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      toast(error.message, "error");
    }
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md px-4"
    >
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-lg">
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-orange-500">A</span>
            <span className="text-[var(--text-primary)]">xcend</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Criar sua conta
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step >= s
                    ? "bg-orange-500 text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-muted)]",
                )}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className={cn(
                    "h-px w-8 transition-colors",
                    step > 1 ? "bg-orange-500" : "bg-[var(--border-default)]",
                  )}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-[var(--text-muted)]">
            Passo {step} de 2
          </span>
        </div>

        {/* Steps */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 ? (
              <motion.form
                key="step1"
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                className="space-y-4"
              >
                <Input
                  label="Nome completo"
                  icon={<User size={16} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    icon={<Lock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    label="Confirmar senha"
                    type={showConfirm ? "text" : "password"}
                    icon={<Lock size={16} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  icon={<ChevronRight size={16} />}
                >
                  Próximo
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <Input
                  label="Nome da empresa"
                  icon={<Building2 size={16} />}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />

                {/* Business mode */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                    Modo de operação
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["B2B", "B2C"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setBusinessMode(mode)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          businessMode === mode
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]",
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            businessMode === mode
                              ? "text-orange-500"
                              : "text-[var(--text-primary)]",
                          )}
                        >
                          {mode}
                        </span>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {mode === "B2B"
                            ? "Vendas para empresas"
                            : "Vendas para consumidores"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team size */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                    Quantidade de vendedores
                  </label>
                  <div className="relative">
                    <Users
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <select
                      value={teamSize}
                      onChange={(e) =>
                        setTeamSize(e.target.value as TeamSize)
                      }
                      className="w-full appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none"
                    >
                      <option value="1-5">1 a 5 vendedores</option>
                      <option value="6-10">6 a 10 vendedores</option>
                      <option value="11-25">11 a 25 vendedores</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={<ChevronLeft size={16} />}
                    onClick={goBack}
                    className="w-auto"
                    type="button"
                  >
                    Voltar
                  </Button>
                  <Button className="flex-1" size="lg" loading={loading}>
                    Criar Conta
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-default)]" />
          <span className="text-xs text-[var(--text-muted)]">
            ou continue com
          </span>
          <div className="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        {/* SSO */}
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<GoogleIcon />}
            onClick={() => handleOAuth("google")}
            type="button"
            className="w-full"
          >
            Continuar com Google
          </Button>
          {/* TODO: Habilitar Microsoft quando Azure estiver configurado */}
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-orange-500 hover:text-orange-400 transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
