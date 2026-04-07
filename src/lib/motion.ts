import type { Variants, Transition } from "framer-motion";

const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

// --- Fade ---

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};

// --- Stagger ---

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};

// --- Interactive ---

export const cardHover = {
  y: -2,
  boxShadow: "0 0 20px rgba(249, 115, 22, 0.15)",
  transition: { duration: 0.2 },
};

export const buttonTap = {
  scale: 0.98,
};

// --- Overlay & Modal ---

export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// --- Sidebar ---

export const sidebar: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { ...spring, stiffness: 260 },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// --- Toast ---

export const toast: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: spring,
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// --- Accessibility ---

export function getReducedMotionVariants(variants: Variants): Variants {
  const reduced: Variants = {};
  for (const key in variants) {
    const value = variants[key];
    if (typeof value === "object" && value !== null) {
      const v = value as Record<string, unknown>;
      const opacity = typeof v.opacity === "number" ? v.opacity : 1;
      reduced[key] = { opacity } as Variants[string];
    } else {
      reduced[key] = value;
    }
  }
  return reduced;
}
