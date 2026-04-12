"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { fadeIn } from "@/lib/motion";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast("Informe seu e-mail", "warning");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast(error.message, "error");
        return;
      }

      setSent(true);
      toast("Link de recuperação enviado!", "success");
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
            Recuperar Senha
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {sent
              ? "Verifique sua caixa de entrada e clique no link para redefinir sua senha."
              : "Informe seu e-mail para receber o link de recuperação."}
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Mail size={28} className="text-emerald-500" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Enviamos um link para <span className="font-medium text-[var(--text-primary)]">{email}</span>.
              Caso não encontre, verifique a pasta de spam.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              icon={<Mail size={16} />}
            />

            <Button className="w-full" size="lg" loading={loading}>
              Enviar Link de Recuperação
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
