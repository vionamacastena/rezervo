"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/api/utils";

const schema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0),
  min_threshold: z.coerce.number().min(0),
  unit: z.string().min(1),
  unit_price: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await apiClient.get("/inventory");
      return data.data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", sku: "", category: "", quantity: 0, min_threshold: 0, unit: "piece", unit_price: 0 },
  });

  const mutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? apiClient.put(`/inventory/${editing.id}`, d) : apiClient.post("/inventory", d),
    onSuccess: () => {
      toast.success(editing ? "U përditësua" : "U shtua");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setDialogOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/inventory/${id}`),
    onSuccess: () => {
      toast.success("U fshi");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ name: "", sku: "", category: "", quantity: 0, min_threshold: 0, unit: "piece", unit_price: 0 });
    setDialogOpen(true);
  };

  const openEdit = (i: any) => {
    setEditing(i);
    form.reset({
      name: i.name, sku: i.sku ?? "", category: i.category ?? "",
      quantity: i.quantity, min_threshold: i.min_threshold,
      unit: i.unit, unit_price: i.unit_price ?? 0,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Inventar</h1>
          <p className="text-sm text-slate-500 mt-1">Menaxho stokun</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 gap-2 h-9" size="sm">
          <Plus className="w-3.5 h-3.5" /> Shto artikull
        </Button>
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
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Kategoria</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Sasia</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Min</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Vlera</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((i: any) => (
                <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{i.name}</span>
                      {i.is_low_stock && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{i.category || "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span className={i.is_low_stock ? "text-amber-600 font-medium" : "text-slate-600"}>
                      {i.quantity} {i.unit}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500 tabular-nums">{i.min_threshold}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">
                    {i.total_value ? formatCurrency(i.total_value) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-0.5">
                      <button onClick={() => openEdit(i)} className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => confirm("Fshij?") && deleteMutation.mutate(i.id)} className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">Nuk ka artikuj</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ndrysho artikullin" : "Shto artikull"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2"><Label>Emri *</Label><Input {...form.register("name")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>SKU</Label><Input {...form.register("sku")} /></div>
              <div className="space-y-2"><Label>Kategoria</Label><Input {...form.register("category")} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Sasia *</Label><Input type="number" {...form.register("quantity")} /></div>
              <div className="space-y-2"><Label>Min *</Label><Input type="number" {...form.register("min_threshold")} /></div>
              <div className="space-y-2"><Label>Njësia *</Label><Input {...form.register("unit")} /></div>
            </div>
            <div className="space-y-2"><Label>Çmimi/njësi (€)</Label><Input type="number" step="0.01" {...form.register("unit_price")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} size="sm">Anulo</Button>
              <Button type="submit" disabled={mutation.isPending} size="sm" className="bg-slate-900">
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ruaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
