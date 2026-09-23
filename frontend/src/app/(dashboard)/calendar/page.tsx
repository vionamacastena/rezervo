"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";
import { sq } from "date-fns/locale";
import {
  Phone, Calendar as CalendarIcon, ArrowRight,
  Plus, Lock, Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { calendarApi, CalendarReservation } from "@/lib/api/calendar";
import { blockedSlotsApi, BlockedSlot } from "@/lib/api/blocked-slots";
import { MonthCalendar, CalendarEvent } from "@/components/calendar/month-calendar";
import { BlockSlotDialog } from "@/components/calendar/block-slot-dialog";
import { ReservationFormDialog } from "@/components/forms/reservation-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/api/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  tentative: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  tentative: "Tentativ",
  confirmed: "Konfirmuar",
  completed: "Përfunduar",
  cancelled: "Anuluar",
};

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [blockOpen, setBlockOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const from = format(addDays(startOfMonth(currentMonth), -7), "yyyy-MM-dd");
  const to = format(addDays(endOfMonth(currentMonth), 7), "yyyy-MM-dd");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["calendar", from, to],
    queryFn: () => calendarApi.list(from, to),
  });

  const { data: blockedSlots = [] } = useQuery({
    queryKey: ["blocked-slots", from, to],
    queryFn: () => blockedSlotsApi.list(from, to),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: number) => blockedSlotsApi.delete(id),
    onSuccess: () => {
      toast.success("Bllokimi u fshi");
      queryClient.invalidateQueries({ queryKey: ["blocked-slots"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  // Events (reservations + blocked)
  const events: CalendarEvent[] = useMemo(() => {
    const items: CalendarEvent[] = [];
    if (Array.isArray(reservations)) {
      reservations
        .filter((r) => r.status !== "cancelled")
        .forEach((r) => {
          items.push({
            id: r.id,
            date: new Date(r.starts_at),
            title: r.client?.full_name ?? "Klient",
            subtitle: r.service?.name,
            color: r.service?.color ?? STATUS_COLORS[r.status] ?? "#3b82f6",
            status: r.status,
          });
        });
    }
    // Shto blocked slots si events me status "blocked"
    blockedSlots.forEach((b) => {
      items.push({
        id: b.id + 1000000,
        date: new Date(b.starts_at),
        title: b.reason ?? "Bllokuar",
        subtitle: "I bllokuar",
        color: "#64748b",
        status: "blocked",
      });
    });
    return items;
  }, [reservations, blockedSlots]);

  // Selected day reservations
  const selectedReservations: CalendarReservation[] = useMemo(() => {
    if (!selectedDate || !Array.isArray(reservations)) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return reservations
      .filter((r) => format(new Date(r.starts_at), "yyyy-MM-dd") === key)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [reservations, selectedDate]);

  // Selected day blocked slots
  const selectedBlocked: BlockedSlot[] = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return blockedSlots
      .filter((b) => format(new Date(b.starts_at), "yyyy-MM-dd") === key)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [blockedSlots, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Kalendar</h1>
          <p className="text-sm text-slate-500 mt-1">Rezervimet dhe bllokimet</p>
        </div>
        <Link
          href="/reservations"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors group"
        >
          Lista e plotë
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {isLoading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <MonthCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}

        {/* Right panel */}
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden h-fit">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <div className="text-xs text-slate-500">Dita e zgjedhur</div>
            <div className="text-sm font-medium text-slate-900 capitalize">
              {selectedDate ? format(selectedDate, "EEEE, d MMMM", { locale: sq }) : "—"}
            </div>
          </div>

          {/* Quick actions */}
          {selectedDate && (
            <div className="grid grid-cols-2 gap-2 p-3 border-b border-slate-100">
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 gap-1.5"
                onClick={() => setBookOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Rezervo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setBlockOpen(true)}
              >
                <Lock className="w-3.5 h-3.5" /> Blloko
              </Button>
            </div>
          )}

          {/* Content */}
          {!selectedDate ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Kliko në kalendar
            </div>
          ) : selectedReservations.length === 0 && selectedBlocked.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Nuk ka aktivitet për këtë ditë
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {/* Blocked slots first */}
              {selectedBlocked.map((b) => (
                <div key={`b-${b.id}`} className="px-5 py-3 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="text-center shrink-0">
                      <div className="text-sm font-semibold text-slate-500 tabular-nums">
                        {format(new Date(b.starts_at), "HH:mm")}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {format(new Date(b.ends_at), "HH:mm")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">
                          {b.reason ?? "Bllokuar"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        I bllokuar nga {b.creator?.name ?? "—"}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBlockMutation.mutate(b.id)}
                      className="w-7 h-7 rounded-md hover:bg-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Reservations */}
              {selectedReservations.map((r) => {
                const startTime = format(new Date(r.starts_at), "HH:mm");
                const endTime = format(new Date(r.ends_at), "HH:mm");
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="text-center shrink-0">
                        <div className="text-sm font-semibold text-slate-900 tabular-nums">
                          {startTime}
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums">
                          {endTime}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: r.service?.color ?? STATUS_COLORS[r.status] }}
                          />
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {r.client?.full_name ?? "Klient"}
                          </span>
                        </div>
                        {r.service && (
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {r.service.name}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {r.client?.phone}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono">{r.code}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400">
                            {STATUS_LABELS[r.status]}
                          </span>
                          <span className="text-xs font-medium text-slate-900 tabular-nums">
                            {formatCurrency(r.total_price, r.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedDate && (
        <>
          <BlockSlotDialog open={blockOpen} onOpenChange={setBlockOpen} date={selectedDate} />
          <ReservationFormDialog
            open={bookOpen}
            onOpenChange={setBookOpen}
            reservation={null}
            defaultDate={selectedDate}
          />
        </>
      )}
    </div>
  );
}
