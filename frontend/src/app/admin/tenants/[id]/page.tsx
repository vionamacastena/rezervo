"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Users,
  CalendarCheck,
  DollarSign,
  Package,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Play,
  Pause,
  Crown,
  UserCog,
  Receipt,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDateTime,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/api/utils";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: "Aktiv", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  suspended: { label: "Pezulluar", class: "bg-red-100 text-red-700 border-red-200" },
  trial: { label: "Trial", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenant", tenantId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/tenants/${tenantId}`);
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await apiClient.patch(
        `/admin/tenants/${tenantId}/status`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Statusi u përditësua");
      queryClient.invalidateQueries({ queryKey: ["admin-tenant", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: () => toast.error("Gabim gjatë përditësimit"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { tenant, stats, recent_reservations, services, users } = data;
  const cfg = STATUS_CONFIG[tenant.status] ?? STATUS_CONFIG.active;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/tenants")}
        className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Kthehu në lista
      </button>

      {/* Header */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                <div className="text-sm text-slate-300 font-mono">{tenant.slug}</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <Badge variant="outline" className={cfg.class}>
                    {cfg.label}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                    Krijur: {new Date(tenant.created_at).toLocaleDateString("sq-AL")}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => window.open(`/book/${tenant.slug}`, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Public Booking
              </Button>

              {tenant.status === "active" ? (
                <Button
                  variant="outline"
                  className="bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                  onClick={() => statusMutation.mutate("suspended")}
                  disabled={statusMutation.isPending}
                >
                  <Pause className="w-4 h-4 mr-2" /> Pezullo
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="bg-emerald-500/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30"
                  onClick={() => statusMutation.mutate("active")}
                  disabled={statusMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" /> Aktivizo
                </Button>
              )}
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10 text-sm">
            {tenant.email && (
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4" /> {tenant.email}
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4" /> {tenant.phone}
              </div>
            )}
            {tenant.address && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4" /> {tenant.address}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Të Ardhura Totale</div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.revenue_total)}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Rezervime Konfirmuara</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.reservations_confirmed}
              </div>
            </div>
            <CalendarCheck className="w-8 h-8 text-blue-500/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Të Përfunduara</div>
              <div className="text-2xl font-bold text-emerald-600">
                {stats.reservations_completed}
              </div>
            </div>
            <Crown className="w-8 h-8 text-emerald-500/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Të Anuluara</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.reservations_cancelled}
              </div>
            </div>
            <Receipt className="w-8 h-8 text-red-500/30" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reservations">
        <TabsList>
          <TabsTrigger value="reservations" className="gap-2">
            <CalendarCheck className="w-4 h-4" /> Rezervimet e Fundit
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Package className="w-4 h-4" /> Shërbimet ({services.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> Përdoruesit ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Reservations */}
        <TabsContent value="reservations">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kodi</TableHead>
                    <TableHead>Klienti</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Statusi</TableHead>
                    <TableHead className="text-right">Shuma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent_reservations?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>
                        {r.client
                          ? `${r.client.first_name} ${r.client.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(r.starts_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[r.status]}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(r.total_price, r.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services">
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{s.name}</div>
                      {s.description && (
                        <div className="text-xs text-slate-500 mt-1">
                          {s.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-500">
                          {s.duration_minutes} min
                        </span>
                        <span className="font-bold text-slate-700">
                          {formatCurrency(s.price, s.currency)}
                        </span>
                        {s.category && (
                          <Badge variant="outline" className="text-[10px]">
                            {s.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emri</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rolet</TableHead>
                    <TableHead>Statusi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles?.map((r: any) => (
                            <Badge
                              key={r.id}
                              variant="outline"
                              className="capitalize text-[10px]"
                            >
                              {r.name.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.status === "active" ? "default" : "secondary"}
                        >
                          {u.status === "active" ? "Aktiv" : "Joaktiv"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
