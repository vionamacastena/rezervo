"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const clientSchema = z.object({
  first_name: z.string().min(1, "Emri kërkohet").max(100),
  last_name: z.string().min(1, "Mbiemri kërkohet").max(100),
  email: z.string().email("Email nuk është valid").optional().or(z.literal("")),
  phone: z.string().min(5, "Telefoni kërkohet").max(30),
  birth_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type ClientForm = z.infer<typeof clientSchema>;

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  birth_date: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormDialog({ open, onOpenChange, client }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!client;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      birth_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        first_name: client?.first_name ?? "",
        last_name: client?.last_name ?? "",
        email: client?.email ?? "",
        phone: client?.phone ?? "",
        birth_date: client?.birth_date ?? "",
        notes: client?.notes ?? "",
      });
    }
  }, [open, client, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      if (isEdit && client) {
        const { data: res } = await apiClient.put(
          `/clients/${client.id}`,
          data,
        );
        return res;
      }
      const { data: res } = await apiClient.post("/clients", data);
      return res;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Klienti u përditësua" : "Klienti u krijua");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Gabim";
      toast.error(msg);
    },
  });

  const onSubmit = (data: ClientForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ndrysho klientin" : "Shto klient"}
          </DialogTitle>
          <DialogDescription>
            Plotëso informacionin e klientit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Emri *</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && (
                <p className="text-xs text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Mbiemri *</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && (
                <p className="text-xs text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoni *</Label>
            <Input
              id="phone"
              placeholder="+383 44 123 456"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Datëlindja</Label>
            <Input id="birth_date" type="date" {...register("birth_date")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Shënime</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
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
