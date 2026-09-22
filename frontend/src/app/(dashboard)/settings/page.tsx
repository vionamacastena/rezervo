"use client";

import { useAuthStore } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, User, Clock, Mail, Phone, MapPin, Globe } from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data.user;
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Cilësimet</h1>
        <p className="text-muted-foreground mt-1">
          Informacion i llogarisë dhe biznesit
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" /> Profili
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{data?.name || user?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{data?.email || user?.email}</span>
                </div>
                {data?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{data.phone}</span>
                  </div>
                )}
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-2">Rolet</div>
                  <div className="flex gap-2 flex-wrap">
                    {data?.roles?.map((r: any) => (
                      <Badge key={r.id} variant="outline" className="capitalize">
                        {r.name.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Business */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" /> Biznesi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{data?.tenant?.name}</span>
                </div>
                {data?.tenant?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{data.tenant.email}</span>
                  </div>
                )}
                {data?.tenant?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{data.tenant.phone}</span>
                  </div>
                )}
                {data?.tenant?.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{data.tenant.address}</span>
                  </div>
                )}
                {data?.tenant?.timezone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{data.tenant.timezone}</span>
                  </div>
                )}
                {data?.tenant?.currency && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>Monedha: {data.tenant.currency}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
