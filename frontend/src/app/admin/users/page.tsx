"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, Users as UsersIcon, Mail, Phone, Building2,
  UserCheck, UserX, Shield, MoreVertical, Trash2, KeyRound, Pencil,
} from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Menaxher",
  receptionist: "Recepsionist",
  accountant: "Kontabilist",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-orange-100 text-orange-700 border-orange-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  receptionist: "bg-purple-100 text-purple-700 border-purple-200",
  accountant: "bg-emerald-100 text-emerald-700 border-emerald-200",
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
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      toast.success("Statusi u përditësua");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
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
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      adminApi.resetUserPassword(id, password),
    onSuccess: () => toast.success("Fjalëkalimi u rivendos"),
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gabim"),
  });

  const handleDelete = (u: any) => {
    if (confirm(`Fshij përdoruesin "${u.name}"?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const handleResetPassword = (u: any) => {
    const pwd = prompt(`Fjalëkalim i ri për ${u.name} (min. 8 karaktere):`);
    if (pwd && pwd.length >= 8) {
      resetPasswordMutation.mutate({ id: u.id, password: pwd });
    } else if (pwd) {
      toast.error("Minimum 8 karaktere");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Përdoruesit</h1>
        <p className="text-slate-500 mt-1">
          Të gjithë përdoruesit në platformë (përveç Super Admin)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Kërko emër, email, telefon..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha rolet</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Joaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Biznesi</TableHead>
                  <TableHead>Roli</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length ? data.data.map((u: any) => {
                  const roleName = u.roles?.[0]?.name;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        {u.tenant ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="text-sm">{u.tenant.name}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {roleName && (
                          <Badge variant="outline" className={ROLE_COLORS[roleName] ?? ""}>
                            {ROLE_LABELS[roleName] ?? roleName}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "secondary"}>
                          {u.status === "active" ? "Aktiv" : "Joaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/admin/users/${u.id}`, "_self")}>
                              <Pencil className="w-4 h-4 mr-2" /> Ndrysho
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                              <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate({
                                id: u.id,
                                status: u.status === "active" ? "inactive" : "active",
                              })}
                            >
                              {u.status === "active"
                                ? <><UserX className="w-4 h-4 mr-2" /> Çaktivizo</>
                                : <><UserCheck className="w-4 h-4 mr-2" /> Aktivizo</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(u)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Fshij
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      Nuk ka përdorues
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
