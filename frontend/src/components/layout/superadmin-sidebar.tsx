"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  ShieldCheck,
  Home,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const superAdminMenu = [
  { href: "/admin", label: "Platform Overview", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Bizneset", icon: Building2 },
  { href: "/admin/users", label: "Përdoruesit", icon: Users },
  { href: "/admin/reports", label: "Raporte Globale", icon: BarChart3 },
  { href: "/admin/settings", label: "Cilësimet", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3 font-bold text-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="leading-tight">Rezervo</div>
            <div className="text-xs font-normal text-orange-400">Super Admin</div>
          </div>
        </Link>
      </div>

      {/* Badge */}
      <div className="px-6 pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" /> Platform Level
        </div>
      </div>

      <div className="px-4 pt-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Platform
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto">
        {superAdminMenu.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-orange-600 text-white shadow-md shadow-orange-900/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Switch to tenant view */}
      <div className="px-3 pb-3 border-t border-slate-800 pt-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <Home className="w-[18px] h-[18px]" />
          Shko në panelin e biznesit
        </Link>
      </div>
    </aside>
  );
}
