"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      const { data } = await apiClient.get("/clients", {
        params: { search: search || undefined, per_page: 50 },
      });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/clients/${id}`),
    onSuccess: () => {
      toast.success("Klienti u fshi");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Klientë</h1>
          <p className="text-sm text-slate-500 mt-1">Menaxho klientët e biznesit</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 gap-2 h-9" size="sm">
          <Plus className="w-3.5 h-3.5" /> Shto klient
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Kërko emër, telefon, email..."
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
        ) : data?.data?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Emri</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Telefoni</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Email</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Rezervime</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{c.full_name}</td>
                  <td className="px-5 py-3 text-slate-600">{c.phone}</td>
                  <td className="px-5 py-3 text-slate-500">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">
                    {c.reservations_count ?? 0}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-0.5">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirm(`Fshij "${c.full_name}"?`) && deleteMutation.mutate(c.id)}
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
          <div className="py-16 text-center text-sm text-slate-500">Nuk ka klientë</div>
        )}
      </div>

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
    </div>
  );
}
