"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      hourly_rate: 0,
      is_active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (d: FormData) => {
      if (editing) {
        await apiClient.put(`/staff/${editing.id}`, d);
      } else {
        await apiClient.post("/staff", d);
      }
    },
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/staff/${id}`);
    },
    onSuccess: () => {
      toast.success("U fshi");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      hourly_rate: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    form.reset({
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email ?? "",
      phone: s.phone ?? "",
      position: s.position ?? "",
      hourly_rate: s.hourly_rate ?? 0,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staf</h1>
          <p className="text-muted-foreground mt-1">Menaxho punonjësit</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Shto punonjës
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead>Pozicioni</TableHead>
                  <TableHead>Telefoni</TableHead>
                  <TableHead>Tarifa/h</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length ? (
                  data.data.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.full_name}
                      </TableCell>
                      <TableCell>{s.position || "—"}</TableCell>
                      <TableCell>{s.phone || "—"}</TableCell>
                      <TableCell>
                        {s.hourly_rate ? formatCurrency(s.hourly_rate) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "default" : "secondary"}>
                          {s.is_active ? "Aktiv" : "Joaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirm("Fshij?") && deleteMutation.mutate(s.id)
                          }
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nuk ka punonjës
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ndrysho punonjësin" : "Shto punonjës"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emri *</Label>
                <Input {...form.register("first_name")} />
              </div>
              <div className="space-y-2">
                <Label>Mbiemri *</Label>
                <Input {...form.register("last_name")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label>Telefoni</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pozicioni</Label>
                <Input {...form.register("position")} />
              </div>
              <div className="space-y-2">
                <Label>Tarifa/h (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("hourly_rate")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Anulo
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ruaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
