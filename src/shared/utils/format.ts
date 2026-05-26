import type { ColumnType } from '../types/Project';

/**
 * Format a number as Mexican currency.
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Get the display label for a column type.
 */
export function getColumnTypeLabel(type: ColumnType): string {
  const labels: Record<ColumnType, string> = {
    text: "Texto", number: "Número", currency: "Moneda", percentage: "Porcentaje",
    date: "Fecha", select: "Selección", multiselect: "Multi-selección", email: "Email",
    phone: "Teléfono", url: "URL", checkbox: "Casilla", rating: "Calificación",
    reference: "Referencia", formula: "Fórmula", autonumber: "Auto-número",
  };
  return labels[type];
}

/**
 * Get the icon representation for a column type.
 */
export function getColumnTypeIcon(type: ColumnType): string {
  const icons: Record<ColumnType, string> = {
    text: "Aa", number: "#", currency: "$", percentage: "%", date: "📅",
    select: "☰", multiselect: "☑", email: "@", phone: "📞", url: "🔗",
    checkbox: "✓", rating: "⭐", reference: "↗", formula: "fx", autonumber: "##",
  };
  return icons[type];
}

/**
 * Get the color classes for a column type badge.
 */
export function getColumnTypeColor(type: ColumnType): string {
  const colors: Record<ColumnType, string> = {
    text: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    number: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    currency: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    percentage: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    date: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    select: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    multiselect: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    email: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    phone: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    url: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    checkbox: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    rating: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    reference: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    formula: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    autonumber: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return colors[type];
}

const SELECT_PILL_COLORS = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
];

export function getSelectPillColor(index: number): string {
  return SELECT_PILL_COLORS[index % SELECT_PILL_COLORS.length];
}

export const PRESET_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  "#84CC16", "#14B8A6",
];
