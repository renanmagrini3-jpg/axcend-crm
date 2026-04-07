"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="lg:pl-60">
        <Header onMenuClick={openMobile} />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

export { DashboardLayout, type DashboardLayoutProps };
