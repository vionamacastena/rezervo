"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Search, Pencil, Trash2, Clock, Package,
  Power, PowerOff,
} from "lucide-react";

import { servicesApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api/utils";
import { ServiceFormDialog } from "@/components/forms/service-form-dialog";

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["services", search],
    queryFn: async () => {
      const { data } = await servicesApi.list({ search: search || undefined });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicesApi.delete(id),
    onSuccess: () => {
      toast.success("Shërbimi u fshi");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: any) => servicesApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shërbimet</h1>
          <p className="text-slate-500 mt-1">
            Menaxho shërbimet që klientët mund të rezervojnë
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Shto Shërbim
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Kërko shërbim..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : data?.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.map((s: any) => (
                <Card key={s.id} className={`border-2 transition-all ${s.is_active ? "border-slate-200" : "border-dashed border-slate-300 opacity-60"}`}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                          {s.category && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {s.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!s.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Joaktiv</Badge>
                      )}
                    </div>

                    {s.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {s.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mb-4 text-xs">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" /> {s.duration_minutes} min
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(s.price, s.currency)}
                      </span>
                    </div>

                    <div className="flex gap-1 pt-3 border-t">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="flex-1 gap-1 text-xs">
                        <Pencil className="w-3 h-3" /> Ndrysho
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        title={s.is_active ? "Çaktivizo" : "Aktivizo"}
                        onClick={() => toggleMutation.mutate({ id: s.id, is_active: !s.is_active })}
                      >
                        {s.is_active ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        onClick={() => confirm(`Fshij "${s.name}"?`) && deleteMutation.mutate(s.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">Nuk ka shërbime</p>
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" /> Shto Shërbimin e Parë
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />
    </div>
  );
}
