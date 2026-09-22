"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Calendar as CalendarIcon,
  ChevronDown,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  publicBookingApi,
  PublicService,
  PublicSlot,
  BookingResponse,
} from "@/lib/api/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const clientSchema = z.object({
  first_name: z.string().min(1, "Emri kërkohet"),
  last_name: z.string().min(1, "Mbiemri kërkohet"),
  phone: z.string().min(5, "Telefoni kërkohet"),
  email: z.string().email("Email nuk është valid").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type ClientForm = z.infer<typeof clientSchema>;

type Step = "welcome" | "service" | "datetime" | "details" | "confirmed";

export default function BookPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [step, setStep] = useState<Step>("welcome");
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // Fetch tenant + services
  const { data: tenantData, isLoading: loadingTenant } = useQuery({
    queryKey: ["public-tenant", slug],
    queryFn: async () => {
      const { data } = await publicBookingApi.getTenant(slug);
      return data;
    },
    retry: false,
  });

  // Fetch availability when date+service chosen
  const { data: availabilityData, isLoading: loadingSlots } = useQuery({
    queryKey: ["availability", slug, selectedDate, selectedService?.id],
    queryFn: async () => {
      if (!selectedDate || !selectedService) return null;
      const { data } = await publicBookingApi.getAvailability(
        slug,
        selectedDate,
        selectedService.id
      );
      return data;
    },
    enabled: !!selectedDate && !!selectedService && step === "datetime",
  });

  // Generate next 30 days
  const dates = useMemo(() => {
    const result: { date: Date; value: string; weekday: string; day: number; month: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push({
        date: d,
        value: d.toISOString().slice(0, 10),
        weekday: d.toLocaleDateString("sq-AL", { weekday: "short" }),
        day: d.getDate(),
        month: d.toLocaleDateString("sq-AL", { month: "short" }),
      });
    }
    return result;
  }, []);

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold">Faqja nuk u gjet</h1>
          <p className="text-slate-500">
            Biznesi me këtë adresë nuk ekziston ose është i çaktivizuar.
          </p>
        </div>
      </div>
    );
  }

  const { tenant, services } = tenantData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{tenant.name}</div>
              <div className="text-xs text-slate-500">Rezervo Booking</div>
            </div>
          </div>
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <Phone className="w-3 h-3" /> {tenant.phone}
            </a>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        {step === "welcome" && (
          <WelcomeStep
            tenant={tenant}
            onNext={() => setStep("service")}
          />
        )}

        {step === "service" && (
          <ServiceStep
            services={services}
            selected={selectedService}
            onSelect={setSelectedService}
            onNext={() => setStep("datetime")}
            onBack={() => setStep("welcome")}
          />
        )}

        {step === "datetime" && (
          <DateTimeStep
            service={selectedService!}
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            slots={availabilityData?.slots ?? []}
            loadingSlots={loadingSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            onNext={() => setStep("details")}
            onBack={() => setStep("service")}
          />
        )}

        {step === "details" && (
          <DetailsStep
            tenant={tenant}
            service={selectedService!}
            slot={selectedSlot!}
            onBack={() => setStep("datetime")}
            onSuccess={(result) => {
              setBookingResult(result);
              setStep("confirmed");
            }}
            slug={slug}
          />
        )}

        {step === "confirmed" && bookingResult && (
          <ConfirmedStep
            result={bookingResult}
            onReset={() => {
              setStep("welcome");
              setSelectedService(null);
              setSelectedDate("");
              setSelectedSlot(null);
              setBookingResult(null);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Powered by <span className="font-semibold text-slate-600">Rezervo.com</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 1: Welcome
// ─────────────────────────────────────────
function WelcomeStep({
  tenant,
  onNext,
}: {
  tenant: any;
  onNext: () => void;
}) {
  return (
    <div className="text-center space-y-8 py-8">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          Mirësevini
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
        <p className="text-slate-500">
          Rezervoni një termin në mënyrë të lehtë dhe të shpejtë
        </p>
      </div>

      {tenant.address && (
        <div className="inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full border">
          <MapPin className="w-4 h-4" /> {tenant.address}
        </div>
      )}

      <div className="pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full max-w-xs h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800"
        >
          Cakto termin
        </Button>
      </div>

      <div className="pt-8">
        <div className="text-xs text-slate-400">
          Orari i punës: 09:00 – 18:00
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 2: Service
// ─────────────────────────────────────────
function ServiceStep({
  services,
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  services: PublicService[];
  selected: PublicService | null;
  onSelect: (s: PublicService) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader step={1} total={4} title="Zgjidh shërbimin" onBack={onBack} />

      <div className="space-y-3">
        {services.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  </div>
                  {s.description && (
                    <p className="text-sm text-slate-500 mt-1">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration_label}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700">
                      {s.price === 0 ? "Falas" : `${s.price} ${s.currency}`}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!selected}
        size="lg"
        className="w-full h-12 font-semibold"
      >
        Vazhdo <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 3: Date & Time
// ─────────────────────────────────────────
function DateTimeStep({
  service,
  dates,
  selectedDate,
  onSelectDate,
  slots,
  loadingSlots,
  selectedSlot,
  onSelectSlot,
  onNext,
  onBack,
}: {
  service: PublicService;
  dates: any[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  slots: PublicSlot[];
  loadingSlots: boolean;
  selectedSlot: PublicSlot | null;
  onSelectSlot: (s: PublicSlot) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader step={2} total={4} title="Zgjidh datën dhe orën" onBack={onBack} />

      <div className="bg-white rounded-xl border p-4 space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">
            Shërbimi i zgjedhur
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: service.color }}
            />
            <span className="font-medium">{service.name}</span>
            <span className="text-sm text-slate-500">
              ({service.duration_label})
            </span>
          </div>
        </div>
      </div>

      {/* Date picker - horizontal scroll */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500 mb-2 block">
          Zgjidh datën
        </Label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {dates.map((d) => {
            const isSelected = selectedDate === d.value;
            return (
              <button
                key={d.value}
                onClick={() => {
                  onSelectDate(d.value);
                  onSelectSlot(null as any);
                }}
                className={`shrink-0 w-[68px] py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-600 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`text-xs uppercase ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                  {d.weekday}
                </div>
                <div className="text-xl font-bold">{d.day}</div>
                <div className={`text-xs ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                  {d.month}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500 mb-2 block">
            Zgjidh një orë
          </Label>

          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nuk ka orare të disponueshme për këtë ditë.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.time === slot.time;
                return (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && onSelectSlot(slot)}
                    disabled={!slot.available}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      !slot.available
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={!selectedSlot}
        size="lg"
        className="w-full h-12 font-semibold"
      >
        Vazhdo <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 4: Details
// ─────────────────────────────────────────
function DetailsStep({
  tenant,
  service,
  slot,
  slug,
  onBack,
  onSuccess,
}: {
  tenant: any;
  service: PublicService;
  slot: PublicSlot;
  slug: string;
  onBack: () => void;
  onSuccess: (r: BookingResponse) => void;
}) {
  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (d: ClientForm) => {
      const { data } = await publicBookingApi.book(slug, {
        service_id: service.id,
        starts_at: slot.datetime,
        first_name: d.first_name,
        last_name: d.last_name,
        phone: d.phone,
        email: d.email || undefined,
        notes: d.notes || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Gabim gjatë rezervimit. Provoni përsëri."
      );
    },
  });

  const dateObj = new Date(slot.datetime);
  const dateLabel = dateObj.toLocaleDateString("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <StepHeader step={3} total={4} title="Të dhënat tuaja" onBack={onBack} />

      {/* Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          Përmbledhje
        </div>
        <div className="text-lg font-bold">{dateLabel}</div>
        <div className="text-2xl font-bold">Ora {slot.time}</div>
        <div className="flex items-center gap-2 pt-2 text-sm text-slate-300">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: service.color }}
          />
          <span>{service.name}</span>
          <span>·</span>
          <span>{service.duration_label}</span>
        </div>
        <div className="text-sm font-semibold text-white pt-1">
          {service.price === 0 ? "Falas" : `Totali: ${service.price} ${service.currency}`}
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-xs">Emri *</Label>
            <Input id="first_name" {...form.register("first_name")} />
            {form.formState.errors.first_name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.first_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-xs">Mbiemri *</Label>
            <Input id="last_name" {...form.register("last_name")} />
            {form.formState.errors.last_name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs">Numri i telefonit *</Label>
          <Input
            id="phone"
            placeholder="+383 44 123 456"
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-red-500">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email (opsional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="emri@example.com"
            {...form.register("email")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">Shënime (opsionale)</Label>
          <Textarea
            id="notes"
            rows={2}
            placeholder="Çdo detaj që duam të dijë biznesi..."
            {...form.register("notes")}
          />
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          size="lg"
          className="w-full h-12 font-semibold bg-slate-900 hover:bg-slate-800"
        >
          {mutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Konfirmo terminin
        </Button>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Duke klikuar butonin, ju pranoni kushtet e përdorimit dhe
          politikën e privatësisë së {tenant.name}.
        </p>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 5: Confirmed
// ─────────────────────────────────────────
function ConfirmedStep({
  result,
  onReset,
}: {
  result: BookingResponse;
  onReset: () => void;
}) {
  const r = result.reservation;
  const dateObj = new Date(r.starts_at);
  const dateLabel = dateObj.toLocaleDateString("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeLabel = dateObj.toLocaleTimeString("sq-AL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAddToCalendar = () => {
    const start = new Date(r.starts_at);
    const end = new Date(r.ends_at);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      r.service.name + " - " + result.tenant.name
    )}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(
      "Kodi: " + r.code
    )}&location=${encodeURIComponent(result.tenant.address || "")}`;

    window.open(googleUrl, "_blank");
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Termini u konfirmua!
        </h2>
        <p className="text-slate-500">
          Do të merrni një konfirmim në {r.client.phone}
        </p>
      </div>

      <div className="bg-white rounded-xl border divide-y">
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Data
            </div>
            <div className="font-semibold capitalize">{dateLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Ora
            </div>
            <div className="font-semibold">{timeLabel}</div>
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Shërbimi
          </div>
          <div className="font-semibold">{r.service.name}</div>
          <div className="text-sm text-slate-500">
            {r.service.duration_minutes} minuta
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Klienti
          </div>
          <div className="font-semibold">{r.client.full_name}</div>
          <div className="text-sm text-slate-500">{r.client.phone}</div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Kodi i rezervimit
          </div>
          <div className="font-mono text-sm font-semibold">{r.code}</div>
        </div>

        {result.tenant.address && (
          <div className="p-4 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-sm">{result.tenant.address}</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleAddToCalendar}
          variant="outline"
          className="w-full"
        >
          <CalendarIcon className="w-4 h-4 mr-2" /> Shto në Kalendar
        </Button>
        <Button
          onClick={onReset}
          variant="ghost"
          className="w-full text-slate-500"
        >
          Cakto një termin tjetër
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Shared: Step Header (progress + back)
// ─────────────────────────────────────────
function StepHeader({
  step,
  total,
  title,
  onBack,
}: {
  step: number;
  total: number;
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Kthehu
        </button>
        <span className="text-xs text-slate-400">
          Hapi {step} / {total}
        </span>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < step ? "bg-blue-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}
