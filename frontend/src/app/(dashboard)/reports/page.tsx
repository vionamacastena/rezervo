"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api/utils";

const TABS = [
  { key: "revenue", label: "Të ardhura" },
  { key: "outstanding", label: "Pambyllur" },
  { key: "inventory", label: "Inventar" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState("revenue");
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { data: revenue, isLoading: loadRev } = useQuery({
    queryKey: ["revenue", from, to],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/revenue", { params: { from, to } });
      return data.data;
    },
    enabled: tab === "revenue",
  });

  const { data: outstanding } = useQuery({
    queryKey: ["outstanding"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/outstanding");
      return data.data;
    },
    enabled: tab === "outstanding",
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory-status"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory-status");
      return data.data;
    },
    enabled: tab === "inventory",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Raporte</h1>
        <p className="text-sm text-slate-500 mt-1">Analitika e biznesit</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div>
              <label className="text-xs text-slate-500 mr-2">Nga</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mr-2">Deri</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-lg bg-white p-5">
              <p className="text-xs text-slate-500 mb-2">Totali</p>
              {loadRev ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(revenue?.total ?? 0)}
                </p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm font-medium text-slate-900">Sipas metodës</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">Metoda</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Transaksione</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Totali</th>
                </tr>
              </thead>
              <tbody>
                {revenue?.by_method?.length ? revenue.by_method.map((m: any) => (
                  <tr key={m.method} className="border-b border-slate-50">
                    <td className="px-5 py-3 capitalize text-slate-700">{m.method}</td>
                    <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{m.count}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                      {formatCurrency(m.total)}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">Nuk ka transaksione</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "outstanding" && (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">Rezervime të pambyllura</h2>
            <span className="text-sm font-medium text-slate-900 tabular-nums">
              {formatCurrency(outstanding?.total_outstanding ?? 0)}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Kodi</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Klienti</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Total</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Paguar</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Mbetur</th>
              </tr>
            </thead>
            <tbody>
              {outstanding?.reservations?.length ? outstanding.reservations.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.code}</td>
                  <td className="px-5 py-3 text-slate-700">{r.client}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{formatCurrency(r.total_price)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{formatCurrency(r.paid)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                    {formatCurrency(r.balance)}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">Nuk ka saldo të pambyllura 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-lg bg-white p-5">
              <p className="text-xs text-slate-500 mb-2">Artikuj gjithsej</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {inventory?.summary?.total_items ?? 0}
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg bg-white p-5">
              <p className="text-xs text-slate-500 mb-2">Vlera totale</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {formatCurrency(inventory?.summary?.total_value ?? 0)}
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg bg-white p-5">
              <p className="text-xs text-slate-500 mb-2">Nën prag</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {inventory?.summary?.low_stock_count ?? 0}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm font-medium text-slate-900">Artikuj nën prag</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">Emri</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Sasia</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right">Min</th>
                </tr>
              </thead>
              <tbody>
                {inventory?.low_stock_items?.length ? inventory.low_stock_items.map((i: any) => (
                  <tr key={i.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-700">{i.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-amber-600 tabular-nums">
                      {i.quantity} {i.unit}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{i.min_threshold}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">Të gjitha artikujt OK 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
