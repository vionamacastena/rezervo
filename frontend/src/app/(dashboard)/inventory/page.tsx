"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";

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
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      quantity: 0,
      min_threshold: 0,
      unit: "piece",
      unit_price: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (d: FormData) => {
      if (editing) {
        await apiClient.put(`/inventory/${editing.id}`, d);
      } else {
        await apiClient.post("/inventory", d);
      }
    },
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/inventory/${id}`);
    },
    onSuccess: () => {
      toast.success("U fshi");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({
      name: "",
      sku: "",
      category: "",
      quantity: 0,
      min_threshold: 0,
      unit: "piece",
      unit_price: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (i: any) => {
    setEditing(i);
    form.reset({
      name: i.name,
      sku: i.sku ?? "",
      category: i.category ?? "",
      quantity: i.quantity,
      min_threshold: i.min_threshold,
      unit: i.unit,
      unit_price: i.unit_price ?? 0,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventar</h1>
          <p className="text-muted-foreground mt-1">Menaxho stokun</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Shto artikull
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="text-right">Sasia</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Vlera</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length ? (
                  data.data.map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {i.name}
                        {i.is_low_stock && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {i.sku || "—"}
                      </TableCell>
                      <TableCell>{i.category || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={i.is_low_stock ? "destructive" : "secondary"}
                        >
                          {i.quantity} {i.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {i.min_threshold}
                      </TableCell>
                      <TableCell className="text-right">
                        {i.total_value ? formatCurrency(i.total_value) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(i)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirm("Fshij?") && deleteMutation.mutate(i.id)
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
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nuk ka artikuj
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
              {editing ? "Ndrysho artikullin" : "Shto artikull"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Emri *</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input {...form.register("sku")} />
              </div>
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Input {...form.register("category")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sasia *</Label>
                <Input type="number" {...form.register("quantity")} />
              </div>
              <div className="space-y-2">
                <Label>Pragu min *</Label>
                <Input type="number" {...form.register("min_threshold")} />
              </div>
              <div className="space-y-2">
                <Label>Njësia *</Label>
                <Input {...form.register("unit")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Çmimi/njësi (€)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("unit_price")}
              />
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
