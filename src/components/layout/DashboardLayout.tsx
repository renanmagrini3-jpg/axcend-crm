"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { createBrowserClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    async function loadUser() {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserEmail(data.user.email);
        setUserName(
          (data.user.user_metadata?.full_name as string) ||
            data.user.email?.split("@")[0],
        );
      }
    }
    loadUser();
  }, []);

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="lg:pl-60">
        <Header
          onMenuClick={openMobile}
          userName={userName}
          userEmail={userEmail}
        />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

export { DashboardLayout, type DashboardLayoutProps };
