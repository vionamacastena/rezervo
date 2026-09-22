"use client";

import { useAuthStore } from "@/lib/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, ShieldCheck } from "lucide-react";

export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cilësimet</h1>
        <p className="text-slate-500 mt-1">Profili i Super Admin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Profili
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <div className="flex gap-1">
              {user?.roles?.map((r) => (
                <Badge
                  key={r.id}
                  variant="outline"
                  className="capitalize bg-orange-50 text-orange-700 border-orange-200"
                >
                  {r.name.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
