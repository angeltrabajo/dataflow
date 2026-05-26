"use client"

import React, { useMemo } from "react"
import { type Project } from "@/lib/store"
import { getColumnTypeIcon, getColumnTypeColor } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"

// ─── Step definitions ───
const STEPS = [
  { num: 1, title: "Tabla destino", desc: "Elige la tabla a vincular" },
  { num: 2, title: "Columna a mostrar", desc: "Qué se verá al seleccionar" },
  { num: 3, title: "Copiar datos", desc: "Auto-rellenar al seleccionar (opcional)" },
  { num: 4, title: "Copiar inverso", desc: "Escribir en tabla referenciada (opcional)" },
  { num: 5, title: "Operaciones", desc: "Actualizar al agregar/eliminar (opcional)" },
]

type RefOperation = { targetColId: string; operation: "subtract" | "add"; sourceColId: string }

interface ReferenceBuilderProps {
  refTableId: string
  setRefTableId: (v: string) => void
  refDisplayColId: string
  setRefDisplayColId: (v: string) => void
  refAutoFill: { sourceColId: string; targetColId: string }[]
  setRefAutoFill: (v: { sourceColId: string; targetColId: string }[]) => void
  refAutoFillReverse?: { sourceColId: string; targetColId: string }[]
  setRefAutoFillReverse?: (v: { sourceColId: string; targetColId: string }[]) => void
  refOnAdd: RefOperation[]
  setRefOnAdd: (v: RefOperation[]) => void
  refOnDelete: RefOperation[]
  setRefOnDelete: (v: RefOperation[]) => void
  project: Project
  currentTableId: string
}

export function ReferenceBuilder({
  refTableId,
  setRefTableId,
  refDisplayColId,
  setRefDisplayColId,
  refAutoFill,
  setRefAutoFill,
  refAutoFillReverse,
  setRefAutoFillReverse,
  refOnAdd,
  setRefOnAdd,
  refOnDelete,
  setRefOnDelete,
  project,
  currentTableId,
}: ReferenceBuilderProps) {
  const [currentStep, setCurrentStep] = React.useState(1)

  // Available tables (exclude current)
  const availableTables = useMemo(() => {
    return project.tables.filter(t => t.id !== currentTableId)
  }, [project.tables, currentTableId])

  // Selected ref table
  const refTable = useMemo(() => {
    if (!refTableId) return null
    return project.tables.find(t => t.id === refTableId) ?? null
  }, [refTableId, project.tables])

  // Current table (for target column dropdowns)
  const currentTable = useMemo(() => {
    return project.tables.find(t => t.id === currentTableId) ?? null
  }, [currentTableId, project.tables])

  // Numeric columns in ref table (for onAdd/onDelete source)
  const refNumericCols = useMemo(() => {
    if (!refTable) return []
    return refTable.columns.filter(c =>
      c.type === "number" || c.type === "currency" || c.type === "percentage"
    )
  }, [refTable])

  // Numeric columns in current table (for onAdd/onDelete target)
  const currentNumericCols = useMemo(() => {
    if (!currentTable) return []
    return currentTable.columns.filter(c =>
      c.type === "number" || c.type === "currency" || c.type === "percentage"
    )
  }, [currentTable])

  // All columns in current table for autofill targets
  const currentColumns = useMemo(() => {
    if (!currentTable) return []
    return currentTable.columns
  }, [currentTable])

  const canGoNext = () => {
    if (currentStep === 1) return !!refTableId
    if (currentStep === 2) return !!refDisplayColId
    return true
  }

  const handleNext = () => {
    if (canGoNext() && currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Auto-fill helpers
  const addAutoFillMapping = () => {
    setRefAutoFill([...refAutoFill, { sourceColId: "", targetColId: "" }])
  }

  const removeAutoFillMapping = (idx: number) => {
    setRefAutoFill(refAutoFill.filter((_, i) => i !== idx))
  }

  const updateAutoFillMapping = (idx: number, field: "sourceColId" | "targetColId", val: string) => {
    const updated = [...refAutoFill]
    updated[idx] = { ...updated[idx], [field]: val }
    setRefAutoFill(updated)
  }

  // Reverse auto-fill helpers (current table → referenced table)
  const internalReverse = refAutoFillReverse || []
  const setInternalReverse = setRefAutoFillReverse || (() => {})

  const addReverseMapping = () => {
    setInternalReverse([...internalReverse, { sourceColId: "", targetColId: "" }])
  }

  const removeReverseMapping = (idx: number) => {
    setInternalReverse(internalReverse.filter((_, i) => i !== idx))
  }

  const updateReverseMapping = (idx: number, field: "sourceColId" | "targetColId", val: string) => {
    const updated = [...internalReverse]
    updated[idx] = { ...updated[idx], [field]: val }
    setInternalReverse(updated)
  }

  // Operation helpers (for arrays)
  const addOnAddOp = () => {
    setRefOnAdd([...refOnAdd, { targetColId: "", operation: "subtract", sourceColId: "" }])
  }

  const removeOnAddOp = (idx: number) => {
    setRefOnAdd(refOnAdd.filter((_, i) => i !== idx))
  }

  const updateOnAddOp = (idx: number, field: keyof RefOperation, val: string) => {
    const updated = [...refOnAdd]
    updated[idx] = { ...updated[idx], [field]: field === "operation" ? val as "subtract" | "add" : val }
    setRefOnAdd(updated)
  }

  const addOnDeleteOp = () => {
    setRefOnDelete([...refOnDelete, { targetColId: "", operation: "add", sourceColId: "" }])
  }

  const removeOnDeleteOp = (idx: number) => {
    setRefOnDelete(refOnDelete.filter((_, i) => i !== idx))
  }

  const updateOnDeleteOp = (idx: number, field: keyof RefOperation, val: string) => {
    const updated = [...refOnDelete]
    updated[idx] = { ...updated[idx], [field]: field === "operation" ? val as "subtract" | "add" : val }
    setRefOnDelete(updated)
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all",
                  currentStep === step.num
                    ? "bg-emerald-500 scale-125"
                    : currentStep > step.num
                      ? "bg-emerald-300 dark:bg-emerald-700"
                      : "bg-muted-foreground/20"
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-medium leading-tight text-center max-w-[60px]",
                  currentStep === step.num ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 mt-[-12px]",
                  currentStep > step.num ? "bg-emerald-300 dark:bg-emerald-700" : "bg-muted-foreground/15"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="min-h-[180px]"
        >
          {/* ─── Step 1: Choose table ─── */}
          {currentStep === 1 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Tabla destino</h3>
              <p className="text-xs text-muted-foreground">Selecciona la tabla a la que quieres vincular</p>
              <div className="grid grid-cols-2 gap-2">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      setRefTableId(table.id)
                      setRefDisplayColId("") // Reset display col when table changes
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all cursor-pointer min-h-[72px]",
                      refTableId === table.id
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-900/30"
                        : "border-border bg-card hover:bg-accent/50"
                    )}
                  >
                    <span className="text-xl">{table.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{table.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {table.columns.length} col · {table.rows.length} filas
                    </span>
                  </button>
                ))}
              </div>
              {availableTables.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay otras tablas en este proyecto
                </p>
              )}
            </div>
          )}

          {/* ─── Step 2: Choose display column ─── */}
          {currentStep === 2 && refTable && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Columna a mostrar</h3>
              <p className="text-xs text-muted-foreground">
                ¿Qué campo de <strong>{refTable.name}</strong> se mostrará al seleccionar?
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                {refTable.columns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setRefDisplayColId(col.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer min-h-[44px]",
                      refDisplayColId === col.id
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-900/30"
                        : "border-border bg-card hover:bg-accent/50"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold shrink-0",
                        getColumnTypeColor(col.type)
                      )}
                    >
                      {getColumnTypeIcon(col.type)}
                    </span>
                    <span className="text-sm font-medium">{col.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {col.type}
                    </span>
                    {refDisplayColId === col.id && (
                      <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <span className="text-[8px] text-white font-bold">✓</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 3: Auto-fill mappings ─── */}
          {currentStep === 3 && refTable && currentTable && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Copiar datos automáticamente</h3>
              <p className="text-xs text-muted-foreground">
                Al seleccionar un registro de <strong>{refTable.name}</strong>, copiar estos valores:
              </p>

              {refAutoFill.length === 0 && (
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground mb-2">Sin mapeos configurados</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAutoFillMapping}
                    className="gap-1 text-xs h-8"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar mapeo
                  </Button>
                </div>
              )}

              {refAutoFill.map((mapping, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border bg-card p-2.5"
                >
                  {/* Source column (from ref table) */}
                  <Select
                    value={mapping.sourceColId || "__none__"}
                    onValueChange={(v) => updateAutoFillMapping(idx, "sourceColId", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                      <SelectValue placeholder="Copiar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seleccionar...</SelectItem>
                      {refTable.columns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground text-xs shrink-0">→</span>

                  {/* Target column (in current table) */}
                  <Select
                    value={mapping.targetColId || "__none__"}
                    onValueChange={(v) => updateAutoFillMapping(idx, "targetColId", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                      <SelectValue placeholder="Hacia..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seleccionar...</SelectItem>
                      {currentColumns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeAutoFillMapping(idx)}
                    className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {refAutoFill.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAutoFillMapping}
                  className="gap-1 text-xs h-8 w-full"
                >
                  <Plus className="h-3 w-3" />
                  Agregar otro mapeo
                </Button>
              )}
            </div>
          )}

          {/* ─── Step 4: Reverse auto-fill (current table → referenced table) ─── */}
          {currentStep === 4 && refTable && currentTable && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Copiar datos en sentido inverso</h3>
              <p className="text-xs text-muted-foreground">
                Al guardar un registro, copiar estos valores de <strong>{currentTable.name}</strong> hacia el registro de <strong>{refTable.name}</strong>:
              </p>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-2.5">
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Ejemplo: Al registrar un cliente en una venta, copiar su tipo de cliente hacia la tabla de clientes automáticamente.
                </p>
              </div>

              {internalReverse.length === 0 && (
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground mb-2">Sin mapeos inversos configurados</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReverseMapping}
                    className="gap-1 text-xs h-8"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar mapeo inverso
                  </Button>
                </div>
              )}

              {internalReverse.map((mapping, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border bg-card p-2.5"
                >
                  {/* Source column (from current table) */}
                  <Select
                    value={mapping.sourceColId || "__none__"}
                    onValueChange={(v) => updateReverseMapping(idx, "sourceColId", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                      <SelectValue placeholder="Copiar de aquí..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seleccionar...</SelectItem>
                      {currentColumns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground text-xs shrink-0">→</span>

                  {/* Target column (in referenced table) */}
                  <Select
                    value={mapping.targetColId || "__none__"}
                    onValueChange={(v) => updateReverseMapping(idx, "targetColId", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                      <SelectValue placeholder="Pegar allá..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seleccionar...</SelectItem>
                      {refTable.columns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeReverseMapping(idx)}
                    className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {internalReverse.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReverseMapping}
                  className="gap-1 text-xs h-8 w-full"
                >
                  <Plus className="h-3 w-3" />
                  Agregar otro mapeo inverso
                </Button>
              )}
            </div>
          )}

          {/* ─── Step 5: On-add / On-delete operations (array support) ─── */}
          {currentStep === 5 && refTable && currentTable && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Actualizar tabla referenciada</h3>
              <p className="text-xs text-muted-foreground">
                Cuando se agrega o elimina un registro aquí, actualizar campos en <strong>{refTable.name}</strong> autom&aacute;ticamente
              </p>
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-2.5">
                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                  Ejemplo: Al registrar una venta, restar la cantidad del stock del producto. Al eliminar la venta, devolver el stock.
                </p>
              </div>

              {/* On Add operations */}
              <div className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Al agregar un registro</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOnAddOp}
                    className="h-7 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar operación
                  </Button>
                </div>

                {refOnAdd.length === 0 && (
                  <p className="text-[11px] text-muted-foreground py-1">Sin operaciones configuradas</p>
                )}

                {refOnAdd.map((op, idx) => (
                  <div key={idx} className="space-y-1.5 pt-1 border-t first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] text-muted-foreground flex-1">
                        Se
                        <Select
                          value={op.operation}
                          onValueChange={(v) => updateOnAddOp(idx, "operation", v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] inline-flex w-auto mx-1 min-w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="subtract">restará</SelectItem>
                            <SelectItem value="add">sumará</SelectItem>
                          </SelectContent>
                        </Select>
                        el campo
                        <Select
                          value={op.sourceColId || "__none__"}
                          onValueChange={(v) => updateOnAddOp(idx, "sourceColId", v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] inline-flex w-auto mx-1 min-w-[100px]">
                            <SelectValue placeholder="campo origen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Seleccionar...</SelectItem>
                            {currentNumericCols.map((col) => (
                              <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        al campo
                        <Select
                          value={op.targetColId || "__none__"}
                          onValueChange={(v) => updateOnAddOp(idx, "targetColId", v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] inline-flex w-auto mx-1 min-w-[100px]">
                            <SelectValue placeholder="campo destino" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Seleccionar...</SelectItem>
                            {refNumericCols.map((col) => (
                              <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        de la tabla referenciada
                      </p>
                      <button
                        type="button"
                        onClick={() => removeOnAddOp(idx)}
                        className="h-6 w-6 shrink-0 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* On Delete operations */}
              <div className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Al eliminar un registro</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOnDeleteOp}
                    className="h-7 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar operación
                  </Button>
                </div>

                {refOnDelete.length === 0 && (
                  <p className="text-[11px] text-muted-foreground py-1">Sin operaciones configuradas</p>
                )}

                {refOnDelete.map((op, idx) => (
                  <div key={idx} className="space-y-1.5 pt-1 border-t first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] text-muted-foreground flex-1">
                        Se
                        <Select
                          value={op.operation}
                          onValueChange={(v) => updateOnDeleteOp(idx, "operation", v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] inline-flex w-auto mx-1 min-w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="subtract">restará</SelectItem>
                            <SelectItem value="add">sumará</SelectItem>
                          </SelectContent>
                        </Select>
                        el campo
                        <Select
                          value={op.sourceColId || "__none__"}
                          onValueChange={(v) => updateOnDeleteOp(idx, "sourceColId", v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] inline-flex w-auto mx-1 min-w-[100px]">
                            <SelectValue placeholder="campo origen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Seleccionar...</SelectItem>
                            {currentNumericCols.map((col) => (
                              <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        al campo
                        <Select
                          value={op.targetColId || "__none__"}
                          onValueChange={(v) => updateOnDeleteOp(idx, "targetColId", v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] inline-flex w-auto mx-1 min-w-[100px]">
                            <SelectValue placeholder="campo destino" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Seleccionar...</SelectItem>
                            {refNumericCols.map((col) => (
                              <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        de la tabla referenciada
                      </p>
                      <button
                        type="button"
                        onClick={() => removeOnDeleteOp(idx)}
                        className="h-6 w-6 shrink-0 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="gap-1 h-9 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentStep} de {STEPS.length}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext() || currentStep === 5}
          className="gap-1 h-9 text-xs"
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
