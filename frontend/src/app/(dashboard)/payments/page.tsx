"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2, Trash2 } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  formatCurrency, formatDate, PAYMENT_METHOD_LABELS,
} from "@/lib/api/utils";

const schema = z.object({
  reservation_id: z.string().min(1, "Zgjidh rezervimin"),
  amount: z.coerce.number().min(0.01),
  method: z.enum(["cash", "card", "bank_transfer", "online", "other"]),
  payment_date: z.string().min(1),
  notes: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await apiClient.get("/payments", { params: { per_page: 50 } });
      return data.data;
    },
  });

  const { data: reservations } = useQuery({
    queryKey: ["reservations-for-payment"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reservations", { params: { per_page: 200 } });
      return data.data.data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reservation_id: "",
      amount: 0,
      method: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (d: FormData) =>
      apiClient.post("/payments", { ...d, reservation_id: Number(d.reservation_id) }),
    onSuccess: () => {
      toast.success("Pagesa u regjistrua");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/payments/${id}`),
    onSuccess: () => {
      toast.success("Pagesa u fshi");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Pagesa</h1>
          <p className="text-sm text-slate-500 mt-1">Regjistro dhe shiko pagesat</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 gap-2 h-9"
          size="sm"
        >
          <Plus className="w-3.5 h-3.5" /> Pagesë e re
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
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Payment ID</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Rezervimi</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Data</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Metoda</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Shuma</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.payment_id}</td>
                  <td className="px-5 py-3 text-slate-900">{p.reservation?.code ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(p.payment_date)}</td>
                  <td className="px-5 py-3 text-slate-600">{PAYMENT_METHOD_LABELS[p.method]}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      disabled={!p.is_deletable}
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                      title={p.is_deletable ? "Fshij" : "Nuk mund të fshihet (>24h)"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">Nuk ka pagesa</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Regjistro pagesë</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Rezervimi *</Label>
              <select
                {...form.register("reservation_id")}
                className="w-full h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Zgjidh...</option>
                {reservations?.filter((r: any) => !["cancelled"].includes(r.status)).map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.client?.full_name} ({r.total_price} {r.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Shuma (€) *</Label>
                <Input type="number" step="0.01" {...form.register("amount")} />
              </div>
              <div className="space-y-2">
                <Label>Metoda *</Label>
                <select
                  {...form.register("method")}
                  className="w-full h-9 px-3 text-sm rounded-md border border-slate-200 bg-white"
                >
                  <option value="cash">Kesh</option>
                  <option value="card">Kartë</option>
                  <option value="bank_transfer">Transfert</option>
                  <option value="online">Online</option>
                  <option value="other">Tjetër</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" {...form.register("payment_date")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} size="sm">
                Anulo
              </Button>
              <Button type="submit" disabled={mutation.isPending} size="sm" className="bg-slate-900">
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Regjistro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
