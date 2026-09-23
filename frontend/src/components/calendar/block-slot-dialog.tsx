"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Clock, Sun, Lock } from "lucide-react";

import { blockedSlotsApi } from "@/lib/api/blocked-slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
}

const REASONS = [
  { value: "Pushim", icon: Sun },
  { value: "Pushim personal", icon: Sun },
  { value: "Takim", icon: Clock },
  { value: "Tjetër", icon: Lock },
];

export function BlockSlotDialog({ open, onOpenChange, date }: Props) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"day" | "range">("day");
  const [reason, setReason] = useState("Pushim");
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("18:00");

  const mutation = useMutation({
    mutationFn: async () => {
      const dateStr = format(date, "yyyy-MM-dd");

      let start: string, end: string;
      if (mode === "day") {
        start = `${dateStr}T09:00:00`;
        end = `${dateStr}T18:00:00`;
      } else {
        start = `${dateStr}T${startsAt}:00`;
        end = `${dateStr}T${endsAt}:00`;
      }

      await blockedSlotsApi.create({ starts_at: start, ends_at: end, reason });
    },
    onSuccess: () => {
      toast.success("Oraret u bllokuan");
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-slots"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gabim");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Blloko orarin</DialogTitle>
          <DialogDescription className="capitalize">
            {format(date, "EEEE, d MMMM yyyy", { locale: require("date-fns/locale").sq })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("day")}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === "day"
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Sun className="w-4 h-4 text-slate-600 mb-1.5" />
              <div className="text-sm font-medium">Tërë ditën</div>
              <div className="text-xs text-slate-500">09:00 — 18:00</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === "range"
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Clock className="w-4 h-4 text-slate-600 mb-1.5" />
              <div className="text-sm font-medium">Ora të caktuara</div>
              <div className="text-xs text-slate-500">Zgjidh orët</div>
            </button>
          </div>

          {mode === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nga ora</Label>
                <Input type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deri ora</Label>
                <Input type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Arsyeja</Label>
            <div className="flex gap-2 flex-wrap">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                    reason === r.value
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {r.value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Anulo
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Lock className="w-4 h-4 mr-2" /> Blloko
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
