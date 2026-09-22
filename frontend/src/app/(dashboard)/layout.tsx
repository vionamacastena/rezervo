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

    // Lexo cookie sinkronikisht (bulletproof — pa race)
    const hasCookie = hasAuthCookie();

    if (!hasCookie) {
      setAuthorized(false);
      window.location.replace("/login");
      return;
    }

    // Hidrato state nga localStorage
    hydrateFromStorage();

    setAuthorized(true);
  }, [hydrateFromStorage]);

  // Pas hidratimit, nëse token ekziston por user jo, bëj fetchMe
  useEffect(() => {
    if (mounted && authorized && token && !user) {
      fetchMe();
    }
  }, [mounted, authorized, token, user, fetchMe]);

  // Gjatë hidratimit ose pa autorizim → spinner
  if (!mounted || authorized === null || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Nëse user-i është duke u ngarkuar
  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
