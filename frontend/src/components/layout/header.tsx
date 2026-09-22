"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Search, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const handleLogout = async () => {
    await logout();
    toast.success("U shkëputët me sukses");
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Kërko..."
            className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />

        <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-3 h-10 px-2 rounded-md hover:bg-slate-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer">
          <Avatar className="w-8 h-8 bg-slate-900">
            <AvatarFallback className="bg-transparent text-white text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-slate-900">
              {user?.name}
            </span>
            <span className="text-xs text-slate-500">
              {user?.tenant?.name || "Rezervo"}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <div className="text-sm font-medium text-slate-900">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <UserIcon className="mr-2 h-4 w-4" /> Cilësimet e profilit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" /> Shkëputu
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
