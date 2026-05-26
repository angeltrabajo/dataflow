"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import { type Column, type Project } from "@/lib/store"
import {
  SPANISH_FORMULA_FNS,
  FORMULA_CATEGORIES,
  getColumnTypeIcon,
  getColumnTypeColor,
  evaluateFormula,
  formatFormulaResult,
} from "@/lib/helpers"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  ExternalLink,
  Search,
  Columns3,
  FunctionSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Info,
} from "lucide-react"

// ─── Function category colors ───
const FN_CATEGORY_COLORS: Record<string, string> = {
  logica: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  matematicas: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  texto: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  fecha: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  busqueda: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  seccion: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
}

const FN_CATEGORY_DOT_COLORS: Record<string, string> = {
  logica: "bg-violet-500",
  matematicas: "bg-sky-500",
  texto: "bg-emerald-500",
  fecha: "bg-amber-500",
  busqueda: "bg-rose-500",
  seccion: "bg-indigo-500",
}

const FN_CATEGORY_ICONS: Record<string, string> = {
  logica: "🔀",
  matematicas: "🔢",
  texto: "📝",
  fecha: "📅",
  busqueda: "🔍",
  seccion: "🔄",
}

// ─── Insert templates ───
const FORMULA_TEMPLATES: Record<string, string> = {
  SI: 'SI(condición, "sí", "no")',
  BUSCARV: "BUSCARV({columnaRef}, columnaDestino)",
  Y: "Y(condición1, condición2)",
  O: "O(condición1, condición2)",
  NO: "NO(condición)",
  ESBLANCO: "ESBLANCO({columna})",
  "SI.ERROR": "SI.ERROR({columna}, 0)",
  SUMAR: "SUMAR({col1}, {col2})",
  CONTAR: "CONTAR({col1}, {col2})",
  PROMEDIO: "PROMEDIO({col1}, {col2})",
  REDONDEAR: "REDONDEAR({columna}, 2)",
  ABS: "ABS({columna})",
  POTENCIA: "POTENCIA({columna}, 2)",
  RAIZ: "RAIZ({columna})",
  CONCATENAR: 'CONCATENAR({col1}, " - ", {col2})',
  IZQUIERDA: "IZQUIERDA({columna}, 3)",
  DERECHA: "DERECHA({columna}, 4)",
  LARGO: "LARGO({columna})",
  MAYUSC: "MAYUSC({columna})",
  MINUSC: "MINUSC({columna})",
  HOY: "HOY()",
  AHORA: "AHORA()",
  "SUMAR.SI": "SUMAR.SI(tablaId, colCond, valorCond, colSuma)",
  "CONTAR.SI": "CONTAR.SI(tablaId, colCond, valorCond)",
  "SUMAR.SECCION": "SUMAR.SECCION({col-cant} * {col-precio})",
}

// ─── Operators quick-insert ───
const OPERATORS = [
  { label: "=", insert: " = " },
  { label: "≠", insert: " <> " },
  { label: ">", insert: " > " },
  { label: "<", insert: " < " },
  { label: "≥", insert: " >= " },
  { label: "≤", insert: " <= " },
  { label: "+", insert: " + " },
  { label: "-", insert: " - " },
  { label: "×", insert: " * " },
  { label: "÷", insert: " / " },
  { label: '""', insert: '""' },
]

interface FormulaAssistantProps {
  label: string
  value: string
  onChange: (v: string) => void
  helpText: string
  columns: { id: string; name: string; type: string; refTableId?: string }[]
  project?: any
  projects?: any[]
  currentProjectId?: string
  showPreview?: boolean
  placeholder?: string
}

export function FormulaAssistant({
  label,
  value,
  onChange,
  helpText,
  columns,
  project,
  projects,
  currentProjectId,
  showPreview = false,
  placeholder = 'Ej: {col-tipo} = "Ingreso"',
}: FormulaAssistantProps) {
  const [activeTab, setActiveTab] = useState<"campos" | "funciones" | "operadores">("campos")
  const [search, setSearch] = useState("")
  const [expandedFn, setExpandedFn] = useState<string | null>(null)
  const [expandedRefTable, setExpandedRefTable] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ─── Cursor-aware insertion ───
  const insertAtCursor = useCallback(
    (insertion: string) => {
      const el = textareaRef.current
      if (el) {
        const start = el.selectionStart
        const end = el.selectionEnd
        const before = value.substring(0, start)
        const after = value.substring(end)
        const newValue = before + insertion + after
        onChange(newValue)
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + insertion.length
          el.focus()
        })
      } else {
        onChange(value + insertion)
      }
    },
    [value, onChange]
  )

  const insertColumnRef = (colId: string) => {
    insertAtCursor(`{${colId}}`)
  }

  const insertFormulaFn = (fnName: string) => {
    const insertion = FORMULA_TEMPLATES[fnName] || SPANISH_FORMULA_FNS[fnName]?.example || `${fnName}()`
    insertAtCursor(insertion)
  }

  // ─── Filter columns (exclude formula/autonumber) ───
  const referenceableColumns = useMemo(
    () => columns.filter((c) => c.type !== "formula" && c.type !== "autonumber"),
    [columns]
  )

  const filteredColumns = useMemo(() => {
    if (!search.trim()) return referenceableColumns
    const q = search.toLowerCase()
    return referenceableColumns.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    )
  }, [referenceableColumns, search])

  // ─── Cross-table references ───
  const crossTableRefs = useMemo(() => {
    if (!project) return []
    const refs: {
      refColId: string
      refColName: string
      targetTable: { id: string; name: string; emoji: string }
      targetColumns: { id: string; name: string; type: string }[]
    }[] = []
    for (const col of columns) {
      if (col.type === "reference" && col.refTableId) {
        const refTable = project.tables?.find((t: any) => t.id === col.refTableId)
        if (refTable) {
          const filteredTargets = refTable.columns
            .filter((c: any) => c.type !== "formula" && c.type !== "autonumber")
            .map((c: any) => ({ id: c.id, name: c.name, type: c.type }))

          const matchedTargets = search.trim()
            ? filteredTargets.filter(
                (tc: any) =>
                  tc.name.toLowerCase().includes(search.toLowerCase()) ||
                  tc.id.toLowerCase().includes(search.toLowerCase())
              )
            : filteredTargets

          if (matchedTargets.length > 0 || !search.trim()) {
            refs.push({
              refColId: col.id,
              refColName: col.name,
              targetTable: { id: refTable.id, name: refTable.name, emoji: refTable.emoji || "📋" },
              targetColumns: search.trim() ? matchedTargets : filteredTargets,
            })
          }
        }
      }
    }
    return refs
  }, [columns, project, search])

  // ─── Group functions by category ───
  const functionsByCategory = useMemo(() => {
    const grouped: Record<string, [string, (typeof SPANISH_FORMULA_FNS)[string]][]> = {}
    for (const [key, fn] of Object.entries(SPANISH_FORMULA_FNS)) {
      if (!grouped[fn.category]) grouped[fn.category] = []
      grouped[fn.category].push([key, fn])
    }
    return grouped
  }, [])

  const filteredFunctionsByCategory = useMemo(() => {
    if (!search.trim()) return functionsByCategory
    const q = search.toLowerCase()
    const filtered: Record<string, [string, (typeof SPANISH_FORMULA_FNS)[string]][]> = {}
    for (const [cat, fns] of Object.entries(functionsByCategory)) {
      const matching = fns.filter(
        ([key, fn]) =>
          fn.name.toLowerCase().includes(q) ||
          fn.description.toLowerCase().includes(q) ||
          key.toLowerCase().includes(q)
      )
      if (matching.length > 0) {
        filtered[cat] = matching
      }
    }
    return filtered
  }, [functionsByCategory, search])

  // ─── Live preview ───
  const previewResult = useMemo(() => {
    if (!showPreview || !value.trim() || !project || !projects || !currentProjectId) return null
    try {
      const firstTable = project.tables?.[0]
      if (!firstTable || firstTable.rows?.length === 0) return null
      const row = firstTable.rows[0]
      const result = evaluateFormula(value, row, firstTable.columns, projects, currentProjectId)
      return formatFormulaResult(result, value)
    } catch {
      return "⚠ Error"
    }
  }, [value, project, projects, currentProjectId, showPreview])

  // ─── Total counts ───
  const totalColumns = referenceableColumns.length + crossTableRefs.reduce((sum, r) => sum + r.targetColumns.length, 0)
  const totalFunctions = Object.keys(SPANISH_FORMULA_FNS).length

  return (
    <div className="space-y-2">
      {/* Label + fx badge */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Sparkles className="h-2.5 w-2.5" />
          fx
        </span>
      </div>

      {/* Main assistant card */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-xs min-h-[48px] resize-y border-0 rounded-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:ring-inset"
            rows={2}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Quick operator bar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-t bg-muted/30">
          <span className="text-[9px] text-muted-foreground mr-1 font-semibold">INSERTAR:</span>
          {OPERATORS.map((op) => (
            <button
              key={op.label}
              type="button"
              onClick={() => insertAtCursor(op.insert)}
              className="h-6 min-w-[24px] px-1 rounded text-[11px] font-mono font-medium hover:bg-accent transition-colors flex items-center justify-center"
              title={`Insertar ${op.label}`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-t">
          {/* Tab headers */}
          <div className="flex">
            {[
              { key: "campos" as const, label: "Campos", icon: Columns3, count: totalColumns },
              { key: "funciones" as const, label: "Funciones", icon: FunctionSquare, count: totalFunctions },
              { key: "operadores" as const, label: "Operadores", icon: Sparkles, count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearch("")
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium transition-colors border-b-2",
                  activeTab === tab.key
                    ? "text-emerald-700 dark:text-emerald-400 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/30"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count !== null && (
                  <span className="text-[9px] bg-muted rounded-full px-1.5 py-0">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="px-2 py-1.5 border-t">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "campos" ? "Buscar columna..." : activeTab === "funciones" ? "Buscar función..." : "Buscar operador..."}
                className="h-7 text-[11px] pl-7 pr-2 font-mono bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {/* ── Campos Tab ── */}
            {activeTab === "campos" && (
              <div className="divide-y">
                {filteredColumns.length === 0 && crossTableRefs.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">
                    {search ? "Sin resultados" : "No hay columnas disponibles"}
                  </p>
                ) : (
                  <>
                    {filteredColumns.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => insertColumnRef(col.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors cursor-pointer min-h-[38px]"
                      >
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold shrink-0",
                            getColumnTypeColor(col.type as Column["type"])
                          )}
                        >
                          {getColumnTypeIcon(col.type as Column["type"])}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium truncate block">{col.name}</span>
                          <span className="text-[10px] text-muted-foreground">{col.type}</span>
                        </div>
                        <code className="text-[10px] text-muted-foreground font-mono shrink-0 bg-muted px-1.5 py-0.5 rounded">
                          {`{${col.id}}`}
                        </code>
                      </button>
                    ))}

                    {/* Cross-table references */}
                    {crossTableRefs.map((ref) => (
                      <React.Fragment key={ref.refColId}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRefTable(expandedRefTable === ref.refColId ? null : ref.refColId)
                          }
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-accent/30 transition-colors bg-rose-50/50 dark:bg-rose-900/10"
                        >
                          {expandedRefTable === ref.refColId ? (
                            <ChevronDown className="h-3 w-3 text-rose-500" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-rose-500" />
                          )}
                          <ExternalLink className="h-3 w-3 text-rose-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            {ref.targetTable.emoji} {ref.targetTable.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            vía {ref.refColName}
                          </span>
                          <span className="text-[9px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full px-1.5 ml-auto">
                            {ref.targetColumns.length}
                          </span>
                        </button>
                        <AnimatePresence>
                          {(expandedRefTable === ref.refColId || search.trim()) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              {ref.targetColumns.map((tc) => (
                                <button
                                  key={`${ref.refColId}.${tc.id}`}
                                  type="button"
                                  onClick={() => insertColumnRef(`${ref.refColId}.${tc.id}`)}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 pl-8 text-left hover:bg-accent/50 transition-colors cursor-pointer min-h-[34px]"
                                >
                                  <span className="text-[10px] opacity-50">
                                    {getColumnTypeIcon(tc.type as Column["type"])}
                                  </span>
                                  <span className="text-xs">{tc.name}</span>
                                  <code className="text-[9px] text-muted-foreground font-mono ml-auto">
                                    {`{${ref.refColId}.${tc.id}}`}
                                  </code>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── Funciones Tab ── */}
            {activeTab === "funciones" && (
              <div className="divide-y">
                {Object.keys(filteredFunctionsByCategory).length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">
                    {search ? "Sin resultados" : "No hay funciones disponibles"}
                  </p>
                ) : (
                  FORMULA_CATEGORIES.map((cat) => {
                    const fns = filteredFunctionsByCategory[cat.key]
                    if (!fns || fns.length === 0) return null

                    return (
                      <div key={cat.key}>
                        {/* Category header */}
                        <div
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                            FN_CATEGORY_COLORS[cat.key]
                          )}
                        >
                          <span>{FN_CATEGORY_ICONS[cat.key]}</span>
                          {cat.label}
                          <span className="ml-auto font-normal opacity-70">({fns.length})</span>
                        </div>

                        {/* Function items */}
                        {fns.map(([fnKey, fn]) => {
                          return (
                            <div key={fnKey}>
                              <button
                                type="button"
                                onClick={() => insertFormulaFn(fnKey)}
                                className="flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors cursor-pointer min-h-[42px]"
                              >
                                <span
                                  className={cn(
                                    "inline-flex h-5 items-center rounded px-1.5 text-[9px] font-bold shrink-0 mt-0.5",
                                    FN_CATEGORY_COLORS[cat.key]
                                  )}
                                >
                                  fx
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold">{fn.name}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setExpandedFn(expandedFn === fnKey ? null : fnKey)
                                      }}
                                      className="h-4 w-4 rounded-full hover:bg-accent flex items-center justify-center"
                                    >
                                      <Info className="h-2.5 w-2.5 text-muted-foreground" />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                                    {fn.description}
                                  </p>
                                </div>
                              </button>

                              {/* Expanded function detail */}
                              <AnimatePresence>
                                {expandedFn === fnKey && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 pb-2.5 pl-10 space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        {fn.description}
                                      </p>
                                      <div className="rounded bg-muted/70 px-2.5 py-1.5">
                                        <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
                                          Ejemplo:
                                        </p>
                                        <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 break-all">
                                          {fn.example}
                                        </code>
                                      </div>
                                      {FORMULA_TEMPLATES[fnKey] && (
                                        <div className="rounded bg-muted/70 px-2.5 py-1.5">
                                          <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
                                            Se insertará:
                                          </p>
                                          <code className="text-[11px] font-mono text-sky-700 dark:text-sky-400 break-all">
                                            {FORMULA_TEMPLATES[fnKey]}
                                          </code>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── Operadores Tab ── */}
            {activeTab === "operadores" && (
              <div className="p-3 space-y-4">
                {/* Comparison operators */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Comparación
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {OPERATORS.filter((o) => ["=", "≠", ">", "<", "≥", "≤"].includes(o.label)).map((op) => (
                      <button
                        key={op.label}
                        type="button"
                        onClick={() => insertAtCursor(op.insert)}
                        className="h-9 rounded-md border bg-card hover:bg-accent transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="text-sm font-bold">{op.label}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {op.insert.trim()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arithmetic operators */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Aritmética
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {OPERATORS.filter((o) => ["+", "-", "×", "÷"].includes(o.label)).map((op) => (
                      <button
                        key={op.label}
                        type="button"
                        onClick={() => insertAtCursor(op.insert)}
                        className="h-9 rounded-md border bg-card hover:bg-accent transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="text-sm font-bold">{op.label}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {op.insert.trim()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text / Other */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Texto y Otros
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '""', insert: '""', desc: "texto" },
                      { label: "()", insert: "()", desc: "paréntesis" },
                      { label: ",", insert: ", ", desc: "separador" },
                      { label: "TRUE", insert: "VERDADERO", desc: "verdadero" },
                      { label: "FALSE", insert: "FALSO", desc: "falso" },
                    ].map((op) => (
                      <button
                        key={op.label}
                        type="button"
                        onClick={() => insertAtCursor(op.insert)}
                        className="h-9 rounded-md border bg-card hover:bg-accent transition-colors flex items-center justify-center flex-col cursor-pointer"
                      >
                        <span className="text-[11px] font-bold font-mono">{op.label}</span>
                        <span className="text-[8px] text-muted-foreground">{op.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Syntax reference */}
                <div className="rounded-lg bg-muted/50 p-2.5 space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground">Referencia rápida:</p>
                  <div className="grid grid-cols-1 gap-1 text-[10px]">
                    {[
                      { syntax: "{colId}", desc: "Referencia a columna" },
                      { syntax: "{refCol.targetCol}", desc: "Referencia cruzada" },
                      { syntax: '"texto"', desc: "Texto literal" },
                      { syntax: "SI(cond, sí, no)", desc: "Condicional" },
                      { syntax: "VERDADERO / FALSO", desc: "Booleanos" },
                    ].map((ref) => (
                      <div key={ref.syntax} className="flex items-center gap-2">
                        <code className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 rounded shrink-0">
                          {ref.syntax}
                        </code>
                        <span className="text-muted-foreground">{ref.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live preview */}
      {showPreview && (
        <AnimatePresence mode="wait">
          {previewResult !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg border bg-card p-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Resultado:
                </span>
                <span
                  className={cn(
                    "text-xs font-mono",
                    typeof previewResult === "string" && previewResult.startsWith("⚠")
                      ? "text-destructive"
                      : "text-foreground font-semibold"
                  )}
                >
                  {previewResult || "—"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Help text */}
      <p className="text-[10px] text-muted-foreground">{helpText}</p>
    </div>
  )
}
