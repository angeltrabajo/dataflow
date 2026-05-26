"use client"

import React, { useState } from "react"
import { type ColumnType, type Column } from "@/lib/store"
import { getColumnTypeLabel, getColumnTypeIcon, getColumnTypeColor } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// ─── Type categories ───
const TYPE_CATEGORIES = [
  { label: "Texto", types: ["text", "email", "phone", "url"] as ColumnType[] },
  { label: "Números", types: ["number", "currency", "percentage", "autonumber"] as ColumnType[] },
  { label: "Fecha", types: ["date"] as ColumnType[] },
  { label: "Selección", types: ["select", "multiselect", "checkbox"] as ColumnType[] },
  { label: "Calificación", types: ["rating"] as ColumnType[] },
  { label: "Avanzado", types: ["reference", "formula"] as ColumnType[] },
]

// ─── Type descriptions (Spanish) ───
const TYPE_DESCRIPTIONS: Record<ColumnType, string> = {
  text: "Texto libre",
  number: "Numérico",
  currency: "Moneda",
  percentage: "Porcentaje",
  date: "Fecha",
  select: "Una opción",
  multiselect: "Varias opciones",
  email: "Correo",
  phone: "Teléfono",
  url: "Enlace web",
  checkbox: "Sí / No",
  rating: "Estrellas",
  reference: "Vincular tabla",
  formula: "Calcular",
  autonumber: "Auto-num.",
}

// ─── Type selected ring colors ───
const TYPE_SELECTED_COLORS: Record<ColumnType, string> = {
  text: "border-slate-500 bg-slate-50 ring-1 ring-slate-500/30 dark:bg-slate-900/40",
  number: "border-blue-500 bg-blue-50 ring-1 ring-blue-500/30 dark:bg-blue-900/40",
  currency: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-900/40",
  percentage: "border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500/30 dark:bg-cyan-900/40",
  date: "border-amber-500 bg-amber-50 ring-1 ring-amber-500/30 dark:bg-amber-900/40",
  select: "border-violet-500 bg-violet-50 ring-1 ring-violet-500/30 dark:bg-violet-900/40",
  multiselect: "border-purple-500 bg-purple-50 ring-1 ring-purple-500/30 dark:bg-purple-900/40",
  email: "border-sky-500 bg-sky-50 ring-1 ring-sky-500/30 dark:bg-sky-900/40",
  phone: "border-teal-500 bg-teal-50 ring-1 ring-teal-500/30 dark:bg-teal-900/40",
  url: "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/30 dark:bg-indigo-900/40",
  checkbox: "border-green-500 bg-green-50 ring-1 ring-green-500/30 dark:bg-green-900/40",
  rating: "border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500/30 dark:bg-yellow-900/40",
  reference: "border-rose-500 bg-rose-50 ring-1 ring-rose-500/30 dark:bg-rose-900/40",
  formula: "border-orange-500 bg-orange-50 ring-1 ring-orange-500/30 dark:bg-orange-900/40",
  autonumber: "border-gray-500 bg-gray-50 ring-1 ring-gray-500/30 dark:bg-gray-900/40",
}

// ─── Category chip colors ───
const CATEGORY_COLORS: Record<string, string> = {
  "Texto": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "Números": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Fecha": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Selección": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Calificación": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Avanzado": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
}

interface ColumnTypePickerProps {
  value: ColumnType
  onChange: (type: ColumnType) => void
  columns?: Column[]
}

export function ColumnTypePicker({ value, onChange, columns: _columns }: ColumnTypePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Texto")

  // Get the types for the active category
  const activeTypes = TYPE_CATEGORIES.find(c => c.label === activeCategory)?.types ?? []

  return (
    <div className="space-y-3">
      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {TYPE_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveCategory(cat.label)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer min-h-[36px]",
              "border",
              activeCategory === cat.label
                ? cn(CATEGORY_COLORS[cat.label], "border-current/20 shadow-sm")
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-accent"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Type grid */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-3 gap-2"
      >
        {activeTypes.map((type) => {
          const isSelected = value === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all cursor-pointer min-h-[80px]",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? TYPE_SELECTED_COLORS[type]
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              {/* Icon badge */}
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold",
                  getColumnTypeColor(type)
                )}
              >
                {getColumnTypeIcon(type)}
              </span>

              {/* Label */}
              <span className="text-xs font-semibold leading-tight">
                {getColumnTypeLabel(type)}
              </span>

              {/* Description */}
              <span className="text-[10px] text-muted-foreground leading-tight">
                {TYPE_DESCRIPTIONS[type]}
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Currently selected indicator */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[11px] text-muted-foreground">Seleccionado:</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            getColumnTypeColor(value)
          )}
        >
          <span className="text-[10px]">{getColumnTypeIcon(value)}</span>
          {getColumnTypeLabel(value)}
        </span>
      </div>
    </div>
  )
}
