"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  mode: "B2B" | "B2C";
  logo: string | null;
  plan: string | null;
}

interface OrganizationContextValue {
  org: OrganizationData | null;
  mode: "B2B" | "B2C" | null;
  isB2C: boolean;
  isB2B: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  org: null,
  mode: null,
  isB2C: false,
  isB2B: true,
  loading: true,
  refresh: async () => {},
});

function OrganizationProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrg() {
    try {
      const res = await fetch("/api/organizations/current");
      if (res.ok) {
        const data = await res.json();
        setOrg(data as OrganizationData);
      }
    } catch {
      // ignore — user may not be authenticated yet
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrg();
  }, []);

  const mode = org?.mode ?? null;
  const isB2C = mode === "B2C";
  const isB2B = mode === "B2B" || mode === null;

  return (
    <OrganizationContext.Provider
      value={{ org, mode, isB2C, isB2B, loading, refresh: fetchOrg }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

function useOrganization() {
  return useContext(OrganizationContext);
}

export { OrganizationProvider, useOrganization };
