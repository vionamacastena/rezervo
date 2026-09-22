"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Plus, ArrowRight } from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api/utils";
import { CreateTenantDialog } from "@/components/admin/create-tenant-dialog";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trial: "Trial",
  suspended: "Pezulluar",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  trial: "bg-amber-500",
  suspended: "bg-red-500",
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenants", search, status],
    queryFn: async () => {
      const { data } = await adminApi.listTenants({
        search: search || undefined,
        status: status === "all" ? undefined : status,
      });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Bizneset
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.total ?? 0} biznese në platformë
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 gap-2 h-9"
          size="sm"
        >
          <Plus className="w-3.5 h-3.5" /> Krijo Biznes
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Kërko..."
            className="pl-9 h-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
        >
          <option value="all">Të gjitha</option>
          <option value="active">Aktiv</option>
          <option value="trial">Trial</option>
          <option value="suspended">Pezulluar</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : data?.data?.length ? (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden divide-y divide-slate-100">
          {data.data.map((t: any) => (
            <Link
              key={t.id}
              href={`/admin/tenants/${t.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status]}`} />
                  <span className="font-medium text-slate-900 truncate">
                    {t.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {t.slug}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span>{t.users_count ?? 0} users</span>
                  <span className="text-slate-300">·</span>
                  <span>{t.services_count ?? 0} shërbime</span>
                  <span className="text-slate-300">·</span>
                  <span>{t.reservations_count ?? 0} rezervime</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-medium text-slate-900 tabular-nums">
                  {formatCurrency(t.revenue_total ?? 0)}
                </div>
                <div className="text-xs text-slate-400">
                  {STATUS_LABEL[t.status]}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg bg-white py-16 text-center">
          <p className="text-sm text-slate-500 mb-4">Nuk ka biznese</p>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-slate-900">
            <Plus className="w-4 h-4 mr-2" /> Krijo Biznesin e Parë
          </Button>
        </div>
      )}

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
