"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  DollarSign,
  UserCircle,
  Package,
  BarChart3,
  LayoutDashboard,
  Settings,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservations", label: "Rezervime", icon: CalendarCheck },
  { href: "/clients", label: "Klientë", icon: Users },
  { href: "/payments", label: "Pagesa", icon: DollarSign },
  { href: "/staff", label: "Staf", icon: UserCircle },
  { href: "/inventory", label: "Inventar", icon: Package },
  { href: "/reports", label: "Raporte", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col bg-slate-900 text-slate-100">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="leading-tight">Rezervo</div>
            <div className="text-xs font-normal text-slate-400">Management</div>
          </div>
        </Link>
      </div>

      <div className="px-4 pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Menu
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3 border-t border-slate-800 pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          <Settings className="w-[18px] h-[18px]" />
          Cilësimet
        </Link>
      </div>
    </aside>
  );
}
