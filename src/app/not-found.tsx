"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { fadeIn, fadeInUp } from "@/lib/motion";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg-base)] px-4">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center"
      >
        <motion.h1
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-[8rem] font-extrabold leading-none tracking-tighter text-orange-500 sm:text-[12rem]"
        >
          404
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-4 text-xl font-medium text-[var(--text-primary)] sm:text-2xl"
        >
          Página não encontrada
        </motion.p>

        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-2 max-w-md text-sm text-[var(--text-secondary)]"
        >
          A página que você está procurando não existe ou foi movida.
        </motion.p>

        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <ArrowLeft size={16} />
            Voltar ao Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
