"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency, formatDate } from "@/lib/api/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
  );
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { data: revenue, isLoading: loadRev } = useQuery({
    queryKey: ["revenue", from, to],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/revenue", {
        params: { from, to },
      });
      return data.data;
    },
  });

  const { data: outstanding } = useQuery({
    queryKey: ["outstanding"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/outstanding");
      return data.data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory-status"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory-status");
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Raporte</h1>
        <p className="text-muted-foreground mt-1">Analitika e biznesit</p>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Të ardhura</TabsTrigger>
          <TabsTrigger value="outstanding">Pambyllur</TabsTrigger>
          <TabsTrigger value="inventory">Inventar</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex gap-4">
              <div className="space-y-2 flex-1">
                <Label>Nga</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Deri</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Totali:{" "}
                {loadRev ? (
                  <Skeleton className="inline-block h-8 w-32" />
                ) : (
                  <span className="text-green-600">
                    {formatCurrency(revenue?.total ?? 0)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metoda</TableHead>
                    <TableHead className="text-right">Transaksione</TableHead>
                    <TableHead className="text-right">Totali</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenue?.by_method?.map((m: any) => (
                    <TableRow key={m.method}>
                      <TableCell className="capitalize">{m.method}</TableCell>
                      <TableCell className="text-right">{m.count}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(m.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>Rezervime të pambyllura</span>
                <span className="text-orange-600">
                  {formatCurrency(outstanding?.total_outstanding ?? 0)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kodi</TableHead>
                    <TableHead>Klienti</TableHead>
                    <TableHead className="text-right">Totali</TableHead>
                    <TableHead className="text-right">Paguar</TableHead>
                    <TableHead className="text-right">Mbetur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstanding?.reservations?.length ? (
                    outstanding.reservations.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">
                          {r.code}
                        </TableCell>
                        <TableCell>{r.client}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(r.total_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(r.paid)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-semibold">
                          {formatCurrency(r.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nuk ka saldo të pambyllura 🎉
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Artikuj gjithsej
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {inventory?.summary?.total_items ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Vlera totale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(inventory?.summary?.total_value ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Nën prag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {inventory?.summary?.low_stock_count ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Artikuj nën prag</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emri</TableHead>
                    <TableHead className="text-right">Sasia</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.low_stock_items?.length ? (
                    inventory.low_stock_items.map((i: any) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {i.quantity} {i.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {i.min_threshold}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Të gjitha artikujt kanë stok të mjaftueshëm 🎉
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
