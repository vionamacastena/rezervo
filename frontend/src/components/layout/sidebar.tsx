"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  DollarSign,
  UserCircle,
  Package,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservations", label: "Rezervime", icon: CalendarCheck },
  { href: "/clients", label: "Klientë", icon: Users },
  { href: "/payments", label: "Pagesa", icon: DollarSign },
  { href: "/staff", label: "Staf", icon: UserCircle },
  { href: "/services", label: "Shërbimet", icon: Sparkles },
  { href: "/inventory", label: "Inventar", icon: Package },
  { href: "/reports", label: "Raporte", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.roles?.some((r) => r.name === "super_admin");

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 tracking-tight truncate">
            Rezervo
          </div>
          <div className="text-xs text-slate-400 truncate">
            {user?.tenant?.name || "Management"}
          </div>
        </div>
      </div>

      {/* SuperAdmin badge */}
      {isSuperAdmin && (
        <div className="px-3 pt-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Panel
          </Link>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
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
          href="/settings"
          className={cn(
            "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
            pathname === "/settings"
              ? "bg-slate-50 text-slate-900 font-medium"
              : "text-slate-500 hover:bg-slate-50/70 hover:text-slate-900"
          )}
        >
          {pathname === "/settings" && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-slate-900" />
          )}
          <Settings className="w-4 h-4" />
          Cilësimet
        </Link>
      </div>
    </aside>
  );
}
