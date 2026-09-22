"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Menaxher",
  receptionist: "Recepsionist",
  accountant: "Kontabilist",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, role, status],
    queryFn: async () => {
      const { data } = await adminApi.listUsers({
        search: search || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
      });
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      toast.success("Statusi u përditësua");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Përdoruesi u fshi");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: any) => adminApi.resetUserPassword(id, password),
    onSuccess: () => toast.success("Fjalëkalimi u rivendos"),
  });

  const handleReset = (u: any) => {
    const pwd = prompt(`Fjalëkalim i ri për ${u.name}:`);
    if (pwd && pwd.length >= 8) {
      resetPasswordMutation.mutate({ id: u.id, password: pwd });
    } else if (pwd) {
      toast.error("Minimum 8 karaktere");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Përdoruesit</h1>
        <p className="text-sm text-slate-500 mt-1">
          Të gjithë përdoruesit në platformë
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Kërko..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">Të gjitha rolet</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="receptionist">Recepsionist</option>
          <option value="accountant">Kontabilist</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">Të gjitha</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Joaktiv</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.data?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Emri</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Email</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Biznesi</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Roli</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500">Statusi</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3 text-slate-600">{u.tenant?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {u.roles?.[0] ? (ROLE_LABEL[u.roles[0].name] ?? u.roles[0].name) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {u.status === "active" ? "Aktiv" : "Joaktiv"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-8 h-8 rounded-md hover:bg-slate-100 inline-flex items-center justify-center text-slate-500">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleReset(u)}>
                          Reset fjalëkalimi
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            statusMutation.mutate({
                              id: u.id,
                              status: u.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          {u.status === "active" ? "Çaktivizo" : "Aktivizo"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => confirm(`Fshij ${u.name}?`) && deleteMutation.mutate(u.id)}
                          className="text-red-600"
                        >
                          Fshij
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            Nuk ka përdorues
          </div>
        )}
      </div>
    </div>
  );
}
