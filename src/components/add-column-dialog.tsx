"use client"

import React, { useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import type { ColumnType, ColumnDisplayMode, ConditionalFormatRule } from "@/shared/types/Project"
import { getColumnTypeLabel, getColumnTypeIcon, getColumnTypeColor } from "@/shared/utils/format"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ColumnTypePicker } from "@/components/editor/column-type-picker"
import { FormulaBuilder } from "@/components/editor/formula-builder"
import { FormulaAssistant } from "@/components/editor/formula-assistant"
import { ReferenceBuilder } from "@/components/editor/reference-builder"
import { ConditionalFormatSection } from "@/components/editor/conditional-format-editor"
import { Plus, X, ChevronDown, ChevronLeft, ChevronRight, Eye, Zap, Ghost, Palette, Shield, Settings, Wrench, Split } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface AddColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  tableId: string
}

// Display mode options per column type
const DISPLAY_MODE_OPTIONS: Record<string, { value: ColumnDisplayMode; label: string }[]> = {
  text: [
    { value: "default", label: "Input" },
    { value: "textarea", label: "Área de texto" },
  ],
  number: [
    { value: "default", label: "Input" },
    { value: "slider", label: "Deslizador" },
    { value: "stepper", label: "Botones +/-" },
    { value: "progress", label: "Barra de progreso" },
  ],
  currency: [
    { value: "default", label: "Input" },
    { value: "slider", label: "Deslizador" },
    { value: "stepper", label: "Botones +/-" },
    { value: "progress", label: "Barra de progreso" },
  ],
  percentage: [
    { value: "default", label: "Input" },
    { value: "slider", label: "Deslizador" },
    { value: "stepper", label: "Botones +/-" },
    { value: "progress", label: "Barra de progreso" },
  ],
  select: [
    { value: "default", label: "Desplegable" },
    { value: "buttons", label: "Botones" },
    { value: "chips", label: "Chips" },
    { value: "badge", label: "Badge" },
  ],
  multiselect: [
    { value: "default", label: "Chips" },
    { value: "buttons", label: "Botones" },
  ],
  checkbox: [
    { value: "default", label: "Casilla" },
    { value: "toggle", label: "Interruptor" },
  ],
}

// Step definitions
const WIZARD_STEPS = [
  { num: 1, title: "Tipo", icon: "📋" },
  { num: 2, title: "Nombre", icon: "✏️" },
  { num: 3, title: "Configuración", icon: "⚙️" },
  { num: 4, title: "Avanzado", icon: "🔧" },
]

// ─── Reusable Collapsible Section Component ───
function CollapsibleSection({
  title,
  icon: Icon,
  themeClass,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ElementType
  themeClass: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn("rounded-lg border p-3 space-y-2", themeClass)}>
      <button
        type="button"
        className="flex items-center justify-between w-full text-left min-h-[44px]"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 pt-1">{children}</div>}
    </div>
  )
}

// ─── Formula Input with fx Popover ───
function FormulaInputWithRef({
  label,
  value,
  onChange,
  helpText,
  columns,
  project,
  currentProjectId,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  helpText: string
  columns: { id: string; name: string; type: string; refTableId?: string }[]
  project?: any
  currentProjectId?: string
}) {
  const { projects } = useAppStore()
  return (
    <FormulaAssistant
      label={label}
      value={value}
      onChange={onChange}
      helpText={helpText}
      columns={columns}
      project={project}
      projects={projects}
      currentProjectId={currentProjectId}
      showPreview={false}
    />
  )
}

export function AddColumnDialog({ open, onOpenChange, projectId, tableId }: AddColumnDialogProps) {
  const { projects, addColumn } = useAppStore()

  // ─── Wizard state ───
  const [currentStep, setCurrentStep] = useState(1)

  // ─── All the same state variables as the original ───
  const [name, setName] = useState("")
  const [type, setType] = useState<ColumnType>("text")
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [defaultValue, setDefaultValue] = useState("")
  const [refTableId, setRefTableId] = useState("")
  const [refDisplayColId, setRefDisplayColId] = useState("")
  const [formula, setFormula] = useState("")
  const [ratingMax, setRatingMax] = useState(5)
  const [refAutoFill, setRefAutoFill] = useState<{ sourceColId: string; targetColId: string }[]>([])
  const [refAutoFillReverse, setRefAutoFillReverse] = useState<{ sourceColId: string; targetColId: string }[]>([])
  const [refOnAdd, setRefOnAdd] = useState<{ targetColId: string; operation: "subtract" | "add"; sourceColId: string }[]>([])
  const [refOnDelete, setRefOnDelete] = useState<{ targetColId: string; operation: "subtract" | "add"; sourceColId: string }[]>([])

  // Conditional behavior
  const [showIf, setShowIf] = useState("")
  const [requiredIf, setRequiredIf] = useState("")
  const [editableIf, setEditableIf] = useState("")
  const [validIf, setValidIf] = useState("")
  const [resetIf, setResetIf] = useState("")

  // Auto-compute
  const [autoCompute, setAutoCompute] = useState(false)
  const [autoComputeFormula, setAutoComputeFormula] = useState("")
  const [initialValueFormula, setInitialValueFormula] = useState("")

  // Cascading
  const [dependsOn, setDependsOn] = useState("")
  const [cascadeOptions, setCascadeOptions] = useState<{ parentValue: string; options: string[] }[]>([])

  // Virtual
  const [virtual, setVirtual] = useState(false)
  const [virtualFormula, setVirtualFormula] = useState("")

  // Display & formatting
  const [placeholder, setPlaceholder] = useState("")
  const [helpText, setHelpText] = useState("")
  const [description, setDescription] = useState("")
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [displayMode, setDisplayMode] = useState<ColumnDisplayMode | "">("")
  const [textTransform, setTextTransform] = useState<"uppercase" | "lowercase" | "titlecase" | "none" | "">("")
  const [columnWidth, setColumnWidth] = useState<"narrow" | "medium" | "wide" | "">("")

  // Complementary
  const [complementaryEnabled, setComplementaryEnabled] = useState(false)
  const [complementaryTotalColId, setComplementaryTotalColId] = useState("")
  const [complementaryOtherColId, setComplementaryOtherColId] = useState("")

  // Value constraints
  const [minValue, setMinValue] = useState<string>("")
  const [maxValue, setMaxValue] = useState<string>("")
  const [step, setStep] = useState<string>("")
  const [regex, setRegex] = useState("")
  const [regexMessage, setRegexMessage] = useState("")
  const [minLength, setMinLength] = useState<string>("")
  const [maxLength, setMaxLength] = useState<string>("")
  const [decimalPlaces, setDecimalPlaces] = useState<string>("")
  const [unique, setUnique] = useState(false)
  const [confirmInput, setConfirmInput] = useState(false)
  const [editableOnce, setEditableOnce] = useState(false)

  // Date constraints
  const [dateMin, setDateMin] = useState("")
  const [dateMax, setDateMax] = useState("")
  const [noPastDates, setNoPastDates] = useState(false)
  const [noFutureDates, setNoFutureDates] = useState(false)

  // Behavior
  const [readOnly, setReadOnly] = useState(false)
  const [showInTable, setShowInTable] = useState(true)
  const [showInForm, setShowInForm] = useState(true)
  const [sectionName, setSectionName] = useState("")

  // Autonumber
  const [autonumberPrefix, setAutonumberPrefix] = useState("")
  const [autonumberDigits, setAutonumberDigits] = useState<string>("")

  // Dynamic options
  const [dynamicOptionsEnabled, setDynamicOptionsEnabled] = useState(false)
  const [dynamicOptionsTableId, setDynamicOptionsTableId] = useState("")
  const [dynamicOptionsColumnId, setDynamicOptionsColumnId] = useState("")

  // Option colors
  const [optionColors, setOptionColors] = useState<Record<string, string>>({})

  // Conditional format
  const [conditionalFormat, setConditionalFormat] = useState<ConditionalFormatRule[]>([])

  // ─── Derived data ───
  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId])
  const currentTable = useMemo(() => project?.tables.find(t => t.id === tableId), [project, tableId])

  const selectColumns = useMemo(() => {
    if (!currentTable) return []
    return currentTable.columns.filter(c => c.type === "select" || c.type === "multiselect")
  }, [currentTable])

  const parentColumnOptions = useMemo(() => {
    if (!dependsOn || !currentTable) return []
    const parentCol = currentTable.columns.find(c => c.id === dependsOn)
    return parentCol?.options || []
  }, [dependsOn, currentTable])

  const dynamicOptionsColumns = useMemo(() => {
    if (!dynamicOptionsTableId) return []
    // Search across ALL projects for the table
    const dynTable = projects
      .flatMap(p => p.tables)
      .find(t => t.id === dynamicOptionsTableId)
    return dynTable?.columns || []
  }, [dynamicOptionsTableId, projects])

  const currentDisplayModes = useMemo(() => {
    return DISPLAY_MODE_OPTIONS[type] || []
  }, [type])

  // ─── Helpers ───
  const isTextType = type === "text" || type === "email" || type === "phone" || type === "url"
  const isNumberType = type === "number" || type === "currency" || type === "percentage"
  const isSelectType = type === "select" || type === "multiselect"

  // Does this type have type-specific config in Step 3?
  const hasTypeConfig = isSelectType || type === "reference" || type === "formula" || isNumberType || type === "rating" || type === "date" || type === "autonumber" || type === "checkbox"

  // ─── Reset form ───
  const resetForm = () => {
    setName("")
    setType("text")
    setRequired(false)
    setOptions([])
    setNewOption("")
    setDefaultValue("")
    setRefTableId("")
    setRefDisplayColId("")
    setFormula("")
    setRatingMax(5)
    setRefAutoFill([])
    setRefAutoFillReverse([])
    setRefOnAdd([])
    setRefOnDelete([])
    setCurrentStep(1)
    setShowIf("")
    setRequiredIf("")
    setEditableIf("")
    setValidIf("")
    setResetIf("")
    setAutoCompute(false)
    setAutoComputeFormula("")
    setInitialValueFormula("")
    setDependsOn("")
    setCascadeOptions([])
    setVirtual(false)
    setVirtualFormula("")
    setPlaceholder("")
    setHelpText("")
    setDescription("")
    setPrefix("")
    setSuffix("")
    setDisplayMode("")
    setTextTransform("")
    setColumnWidth("")
    setMinValue("")
    setMaxValue("")
    setStep("")
    setRegex("")
    setRegexMessage("")
    setMinLength("")
    setMaxLength("")
    setDecimalPlaces("")
    setUnique(false)
    setConfirmInput(false)
    setEditableOnce(false)
    setDateMin("")
    setDateMax("")
    setNoPastDates(false)
    setNoFutureDates(false)
    setReadOnly(false)
    setShowInTable(true)
    setShowInForm(true)
    setSectionName("")
    setAutonumberPrefix("")
    setAutonumberDigits("")
    setDynamicOptionsEnabled(false)
    setDynamicOptionsTableId("")
    setDynamicOptionsColumnId("")
    setOptionColors({})
    setConditionalFormat([])
    setComplementaryEnabled(false)
    setComplementaryTotalColId("")
    setComplementaryOtherColId("")
  }

  // ─── Type change handler ───
  const handleTypeChange = (newType: ColumnType) => {
    setType(newType)
    setOptions([])
    setNewOption("")
    setRefTableId("")
    setRefDisplayColId("")
    setFormula("")
    setDefaultValue("")
    setRatingMax(5)
    setRefAutoFill([])
    setRefAutoFillReverse([])
    setRefOnAdd([])
    setRefOnDelete([])
    setDependsOn("")
    setCascadeOptions([])
    setDisplayMode("")
    setTextTransform("")
    setDynamicOptionsEnabled(false)
    setDynamicOptionsTableId("")
    setDynamicOptionsColumnId("")
    setOptionColors({})
  }

  // ─── Option helpers ───
  const handleAddOption = () => {
    if (!newOption.trim()) return
    if (options.includes(newOption.trim())) return
    setOptions([...options, newOption.trim()])
    setNewOption("")
  }

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx))
  }

  // ─── Cascade helpers ───
  const updateCascadeOption = (parentValue: string, childOptionsStr: string) => {
    setCascadeOptions(prev => {
      const childOptions = childOptionsStr.split(",").map(s => s.trim()).filter(Boolean)
      const existing = prev.find(co => co.parentValue === parentValue)
      if (existing) {
        return prev.map(co => co.parentValue === parentValue ? { ...co, options: childOptions } : co)
      }
      return [...prev, { parentValue, options: childOptions }]
    })
  }

  const getCascadeChildOptions = (parentValue: string): string => {
    const existing = cascadeOptions.find(co => co.parentValue === parentValue)
    return existing ? existing.options.join(", ") : ""
  }

  // ─── Conditional format helpers ───
  const addConditionalFormatRule = () => {
    setConditionalFormat(prev => [...prev, { condition: "", bgColor: undefined, textColor: undefined, icon: undefined }])
  }

  const removeConditionalFormatRule = (idx: number) => {
    setConditionalFormat(prev => prev.filter((_, i) => i !== idx))
  }

  const updateConditionalFormatRule = (idx: number, field: keyof ConditionalFormatRule, value: string) => {
    setConditionalFormat(prev => prev.map((rule, i) => i === idx ? { ...rule, [field]: value || undefined } : rule))
  }

  // ─── Submit handler (IDENTICAL to original) ───
  const handleSubmit = () => {
    if (!name.trim()) return

    if ((type === "select" || type === "multiselect") && options.length === 0) {
      toast.error("Agrega al menos una opción para la columna de selección")
      return
    }

    if (type === "reference" && !refTableId) {
      toast.error("Selecciona la tabla de referencia")
      return
    }

    if (type === "formula" && !formula.trim()) {
      toast.error("Escribe una fórmula para la columna")
      return
    }

    const columnData: Record<string, unknown> = {
      name: name.trim(),
      type,
      required,
      ...(defaultValue ? { defaultValue } : {}),
    }

    if (type === "select" || type === "multiselect") {
      columnData.options = options
    }

    if (type === "reference") {
      columnData.refTableId = refTableId
      columnData.refDisplayColId = refDisplayColId
      const validAutoFill = refAutoFill.filter(m => m.sourceColId && m.targetColId)
      if (validAutoFill.length > 0) columnData.refAutoFill = validAutoFill
      const validReverse = refAutoFillReverse.filter(m => m.sourceColId && m.targetColId)
      if (validReverse.length > 0) columnData.refAutoFillReverse = validReverse
      const validOnAdd = refOnAdd.filter(op => op.targetColId && op.sourceColId)
      if (validOnAdd.length > 0) columnData.refOnAdd = validOnAdd
      const validOnDelete = refOnDelete.filter(op => op.targetColId && op.sourceColId)
      if (validOnDelete.length > 0) columnData.refOnDelete = validOnDelete
    }

    if (type === "formula") {
      columnData.formula = formula.trim()
    }

    if (type === "rating") {
      columnData.ratingMax = ratingMax
    }

    // Conditional behavior
    if (showIf.trim()) columnData.showIf = showIf.trim()
    if (requiredIf.trim()) columnData.requiredIf = requiredIf.trim()
    if (editableIf.trim()) columnData.editableIf = editableIf.trim()
    if (validIf.trim()) columnData.validIf = validIf.trim()
    if (resetIf.trim()) columnData.resetIf = resetIf.trim()

    // Auto-compute
    if (autoCompute) columnData.autoCompute = true
    if (autoComputeFormula.trim()) columnData.autoComputeFormula = autoComputeFormula.trim()
    if (initialValueFormula.trim()) columnData.initialValueFormula = initialValueFormula.trim()

    // Cascading
    if (dependsOn) columnData.dependsOn = dependsOn
    if (cascadeOptions.length > 0) {
      const validCascade = cascadeOptions.filter(co => co.parentValue && co.options.length > 0)
      if (validCascade.length > 0) columnData.cascadeOptions = validCascade
    }

    // Virtual
    if (virtual) columnData.virtual = true
    if (virtualFormula.trim()) columnData.virtualFormula = virtualFormula.trim()

    // Display & formatting
    if (displayMode) columnData.displayMode = displayMode
    if (placeholder.trim()) columnData.placeholder = placeholder.trim()
    if (helpText.trim()) columnData.helpText = helpText.trim()
    if (description.trim()) columnData.description = description.trim()
    if (prefix.trim()) columnData.prefix = prefix.trim()
    if (suffix.trim()) columnData.suffix = suffix.trim()
    if (textTransform && textTransform !== "none") columnData.textTransform = textTransform
    if (columnWidth) columnData.columnWidth = columnWidth

    // Value constraints
    if (minValue !== "") columnData.minValue = Number(minValue)
    if (maxValue !== "") columnData.maxValue = Number(maxValue)
    if (step !== "") columnData.step = Number(step)
    if (regex.trim()) columnData.regex = regex.trim()
    if (regexMessage.trim()) columnData.regexMessage = regexMessage.trim()
    if (minLength !== "") columnData.minLength = Number(minLength)
    if (maxLength !== "") columnData.maxLength = Number(maxLength)
    if (decimalPlaces !== "") columnData.decimalPlaces = Number(decimalPlaces)
    if (unique) columnData.unique = true
    if (confirmInput) columnData.confirmInput = true
    if (editableOnce) columnData.editableOnce = true

    // Date constraints
    if (dateMin) columnData.dateMin = dateMin
    if (dateMax) columnData.dateMax = dateMax
    if (noPastDates) columnData.noPastDates = true
    if (noFutureDates) columnData.noFutureDates = true

    // Behavior
    if (readOnly) columnData.readOnly = true
    columnData.showInTable = showInTable
    columnData.showInForm = showInForm
    if (sectionName.trim()) columnData.sectionName = sectionName.trim()

    // Autonumber
    if (type === "autonumber") {
      if (autonumberPrefix.trim()) columnData.autonumberPrefix = autonumberPrefix.trim()
      if (autonumberDigits !== "") columnData.autonumberDigits = Number(autonumberDigits)
    }

    // Dynamic options
    if ((type === "select" || type === "multiselect") && dynamicOptionsEnabled && dynamicOptionsTableId) {
      columnData.dynamicOptionsTableId = dynamicOptionsTableId
      if (dynamicOptionsColumnId) columnData.dynamicOptionsColumnId = dynamicOptionsColumnId
    }

    // Option colors
    if ((type === "select" || type === "multiselect") && Object.keys(optionColors).length > 0) {
      columnData.optionColors = optionColors
    }

    // Conditional format
    if (conditionalFormat.length > 0) {
      const validRules = conditionalFormat.filter(r => r.condition.trim())
      if (validRules.length > 0) columnData.conditionalFormat = validRules
    }

    // Complementary fields
    if (isNumberType && complementaryEnabled && complementaryTotalColId && complementaryOtherColId) {
      columnData.complementaryOf = {
        totalColId: complementaryTotalColId,
        otherColId: complementaryOtherColId,
      }
    }

    addColumn(projectId, tableId, columnData as any)
    toast.success(`Columna "${name}" agregada`)
    onOpenChange(false)
    resetForm()
  }

  // ─── Navigation helpers ───
  const canGoNext = (): boolean => {
    if (currentStep === 1) return true // type is always selected (default: text)
    if (currentStep === 2) return !!name.trim()
    if (currentStep === 3) {
      // Validate type-specific requirements
      if (isSelectType && options.length === 0) return false
      if (type === "reference" && !refTableId) return false
      if (type === "formula" && !formula.trim()) return false
    }
    return true
  }

  const handleNext = () => {
    if (canGoNext() && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Determine if step 3 should be skipped (no type-specific config)
  const effectiveStep = currentStep

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { resetForm(); onOpenChange(false) } }}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:h-[85vh] sm:max-w-lg sm:mx-auto rounded-t-2xl p-0 flex flex-col"
      >
        {/* ─── Header with step indicator ─── */}
        <SheetHeader className="px-4 pt-4 pb-2 space-y-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Agregar Columna</SheetTitle>
              <SheetDescription className="text-xs">
                Paso {currentStep} de 4 — {WIZARD_STEPS[currentStep - 1].title}
              </SheetDescription>
            </div>
            {/* Type badge if already selected */}
            {currentStep > 1 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  getColumnTypeColor(type)
                )}
              >
                <span className="text-[10px]">{getColumnTypeIcon(type)}</span>
                {getColumnTypeLabel(type)}
              </span>
            )}
          </div>

          {/* Step progress indicator */}
          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    // Allow going back to any previous step
                    if (s.num < currentStep) setCurrentStep(s.num)
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all min-h-[32px]",
                    currentStep === s.num
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : currentStep > s.num
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100"
                        : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="text-[10px]">{s.icon}</span>
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{s.num}</span>
                </button>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={cn(
                    "h-px flex-1 min-w-[12px]",
                    currentStep > s.num ? "bg-emerald-300 dark:bg-emerald-700" : "bg-muted-foreground/15"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </SheetHeader>

        {/* ─── Step content ─── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 1: Tipo */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Elige el tipo de columna</h3>
                    <p className="text-xs text-muted-foreground">
                      Selecciona el tipo de dato que almacenará esta columna
                    </p>
                  </div>
                  <ColumnTypePicker
                    value={type}
                    onChange={handleTypeChange}
                    columns={currentTable?.columns}
                  />
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 2: Nombre */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Nombre y opciones básicas</h3>
                    <p className="text-xs text-muted-foreground">
                      Define el nombre de la columna y si será obligatoria
                    </p>
                  </div>

                  {/* Name input - large and prominent */}
                  <div className="space-y-2">
                    <Label htmlFor="col-name" className="text-sm font-medium">Nombre de la columna *</Label>
                    <Input
                      id="col-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Precio, Categoría, Fecha de inicio..."
                      className="h-12 text-base"
                      autoFocus
                    />
                  </div>

                  {/* Required toggle - prominent */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Campo requerido</Label>
                      <p className="text-[11px] text-muted-foreground">El usuario deberá completar este campo</p>
                    </div>
                    <Switch
                      checked={required}
                      onCheckedChange={setRequired}
                    />
                  </div>

                  {/* Default value */}
                  {type !== "formula" && type !== "autonumber" && (
                    <div className="space-y-2">
                      <Label htmlFor="col-default" className="text-sm font-medium">Valor por defecto</Label>
                      {type === "reference" && refTableId ? (
                        <Select value={defaultValue || "__none__"} onValueChange={(v) => setDefaultValue(v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Sin valor por defecto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin valor por defecto</SelectItem>
                            {(() => {
                              const refTable = project?.tables.find(t => t.id === refTableId)
                              const displayCol = refTable?.columns.find(c => c.id === refDisplayColId)
                              return refTable?.rows.map((row) => (
                                <SelectItem key={row.id} value={row.id}>
                                  {displayCol ? (row[displayCol.id] ?? row.id) : row.id}
                                </SelectItem>
                              )) || []
                            })()}
                          </SelectContent>
                        </Select>
                      ) : type === "checkbox" ? (
                        <Select value={defaultValue || "false"} onValueChange={setDefaultValue}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Activado (Sí)</SelectItem>
                            <SelectItem value="false">Desactivado (No)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : type === "select" || type === "multiselect" ? (
                        <Select value={defaultValue || "__none__"} onValueChange={(v) => setDefaultValue(v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Sin valor por defecto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin valor por defecto</SelectItem>
                            {options.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : type === "rating" ? (
                        <Input
                          id="col-default"
                          type="number"
                          min={0}
                          max={ratingMax}
                          value={defaultValue}
                          onChange={(e) => setDefaultValue(e.target.value)}
                          placeholder={`0-${ratingMax}`}
                          className="h-10"
                        />
                      ) : (
                        <Input
                          id="col-default"
                          type={type === "number" || type === "currency" || type === "percentage" ? "number" : type === "date" ? "date" : "text"}
                          step={type === "currency" ? "0.01" : type === "percentage" ? "0.1" : undefined}
                          value={defaultValue}
                          onChange={(e) => setDefaultValue(e.target.value)}
                          placeholder="Dejar vacío si no aplica"
                          className="h-10"
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 3: Configuración (type-specific) */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Configuración de {getColumnTypeLabel(type)}</h3>
                    <p className="text-xs text-muted-foreground">
                      Ajusta las opciones específicas para este tipo de columna
                    </p>
                  </div>

                  {/* ─── Select / Multiselect: Options editor ─── */}
                  {isSelectType && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Opciones</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Nueva opción"
                          className="h-10 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddOption()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 gap-1 shrink-0"
                          onClick={handleAddOption}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((opt, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium min-h-[36px]"
                            >
                              {opt}
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground min-h-[28px] min-w-[28px] flex items-center justify-center"
                                onClick={() => handleRemoveOption(idx)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {options.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">
                          Agrega al menos una opción para continuar
                        </p>
                      )}
                    </div>
                  )}

                  {/* ─── Reference: ReferenceBuilder ─── */}
                  {type === "reference" && project && (
                    <ReferenceBuilder
                      refTableId={refTableId}
                      setRefTableId={(v) => { setRefTableId(v); setRefDisplayColId(""); setRefAutoFill([]); setRefAutoFillReverse([]); setRefOnAdd([]); setRefOnDelete([]) }}
                      refDisplayColId={refDisplayColId}
                      setRefDisplayColId={setRefDisplayColId}
                      refAutoFill={refAutoFill}
                      setRefAutoFill={setRefAutoFill}
                      refAutoFillReverse={refAutoFillReverse}
                      setRefAutoFillReverse={setRefAutoFillReverse}
                      refOnAdd={refOnAdd}
                      setRefOnAdd={setRefOnAdd}
                      refOnDelete={refOnDelete}
                      setRefOnDelete={setRefOnDelete}
                      project={project}
                      currentTableId={tableId}
                    />
                  )}

                  {/* ─── Formula: FormulaBuilder ─── */}
                  {type === "formula" && project && currentTable && (
                    <FormulaBuilder
                      value={formula}
                      onChange={setFormula}
                      columns={currentTable.columns}
                      project={project}
                      projects={projects}
                      currentProjectId={projectId}
                    />
                  )}

                  {/* ─── Number / Currency / Percentage: Constraints ─── */}
                  {isNumberType && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Valor mínimo</Label>
                          <Input type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="Sin límite" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Valor máximo</Label>
                          <Input type="number" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} placeholder="Sin límite" className="h-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Incremento (step)</Label>
                          <Input type="number" value={step} onChange={(e) => setStep(e.target.value)} placeholder="1" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Decimales</Label>
                          <Input type="number" value={decimalPlaces} onChange={(e) => setDecimalPlaces(e.target.value)} placeholder="Auto" className="h-10" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── Rating: Max stars ─── */}
                  {type === "rating" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Máximo de estrellas</Label>
                      <div className="flex gap-2">
                        {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRatingMax(n)}
                            className={cn(
                              "flex items-center justify-center h-10 w-10 rounded-lg border-2 text-sm font-bold transition-all cursor-pointer",
                              ratingMax === n
                                ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "border-border bg-card hover:bg-accent/50"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: ratingMax }).map((_, i) => (
                          <span key={i} className="text-lg">⭐</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─── Date: Constraints ─── */}
                  {type === "date" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Fecha mínima</Label>
                          <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Fecha máxima</Label>
                          <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="h-10" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label className="text-xs font-medium">Sin fechas pasadas</Label>
                          <p className="text-[10px] text-muted-foreground">No permitir fechas anteriores a hoy</p>
                        </div>
                        <Switch checked={noPastDates} onCheckedChange={setNoPastDates} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label className="text-xs font-medium">Sin fechas futuras</Label>
                          <p className="text-[10px] text-muted-foreground">No permitir fechas posteriores a hoy</p>
                        </div>
                        <Switch checked={noFutureDates} onCheckedChange={setNoFutureDates} />
                      </div>
                    </div>
                  )}

                  {/* ─── Autonumber: Prefix + Digits ─── */}
                  {type === "autonumber" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Prefijo</Label>
                          <Input value={autonumberPrefix} onChange={(e) => setAutonumberPrefix(e.target.value)} placeholder="Ej: INV-, ORD-" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Dígitos</Label>
                          <Input type="number" min={1} max={10} value={autonumberDigits} onChange={(e) => setAutonumberDigits(e.target.value)} placeholder="Ej: 3 → 001" className="h-10" />
                        </div>
                      </div>
                      {autonumberPrefix && autonumberDigits && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Vista previa:</p>
                          <p className="text-base font-mono font-semibold mt-1">
                            {autonumberPrefix}{String(1).padStart(Number(autonumberDigits), "0")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Checkbox: Default ─── */}
                  {type === "checkbox" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estado por defecto</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDefaultValue("true")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all cursor-pointer min-h-[52px]",
                            defaultValue === "true"
                              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "border-border bg-card hover:bg-accent/50"
                          )}
                        >
                          ✓ Activado
                        </button>
                        <button
                          type="button"
                          onClick={() => setDefaultValue("false")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all cursor-pointer min-h-[52px]",
                            defaultValue === "false" || defaultValue === ""
                              ? "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
                              : "border-border bg-card hover:bg-accent/50"
                          )}
                        >
                          ✗ Desactivado
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If no type-specific config, show a message */}
                  {!hasTypeConfig && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        Este tipo de columna no requiere configuración adicional.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Puedes continuar al paso de opciones avanzadas o agregar la columna directamente.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 4: Avanzado (collapsible sections) */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Opciones avanzadas</h3>
                    <p className="text-xs text-muted-foreground">
                      Configuración opcional para personalizar el comportamiento de la columna
                    </p>
                  </div>

                  {/* Presentación Visual */}
                  <CollapsibleSection
                    title="Presentación Visual"
                    icon={Palette}
                    themeClass="border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300"
                  >
                    <div className="space-y-2">
                      {/* Display mode */}
                      {currentDisplayModes.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Modo de visualización</Label>
                          <Select value={displayMode || "default"} onValueChange={(v) => setDisplayMode(v as ColumnDisplayMode)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Por defecto" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentDisplayModes.map((dm) => (
                                <SelectItem key={dm.value} value={dm.value}>{dm.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Placeholder */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Marcador de posición</Label>
                        <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Texto placeholder en el campo vacío" className="h-9 text-xs" />
                      </div>

                      {/* Help text */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Texto de ayuda</Label>
                        <Input value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder="Texto mostrado debajo del campo en el formulario" className="h-9 text-xs" />
                      </div>

                      {/* Prefix/Suffix for number types */}
                      {isNumberType && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Prefijo</Label>
                            <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Ej: $, MXN, #" className="h-9 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Sufijo</Label>
                            <Input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Ej: %, kg, uds" className="h-9 text-xs" />
                          </div>
                        </div>
                      )}

                      {/* Text transform for text types */}
                      {isTextType && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Transformación de texto</Label>
                          <Select value={textTransform || "none"} onValueChange={(v) => setTextTransform(v as "uppercase" | "lowercase" | "titlecase" | "none")}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Sin transformar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin transformar</SelectItem>
                              <SelectItem value="uppercase">MAYÚSCULAS</SelectItem>
                              <SelectItem value="lowercase">minúsculas</SelectItem>
                              <SelectItem value="titlecase">Tipo Título</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Column width */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Ancho de columna</Label>
                        <Select value={columnWidth || "medium"} onValueChange={(v) => setColumnWidth(v as "narrow" | "medium" | "wide")}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Medio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="narrow">Estrecho</SelectItem>
                            <SelectItem value="medium">Medio (por defecto)</SelectItem>
                            <SelectItem value="wide">Ancho</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Internal description */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Descripción interna</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas internas sobre esta columna (no visibles en formularios)" className="h-9 text-xs" />
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Comportamiento Condicional */}
                  <CollapsibleSection
                    title="Comportamiento Condicional"
                    icon={Eye}
                    themeClass="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                  >
                    <FormulaInputWithRef
                      label="Mostrar si"
                      value={showIf}
                      onChange={setShowIf}
                      helpText='Fórmula que debe ser verdadera para mostrar este campo. Ej: {col-tipo} = "Ingreso"'
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Obligatorio si"
                      value={requiredIf}
                      onChange={setRequiredIf}
                      helpText="Campo requerido solo cuando la fórmula es verdadera"
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Editable si"
                      value={editableIf}
                      onChange={setEditableIf}
                      helpText="Campo editable solo cuando la fórmula es verdadera. Si no, será solo lectura"
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Válido si"
                      value={validIf}
                      onChange={setValidIf}
                      helpText="Fórmula de validación personalizada. El valor será inválido si es falso"
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Resetear si"
                      value={resetIf}
                      onChange={setResetIf}
                      helpText="Se reseteará el valor cuando esta condición sea verdadera"
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                  </CollapsibleSection>

                  {/* Validación */}
                  <CollapsibleSection
                    title="Validación"
                    icon={Shield}
                    themeClass="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Valor único</Label>
                          <p className="text-[10px] text-muted-foreground">No permitir valores duplicados</p>
                        </div>
                        <Switch checked={unique} onCheckedChange={setUnique} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Confirmar entrada</Label>
                          <p className="text-[10px] text-muted-foreground">Solicitar escribir el valor dos veces</p>
                        </div>
                        <Switch checked={confirmInput} onCheckedChange={setConfirmInput} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Editable solo al crear</Label>
                          <p className="text-[10px] text-muted-foreground">Solo se puede establecer al crear, no al editar</p>
                        </div>
                        <Switch checked={editableOnce} onCheckedChange={setEditableOnce} />
                      </div>

                      {/* Type-specific constraints */}
                      {isNumberType ? (
                        <div className="space-y-2 pt-2 border-t border-red-200/50 dark:border-red-800/50">
                          <p className="text-[11px] font-medium text-red-600 dark:text-red-400">Restricciones numéricas</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Mínimo</Label>
                              <Input type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="Sin límite" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Máximo</Label>
                              <Input type="number" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} placeholder="Sin límite" className="h-9 text-xs" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Incremento</Label>
                              <Input type="number" value={step} onChange={(e) => setStep(e.target.value)} placeholder="1" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Decimales</Label>
                              <Input type="number" value={decimalPlaces} onChange={(e) => setDecimalPlaces(e.target.value)} placeholder="Auto" className="h-9 text-xs" />
                            </div>
                          </div>
                        </div>
                      ) : isTextType ? (
                        <div className="space-y-2 pt-2 border-t border-red-200/50 dark:border-red-800/50">
                          <p className="text-[11px] font-medium text-red-600 dark:text-red-400">Restricciones de texto</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Longitud mínima</Label>
                              <Input type="number" value={minLength} onChange={(e) => setMinLength(e.target.value)} placeholder="0" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Longitud máxima</Label>
                              <Input type="number" value={maxLength} onChange={(e) => setMaxLength(e.target.value)} placeholder="Sin límite" className="h-9 text-xs" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Patrón regex</Label>
                            <Input value={regex} onChange={(e) => setRegex(e.target.value)} placeholder="Ej: ^[A-Za-z]+$" className="h-9 text-xs font-mono" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Mensaje de error</Label>
                            <Input value={regexMessage} onChange={(e) => setRegexMessage(e.target.value)} placeholder="Mensaje cuando el patrón no coincide" className="h-9 text-xs" />
                          </div>
                        </div>
                      ) : type === "date" ? (
                        <div className="space-y-2 pt-2 border-t border-red-200/50 dark:border-red-800/50">
                          <p className="text-[11px] font-medium text-red-600 dark:text-red-400">Restricciones de fecha</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Fecha mínima</Label>
                              <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Fecha máxima</Label>
                              <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="h-9 text-xs" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-medium">Sin fechas pasadas</Label>
                              <p className="text-[10px] text-muted-foreground">No permitir seleccionar fechas anteriores a hoy</p>
                            </div>
                            <Switch checked={noPastDates} onCheckedChange={setNoPastDates} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-medium">Sin fechas futuras</Label>
                              <p className="text-[10px] text-muted-foreground">No permitir seleccionar fechas posteriores a hoy</p>
                            </div>
                            <Switch checked={noFutureDates} onCheckedChange={setNoFutureDates} />
                          </div>
                        </div>
                      ) : (
                        !unique && !confirmInput && !editableOnce ? (
                          <p className="text-[11px] text-muted-foreground">No hay restricciones adicionales para este tipo de columna</p>
                        ) : null
                      )}
                    </div>
                  </CollapsibleSection>

                  {/* Auto-cálculo */}
                  <CollapsibleSection
                    title="Auto-cálculo"
                    icon={Zap}
                    themeClass="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Auto-calcular</Label>
                      <Switch checked={autoCompute} onCheckedChange={setAutoCompute} />
                    </div>
                    {autoCompute && (
                      <FormulaInputWithRef
                        label="Fórmula de auto-cálculo"
                        value={autoComputeFormula}
                        onChange={setAutoComputeFormula}
                        helpText="El campo se llenará automáticamente con el resultado de la fórmula, pero el usuario podrá modificarlo"
                        columns={currentTable?.columns || []}
                        project={project}
                        currentProjectId={projectId}
                      />
                    )}
                    <FormulaInputWithRef
                      label="Valor Inicial Dinámico"
                      value={initialValueFormula}
                      onChange={setInitialValueFormula}
                      helpText="Fórmula para calcular el valor inicial al crear un nuevo registro"
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                  </CollapsibleSection>

                  {/* Cascada (only for select types) */}
                  {isSelectType && (
                    <CollapsibleSection
                      title="Desplegable en Cascada"
                      icon={ChevronDown}
                      themeClass="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Depende de</Label>
                        <Select value={dependsOn || "__none__"} onValueChange={(v) => {
                          setDependsOn(v === "__none__" ? "" : v)
                          setCascadeOptions([])
                        }}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Seleccionar columna padre..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Ninguna (independiente)</SelectItem>
                            {selectColumns.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Columna select de la que depende este campo</p>
                      </div>
                      {dependsOn && parentColumnOptions.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Opciones por valor del padre</Label>
                          {parentColumnOptions.map((opt) => (
                            <div key={opt} className="space-y-1">
                              <p className="text-[11px] text-muted-foreground font-medium">
                                Cuando padre = <span className="text-purple-700 dark:text-purple-300">{opt}</span>:
                              </p>
                              <Input
                                value={getCascadeChildOptions(opt)}
                                onChange={(e) => updateCascadeOption(opt, e.target.value)}
                                placeholder="Opciones separadas por coma: manzana, plátano, uva"
                                className="h-9 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleSection>
                  )}

                  {/* Columna Virtual */}
                  <CollapsibleSection
                    title="Columna Virtual"
                    icon={Ghost}
                    themeClass="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Columna virtual</Label>
                        <p className="text-[10px] text-muted-foreground">Las columnas virtuales no almacenan datos, solo muestran un cálculo. Útil para mostrar información derivada sin guardarla</p>
                      </div>
                      <Switch checked={virtual} onCheckedChange={setVirtual} />
                    </div>
                    {virtual && (
                      <FormulaInputWithRef
                        label="Fórmula virtual"
                        value={virtualFormula}
                        onChange={setVirtualFormula}
                        helpText="Fórmula para calcular el valor mostrado (no se almacena)"
                        columns={currentTable?.columns || []}
                        project={project}
                        currentProjectId={projectId}
                      />
                    )}
                  </CollapsibleSection>

                  {/* Formato Condicional */}
                  <CollapsibleSection
                    title="Formato Condicional"
                    icon={Palette}
                    themeClass="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                  >
                    <ConditionalFormatSection
                      rules={conditionalFormat}
                      onAddRule={addConditionalFormatRule}
                      onChangeRule={updateConditionalFormatRule}
                      onRemoveRule={removeConditionalFormatRule}
                      columns={currentTable?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                  </CollapsibleSection>

                  {/* Comportamiento */}
                  <CollapsibleSection
                    title="Comportamiento"
                    icon={Settings}
                    themeClass="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Solo lectura</Label>
                          <p className="text-[10px] text-muted-foreground">El usuario no puede modificar este campo</p>
                        </div>
                        <Switch checked={readOnly} onCheckedChange={setReadOnly} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Mostrar en tabla</Label>
                          <p className="text-[10px] text-muted-foreground">Mostrar esta columna en la vista de tabla</p>
                        </div>
                        <Switch checked={showInTable} onCheckedChange={setShowInTable} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Mostrar en formulario</Label>
                          <p className="text-[10px] text-muted-foreground">Mostrar este campo en los formularios</p>
                        </div>
                        <Switch checked={showInForm} onCheckedChange={setShowInForm} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Sección del formulario</Label>
                        <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Agrupa campos bajo un título de sección en el formulario" className="h-9 text-xs" />
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Campo Complementario (numeric types only) */}
                  {isNumberType && currentTable && (
                    <CollapsibleSection
                      title="Campo Complementario"
                      icon={Split}
                      themeClass="border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10 text-orange-700 dark:text-orange-300"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs font-medium">Habilitar complementario</Label>
                            <p className="text-[10px] text-muted-foreground">Al escribir aquí, el otro campo se rellena con total - este campo</p>
                          </div>
                          <Switch checked={complementaryEnabled} onCheckedChange={setComplementaryEnabled} />
                        </div>
                        {complementaryEnabled && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Columna total</Label>
                              <Select value={complementaryTotalColId} onValueChange={setComplementaryTotalColId}>
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar columna total..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentTable.columns
                                    .filter(c => c.type === "formula" || c.autoCompute || c.type === "number" || c.type === "currency" || c.type === "percentage")
                                    .map(c => (
                                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <p className="text-[10px] text-muted-foreground">La columna cuyo valor es la suma de este campo y el otro complementario</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Otro campo complementario</Label>
                              <Select value={complementaryOtherColId} onValueChange={setComplementaryOtherColId}>
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar otro campo..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentTable.columns
                                    .filter(c => c.type === "number" || c.type === "currency" || c.type === "percentage")
                                    .map(c => (
                                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Opciones Dinámicas (select types only) */}
                  {isSelectType && project && (
                    <CollapsibleSection
                      title="Opciones Dinámicas"
                      icon={Wrench}
                      themeClass="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-300"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs font-medium">Opciones dinámicas desde otra tabla</Label>
                            <p className="text-[10px] text-muted-foreground">
                              Obtener opciones de las filas de otra tabla en vez de definirlas manualmente
                            </p>
                          </div>
                          <Switch
                            checked={dynamicOptionsEnabled}
                            onCheckedChange={(checked) => {
                              setDynamicOptionsEnabled(checked)
                              if (!checked) {
                                setDynamicOptionsTableId("")
                                setDynamicOptionsColumnId("")
                              }
                            }}
                          />
                        </div>
                        {dynamicOptionsEnabled && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Tabla de origen</Label>
                              <Select value={dynamicOptionsTableId || "__none__"} onValueChange={(v) => {
                                setDynamicOptionsTableId(v === "__none__" ? "" : v)
                                setDynamicOptionsColumnId("")
                              }}>
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar tabla..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {projects.map((p) => (
                                    <SelectGroup key={p.id}>
                                      <SelectLabel className="text-[10px] font-semibold">
                                        {p.emoji} {p.name}
                                      </SelectLabel>
                                      {p.tables
                                        .filter(t => !(p.id === projectId && t.id === tableId))
                                        .map((t) => (
                                          <SelectItem key={t.id} value={t.id}>{t.emoji} {t.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {dynamicOptionsTableId && (
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Columna para opciones</Label>
                                <Select value={dynamicOptionsColumnId || "__none__"} onValueChange={(v) => setDynamicOptionsColumnId(v === "__none__" ? "" : v)}>
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Seleccionar columna..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Seleccionar...</SelectItem>
                                    {dynamicOptionsColumns.map((c) => (
                                      <SelectItem key={c.id} value={c.id}>{getColumnTypeIcon(c.type)} {c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Colores de Opciones (select types only) */}
                  {isSelectType && options.length > 0 && (
                    <CollapsibleSection
                      title="Colores de Opciones"
                      icon={Palette}
                      themeClass="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300"
                    >
                      <div className="space-y-2">
                        {options.map((opt) => (
                          <div key={opt} className="flex items-center gap-2">
                            <span className="text-xs flex-1 truncate">{opt}</span>
                            <input
                              type="color"
                              value={optionColors[opt] || "#6366f1"}
                              onChange={(e) => setOptionColors(prev => ({ ...prev, [opt]: e.target.value }))}
                              className="h-8 w-8 rounded border border-border cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Navigation footer ─── */}
        <div className="shrink-0 border-t px-4 py-3 bg-background">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="gap-1 h-11 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-1.5">
              {WIZARD_STEPS.map((s) => (
                <div
                  key={s.num}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    currentStep === s.num
                      ? "w-6 bg-emerald-500"
                      : currentStep > s.num
                        ? "w-3 bg-emerald-300 dark:bg-emerald-700"
                        : "w-3 bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className="gap-1 h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim() || (type === "formula" && !formula.trim()) || (isSelectType && options.length === 0) || (type === "reference" && !refTableId)}
                className="gap-1 h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Agregar Columna
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
