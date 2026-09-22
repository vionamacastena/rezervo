"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Building2,
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Crown,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      label: "Biznese Totale",
      value: data?.total_tenants ?? 0,
      sub: `${data?.active_tenants ?? 0} aktive`,
      icon: Building2,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Përdorues",
      value: data?.total_users ?? 0,
      sub: "në të gjitha bizneset",
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Rezervime Totale",
      value: data?.total_reservations ?? 0,
      sub: "gjithsej",
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Të Ardhura këtë Muaj",
      value: formatCurrency(data?.revenue_month ?? 0),
      sub: `Total: ${formatCurrency(data?.total_revenue ?? 0)}`,
      icon: DollarSign,
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        {" "}
        <div>
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
            <Crown className="w-3 h-3" /> Platform Overview
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mirë se vini, Super Admin
          </h1>
          <p className="text-slate-500 mt-1">
            Përmbledhje e plotë e platformës Rezervo
          </p>
        </div>
        <Link href="/admin/tenants" className="shrink-0">
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Building2 className="w-4 h-4" /> Menaxho Bizneset
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card
              key={i}
              className="border-slate-200 hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      {k.label}
                    </p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-24 mt-2" />
                    ) : (
                      <p className="text-3xl font-bold tracking-tight mt-2">
                        {k.value}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Tenants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top Bizneset
            </CardTitle>
            <Link
              href="/admin/tenants"
              className="text-xs text-blue-600 hover:underline"
            >
              Shiko të gjitha →
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : data?.top_tenants?.length ? (
              <div className="space-y-3">
                {data.top_tenants.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/admin/tenants/${t.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-500">{t.slug}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-emerald-600">
                        {formatCurrency(t.revenue || 0)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t.reservations_count || 0} rez.
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nuk ka biznese
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Rezervime sipas Statusit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: "draft", label: "Draft", color: "bg-slate-400" },
                  {
                    key: "tentative",
                    label: "Tentativ",
                    color: "bg-yellow-400",
                  },
                  {
                    key: "confirmed",
                    label: "Konfirmuar",
                    color: "bg-blue-500",
                  },
                  {
                    key: "completed",
                    label: "Përfunduar",
                    color: "bg-emerald-500",
                  },
                  { key: "cancelled", label: "Anuluar", color: "bg-red-500" },
                ].map((s) => {
                  const count = data?.reservations_by_status?.[s.key] ?? 0;
                  const total = data?.total_reservations ?? 1;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={s.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{s.label}</span>
                        <span className="text-slate-500">
                          {count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Veprime të Shpejta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Link href="/admin/tenants">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
              <Building2 className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-medium text-sm">Lista e Bizneseve</div>
              <div className="text-xs text-slate-500 mt-1">
                {data?.total_tenants ?? 0} biznese
              </div>
            </div>
          </Link>
          <Link href="/dashboard">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer">
              <CalendarCheck className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="font-medium text-sm">Paneli i Demos</div>
              <div className="text-xs text-slate-500 mt-1">
                Shko në Rezervo Demo
              </div>
            </div>
          </Link>
          <div
            onClick={() =>
              window.open("http://localhost:3000/book/demo", "_blank")
            }
            className="p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer"
          >
            <Activity className="w-6 h-6 text-purple-600 mb-2" />
            <div className="font-medium text-sm">Public Booking</div>
            <div className="text-xs text-slate-500 mt-1">
              Testo wizard-in publik
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
