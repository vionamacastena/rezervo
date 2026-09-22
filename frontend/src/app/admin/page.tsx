"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Users,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api/utils";

interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_reservations: number;
  total_revenue: number;
  revenue_month: number;
  top_tenants: any[];
  reservations_by_status: Record<string, number>;
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/platform-stats");
      return data;
    },
  });

  const kpis = [
    {
      label: "Biznese",
      value: data?.total_tenants ?? 0,
      sub: `${data?.active_tenants ?? 0} aktive`,
      icon: Building2,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Përdorues",
      value: data?.total_users ?? 0,
      sub: "gjithsej",
      icon: Users,
      accent: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Rezervime",
      value: data?.total_reservations ?? 0,
      sub: "gjithsej",
      icon: CalendarCheck,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Të ardhura (muaj)",
      value: formatCurrency(data?.revenue_month ?? 0),
      sub: `Total: ${formatCurrency(data?.total_revenue ?? 0)}`,
      icon: TrendingUp,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const statusList = [
    { key: "draft", label: "Draft", color: "bg-slate-400" },
    { key: "tentative", label: "Tentativ", color: "bg-slate-500" },
    { key: "confirmed", label: "Konfirmuar", color: "bg-slate-700" },
    { key: "completed", label: "Përfunduar", color: "bg-slate-900" },
    { key: "cancelled", label: "Anuluar", color: "bg-slate-300" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Përmbledhje e platformës
          </p>
        </div>
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors group"
        >
          Menaxho bizneset
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-500">{k.label}</p>
                <div className={`w-7 h-7 rounded-md ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${k.accent}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {k.value}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Bizneset */}
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">Top Bizneset</h2>
            <Link
              href="/admin/tenants"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Të gjitha
            </Link>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data?.top_tenants?.length ? (
            <div className="divide-y divide-slate-50">
              {data.top_tenants.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/admin/tenants/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500 shrink-0 group-hover:bg-slate-200 transition-colors">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate font-mono">
                      {t.slug}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(t.revenue || 0)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t.reservations_count || 0} rez.
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              Nuk ka biznese
            </div>
          )}
        </div>

        {/* Statuset */}
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-900">
              Rezervime sipas statusit
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {statusList.map((s) => {
              const count = data?.reservations_by_status?.[s.key] ?? 0;
              const total = data?.total_reservations ?? 1;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{s.label}</span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {count}{" "}
                      <span className="text-slate-300">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
