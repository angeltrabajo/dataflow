"use client"

import React, { useState, useMemo } from "react"
import { type Column, type Project } from "@/lib/store"
import {
  SPANISH_FORMULA_FNS,
  FORMULA_CATEGORIES,
  getColumnTypeIcon,
  getColumnTypeColor,
  evaluateFormula,
  formatFormulaResult,
} from "@/lib/helpers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink } from "lucide-react"

// ─── Function category colors ───
const FN_CATEGORY_COLORS: Record<string, string> = {
  logica: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  matematicas: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  texto: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  fecha: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  busqueda: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
}

const FN_CATEGORY_DOT_COLORS: Record<string, string> = {
  logica: "bg-violet-500",
  matematicas: "bg-blue-500",
  texto: "bg-emerald-500",
  fecha: "bg-amber-500",
  busqueda: "bg-rose-500",
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
}

interface FormulaBuilderProps {
  value: string
  onChange: (v: string) => void
  columns: Column[]
  project: Project
  projects: Project[]
  currentProjectId: string
}

export function FormulaBuilder({
  value,
  onChange,
  columns,
  project,
  projects,
  currentProjectId,
}: FormulaBuilderProps) {
  const [activeTab, setActiveTab] = useState("campos")

  // Live preview: evaluate the formula using the first row of the current table
  const previewResult = useMemo(() => {
    if (!value.trim()) return null
    const firstRow = project.tables
      .flatMap(t => t.rows)
      .find(() => true) // Get first row from any table in the project
    if (!firstRow) return null

    try {
      // Try with the first table's first row for preview
      const firstTable = project.tables[0]
      if (!firstTable || firstTable.rows.length === 0) return null
      const row = firstTable.rows[0]
      const result = evaluateFormula(value, row, firstTable.columns, projects, currentProjectId)
      return formatFormulaResult(result, value)
    } catch {
      return "⚠ Error"
    }
  }, [value, project, projects, currentProjectId])

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = React.useCallback(
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

  // Group functions by category
  const functionsByCategory = useMemo(() => {
    const grouped: Record<string, [string, typeof SPANISH_FORMULA_FNS[string]][]> = {}
    for (const [key, fn] of Object.entries(SPANISH_FORMULA_FNS)) {
      if (!grouped[fn.category]) grouped[fn.category] = []
      grouped[fn.category].push([key, fn])
    }
    return grouped
  }, [])

  // Filter columns excluding formula/autonumber (which can't be referenced meaningfully)
  const referenceableColumns = columns.filter(c => c.type !== "formula" && c.type !== "autonumber")

  // Cross-table references: find reference columns and list their target table columns
  const crossTableRefs = useMemo(() => {
    const refs: { refColId: string; refColName: string; targetTable: { id: string; name: string; emoji: string }; targetColumns: { id: string; name: string; type: string }[] }[] = []
    for (const col of columns) {
      if (col.type === "reference" && col.refTableId) {
        const refTable = project.tables.find(t => t.id === col.refTableId)
        if (refTable) {
          refs.push({
            refColId: col.id,
            refColName: col.name,
            targetTable: { id: refTable.id, name: refTable.name, emoji: refTable.emoji },
            targetColumns: refTable.columns
              .filter(c => c.type !== "formula" && c.type !== "autonumber")
              .map(c => ({ id: c.id, name: c.name, type: c.type }))
          })
        }
      }
    }
    return refs
  }, [columns, project])

  return (
    <div className="space-y-3">
      {/* Formula input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Fórmula</label>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: {col-precio} * {col-cantidad}"
          className="font-mono text-sm bg-muted border-0 rounded-lg min-h-[56px] resize-y focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          rows={2}
        />
      </div>

      {/* Tabs: Campos / Funciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-9">
          <TabsTrigger value="campos" className="flex-1 text-xs">
            Campos
          </TabsTrigger>
          <TabsTrigger value="funciones" className="flex-1 text-xs">
            Funciones
          </TabsTrigger>
        </TabsList>

        {/* Campos tab */}
        <TabsContent value="campos" className="mt-2">
          <div className="max-h-48 overflow-y-auto rounded-lg border bg-card custom-scrollbar">
            {referenceableColumns.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground text-center">
                No hay columnas disponibles
              </p>
            ) : (
              <div className="divide-y">
                {referenceableColumns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => insertColumnRef(col.id)}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-accent/50 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold shrink-0",
                        getColumnTypeColor(col.type)
                      )}
                    >
                      {getColumnTypeIcon(col.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{col.name}</span>
                    </div>
                    <code className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {`{${col.id}}`}
                    </code>
                  </button>
                ))}
              </div>
            )}

            {/* Cross-table references */}
            {crossTableRefs.length > 0 && (
              <>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  Campos de otras tablas
                </div>
                {crossTableRefs.map(ref => (
                  <React.Fragment key={ref.refColId}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground bg-muted/30">
                      {ref.targetTable.emoji} {ref.targetTable.name} (vía {ref.refColName})
                    </div>
                    {ref.targetColumns.map(tc => (
                      <button
                        key={`${ref.refColId}.${tc.id}`}
                        type="button"
                        onClick={() => insertColumnRef(`${ref.refColId}.${tc.id}`)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <span className="text-[10px] opacity-50">{getColumnTypeIcon(tc.type as Column["type"])}</span>
                        <span className="text-sm">{tc.name}</span>
                        <code className="text-[9px] text-muted-foreground font-mono ml-auto">
                          {`{${ref.refColId}.${tc.id}}`}
                        </code>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        {/* Funciones tab */}
        <TabsContent value="funciones" className="mt-2">
          <div className="max-h-64 overflow-y-auto rounded-lg border bg-card custom-scrollbar">
            {FORMULA_CATEGORIES.map((cat) => {
              const fns = functionsByCategory[cat.key]
              if (!fns || fns.length === 0) return null

              return (
                <div key={cat.key} className="divide-y">
                  {/* Category header */}
                  <div className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider", FN_CATEGORY_COLORS[cat.key])}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", FN_CATEGORY_DOT_COLORS[cat.key])} />
                      {cat.label}
                    </span>
                  </div>

                  {/* Function items */}
                  {fns.map(([fnKey, fn]) => (
                    <button
                      key={fnKey}
                      type="button"
                      onClick={() => insertFormulaFn(fnKey)}
                      className="flex items-start gap-2.5 w-full px-3 py-2.5 text-left hover:bg-accent/50 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span
                        className={cn(
                          "inline-flex h-5 items-center rounded px-1.5 text-[10px] font-bold shrink-0 mt-0.5",
                          FN_CATEGORY_COLORS[cat.key]
                        )}
                      >
                        fx
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold">{fn.name}</span>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                          {fn.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Live preview */}
      <AnimatePresence mode="wait">
        {previewResult !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="rounded-lg border bg-card p-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Resultado:
              </span>
              <span
                className={cn(
                  "text-sm font-mono",
                  typeof previewResult === "string" && previewResult.startsWith("⚠")
                    ? "text-destructive"
                    : "text-foreground font-semibold"
                )}
              >
                {previewResult || "—"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Vista previa usando el primer registro de la tabla
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
