"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Check, X, Copy, Pencil } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationFormDialog } from "@/components/forms/reservation-form-dialog";
import {
  formatCurrency, formatDateTime, STATUS_LABELS,
} from "@/lib/api/utils";

const STATUS_DOT: Record<string, string> = {
  draft: "bg-slate-400",
  tentative: "bg-amber-500",
  confirmed: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", search, status],
    queryFn: async () => {
      const { data } = await apiClient.get("/reservations", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          per_page: 50,
        },
      });
      return data.data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, reason }: any) => {
      const body = action === "cancel" ? { reason } : {};
      await apiClient.post(`/reservations/${id}/${action}`, body);
    },
    onSuccess: () => {
      toast.success("Statusi u ndryshua");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/reservations/${id}/duplicate`),
    onSuccess: () => {
      toast.success("Rezervimi u duplikua");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  const handleCancel = (r: any) => {
    const reason = prompt("Arsyeja e anulimit:");
    if (reason && reason.trim().length >= 3) {
      actionMutation.mutate({ id: r.id, action: "cancel", reason });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Rezervime</h1>
          <p className="text-sm text-slate-500 mt-1">Menaxho rezervimet e biznesit</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="bg-slate-900 hover:bg-slate-800 gap-2 h-9"
          size="sm"
        >
          <Plus className="w-3.5 h-3.5" /> Rezervim i ri
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Kërko kod, klient..."
            className="pl-9 h-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          <option value="all">Të gjitha</option>
          <option value="draft">Draft</option>
          <option value="tentative">Tentativ</option>
          <option value="confirmed">Konfirmuar</option>
          <option value="completed">Përfunduar</option>
          <option value="cancelled">Anuluar</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.data?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Kodi</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Klienti</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Data</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Statusi</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Çmimi</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.code}</td>
                  <td className="px-5 py-3 text-slate-900 font-medium">{r.client?.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{formatDateTime(r.starts_at)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-900 font-medium tabular-nums">
                    {formatCurrency(r.total_price, r.currency)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-0.5">
                      {r.status === "draft" && (
                        <button
                          onClick={() => actionMutation.mutate({ id: r.id, action: "confirm" })}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                          title="Konfirmo"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {r.status === "confirmed" && (
                        <button
                          onClick={() => actionMutation.mutate({ id: r.id, action: "complete" })}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                          title="Përfundo"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!["cancelled", "completed"].includes(r.status) && (
                        <button
                          onClick={() => handleCancel(r)}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-red-600"
                          title="Anulo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => duplicateMutation.mutate(r.id)}
                        className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                        title="Dupliko"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditing(r); setDialogOpen(true); }}
                        className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"
                        title="Ndrysho"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            Nuk ka rezervime
          </div>
        )}
      </div>

      <ReservationFormDialog open={dialogOpen} onOpenChange={setDialogOpen} reservation={editing} />
    </div>
  );
}
