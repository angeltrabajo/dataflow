"use client"

import React, { useState, useCallback } from "react"
import { type Column, type ColumnDisplayMode, type Project } from "@/lib/store"
import { getColumnTypeIcon, getColumnTypeColor, evaluateFormula, formatFormulaResult } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, ExternalLink, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ColumnPreviewProps {
  column: Column
  project: Project
  projects: Project[]
  currentProjectId: string
}

export function ColumnPreview({ column, project, projects, currentProjectId }: ColumnPreviewProps) {
  const isVirtual = !!column.virtual
  const isReadOnly = !!column.readOnly || isVirtual
  const displayMode: ColumnDisplayMode = column.displayMode || "default"

  // Compute a preview value for formula columns
  const formulaPreviewValue = React.useMemo(() => {
    if (column.type !== "formula" || !column.formula) return ""
    try {
      const firstTable = project.tables[0]
      if (!firstTable || firstTable.rows.length === 0) return ""
      const result = evaluateFormula(column.formula, firstTable.rows[0], firstTable.columns, projects, currentProjectId)
      return formatFormulaResult(result, column.formula)
    } catch {
      return "⚠ Error"
    }
  }, [column, project, projects, currentProjectId])

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Vista Previa
        </span>
        {isVirtual && (
          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
            virtual
          </span>
        )}
        {isReadOnly && !isVirtual && (
          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
            solo lectura
          </span>
        )}
        {column.type === "autonumber" && (
          <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
            automático
          </span>
        )}
      </div>

      {/* Field label */}
      <Label className="text-sm flex items-center gap-1.5">
        <span className="text-[10px] opacity-50">{getColumnTypeIcon(column.type)}</span>
        {column.name || "Sin nombre"}
        {column.required && <span className="text-destructive ml-0.5">*</span>}
        {column.type === "reference" && <ExternalLink className="h-3 w-3 text-rose-400" />}
      </Label>

      {/* Field widget */}
      <PreviewFieldWidget
        column={column}
        displayMode={displayMode}
        formulaPreviewValue={formulaPreviewValue}
        project={project}
      />

      {/* Help text */}
      {column.helpText && (
        <p className="text-[10px] text-muted-foreground">{column.helpText}</p>
      )}

      {/* Prefix/Suffix info */}
      {(column.prefix || column.suffix) && (
        <p className="text-[10px] text-muted-foreground">
          {column.prefix && `Prefijo: "${column.prefix}"`}
          {column.prefix && column.suffix && " · "}
          {column.suffix && `Sufijo: "${column.suffix}"`}
        </p>
      )}
    </div>
  )
}

// ─── Preview Field Widget (INTERACTIVE) ───
function PreviewFieldWidget({
  column,
  displayMode,
  formulaPreviewValue,
  project,
}: {
  column: Column
  displayMode: ColumnDisplayMode
  formulaPreviewValue: string
  project: Project
}) {
  const placeholder = column.placeholder || undefined
  const isReadOnly = !!column.readOnly || !!column.virtual

  // Shared interactive state (all hooks at top level to follow React rules)
  const [textValue, setTextValue] = useState("")
  const [numberValue, setNumberValue] = useState("")
  const [sliderValue, setSliderValue] = useState([50])
  const [stepperValue, setStepperValue] = useState(0)
  const [selectValue, setSelectValue] = useState("")
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [dateValue, setDateValue] = useState("")
  const [multiValues, setMultiValues] = useState<string[]>([])

  // Reset state when column changes to avoid stale values
  React.useEffect(() => {
    setTextValue("")
    setNumberValue("")
    setSliderValue([50])
    setStepperValue(0)
    setSelectValue("")
    setCheckboxValue(false)
    setRatingValue(0)
    setDateValue("")
    setMultiValues([])
  }, [column.id])

  const handleStepperChange = useCallback((delta: number) => {
    setStepperValue(prev => {
      const min = column.minValue ?? -Infinity
      const max = column.maxValue ?? Infinity
      const step = column.step ?? 1
      const next = prev + delta * step
      return Math.min(max, Math.max(min, next))
    })
  }, [column.minValue, column.maxValue, column.step])

  const handleRatingClick = useCallback((star: number) => {
    setRatingValue(prev => prev === star ? 0 : star)
  }, [])

  switch (column.type) {
    // ─── Text types ───
    case "text": {
      if (displayMode === "textarea") {
        return (
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={placeholder || "Escribe aquí..."}
            readOnly={isReadOnly}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        )
      }
      return (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={placeholder || "Texto..."}
          className="h-9"
          disabled={isReadOnly}
        />
      )
    }

    case "email":
      return (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={placeholder || "correo@ejemplo.com"}
          type="email"
          className="h-9"
          disabled={isReadOnly}
        />
      )

    case "phone":
      return (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={placeholder || "+52 55 1234 5678"}
          type="tel"
          className="h-9"
          disabled={isReadOnly}
        />
      )

    case "url":
      return (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={placeholder || "https://ejemplo.com"}
          type="url"
          className="h-9"
          disabled={isReadOnly}
        />
      )

    // ─── Number types ───
    case "number": {
      if (displayMode === "slider") {
        const sliderMin = column.minValue ?? 0
        const sliderMax = column.maxValue ?? 100
        return (
          <div className="flex items-center gap-3 h-9">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={sliderMin}
              max={sliderMax}
              step={column.step ?? 1}
              disabled={isReadOnly}
              className="flex-1"
            />
            <span className="text-sm font-medium tabular-nums">{sliderValue[0]}</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      if (displayMode === "stepper") {
        return (
          <div className="flex items-center gap-1">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleStepperChange(-1)}
              disabled={isReadOnly}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="number"
              value={stepperValue}
              onChange={(e) => setStepperValue(Number(e.target.value))}
              placeholder={placeholder || "0"}
              className="h-9 text-center w-16"
              disabled={isReadOnly}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleStepperChange(1)}
              disabled={isReadOnly}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      if (displayMode === "progress") {
        const progressMax = column.maxValue ?? 100
        const previewVal = sliderValue[0]
        const pct = Math.min(100, Math.max(0, (previewVal / progressMax) * 100))
        return (
          <div className="flex items-center gap-2 h-9">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Progress value={pct} className="flex-1 h-3" />
            <span className="text-xs font-medium tabular-nums">{previewVal}</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1">
          {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
          <Input
            type="number"
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            placeholder={placeholder || "0"}
            className="h-9"
            disabled={isReadOnly}
          />
          {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
        </div>
      )
    }

    case "currency": {
      if (displayMode === "stepper") {
        return (
          <div className="flex items-center gap-1">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleStepperChange(-1)}
              disabled={isReadOnly}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="number"
              value={stepperValue}
              onChange={(e) => setStepperValue(Number(e.target.value))}
              placeholder={placeholder || "0.00"}
              className="h-9 text-center w-20"
              disabled={isReadOnly}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleStepperChange(1)}
              disabled={isReadOnly}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      if (displayMode === "slider") {
        const sliderMin = column.minValue ?? 0
        const sliderMax = column.maxValue ?? 1000
        return (
          <div className="flex items-center gap-3 h-9">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={sliderMin}
              max={sliderMax}
              step={column.step ?? 1}
              disabled={isReadOnly}
              className="flex-1"
            />
            <span className="text-sm font-medium tabular-nums">{sliderValue[0]}</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      if (displayMode === "progress") {
        const progressMax = column.maxValue ?? 1000
        const previewVal = sliderValue[0]
        const pct = Math.min(100, Math.max(0, (previewVal / progressMax) * 100))
        return (
          <div className="flex items-center gap-2 h-9">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Progress value={pct} className="flex-1 h-3" />
            <span className="text-xs font-medium tabular-nums">{previewVal}</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1">
          {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
          <Input
            type="number"
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            placeholder={placeholder || "$0.00"}
            className="h-9"
            disabled={isReadOnly}
          />
          {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
        </div>
      )
    }

    case "percentage": {
      if (displayMode === "slider") {
        const sliderMin = column.minValue ?? 0
        const sliderMax = column.maxValue ?? 100
        return (
          <div className="flex items-center gap-3 h-9">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={sliderMin}
              max={sliderMax}
              step={column.step ?? 1}
              disabled={isReadOnly}
              className="flex-1"
            />
            <span className="text-sm font-medium tabular-nums">{sliderValue[0]}%</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      if (displayMode === "stepper") {
        return (
          <div className="flex items-center gap-1">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleStepperChange(-1)}
              disabled={isReadOnly}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="number"
              value={stepperValue}
              onChange={(e) => setStepperValue(Number(e.target.value))}
              placeholder={placeholder || "0"}
              className="h-9 text-center w-16"
              disabled={isReadOnly}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleStepperChange(1)}
              disabled={isReadOnly}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm text-muted-foreground">%</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      if (displayMode === "progress") {
        const progressMax = column.maxValue ?? 100
        const previewVal = sliderValue[0]
        const pct = Math.min(100, Math.max(0, (previewVal / progressMax) * 100))
        return (
          <div className="flex items-center gap-2 h-9">
            {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
            <Progress value={pct} className="flex-1 h-3" />
            <span className="text-xs font-medium tabular-nums">{previewVal}%</span>
            {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
          </div>
        )
      }

      return (
        <div className="relative flex items-center gap-1">
          {column.prefix && <span className="text-sm text-muted-foreground">{column.prefix}</span>}
          <div className="relative flex-1">
            <Input
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(e.target.value)}
              placeholder={placeholder || "0"}
              className="h-9 pr-8"
              disabled={isReadOnly}
            />
            {!column.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>}
          </div>
          {column.suffix && <span className="text-sm text-muted-foreground">{column.suffix}</span>}
        </div>
      )
    }

    // ─── Date ───
    case "date":
      return (
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          placeholder={placeholder}
          className="h-9"
          disabled={isReadOnly}
        />
      )

    // ─── Select ───
    case "select": {
      const options = column.options || []

      if (displayMode === "buttons") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {options.length > 0 ? options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectValue(prev => prev === opt ? "" : opt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer min-h-[36px]",
                  selectValue === opt
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border-input bg-background text-foreground hover:bg-accent/50"
                )}
              >
                {column.optionColors?.[opt] && (
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: column.optionColors[opt] }} />
                )}
                {opt}
              </button>
            )) : (
              <span className="text-xs text-muted-foreground">Sin opciones</span>
            )}
          </div>
        )
      }

      if (displayMode === "chips") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {options.length > 0 ? options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectValue(prev => prev === opt ? "" : opt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer min-h-[36px]",
                  selectValue === opt
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-muted text-muted-foreground hover:bg-accent/50"
                )}
              >
                {column.optionColors?.[opt] && (
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: column.optionColors[opt] }} />
                )}
                {opt}
              </button>
            )) : (
              <span className="text-xs text-muted-foreground">Sin opciones</span>
            )}
          </div>
        )
      }

      if (displayMode === "badge") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {options.length > 0 ? options.slice(0, 4).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectValue(prev => prev === opt ? "" : opt)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer min-h-[36px]",
                  selectValue === opt
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent/50"
                )}
              >
                {column.optionColors?.[opt] && (
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: column.optionColors[opt] }} />
                )}
                {opt}
              </button>
            )) : (
              <span className="text-xs text-muted-foreground">Sin opciones</span>
            )}
            {options.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{options.length - 4} más</span>
            )}
          </div>
        )
      }

      // Default dropdown
      return (
        <Select value={selectValue || undefined} onValueChange={setSelectValue} disabled={isReadOnly}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={placeholder || "Seleccionar..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // ─── Multiselect ───
    case "multiselect": {
      const options = column.options || []

      const toggleOption = (opt: string) => {
        setMultiValues(prev =>
          prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]
        )
      }

      if (displayMode === "buttons") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {options.length > 0 ? options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer min-h-[36px]",
                  multiValues.includes(opt)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border-input bg-background text-foreground hover:bg-accent/50"
                )}
              >
                {opt}
              </button>
            )) : (
              <span className="text-xs text-muted-foreground">Sin opciones</span>
            )}
          </div>
        )
      }

      // Default chips
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.length > 0 ? options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer min-h-[32px]",
                multiValues.includes(opt)
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                  : "bg-muted text-muted-foreground hover:bg-accent/50"
              )}
            >
              {opt}
            </button>
          )) : (
            <span className="text-xs text-muted-foreground">Sin opciones</span>
          )}
        </div>
      )
    }

    // ─── Checkbox ───
    case "checkbox": {
      if (displayMode === "toggle") {
        return (
          <div className="flex items-center gap-2 h-9">
            <Switch
              checked={checkboxValue}
              onCheckedChange={(checked) => setCheckboxValue(checked === true)}
              disabled={isReadOnly}
            />
            <span className="text-sm text-muted-foreground">{checkboxValue ? "Sí" : "No"}</span>
          </div>
        )
      }
      return (
        <div className="flex items-center gap-2 h-9">
          <Checkbox
            checked={checkboxValue}
            onCheckedChange={(checked) => setCheckboxValue(checked === true)}
            disabled={isReadOnly}
          />
          <span className="text-sm text-muted-foreground">{checkboxValue ? "Sí" : "No"}</span>
        </div>
      )
    }

    // ─── Rating ───
    case "rating": {
      const max = column.ratingMax || 5
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: max }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleRatingClick(i + 1)}
              aria-label={`${i + 1} estrellas`}
              className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center border-0 bg-transparent cursor-pointer"
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  i < ratingValue
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30 hover:text-yellow-400/50"
                )}
              />
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{ratingValue}/{max}</span>
        </div>
      )
    }

    // ─── Reference ───
    case "reference": {
      const refTable = project.tables.find(t => t.id === column.refTableId)
      if (!refTable) {
        return <Input value="Seleccionar tabla primero" disabled className="h-9" />
      }

      // Show interactive dropdown with ref table rows
      const refRows = (refTable.rows || []).filter(Boolean)
      const displayCol = column.refDisplayColId
        ? refTable.columns.find(c => c.id === column.refDisplayColId)
        : refTable.columns[0]

      return (
        <Select value={selectValue || undefined} onValueChange={setSelectValue} disabled={isReadOnly}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={placeholder || `Seleccionar de ${refTable.name}...`} />
          </SelectTrigger>
          <SelectContent>
            {refRows.slice(0, 20).map((row) => (
              <SelectItem key={row.id} value={row.id}>
                {displayCol ? (row[displayCol.id] ?? "—") : `Registro ${row.id.slice(-4)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // ─── Formula ───
    case "formula": {
      return (
        <div className="flex items-center gap-2 h-9 rounded-md border bg-muted/50 px-3">
          <span className="text-[10px] font-bold text-muted-foreground">fx</span>
          <span className="text-sm text-muted-foreground">
            {formulaPreviewValue || "Resultado de la fórmula"}
          </span>
        </div>
      )
    }

    // ─── Autonumber ───
    case "autonumber": {
      const prefix = column.autonumberPrefix || ""
      const digits = column.autonumberDigits || 3
      const previewNum = String(1).padStart(digits, "0")
      return (
        <div className="flex items-center gap-2 h-9 rounded-md border bg-muted/50 px-3">
          <span className="text-sm font-mono text-muted-foreground">
            {prefix}{previewNum}
          </span>
          <Badge variant="secondary" className="text-[9px] h-4 ml-auto">auto</Badge>
        </div>
      )
    }

    default:
      return (
        <Input value="Tipo desconocido" disabled className="h-9" />
      )
  }
}
