"use client";

import { useEffect, useState } from "react";
import { SuperAdminSidebar } from "@/components/layout/superadmin-sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/lib/store/auth";
import { hasAuthCookie } from "@/lib/auth-cookie";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminLayout({
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
    const hasCookie = hasAuthCookie();
    if (!hasCookie) {
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

  if (!mounted || authorized === null || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const isSuperAdmin = user?.roles?.some((r) => r.name === "super_admin");

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Akses i ndaluar</h1>
          <p className="text-slate-500">
            Ky panel është vetëm për Super Admin. Ju nuk keni akses.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            Kthehu në panelin e biznesit
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
