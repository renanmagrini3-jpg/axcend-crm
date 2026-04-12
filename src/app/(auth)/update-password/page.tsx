"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { fadeIn } from "@/lib/motion";
import { createBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast("A senha deve ter pelo menos 6 caracteres", "warning");
      return;
    }
    if (password !== confirmPassword) {
      toast("As senhas não coincidem", "warning");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast(error.message, "error");
        return;
      }

      toast("Senha atualizada com sucesso!", "success");
      router.push("/dashboard");
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-base)] px-4">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Nova Senha
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Defina sua nova senha para acessar o CRM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Nova Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              icon={<Lock size={16} />}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-[34px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Input
            label="Confirmar Senha"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            icon={<Lock size={16} />}
          />

          <Button className="w-full" size="lg" loading={loading}>
            Atualizar Senha
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
