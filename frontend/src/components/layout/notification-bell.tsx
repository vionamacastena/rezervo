"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell, Check, Trash2, CalendarCheck, X, BellOff,
} from "lucide-react";

import { notificationsApi, AppNotification } from "@/lib/api/notifications";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "tani";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} orë`;
  const days = Math.floor(hours / 24);
  return `${days} ditë`;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await notificationsApi.list();
      return data;
    },
    refetchInterval: 15000, // Poll every 15s
    refetchOnWindowFocus: true,
  });

  const unread = data?.unread_count ?? 0;
  const notifications = data?.notifications ?? [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success("Të gjitha u shënuan si të lexuara");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleClick = (n: AppNotification) => {
    if (!n.read_at) {
      markReadMutation.mutate(n.id);
    }
    setOpen(false);
    if (n.data.type === "new_reservation") {
      router.push("/reservations");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative w-9 h-9 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 outline-none">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-slate-900">Njoftimet</h3>
            {unread > 0 && (
              <span className="text-xs text-slate-400">({unread} të reja)</span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAllMutation.mutate();
              }}
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Shëno të gjitha
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nuk ka njoftime</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`relative px-4 py-3 cursor-pointer hover:bg-slate-50/70 transition-colors group ${
                      isUnread ? "bg-slate-50/40" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnread ? "bg-slate-900" : "bg-slate-100"
                      }`}>
                        <CalendarCheck className={`w-4 h-4 ${
                          isUnread ? "text-white" : "text-slate-500"
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {n.data.title}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {n.data.message}
                        </div>
                        {n.data.service_name && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {n.data.service_name}
                            {n.data.total_price ? ` · ${n.data.total_price} ${n.data.currency}` : ""}
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-slate-200 inline-flex items-center justify-center text-slate-400 shrink-0 self-start"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {isUnread && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-900 rounded-r" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
