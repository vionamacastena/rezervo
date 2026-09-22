"use client";

import { useAuthStore } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data.user;
    },
  });

  const Row = ({ label, value }: { label: string; value: any }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      {isLoading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span className="text-sm text-slate-900">{value || "—"}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Cilësimet</h1>
        <p className="text-sm text-slate-500 mt-1">Informacion i llogarisë dhe biznesit</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-900">Profili</h2>
          </div>
          <div className="px-5">
            <Row label="Emri" value={data?.name || user?.name} />
            <Row label="Email" value={data?.email || user?.email} />
            <Row label="Telefoni" value={data?.phone} />
            <Row
              label="Rolet"
              value={
                data?.roles?.length
                  ? data.roles.map((r: any) => r.name.replace("_", " ")).join(", ")
                  : "—"
              }
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-900">Biznesi</h2>
          </div>
          <div className="px-5">
            <Row label="Emri" value={data?.tenant?.name} />
            <Row label="Slug" value={data?.tenant?.slug} />
            <Row label="Timezone" value={data?.tenant?.timezone} />
            <Row label="Currency" value={data?.tenant?.currency} />
            <Row label="Adresa" value={data?.tenant?.address} />
          </div>
        </div>
      </div>
    </div>
  );
}
