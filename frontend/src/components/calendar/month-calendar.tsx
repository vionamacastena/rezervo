"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { sq } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  subtitle?: string;
  color: string;
  status: string;
}

interface Props {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ["Hë", "Ma", "Më", "En", "Pr", "Sh", "Di"];

export function MonthCalendar({
  currentMonth,
  onMonthChange,
  events,
  selectedDate,
  onSelectDate,
}: Props) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDay = new Map<string, CalendarEvent[]>();
  events.forEach((ev) => {
    const key = format(ev.date, "yyyy-MM-dd");
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(ev);
  });

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <h2 className="text-sm font-medium text-slate-900 capitalize">
          {format(currentMonth, "LLLL yyyy", { locale: sq })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-2 h-7 text-xs rounded-md hover:bg-slate-100 text-slate-600"
          >
            Sot
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider text-center"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative min-h-[80px] p-1.5 border-b border-r border-slate-100 text-left transition-colors",
                !isCurrentMonth && "bg-slate-50/40",
                isSelected && "bg-slate-900/5 ring-1 ring-inset ring-slate-900",
                !isSelected && "hover:bg-slate-50"
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full",
                    isTodayDate && !isSelected && "bg-slate-900 text-white",
                    isSelected && "bg-slate-900 text-white",
                    !isTodayDate && !isSelected && isCurrentMonth && "text-slate-700",
                    !isCurrentMonth && "text-slate-300"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Events (max 2) */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1 text-[10px] text-slate-600 truncate"
                  >
                    <span
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ backgroundColor: ev.color }}
                    />
                    <span className="truncate">
                      {format(ev.date, "HH:mm")} {ev.title}
                    </span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-slate-400 pl-2">
                    +{dayEvents.length - 2} të tjera
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
