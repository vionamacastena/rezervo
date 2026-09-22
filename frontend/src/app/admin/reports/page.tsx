"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Wrench } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporte Globale</h1>
        <p className="text-slate-500 mt-1">Analitika e platformës</p>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-lg">Në zhvillim</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Raporte globale: MRR, churn, growth, aktiviteti ditor, top performing businesses.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400">
            <Wrench className="w-3 h-3" /> Coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
