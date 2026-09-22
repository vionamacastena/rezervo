"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CalendarCheck,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/api/utils";

interface DashboardData {
  reservations: {
    total: number;
    confirmed: number;
    today: number;
    this_month: number;
  };
  clients: { total: number; this_month: number };
  revenue: { this_month: number; today: number };
  inventory: { low_stock: number };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/dashboard");
      return data;
    },
  });

  const kpi = data?.data;

  const cards = [
    {
      label: "Rezervime sot",
      value: kpi?.reservations.today ?? 0,
      icon: Clock,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Konfirmuara",
      value: kpi?.reservations.confirmed ?? 0,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Klientë gjithsej",
      value: kpi?.clients.total ?? 0,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Të ardhura këtë muaj",
      value: formatCurrency(kpi?.revenue.this_month ?? 0),
      icon: DollarSign,
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Përmbledhje e aktivitetit të biznesit tuaj
          </p>
        </div>
        <Link href="/reservations">
          <Button className="gap-2">
            <CalendarCheck className="w-4 h-4" /> Rezervim i ri
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      {c.label}
                    </p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-24 mt-2" />
                    ) : (
                      <p className="text-3xl font-bold tracking-tight mt-2">
                        {c.value}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {kpi?.inventory.low_stock ? (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-orange-900">
                {kpi.inventory.low_stock} artikuj nën pragun minimal
              </p>
              <p className="text-sm text-orange-700">
                Kontrolloni inventarin për të rimbushur stokun
              </p>
            </div>
            <Link href="/inventory">
              <Button variant="outline" size="sm" className="gap-2">
                Shiko <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Të ardhura sot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold text-emerald-600 tracking-tight">
                {formatCurrency(kpi?.revenue.today ?? 0)}
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Live
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Përditësohet automatikisht
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Rezervime këtë muaj
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 tracking-tight">
              {kpi?.reservations.this_month ?? 0}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Totali i rezervimeve nga fillimi i muajit
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Veprime të shpejta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Link href="/reservations">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
              <CalendarCheck className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-medium text-sm">Rezervim i ri</div>
              <div className="text-xs text-slate-500 mt-1">
                Krijo rezervim
              </div>
            </div>
          </Link>
          <Link href="/clients">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer">
              <Users className="w-6 h-6 text-purple-600 mb-2" />
              <div className="font-medium text-sm">Shto klient</div>
              <div className="text-xs text-slate-500 mt-1">
                Regjistro klient të ri
              </div>
            </div>
          </Link>
          <Link href="/payments">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer">
              <DollarSign className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="font-medium text-sm">Regjistro pagesë</div>
              <div className="text-xs text-slate-500 mt-1">
                Shto pagesë
              </div>
            </div>
          </Link>
          <Link href="/reports">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all cursor-pointer">
              <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
              <div className="font-medium text-sm">Raporte</div>
              <div className="text-xs text-slate-500 mt-1">
                Shiko analitikën
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
