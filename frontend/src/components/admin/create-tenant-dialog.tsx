"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  Loader2,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  // Tenant
  name: z.string().min(2, "Emri i biznesit kërkohet"),
  slug: z
    .string()
    .min(2, "Slug kërkohet")
    .regex(/^[a-z0-9-]+$/, "Vetëm shkronja të vogla, numra dhe -"),
  email: z.string().email("Email nuk është valid").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  timezone: z.string().default("Europe/Tirane"),
  currency: z.string().default("EUR"),
  status: z.enum(["active", "trial", "suspended"]).default("active"),
  business_type: z.string().default("generic"),

  // Owner
  owner_name: z.string().min(2, "Emri i ownerit kërkohet"),
  owner_email: z.string().email("Email i ownerit nuk është valid"),
  owner_password: z.string().min(8, "Minimum 8 karaktere"),
  owner_phone: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd + "!";
}

export function CreateTenantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: templatesData } = useQuery({
    queryKey: ["business-templates"],
    queryFn: async () => {
      const { adminApi } = await import("@/lib/api/admin");
      const { data } = await adminApi.listTemplates();
      return data;
    },
  });

  const [step, setStep] = useState<"form" | "success">("form");
  const [credentials, setCredentials] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      timezone: "Europe/Tirane",
      currency: "EUR",
      status: "active",
      business_type: "generic",
      owner_name: "",
      owner_email: "",
      owner_password: generatePassword(),
      owner_phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => adminApi.createTenant(data),
    onSuccess: (res) => {
      const { credentials, tenant } = res.data;
      setCredentials({ ...credentials, tenant_name: tenant.name });
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Biznesi u krijua me sukses!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Gabim";
      const errors = err?.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, msgs]: any) => {
          form.setError(field as any, { message: msgs[0] });
        });
      }
      toast.error(msg);
    },
  });

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("form");
      setCredentials(null);
      form.reset();
    }, 200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("U kopjua!");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Krijo Biznes të Ri
              </DialogTitle>
              <DialogDescription>
                Krijo biznes + llogari Owner që do të menaxhojë sistemin.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
              className="space-y-6"
            >
              {/* Tenant Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Informacioni i Biznesit
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Emri i Biznesit *</Label>
                    <Input
                      id="name"
                      placeholder="p.sh. Barber King"
                      {...form.register("name")}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">
                      URL Slug *
                      <span className="text-xs text-slate-400 ml-2 font-normal">
                        (book/{form.watch("slug") || "..."})
                      </span>
                    </Label>
                    <Input
                      id="slug"
                      placeholder="barber-king"
                      {...form.register("slug")}
                    />
                    {form.formState.errors.slug && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.slug.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (opsional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@biznesi.com"
                        {...form.register("email")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon (opsional)</Label>
                      <Input
                        id="phone"
                        placeholder="+383 44 123 456"
                        {...form.register("phone")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresa (opsionale)</Label>
                    <Input
                      id="address"
                      placeholder="Rr. Nëna Terezë 45, Prishtinë"
                      {...form.register("address")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={form.watch("timezone")}
                        onValueChange={(v) => form.setValue("timezone", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Tirane">
                            Europe/Tirane
                          </SelectItem>
                          <SelectItem value="Europe/Belgrade">
                            Europe/Belgrade
                          </SelectItem>
                          <SelectItem value="Europe/Skopje">
                            Europe/Skopje
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={form.watch("currency")}
                        onValueChange={(v) => form.setValue("currency", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="ALL">ALL (Lek)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Statusi</Label>
                      <Select
                        value={form.watch("status")}
                        onValueChange={(v: any) => form.setValue("status", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktiv</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="suspended">Pezulluar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipi i Biznesit</Label>
                      <Select
                        value={form.watch("business_type")}
                        onValueChange={(v) => form.setValue("business_type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(templatesData || []).map((t: any) => (
                            <SelectItem key={t.key} value={t.key}>
                              {t.label} ({t.services_count} shërbime)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">
                        Shërbimet standarde do të krijohen automatikisht.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Llogaria e Owner (Administratori)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Owneri do të ketë akses të plotë në panelin e biznesit.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Emri i Plotë *</Label>
                    <Input
                      id="owner_name"
                      placeholder="Endrit Berisha"
                      {...form.register("owner_name")}
                    />
                    {form.formState.errors.owner_name && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.owner_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner_email">Email *</Label>
                    <Input
                      id="owner_email"
                      type="email"
                      placeholder="owner@biznesi.com"
                      {...form.register("owner_email")}
                    />
                    {form.formState.errors.owner_email && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.owner_email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner_password">Fjalëkalimi *</Label>
                    <div className="relative">
                      <Input
                        id="owner_password"
                        type={showPassword ? "text" : "password"}
                        {...form.register("owner_password")}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-slate-500">
                        Gjeneruar automatikisht. Kopjoji për t'ia dhënë ownerit.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue("owner_password", generatePassword())
                        }
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Rikrijo
                      </button>
                    </div>
                    {form.formState.errors.owner_password && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.owner_password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner_phone">Telefon (opsional)</Label>
                    <Input
                      id="owner_phone"
                      placeholder="+383 44 123 456"
                      {...form.register("owner_phone")}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                >
                  Anulo
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Duke
                      krijuar...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" /> Krijo Biznesin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <DialogTitle className="text-2xl">
                  Biznesi u krijua! 🎉
                </DialogTitle>
                <DialogDescription>
                  {credentials?.tenant_name} tani është aktiv në platformë.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-orange-900 uppercase tracking-wider mb-3">
                  ⚠️ Ruaj këto kredenciale para se të mbyllësh
                </div>
                <div className="text-xs text-orange-700 mb-3">
                  Owneri do t'i përdorë për të hyrë në sistem. Fjalëkalimi nuk
                  do të shfaqet më.
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Email</div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-white px-3 py-2 rounded border flex-1 font-mono truncate">
                        {credentials?.email}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials?.email)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      Fjalëkalimi
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-white px-3 py-2 rounded border flex-1 font-mono truncate">
                        {credentials?.password}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials?.password)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      URL e Login-it
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-white px-3 py-2 rounded border flex-1 font-mono truncate">
                        {credentials?.login_url}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials?.login_url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                <Badge variant="outline" className="bg-white">
                  Book URL
                </Badge>
                <code className="text-slate-700">
                  /book/{form.watch("slug")}
                </code>
              </div>
            </div>

            <DialogFooter className="flex justify-between gap-2 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  copyToClipboard(
                    `Email: ${credentials?.email}\nPassword: ${credentials?.password}\nLogin: ${credentials?.login_url}`,
                  );
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Kopjo të gjitha
              </Button>
              <Button
                onClick={handleClose}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Mbyll
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
