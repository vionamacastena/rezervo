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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatDate,
  PAYMENT_METHOD_LABELS,
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
      const { data } = await apiClient.get("/payments", {
        params: { per_page: 50 },
      });
      return data.data;
    },
  });

  const { data: reservations } = useQuery({
    queryKey: ["reservations-for-payment"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reservations", {
        params: { per_page: 200 },
      });
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
    mutationFn: async (d: FormData) => {
      await apiClient.post("/payments", {
        ...d,
        reservation_id: Number(d.reservation_id),
      });
    },
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/payments/${id}`);
    },
    onSuccess: () => {
      toast.success("Pagesa u fshi");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pagesa</h1>
          <p className="text-muted-foreground mt-1">
            Regjistro dhe shiko pagesat
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Pagesë e re
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
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Rezervimi</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Metoda</TableHead>
                  <TableHead className="text-right">Shuma</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length ? (
                  data.data.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        {p.payment_id}
                      </TableCell>
                      <TableCell>{p.reservation?.code ?? "—"}</TableCell>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_METHOD_LABELS[p.method]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(p.amount, p.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!p.is_deletable}
                          onClick={() => deleteMutation.mutate(p.id)}
                          title={
                            p.is_deletable
                              ? "Fshij"
                              : "Nuk mund të fshihet (24h)"
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
                      Nuk ka pagesa
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Regjistro pagesë</DialogTitle>
            <DialogDescription>Shto pagesën për një rezervim</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Rezervimi *</Label>
              <Select
                value={form.watch("reservation_id")}
                onValueChange={(v) => form.setValue("reservation_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidh" />
                </SelectTrigger>
                <SelectContent>
                  {reservations
                    ?.filter((r: any) => !["cancelled"].includes(r.status))
                    .map((r: any) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.code} — {r.client?.full_name} ({r.total_price}{" "}
                        {r.currency})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shuma (€) *</Label>
                <Input type="number" step="0.01" {...form.register("amount")} />
              </div>
              <div className="space-y-2">
                <Label>Metoda *</Label>
                <Select
                  value={form.watch("method")}
                  onValueChange={(v: any) => form.setValue("method", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Kesh</SelectItem>
                    <SelectItem value="card">Kartë</SelectItem>
                    <SelectItem value="bank_transfer">Transfert</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="other">Tjetër</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" {...form.register("payment_date")} />
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
                Regjistro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

