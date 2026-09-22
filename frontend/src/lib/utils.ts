export { cn } from "cn";

export function formatCurrency(
  amount: number | string,
  currency = "EUR",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("sq-AL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  tentative: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  tentative: "Tentativ",
  confirmed: "Konfirmuar",
  completed: "Përfunduar",
  cancelled: "Anuluar",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Kesh",
  card: "Kartë",
  bank_transfer: "Transfert Bankar",
  online: "Online",
  other: "Tjetër",
};
