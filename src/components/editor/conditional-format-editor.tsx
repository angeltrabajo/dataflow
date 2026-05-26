"use client"

import React, { useState } from "react"
import { useAppStore, ConditionalFormatRule } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Palette, ChevronDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormulaAssistant } from "@/components/editor/formula-assistant"

// ═══════════════════════════════════════════════════════════════
// COLOR PRESETS
// ═══════════════════════════════════════════════════════════════

export const BG_COLOR_PRESETS = [
  { label: "Rojo", value: "#fef2f2" },
  { label: "Naranja", value: "#fff7ed" },
  { label: "Ámbar", value: "#fffbeb" },
  { label: "Amarillo", value: "#fefce8" },
  { label: "Lima", value: "#f7fee7" },
  { label: "Verde", value: "#f0fdf4" },
  { label: "Esmeralda", value: "#ecfdf5" },
  { label: "Teal", value: "#f0fdfa" },
  { label: "Cian", value: "#ecfeff" },
  { label: "Azul", value: "#eff6ff" },
  { label: "Índigo", value: "#eef2ff" },
  { label: "Violeta", value: "#f5f3ff" },
  { label: "Púrpura", value: "#faf5ff" },
  { label: "Fucsia", value: "#fdf4ff" },
  { label: "Rosa", value: "#fdf2f8" },
  { label: "Rosa osc.", value: "#fff1f2" },
]

export const TEXT_COLOR_PRESETS = [
  { label: "Rojo", value: "#991b1b" },
  { label: "Naranja", value: "#9a3412" },
  { label: "Ámbar", value: "#92400e" },
  { label: "Amarillo", value: "#854d0e" },
  { label: "Lima", value: "#3f6212" },
  { label: "Verde", value: "#166534" },
  { label: "Esmeralda", value: "#065f46" },
  { label: "Teal", value: "#115e59" },
  { label: "Cian", value: "#155e75" },
  { label: "Azul", value: "#1e40af" },
  { label: "Índigo", value: "#3730a3" },
  { label: "Violeta", value: "#5b21b6" },
  { label: "Púrpura", value: "#6b21a8" },
  { label: "Fucsia", value: "#86198f" },
  { label: "Rosa", value: "#9d174d" },
  { label: "Rosa osc.", value: "#9f1239" },
]

// ═══════════════════════════════════════════════════════════════
// COLOR SWATCH PICKER
// ═══════════════════════════════════════════════════════════════

function ColorSwatchPicker({
  label,
  value,
  onChange,
  presets,
}: {
  label: string
  value: string | undefined
  onChange: (v: string | undefined) => void
  presets: { label: string; value: string }[]
}) {
  const [customHex, setCustomHex] = useState(value || "")
  const [showCustom, setShowCustom] = useState(
    !!value && !presets.some((p) => p.value === value)
  )

  React.useEffect(() => {
    setCustomHex(value || "")
    setShowCustom(!!value && !presets.some((p) => p.value === value))
  }, [value, presets])

  const handlePresetClick = (presetValue: string) => {
    if (value === presetValue) {
      onChange(undefined)
    } else {
      onChange(presetValue)
      setCustomHex(presetValue)
      setShowCustom(false)
    }
  }

  const handleCustomHexChange = (hex: string) => {
    setCustomHex(hex)
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex)
    }
  }

  const handleCustomHexBlur = () => {
    if (/^#[0-9a-fA-F]{6}$/.test(customHex)) {
      onChange(customHex)
    } else if (customHex && !/^#[0-9a-fA-F]{6}$/.test(customHex)) {
      setCustomHex(value || "")
    }
  }

  const handleClear = () => {
    onChange(undefined)
    setCustomHex("")
    setShowCustom(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-medium">{label}</Label>
        {value && (
          <button
            type="button"
            className="text-[9px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleClear}
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            title={preset.label}
            className={cn(
              "h-5 w-full rounded border transition-all cursor-pointer",
              value === preset.value
                ? "ring-2 ring-primary ring-offset-1 border-primary/50"
                : "border-border hover:border-primary/30"
            )}
            style={{ backgroundColor: preset.value }}
            onClick={() => handlePresetClick(preset.value)}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
            showCustom
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30"
          )}
          onClick={() => setShowCustom(!showCustom)}
        >
          #
        </button>
        {showCustom && (
          <Input
            value={customHex}
            onChange={(e) => handleCustomHexChange(e.target.value)}
            onBlur={handleCustomHexBlur}
            placeholder="#ff9900"
            className="h-6 text-[10px] font-mono flex-1 px-1.5"
          />
        )}
        {value && (
          <span
            className="h-5 w-5 rounded border shrink-0"
            style={{ backgroundColor: value }}
          />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONDITIONAL FORMAT RULE EDITOR
// ═══════════════════════════════════════════════════════════════

function ConditionalFormatRuleEditor({
  rule,
  idx,
  columns,
  project,
  currentProjectId,
  onChange,
  onRemove,
}: {
  rule: ConditionalFormatRule
  idx: number
  columns: { id: string; name: string; type: string; refTableId?: string }[]
  project?: any
  currentProjectId?: string
  onChange: (idx: number, field: keyof ConditionalFormatRule, value: string) => void
  onRemove: (idx: number) => void
}) {
  const { projects } = useAppStore()
  const [showColorPanel, setShowColorPanel] = useState(false)

  return (
    <div className="p-2.5 rounded-lg border bg-card space-y-2.5">
      {/* Rule header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Regla {idx + 1}
          </span>
          {/* Mini preview */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
            style={{
              backgroundColor: rule.bgColor || "transparent",
              color: rule.textColor || "inherit",
            }}
          >
            {rule.icon && <span>{rule.icon}</span>}
            Ejemplo
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(idx)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Condition input with formula assistant */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium">Condición (fórmula)</Label>
        <FormulaAssistant
          label=""
          value={rule.condition}
          onChange={(v) => onChange(idx, "condition", v)}
          helpText="Se evalúa como verdadero/falso. Usa {colId} para referenciar columnas."
          columns={columns}
          project={project}
          projects={projects}
          currentProjectId={currentProjectId}
          showPreview={false}
        />
      </div>

      {/* Color toggle button */}
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left rounded-md border px-2 py-1.5 hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => setShowColorPanel(!showColorPanel)}
      >
        <div className="flex items-center gap-1">
          {rule.bgColor ? (
            <span
              className="h-4 w-4 rounded-sm border"
              style={{ backgroundColor: rule.bgColor }}
            />
          ) : (
            <span className="h-4 w-4 rounded-sm border border-dashed border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground">
              A
            </span>
          )}
          {rule.textColor ? (
            <span
              className="h-4 w-4 rounded-sm border"
              style={{ backgroundColor: rule.textColor }}
            />
          ) : (
            <span className="h-4 w-4 rounded-sm border border-dashed border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground">
              T
            </span>
          )}
          {rule.icon && <span className="text-sm">{rule.icon}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground flex-1">
          {rule.bgColor || rule.textColor || rule.icon
            ? "Colores configurados"
            : "Configurar colores..."}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            showColorPanel && "rotate-180"
          )}
        />
      </button>

      {/* Color panel (collapsible) */}
      {showColorPanel && (
        <div className="space-y-3 p-2 rounded-md border bg-muted/30">
          <ColorSwatchPicker
            label="Color de fondo"
            value={rule.bgColor}
            onChange={(v) => onChange(idx, "bgColor", v || "")}
            presets={BG_COLOR_PRESETS}
          />
          <ColorSwatchPicker
            label="Color de texto"
            value={rule.textColor}
            onChange={(v) => onChange(idx, "textColor", v || "")}
            presets={TEXT_COLOR_PRESETS}
          />
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Icono / Emoji</Label>
            <div className="flex items-center gap-2">
              <Input
                value={rule.icon || ""}
                onChange={(e) => onChange(idx, "icon", e.target.value)}
                placeholder="🔥 ⚠️ ✅"
                className="h-7 text-sm text-center px-1 w-20"
              />
              <p className="text-[9px] text-muted-foreground">
                Opcional. Se muestra antes del valor.
              </p>
            </div>
          </div>

          {/* Full preview */}
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Vista previa</Label>
            <div className="flex gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border"
                style={{
                  backgroundColor: rule.bgColor || "transparent",
                  color: rule.textColor || "inherit",
                }}
              >
                {rule.icon && <span>{rule.icon}</span>}
                Valor de ejemplo
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] border"
                style={{
                  backgroundColor: rule.bgColor || "transparent",
                  color: rule.textColor || "inherit",
                }}
              >
                {rule.icon && <span>{rule.icon}</span>}
                1,234
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONDITIONAL FORMAT SECTION (reusable in both dialogs)
// ═══════════════════════════════════════════════════════════════

interface ConditionalFormatSectionProps {
  rules: ConditionalFormatRule[]
  onAddRule: () => void
  onChangeRule: (idx: number, field: keyof ConditionalFormatRule, value: string) => void
  onRemoveRule: (idx: number) => void
  columns: { id: string; name: string; type: string; refTableId?: string }[]
  project?: any
  currentProjectId?: string
  /** If true, renders as a CollapsibleSection (add-column style); if false, as AccordionItem content */
  variant?: "accordion" | "collapsible"
  formatCount?: number
}

export function ConditionalFormatSection({
  rules,
  onAddRule,
  onChangeRule,
  onRemoveRule,
  columns,
  project,
  currentProjectId,
}: ConditionalFormatSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Aplica colores e iconos según el valor del campo
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={onAddRule}
        >
          <Plus className="h-3 w-3" /> Agregar regla
        </Button>
      </div>
      {rules.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic py-2">
          Sin reglas de formato condicional
        </p>
      )}
      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <ConditionalFormatRuleEditor
            key={idx}
            rule={rule}
            idx={idx}
            columns={columns}
            project={project}
            currentProjectId={currentProjectId}
            onChange={onChangeRule}
            onRemove={onRemoveRule}
          />
        ))}
      </div>
    </div>
  )
}
