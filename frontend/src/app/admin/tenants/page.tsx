"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Building2, Search, Users, CalendarCheck, DollarSign,
  ArrowRight, ExternalLink, Mail, Phone, MapPin, Plus,
} from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api/utils";
import { CreateTenantDialog } from "@/components/admin/create-tenant-dialog";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: "Aktiv", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  suspended: { label: "Pezulluar", class: "bg-red-100 text-red-700 border-red-200" },
  trial: { label: "Trial", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bizneset</h1>
          <p className="text-slate-500 mt-1">
            Menaxho të gjitha bizneset në platformë
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Krijo Biznes
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Kërko biznes..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "trial", "suspended"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    status === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {s === "all" ? "Të gjitha" : STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : data?.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((t: any) => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.active;
            return (
              <Card key={t.id} className="border-slate-200 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg truncate">{t.name}</h3>
                        <div className="text-xs text-slate-500 font-mono truncate">{t.slug}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>
                  </div>

                  <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                    {t.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {t.email}</div>}
                    {t.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {t.phone}</div>}
                    {t.address && <div className="flex items-center gap-2 truncate"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{t.address}</span></div>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-b">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="text-xs text-slate-500">Users</div>
                        <div className="font-bold text-sm">{t.users_count ?? 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-xs text-slate-500">Rezervime</div>
                        <div className="font-bold text-sm">{t.reservations_count ?? 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="text-xs text-slate-500">Shërbime</div>
                        <div className="font-bold text-sm">{t.services_count ?? 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="text-xs text-slate-500">Revenue</div>
                        <div className="font-bold text-sm text-emerald-600">{formatCurrency(t.revenue_total ?? 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Link href={`/admin/tenants/${t.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2" size="sm">
                        Detajet <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => window.open(`/book/${t.slug}`, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nuk ka biznese që përputhen me filtrat</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" /> Krijo Biznesin e Parë
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
