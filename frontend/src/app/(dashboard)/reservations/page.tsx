"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CheckCircle, XCircle, Pencil, Search, Copy } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReservationFormDialog } from "@/components/forms/reservation-form-dialog";
import {
  formatCurrency,
  formatDateTime,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/api/utils";

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
      const { data } = await apiClient.post(
        `/reservations/${id}/${action}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Statusi u ndryshua");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/reservations/${id}/duplicate`);
    },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rezervime</h1>
          <p className="text-muted-foreground mt-1">Menaxho rezervimet</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Rezervim i ri
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kërko kod, burim..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="tentative">Tentativ</SelectItem>
                <SelectItem value="confirmed">Konfirmuar</SelectItem>
                <SelectItem value="completed">Përfunduar</SelectItem>
                <SelectItem value="cancelled">Anuluar</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  <TableHead>Kodi</TableHead>
                  <TableHead>Klienti</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Burimi</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead className="text-right">Çmimi</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length ? (
                  data.data.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {r.code}
                      </TableCell>
                      <TableCell>{r.client?.full_name ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(r.starts_at)}
                      </TableCell>
                      <TableCell>{r.resource || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[r.status]}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(r.total_price, r.currency)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {r.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Konfirmo"
                            onClick={() =>
                              actionMutation.mutate({
                                id: r.id,
                                action: "confirm",
                              })
                            }
                          >
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {r.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Përfundo"
                            onClick={() =>
                              actionMutation.mutate({
                                id: r.id,
                                action: "complete",
                              })
                            }
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {!["cancelled", "completed"].includes(r.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Anulo"
                            onClick={() => handleCancel(r)}
                          >
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Dupliko"
                          onClick={() => duplicateMutation.mutate(r.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ndrysho"
                          onClick={() => {
                            setEditing(r);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
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
                      Nuk ka rezervime
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReservationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reservation={editing}
      />
    </div>
  );
}
