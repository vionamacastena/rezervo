"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  client_id: z.string().min(1, "Zgjidh klientin"),
  starts_at: z.string().min(1, "Data e fillimit kërkohet"),
  ends_at: z.string().min(1, "Data e mbarimit kërkohet"),
  guests_count: z.coerce.number().min(1).max(500),
  resource: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  total_price: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: any;
  defaultDate?: Date;
}

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservation,
  defaultDate,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!reservation;

  const { data: clientsData } = useQuery({
    queryKey: ["clients-for-select"],
    queryFn: async () => {
      const { data } = await apiClient.get("/clients", {
        params: { per_page: 200 },
      });
      return data.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: "",
      starts_at: "",
      ends_at: "",
      guests_count: 2,
      resource: "",
      notes: "",
      total_price: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (reservation) {
        reset({
          client_id: String(reservation.client_id),
          starts_at: reservation.starts_at?.slice(0, 16) ?? "",
          ends_at: reservation.ends_at?.slice(0, 16) ?? "",
          guests_count: reservation.guests_count,
          resource: reservation.resource ?? "",
          notes: reservation.notes ?? "",
          total_price: Number(reservation.total_price),
        });
      } else {
        // Përdor defaultDate nëse ekziston
        const baseDate = defaultDate ?? new Date();
        const startsAt = new Date(baseDate);
        startsAt.setHours(9, 0, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setHours(startsAt.getHours() + 1);

        const formatLocal = (d: Date) => {
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        reset({
          client_id: "",
          starts_at: formatLocal(startsAt),
          ends_at: formatLocal(endsAt),
          guests_count: 1,
          resource: "",
          notes: "",
          total_price: 0,
        });
      }
    }
  }, [open, reservation, defaultDate, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        client_id: Number(data.client_id),
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
      };
      if (isEdit) {
        const { data: res } = await apiClient.put(
          `/reservations/${reservation.id}`,
          payload,
        );
        return res;
      }
      const { data: res } = await apiClient.post("/reservations", payload);
      return res;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Rezervimi u përditësua" : "Rezervimi u krijua");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gabim");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ndrysho rezervimin" : "Rezervim i ri"}
          </DialogTitle>
          <DialogDescription>Plotëso detajet e rezervimit</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Klienti *</Label>
            <Select
              value={watch("client_id")}
              onValueChange={(v) => setValue("client_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Zgjidh klientin" />
              </SelectTrigger>
              <SelectContent>
                {clientsData?.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.full_name} — {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-xs text-destructive">
                {errors.client_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fillimi *</Label>
              <Input type="datetime-local" {...register("starts_at")} />
              {errors.starts_at && (
                <p className="text-xs text-destructive">
                  {errors.starts_at.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Mbarimi *</Label>
              <Input type="datetime-local" {...register("ends_at")} />
              {errors.ends_at && (
                <p className="text-xs text-destructive">
                  {errors.ends_at.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mysafirë *</Label>
              <Input type="number" min="1" {...register("guests_count")} />
            </div>
            <div className="space-y-2">
              <Label>Burimi / Salla</Label>
              <Input placeholder="Salla A" {...register("resource")} />
            </div>
            <div className="space-y-2">
              <Label>Çmimi (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("total_price")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Shënime</Label>
            <Textarea rows={3} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Anulo
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Ruaj" : "Krijo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
