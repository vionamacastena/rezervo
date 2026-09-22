"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/lib/store/auth";
import { hasAuthCookie } from "@/lib/auth-cookie";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!hasAuthCookie()) {
      setAuthorized(false);
      window.location.replace("/login");
      return;
    }
    hydrateFromStorage();
    setAuthorized(true);
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (mounted && authorized && token && !user) {
      fetchMe();
    }
  }, [mounted, authorized, token, user, fetchMe]);

  useEffect(() => {
    if (user) {
      const isSuperAdmin = user.roles?.some((r) => r.name === "super_admin");
      if (isSuperAdmin && !user.tenant_id) {
        window.location.replace("/admin");
      }
    }
  }, [user]);

  if (!mounted || authorized === null || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
