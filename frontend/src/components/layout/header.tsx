"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth";

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
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Kërko..."
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-600">
          <Bell className="w-5 h-5" />
        </Button>

        <div className="w-px h-8 bg-slate-200" />

        {/* DropdownMenuTrigger NUK ka asChild — stilet direkt */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-3 h-12 px-2 rounded-md hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer"
          >
            <Avatar className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600">
              <AvatarFallback className="bg-transparent text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-semibold text-slate-900">
                {user?.name}
              </span>
              <span className="text-xs text-slate-500">
                {user?.tenant?.name || "Rezervo"}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <UserIcon className="mr-2 h-4 w-4" /> Cilësimet e profilit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Shkëputu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
