"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  hourly_rate: z.coerce.number().min(0).optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await apiClient.get("/staff");
      return data.data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "", last_name: "", email: "", phone: "",
      position: "", hourly_rate: 0, is_active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? apiClient.put(`/staff/${editing.id}`, d) : apiClient.post("/staff", d),
    onSuccess: () => {
      toast.success(editing ? "U përditësua" : "U shtua");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setDialogOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/staff/${id}`),
    onSuccess: () => {
      toast.success("U fshi");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ first_name: "", last_name: "", email: "", phone: "", position: "", hourly_rate: 0, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    form.reset({
      first_name: s.first_name, last_name: s.last_name,
      email: s.email ?? "", phone: s.phone ?? "", position: s.position ?? "",
      hourly_rate: s.hourly_rate ?? 0, is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Staf</h1>
          <p className="text-sm text-slate-500 mt-1">Menaxho punonjësit</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 gap-2 h-9" size="sm">
          <Plus className="w-3.5 h-3.5" /> Shto punonjës
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
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Pozicioni</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Telefoni</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Tarifa/h</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-center">Statusi</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((s: any) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.full_name}</td>
                  <td className="px-5 py-3 text-slate-600">{s.position || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{s.phone || "—"}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">
                    {s.hourly_rate ? formatCurrency(s.hourly_rate) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {s.is_active ? "Aktiv" : "Joaktiv"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-0.5">
                      <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-slate-900">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => confirm("Fshij?") && deleteMutation.mutate(s.id)} className="w-7 h-7 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">Nuk ka punonjës</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ndrysho punonjësin" : "Shto punonjës"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Emri *</Label><Input {...form.register("first_name")} /></div>
              <div className="space-y-2"><Label>Mbiemri *</Label><Input {...form.register("last_name")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
              <div className="space-y-2"><Label>Telefoni</Label><Input {...form.register("phone")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Pozicioni</Label><Input {...form.register("position")} /></div>
              <div className="space-y-2"><Label>Tarifa/h (€)</Label><Input type="number" step="0.01" {...form.register("hourly_rate")} /></div>
            </div>
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
