"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { servicesApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(2, "Emri kërkohet").max(150),
  description: z.string().max(1000).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().min(5, "Minimum 5 min").max(480),
  price: z.coerce.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ngjyra duhet #RRGGBB"),
  category: z.string().max(100).optional().or(z.literal("")),
  is_active: z.boolean(),
  sort_order: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#EF4444", "#06B6D4", "#84CC16",
];

export function ServiceFormDialog({
  open, onOpenChange, service,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service?: any;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!service;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", description: "", duration_minutes: 30, price: 0,
      color: COLORS[0], category: "", is_active: true, sort_order: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name ?? "",
        description: service?.description ?? "",
        duration_minutes: service?.duration_minutes ?? 30,
        price: Number(service?.price ?? 0),
        color: service?.color ?? COLORS[0],
        category: service?.category ?? "",
        is_active: service?.is_active ?? true,
        sort_order: service?.sort_order ?? 0,
      });
    }
  }, [open, service, form]);

  const mutation = useMutation({
    mutationFn: (d: FormData) =>
      isEdit ? servicesApi.update(service.id, d) : servicesApi.create(d),
    onSuccess: () => {
      toast.success(isEdit ? "Shërbimi u përditësua" : "Shërbimi u krijua");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ndrysho shërbimin" : "Shërbim i ri"}</DialogTitle>
          <DialogDescription>
            Konfiguro detajet e shërbimit që klientët mund të rezervojnë.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label>Emri *</Label>
            <Input placeholder="p.sh. Prerje flokësh" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Përshkrimi</Label>
            <Textarea rows={2} placeholder="Detaje opsionale..." {...form.register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kohëzgjatja (min) *</Label>
              <Input type="number" min="5" step="5" {...form.register("duration_minutes")} />
              {form.formState.errors.duration_minutes && (
                <p className="text-xs text-red-500">{form.formState.errors.duration_minutes.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Çmimi (€) *</Label>
              <Input type="number" step="0.01" min="0" {...form.register("price")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Input placeholder="p.sh. Prerje" {...form.register("category")} />
            </div>
            <div className="space-y-2">
              <Label>Renditja</Label>
              <Input type="number" min="0" {...form.register("sort_order")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ngjyra</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => form.setValue("color", c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.watch("color") === c
                      ? "border-slate-900 scale-110"
                      : "border-slate-200"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...form.register("is_active")} className="rounded" />
            <span className="text-sm">Aktiv (i dukshëm për klientët)</span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Anulo
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Ruaj" : "Krijo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
