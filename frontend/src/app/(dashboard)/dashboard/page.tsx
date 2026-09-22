"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CalendarCheck,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api/utils";

interface DashboardData {
  reservations: {
    total: number;
    confirmed: number;
    today: number;
    this_month: number;
  };
  clients: { total: number; this_month: number };
  revenue: { this_month: number; today: number };
  inventory: { low_stock: number };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/dashboard");
      return data;
    },
  });

  const kpi = data?.data;

  const kpis = [
    {
      label: "Rezervime sot",
      value: kpi?.reservations.today ?? 0,
      sub: "për sot",
      icon: Clock,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Konfirmuara",
      value: kpi?.reservations.confirmed ?? 0,
      sub: "aktive",
      icon: TrendingUp,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Klientë",
      value: kpi?.clients.total ?? 0,
      sub: `${kpi?.clients.this_month ?? 0} të reja këtë muaj`,
      icon: Users,
      accent: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Të ardhura (muaj)",
      value: formatCurrency(kpi?.revenue.this_month ?? 0),
      sub: `Sot: ${formatCurrency(kpi?.revenue.today ?? 0)}`,
      icon: DollarSign,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Përmbledhje e aktivitetit
          </p>
        </div>
        <Link
          href="/reservations"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors group"
        >
          Rezervim i ri
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

      {/* Low stock alert */}
      {kpi?.inventory.low_stock ? (
        <Link
          href="/inventory"
          className="flex items-center gap-3 border border-slate-200 rounded-lg bg-white px-4 py-3 hover:bg-slate-50/70 transition-colors group"
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-slate-700 flex-1">
            <strong>{kpi.inventory.low_stock}</strong> artikuj nën pragun minimal
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      ) : null}

      {/* Two stat cards */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-slate-200 rounded-lg bg-white p-5">
          <p className="text-xs text-slate-500 mb-2">Të ardhura sot</p>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
            {formatCurrency(kpi?.revenue.today ?? 0)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Përditësohet automatikisht</p>
        </div>
        <div className="border border-slate-200 rounded-lg bg-white p-5">
          <p className="text-xs text-slate-500 mb-2">Rezervime këtë muaj</p>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
            {kpi?.reservations.this_month ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-2">Totali nga fillimi i muajit</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-medium text-slate-900">Veprime të shpejta</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
          {[
            { href: "/reservations", label: "Rezervim i ri", desc: "Krijo rezervim", icon: CalendarCheck },
            { href: "/clients", label: "Shto klient", desc: "Regjistro klient", icon: Users },
            { href: "/payments", label: "Regjistro pagesë", desc: "Shto pagesë", icon: DollarSign },
            { href: "/reports", label: "Raporte", desc: "Analitika", icon: TrendingUp },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="p-4 hover:bg-slate-50/60 transition-colors group"
              >
                <Icon className="w-4 h-4 text-slate-500 mb-2" />
                <div className="text-sm font-medium text-slate-900">{a.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
