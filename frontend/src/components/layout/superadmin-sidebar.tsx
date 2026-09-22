"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/tenants", label: "Bizneset", icon: Building2 },
  { href: "/admin/users", label: "Përdoruesit", icon: Users },
  { href: "/admin/reports", label: "Raporte", icon: BarChart3 },
  { href: "/admin/settings", label: "Cilësimet", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 tracking-tight">
            Rezervo
          </span>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs text-slate-500">Admin</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-0.5">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
                isActive
                  ? "bg-slate-50 text-slate-900 font-medium"
                  : "text-slate-500 hover:bg-slate-50/70 hover:text-slate-900"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-slate-900" />
              )}
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-50/70 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Paneli i biznesit
        </Link>
      </div>
    </aside>
  );
}
