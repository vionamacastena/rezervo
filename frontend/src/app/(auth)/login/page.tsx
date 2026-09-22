"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Calendar, Loader2, Mail, Lock, ArrowRight, Eye, EyeOff,
  ShieldCheck, Sparkles,
} from "lucide-react";
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@rezervo.com", password: "Admin12345!" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setServerError(null);
    try {
      await login(data.email, data.password);
      toast.success("Mirë se vini!");
      // Hard nav — state pastrohet, cookie mbetet
      window.location.href = "/dashboard";
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        (status === 401 ? "Email ose fjalëkalim i pasaktë."
         : status === 422 ? "Të dhënat nuk janë të sakta."
         : "Gabim gjatë hyrjes. Provoni përsëri.");
      setServerError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-xl">Rezervo</div>
              <div className="text-xs text-slate-400">Management System</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs">
            <Sparkles className="w-3 h-3" /> Platforma #1 e rezervimeve
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Menaxho rezervimet,<br />klientët dhe biznesin<br />
            <span className="text-blue-400">në një vend.</span>
          </h1>
          <p className="text-slate-300 max-w-md">
            Sistemi i plotë për bizneset që duan të rriten — rezervime, pagesa, staf, inventar dhe raporte.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div><div className="text-2xl font-bold">500+</div><div className="text-xs text-slate-400">Biznese aktive</div></div>
            <div><div className="text-2xl font-bold">99.9%</div><div className="text-xs text-slate-400">Uptime SLA</div></div>
            <div><div className="text-2xl font-bold">24/7</div><div className="text-xs text-slate-400">Support</div></div>
          </div>
        </div>
        <div className="relative z-10 text-xs text-slate-400">© 2026 Rezervo.com — Korniza.net LLC</div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div><div className="font-bold text-xl">Rezervo</div><div className="text-xs text-slate-500">Management</div></div>
          </div>
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Mirë se vini!</h2>
            <p className="text-slate-500 mt-2">Hyr në llogarinë tënde për të vazhduar</p>
          </div>
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="email" type="email" className="pl-10 h-11 bg-white" {...register("email")} disabled={loading} autoComplete="email" />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">Fjalëkalimi</Label>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium" onClick={() => toast.info("Kontakto administratorin.")}>Harruat fjalëkalimin?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="password" type={showPassword ? "text" : "password"} className="pl-10 pr-10 h-11 bg-white" {...register("password")} disabled={loading} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 font-semibold" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Duke hyrë...</>) : (<>Hyr në sistem<ArrowRight className="w-4 h-4 ml-2" /></>)}
            </Button>
          </form>
          <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wider">Kredencialet demo</div>
            <div className="space-y-1 text-xs text-blue-800 font-mono">
              <div><span className="text-blue-600">Email:</span> admin@rezervo.com</div>
              <div><span className="text-blue-600">Password:</span> Admin12345!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
