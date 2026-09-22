"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";

const loginSchema = z.object({
  email: z.string().min(1, "Email kërkohet").email("Email nuk është valid"),
  password: z.string().min(8, "Fjalëkalimi duhet të paktën 8 karaktere"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setServerError(null);

    try {
      const user = await login(data.email, data.password);
      const isSuperAdmin = user.roles?.some(
        (r: any) => r.name === "super_admin",
      );
      const hasTenant = !!user.tenant_id;

      toast.success("Mirë se vini!");

      if (isSuperAdmin && !hasTenant) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        (status === 401
          ? "Email ose fjalëkalim i pasaktë."
          : status === 422
            ? "Të dhënat nuk janë të sakta."
            : "Gabim gjatë hyrjes. Provoni përsëri.");

      setServerError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Rezervo</h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ju@example.com"
                className="h-10"
                {...register("email")}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 text-sm">
                  Fjalëkalimi
                </Label>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-900"
                  onClick={() => toast.info("Kontakto administratorin.")}
                >
                  Harruat?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-10 pr-10"
                  {...register("password")}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-slate-900 hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Duke hyrë...
                </>
              ) : (
                "Hyr"
              )}
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-slate-400 mt-6">
          © 2026 Rezervo.com
        </p>
      </div>
    </div>
  );
}
