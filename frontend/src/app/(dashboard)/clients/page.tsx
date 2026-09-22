"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClientFormDialog } from "@/components/forms/client-form-dialog";

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string;
  reservations_count?: number;
  created_at: string;
}

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      const { data } = await apiClient.get("/clients", {
        params: { search: search || undefined, per_page: 50 },
      });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      toast.success("Klienti u fshi");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gabim");
    },
  });

  const handleDelete = (client: Client) => {
    if (confirm(`Fshij klientin "${client.full_name}"?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Klientë</h1>
          <p className="text-muted-foreground mt-1">
            Menaxho klientët e biznesit tënd
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Shto klient
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Kërko emër, telefon, email..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  <TableHead>Emri</TableHead>
                  <TableHead>Telefoni</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Rezervime</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length ? (
                  data.data.map((c: Client) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.full_name}
                      </TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.email || "—"}</TableCell>
                      <TableCell className="text-center">
                        {c.reservations_count ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(c)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nuk ka klientë
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
      />
    </div>
  );
}
