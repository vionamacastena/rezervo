"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Power, PowerOff } from "lucide-react";

import { servicesApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Shërbimet</h1>
          <p className="text-sm text-slate-500 mt-1">Shërbimet që klientët mund të rezervojnë</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 gap-2 h-9" size="sm">
          <Plus className="w-3.5 h-3.5" /> Shto Shërbim
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Kërko shërbim..."
          className="pl-9 h-9 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Emri</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Kategoria</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Kohëzgjatja</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Çmimi</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-center">Statusi</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((s: any) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.category || "—"}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">
                    {s.duration_minutes} min
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                    {formatCurrency(s.price, s.currency)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {s.is_active ? "Aktiv" : "Joaktiv"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-0.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: s.id, is_active: !s.is_active })}
                        className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                        title={s.is_active ? "Çaktivizo" : "Aktivizo"}
                      >
                        {s.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => confirm(`Fshij "${s.name}"?`) && deleteMutation.mutate(s.id)}
                        className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            Nuk ka shërbime. Krijo shërbimin e parë.
          </div>
        )}
      </div>

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />
    </div>
  );
}
