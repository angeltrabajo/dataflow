"use client"

import React, { useState, useMemo } from "react"
import { useAppStore, ColumnDisplayMode, ConditionalFormatRule, Column } from "@/lib/store"
import { getColumnTypeLabel, getColumnTypeIcon, getColumnTypeColor } from "@/lib/helpers"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import {
  Palette,
  Shield,
  Eye,
  Zap,
  ExternalLink,
  Code,
  List,
  ChevronDown,
  Ghost,
  Settings,
  Plus,
  X,
  Split,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ColumnPreview } from "@/components/editor/column-preview"
import { FormulaBuilder } from "@/components/editor/formula-builder"
import { FormulaAssistant } from "@/components/editor/formula-assistant"
import { ReferenceBuilder } from "@/components/editor/reference-builder"
import { ConditionalFormatSection } from "@/components/editor/conditional-format-editor"

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

interface EditColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  tableId: string
  columnId: string | null
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY MODE OPTIONS
// ═══════════════════════════════════════════════════════════════

const DISPLAY_MODE_OPTIONS: Record<string, { value: ColumnDisplayMode; label: string }[]> = {
  text: [
    { value: "default", label: "Input" },
    { value: "textarea", label: "Área de texto" },
  ],
  number: [
    { value: "default", label: "Input" },
    { value: "slider", label: "Deslizador" },
    { value: "stepper", label: "Botones +/−" },
    { value: "progress", label: "Barra de progreso" },
  ],
  currency: [
    { value: "default", label: "Input" },
    { value: "slider", label: "Deslizador" },
    { value: "stepper", label: "Botones +/−" },
    { value: "progress", label: "Barra de progreso" },
  ],
  percentage: [
    { value: "default", label: "Input" },
    { value: "slider", label: "Deslizador" },
    { value: "stepper", label: "Botones +/−" },
    { value: "progress", label: "Barra de progreso" },
  ],
  select: [
    { value: "default", label: "Desplegable" },
    { value: "buttons", label: "Botones" },
    { value: "chips", label: "Chips/Etiquetas" },
    { value: "badge", label: "Badge/Insignia" },
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

// ═══════════════════════════════════════════════════════════════
// FORMULA INPUT WITH FX POPOVER (local component)
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// SECTION BADGE HELPER - shows summary when collapsed
// ═══════════════════════════════════════════════════════════════

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
      {children}
    </span>
  )
}

/** Icon wrapper with subtle colored background circle for accordion headers */
function SectionIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn(
      "inline-flex items-center justify-center h-7 w-7 rounded-lg shrink-0",
      color
    )}>
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function EditColumnDialog({
  open,
  onOpenChange,
  projectId,
  tableId,
  columnId,
}: EditColumnDialogProps) {
  const { projects, updateColumn } = useAppStore()

  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  )
  const table = useMemo(
    () => project?.tables.find((t) => t.id === tableId),
    [project, tableId]
  )
  const column = useMemo(
    () => table?.columns.find((c) => c.id === columnId),
    [table, columnId]
  )

  // ─── Core state ───
  const [name, setName] = useState("")
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [defaultValue, setDefaultValue] = useState("")
  const [refTableId, setRefTableId] = useState("")
  const [refDisplayColId, setRefDisplayColId] = useState("")
  const [formula, setFormula] = useState("")
  const [ratingMax, setRatingMax] = useState(5)
  const [refAutoFill, setRefAutoFill] = useState<
    { sourceColId: string; targetColId: string }[]
  >([])
  const [refAutoFillReverse, setRefAutoFillReverse] = useState<
    { sourceColId: string; targetColId: string }[]
  >([])
  const [refOnAdd, setRefOnAdd] = useState<{
    targetColId: string
    operation: "subtract" | "add"
    sourceColId: string
  }[]>([])
  const [refOnDelete, setRefOnDelete] = useState<{
    targetColId: string
    operation: "subtract" | "add"
    sourceColId: string
  }[]>([])

  // ─── Conditional behavior ───
  const [showIf, setShowIf] = useState("")
  const [requiredIf, setRequiredIf] = useState("")
  const [editableIf, setEditableIf] = useState("")
  const [validIf, setValidIf] = useState("")
  const [resetIf, setResetIf] = useState("")

  // ─── Auto-compute ───
  const [autoCompute, setAutoCompute] = useState(false)
  const [autoComputeFormula, setAutoComputeFormula] = useState("")

  // ─── Cascading ───
  const [dependsOn, setDependsOn] = useState("")
  const [cascadeOptions, setCascadeOptions] = useState<
    { parentValue: string; options: string[] }[]
  >([])

  // ─── Virtual ───
  const [virtual, setVirtual] = useState(false)
  const [virtualFormula, setVirtualFormula] = useState("")

  // ─── Display & formatting ───
  const [placeholder, setPlaceholder] = useState("")
  const [helpText, setHelpText] = useState("")
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [displayMode, setDisplayMode] = useState<ColumnDisplayMode>("default")
  const [textTransform, setTextTransform] = useState<
    "uppercase" | "lowercase" | "titlecase" | "none"
  >("none")
  const [columnWidth, setColumnWidth] = useState<"narrow" | "medium" | "wide">(
    "medium"
  )
  const [optionColors, setOptionColors] = useState<Record<string, string>>({})

  // ─── Validation ───
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
  const [dateMin, setDateMin] = useState("")
  const [dateMax, setDateMax] = useState("")
  const [noPastDates, setNoPastDates] = useState(false)
  const [noFutureDates, setNoFutureDates] = useState(false)

  // ─── Description ───
  const [description, setDescription] = useState("")

  // ─── Initial value formula ───
  const [initialValueFormula, setInitialValueFormula] = useState("")

  // ─── Autonumber ───
  const [autonumberPrefix, setAutonumberPrefix] = useState("")
  const [autonumberDigits, setAutonumberDigits] = useState<string>("")

  // ─── Dynamic options ───
  const [dynamicOptionsEnabled, setDynamicOptionsEnabled] = useState(false)
  const [dynamicOptionsTableId, setDynamicOptionsTableId] = useState("")
  const [dynamicOptionsColumnId, setDynamicOptionsColumnId] = useState("")

  // ─── Conditional format ───
  const [conditionalFormat, setConditionalFormat] = useState<
    ConditionalFormatRule[]
  >([])

  // ─── Complementary ───
  const [complementaryEnabled, setComplementaryEnabled] = useState(false)
  const [complementaryTotalColId, setComplementaryTotalColId] = useState("")
  const [complementaryOtherColId, setComplementaryOtherColId] = useState("")

  // ─── Behavior ───
  const [readOnly, setReadOnly] = useState(false)
  const [showInTable, setShowInTable] = useState(true)
  const [showInForm, setShowInForm] = useState(true)
  const [sectionName, setSectionName] = useState("")

  // ═══════════════════════════════════════════════════════════
  // SYNC STATE WHEN COLUMN CHANGES
  // ═══════════════════════════════════════════════════════════

  React.useEffect(() => {
    if (column) {
      setName(column.name)
      setRequired(column.required)
      setOptions(column.options || [])
      setDefaultValue(column.defaultValue || "")
      setRefTableId(column.refTableId || "")
      setRefDisplayColId(column.refDisplayColId || "")
      setRefAutoFill(column.refAutoFill || [])
      setRefAutoFillReverse(column.refAutoFillReverse || [])
      setRefOnAdd(column.refOnAdd || [])
      setRefOnDelete(column.refOnDelete || [])
      setFormula(column.formula || "")
      setRatingMax(column.ratingMax || 5)
      setShowIf(column.showIf || "")
      setRequiredIf(column.requiredIf || "")
      setEditableIf(column.editableIf || "")
      setValidIf(column.validIf || "")
      setResetIf(column.resetIf || "")
      setAutoCompute(column.autoCompute || false)
      setAutoComputeFormula(column.autoComputeFormula || "")
      setDependsOn(column.dependsOn || "")
      setCascadeOptions(column.cascadeOptions || [])
      setVirtual(column.virtual || false)
      setVirtualFormula(column.virtualFormula || "")
      setPlaceholder(column.placeholder || "")
      setHelpText(column.helpText || "")
      setPrefix(column.prefix || "")
      setSuffix(column.suffix || "")
      setDisplayMode(column.displayMode || "default")
      setTextTransform(column.textTransform || "none")
      setColumnWidth(column.columnWidth || "medium")
      setOptionColors(column.optionColors || {})
      setMinValue(column.minValue != null ? String(column.minValue) : "")
      setMaxValue(column.maxValue != null ? String(column.maxValue) : "")
      setStep(column.step != null ? String(column.step) : "")
      setRegex(column.regex || "")
      setRegexMessage(column.regexMessage || "")
      setMinLength(column.minLength != null ? String(column.minLength) : "")
      setMaxLength(column.maxLength != null ? String(column.maxLength) : "")
      setDecimalPlaces(
        column.decimalPlaces != null ? String(column.decimalPlaces) : ""
      )
      setUnique(column.unique || false)
      setConfirmInput(column.confirmInput || false)
      setEditableOnce(column.editableOnce || false)
      setDateMin(column.dateMin || "")
      setDateMax(column.dateMax || "")
      setNoPastDates(column.noPastDates || false)
      setNoFutureDates(column.noFutureDates || false)
      setDescription(column.description || "")
      setInitialValueFormula(column.initialValueFormula || "")
      setAutonumberPrefix(column.autonumberPrefix || "")
      setAutonumberDigits(
        column.autonumberDigits != null ? String(column.autonumberDigits) : ""
      )
      setDynamicOptionsEnabled(!!column.dynamicOptionsTableId)
      setDynamicOptionsTableId(column.dynamicOptionsTableId || "")
      setDynamicOptionsColumnId(column.dynamicOptionsColumnId || "")
      setConditionalFormat(column.conditionalFormat || [])
      setReadOnly(column.readOnly || false)
      setShowInTable(column.showInTable !== false)
      setShowInForm(column.showInForm !== false)
      setSectionName(column.sectionName || "")
      setComplementaryEnabled(!!column.complementaryOf)
      setComplementaryTotalColId(column.complementaryOf?.totalColId || "")
      setComplementaryOtherColId(column.complementaryOf?.otherColId || "")
    }
  }, [column, open])

  // ═══════════════════════════════════════════════════════════
  // DERIVED DATA
  // ═══════════════════════════════════════════════════════════

  const availableRefTables = useMemo(() => {
    if (!project) return []
    return project.tables.filter((t) => t.id !== tableId)
  }, [project, tableId])

  const refTableColumns = useMemo(() => {
    if (!refTableId || !project) return []
    const refTable = project.tables.find((t) => t.id === refTableId)
    return refTable?.columns || []
  }, [refTableId, project])

  const selectColumns = useMemo(() => {
    if (!table) return []
    return table.columns.filter(
      (c) => (c.type === "select" || c.type === "multiselect") && c.id !== columnId
    )
  }, [table, columnId])

  const parentColumnOptions = useMemo(() => {
    if (!dependsOn || !table) return []
    const parentCol = table.columns.find((c) => c.id === dependsOn)
    return parentCol?.options || []
  }, [dependsOn, table])

  const dynamicOptionsTableColumns = useMemo(() => {
    if (!dynamicOptionsTableId) return []
    // Search across ALL projects for the table
    const dynTable = projects
      .flatMap((p) => p.tables)
      .find((t) => t.id === dynamicOptionsTableId)
    return dynTable?.columns || []
  }, [dynamicOptionsTableId, projects])

  const currentDisplayModeOptions = useMemo(() => {
    if (!column) return []
    return DISPLAY_MODE_OPTIONS[column.type] || []
  }, [column])

  // ═══════════════════════════════════════════════════════════
  // LIVE PREVIEW COLUMN
  // ═══════════════════════════════════════════════════════════

  const previewColumn = useMemo(() => {
    if (!column) return null
    return {
      ...column,
      name: name || column.name,
      required,
      options: options.length > 0 ? options : column.options,
      defaultValue: defaultValue || column.defaultValue,
      refTableId: refTableId || column.refTableId,
      refDisplayColId: refDisplayColId || column.refDisplayColId,
      refAutoFill: refAutoFill,
      refOnAdd,
      refOnDelete,
      formula: formula || column.formula,
      ratingMax,
      placeholder,
      helpText,
      prefix,
      suffix,
      displayMode,
      textTransform,
      columnWidth,
      optionColors,
      virtual,
      virtualFormula,
      autoCompute,
      autoComputeFormula,
      readOnly,
      autonumberPrefix,
      autonumberDigits: autonumberDigits ? Number(autonumberDigits) : column.autonumberDigits,
      minValue: minValue !== "" ? Number(minValue) : column.minValue,
      maxValue: maxValue !== "" ? Number(maxValue) : column.maxValue,
      step: step !== "" ? Number(step) : column.step,
      conditionalFormat,
    }
  }, [
    column, name, required, options, defaultValue, refTableId, refDisplayColId,
    refAutoFill, refOnAdd, refOnDelete,
    formula, ratingMax, placeholder, helpText, prefix, suffix, displayMode,
    textTransform, columnWidth, optionColors, virtual, virtualFormula,
    autoCompute, autoComputeFormula, readOnly,
    autonumberPrefix, autonumberDigits, minValue, maxValue, step,
    conditionalFormat,
  ])

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleAddOption = () => {
    if (!newOption.trim()) return
    if (options.includes(newOption.trim())) return
    setOptions([...options, newOption.trim()])
    setNewOption("")
  }

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx))
  }

  const updateCascadeOption = (parentValue: string, childOptionsStr: string) => {
    setCascadeOptions((prev) => {
      const childOpts = childOptionsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const existing = prev.find((co) => co.parentValue === parentValue)
      if (existing) {
        return prev.map((co) =>
          co.parentValue === parentValue ? { ...co, options: childOpts } : co
        )
      }
      return [...prev, { parentValue, options: childOpts }]
    })
  }

  const getCascadeChildOptions = (parentValue: string): string => {
    const existing = cascadeOptions.find((co) => co.parentValue === parentValue)
    return existing ? existing.options.join(", ") : ""
  }

  const addConditionalFormatRule = () => {
    setConditionalFormat((prev) => [
      ...prev,
      { condition: "", bgColor: undefined, textColor: undefined, icon: undefined },
    ])
  }

  const updateConditionalFormatRule = (
    idx: number,
    field: keyof ConditionalFormatRule,
    value: string
  ) => {
    setConditionalFormat((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value || undefined } : r))
    )
  }

  const removeConditionalFormatRule = (idx: number) => {
    setConditionalFormat((prev) => prev.filter((_, i) => i !== idx))
  }

  // ═══════════════════════════════════════════════════════════
  // SUBMIT (same data structure as original)
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !columnId || !column) return

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      required,
      defaultValue: defaultValue || undefined,
    }

    if (column.type === "select" || column.type === "multiselect") {
      updateData.options = options
    }

    if (column.type === "reference") {
      updateData.refTableId = refTableId
      updateData.refDisplayColId = refDisplayColId
      updateData.refAutoFill = refAutoFill.filter(
        (m) => m.sourceColId && m.targetColId
      )
      const validReverse = refAutoFillReverse.filter(m => m.sourceColId && m.targetColId)
      if (validReverse.length > 0) updateData.refAutoFillReverse = validReverse
      const validOnAdd = refOnAdd.filter(op => op.targetColId && op.sourceColId)
      updateData.refOnAdd = validOnAdd.length > 0 ? validOnAdd : undefined
      const validOnDelete = refOnDelete.filter(op => op.targetColId && op.sourceColId)
      updateData.refOnDelete = validOnDelete.length > 0 ? validOnDelete : undefined
    }

    if (column.type === "formula") {
      updateData.formula = formula.trim()
    }

    if (column.type === "rating") {
      updateData.ratingMax = ratingMax
    }

    // Conditional behavior
    updateData.showIf = showIf.trim() || undefined
    updateData.requiredIf = requiredIf.trim() || undefined
    updateData.editableIf = editableIf.trim() || undefined
    updateData.validIf = validIf.trim() || undefined
    updateData.resetIf = resetIf.trim() || undefined

    // Auto-compute
    updateData.autoCompute = autoCompute || undefined
    updateData.autoComputeFormula = autoComputeFormula.trim() || undefined

    // Complementary
    if (complementaryEnabled && complementaryTotalColId && complementaryOtherColId) {
      updateData.complementaryOf = {
        totalColId: complementaryTotalColId,
        otherColId: complementaryOtherColId,
      }
      // Auto-link the other column: set its complementaryOf pointing back to this column
      const otherCol = table?.columns.find(c => c.id === complementaryOtherColId)
      if (otherCol) {
        const otherUpdate: Partial<Column> = {
          complementaryOf: {
            totalColId: complementaryTotalColId,
            otherColId: columnId,
          }
        }
        updateColumn(projectId, tableId, complementaryOtherColId, otherUpdate)
      }
    } else {
      updateData.complementaryOf = undefined
      // If disabling, also remove complementaryOf from the previously linked column
      if (column?.complementaryOf?.otherColId) {
        const prevOtherCol = table?.columns.find(c => c.id === column.complementaryOf!.otherColId)
        if (prevOtherCol?.complementaryOf) {
          updateColumn(projectId, tableId, column.complementaryOf.otherColId, { complementaryOf: undefined })
        }
      }
    }

    // Cascading
    updateData.dependsOn = dependsOn || undefined
    const validCascade = cascadeOptions.filter(
      (co) => co.parentValue && co.options.length > 0
    )
    updateData.cascadeOptions = validCascade.length > 0 ? validCascade : undefined

    // Virtual
    updateData.virtual = virtual || undefined
    updateData.virtualFormula = virtualFormula.trim() || undefined

    // Display & formatting
    updateData.placeholder = placeholder.trim() || undefined
    updateData.helpText = helpText.trim() || undefined
    updateData.description = description.trim() || undefined
    updateData.prefix = prefix.trim() || undefined
    updateData.suffix = suffix.trim() || undefined
    updateData.displayMode = displayMode !== "default" ? displayMode : undefined
    updateData.textTransform = textTransform !== "none" ? textTransform : undefined
    updateData.columnWidth = columnWidth !== "medium" ? columnWidth : undefined
    updateData.optionColors =
      Object.keys(optionColors).length > 0 ? optionColors : undefined

    // Validation
    updateData.minValue = minValue !== "" ? Number(minValue) : undefined
    updateData.maxValue = maxValue !== "" ? Number(maxValue) : undefined
    updateData.step = step !== "" ? Number(step) : undefined
    updateData.regex = regex.trim() || undefined
    updateData.regexMessage = regexMessage.trim() || undefined
    updateData.minLength = minLength !== "" ? Number(minLength) : undefined
    updateData.maxLength = maxLength !== "" ? Number(maxLength) : undefined
    updateData.decimalPlaces =
      decimalPlaces !== "" ? Number(decimalPlaces) : undefined
    updateData.unique = unique || undefined
    updateData.confirmInput = confirmInput || undefined
    updateData.editableOnce = editableOnce || undefined
    updateData.dateMin = dateMin.trim() || undefined
    updateData.dateMax = dateMax.trim() || undefined
    updateData.noPastDates = noPastDates || undefined
    updateData.noFutureDates = noFutureDates || undefined

    // Initial value formula
    updateData.initialValueFormula = initialValueFormula.trim() || undefined

    // Autonumber
    updateData.autonumberPrefix = autonumberPrefix.trim() || undefined
    updateData.autonumberDigits =
      autonumberDigits !== "" ? Number(autonumberDigits) : undefined

    // Dynamic options
    updateData.dynamicOptionsTableId = dynamicOptionsEnabled ? (dynamicOptionsTableId || undefined) : undefined
    updateData.dynamicOptionsColumnId = dynamicOptionsEnabled ? (dynamicOptionsColumnId || undefined) : undefined

    // Conditional format
    const validConditionalFormat = conditionalFormat.filter((r) =>
      r.condition.trim()
    )
    updateData.conditionalFormat =
      validConditionalFormat.length > 0 ? validConditionalFormat : undefined

    // Behavior
    updateData.readOnly = readOnly || undefined
    updateData.showInTable = showInTable
    updateData.showInForm = showInForm
    updateData.sectionName = sectionName.trim() || undefined

    updateColumn(projectId, tableId, columnId, updateData)
    toast.success(`Columna "${name}" actualizada`)
    onOpenChange(false)
  }

  // ═══════════════════════════════════════════════════════════
  // TYPE GUARDS
  // ═══════════════════════════════════════════════════════════

  if (!column) return null

  const isNumericType =
    column.type === "number" ||
    column.type === "currency" ||
    column.type === "percentage"
  const isTextType =
    column.type === "text" ||
    column.type === "email" ||
    column.type === "phone" ||
    column.type === "url"
  const isSelectType =
    column.type === "select" || column.type === "multiselect"

  // ─── Section badge counters ───
  const conditionalCount = [showIf, requiredIf, editableIf, validIf, resetIf].filter(Boolean).length
  const validationActive = unique || confirmInput || editableOnce || minValue || maxValue || step || regex || minLength || maxLength || decimalPlaces || dateMin || dateMax || noPastDates || noFutureDates
  const formatCount = conditionalFormat.filter((r) => r.condition.trim()).length

  // ─── Determine which sections to show ───
  const showPresentacion = true
  const showValidacion = isNumericType || isTextType || column.type === "date" || unique || confirmInput || editableOnce
  const showCondicional = true
  const showAutoCalculo = true
  const showComplementario = isNumericType
  const showReferencia = column.type === "reference"
  const showFormula = column.type === "formula"
  const showOpciones = isSelectType
  const showCascada = isSelectType
  const showVirtual = true
  const showFormatoCondicional = true
  const showComportamiento = true

  // Build section list (only visible ones)
  const sectionIds: string[] = []
  if (showPresentacion) sectionIds.push("presentacion")
  if (showValidacion) sectionIds.push("validacion")
  if (showCondicional) sectionIds.push("condicional")
  if (showAutoCalculo) sectionIds.push("autocalculo")
  if (showComplementario) sectionIds.push("complementario")
  if (showReferencia) sectionIds.push("referencia")
  if (showFormula) sectionIds.push("formula")
  if (showOpciones) sectionIds.push("opciones")
  if (showCascada) sectionIds.push("cascada")
  if (showVirtual) sectionIds.push("virtual")
  if (showFormatoCondicional) sectionIds.push("formato-condicional")
  if (showComportamiento) sectionIds.push("comportamiento")

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] max-h-[92vh] rounded-t-2xl p-0 flex flex-col"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* ─── Drag Handle ─── */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
          </div>

          {/* ─── Header: Type Badge + Name + Required ─── */}
          <SheetHeader className="px-4 pb-2 space-y-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <Badge
                variant="secondary"
                className={cn(
                  getColumnTypeColor(column.type),
                  "px-2.5 py-1 text-sm shrink-0"
                )}
              >
                {getColumnTypeIcon(column.type)} {getColumnTypeLabel(column.type)}
              </Badge>
              <SheetTitle className="flex-1 sr-only">
                Editar Columna
              </SheetTitle>
            </div>
            <SheetDescription className="sr-only">
              Modifica las propiedades de la columna
            </SheetDescription>
            <div className="flex items-center gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la columna"
                required
                className="h-10 text-base font-semibold border-0 bg-muted/50 focus-visible:bg-background focus-visible:ring-1 px-3 rounded-lg"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  id="edit-col-required"
                  checked={required}
                  onCheckedChange={setRequired}
                />
                <Label
                  htmlFor="edit-col-required"
                  className="text-xs font-medium whitespace-nowrap"
                >
                  Req.
                </Label>
              </div>
            </div>
          </SheetHeader>

          {/* ─── Live Preview ─── */}
          {previewColumn && (
          <div className="px-4 pb-2 shrink-0">
            <ColumnPreview
              column={previewColumn as Column}
              project={project!}
              projects={projects}
              currentProjectId={projectId}
            />
          </div>
          )}

          {/* ─── Scrollable Content Area ─── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ─── Basic Fields (always visible) ─── */}
          <div className="px-4 pb-2 space-y-3">
            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas internas sobre esta columna (no se muestra en formularios)"
                className="min-h-[48px] text-xs resize-y"
              />
            </div>

            {/* Default Value */}
            {column.type !== "formula" &&
              column.type !== "autonumber" && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Valor por Defecto</Label>
                  {column.type === "reference" ? (
                    <Select
                      value={defaultValue || "__none__"}
                      onValueChange={(v) =>
                        setDefaultValue(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sin valor por defecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          Sin valor por defecto
                        </SelectItem>
                        {refTableId && project && (() => {
                          const refTable = project.tables.find((t) => t.id === refTableId)
                          if (!refTable?.rows) return null
                          const displayCol = refDisplayColId || refTable.columns?.[0]?.id
                          return refTable.rows.map((row: Record<string, any>) => {
                            const rowId = row.id as string
                            const label = displayCol ? (row[displayCol] as string || rowId) : rowId
                            return (
                              <SelectItem key={rowId} value={rowId}>
                                {label}
                              </SelectItem>
                            )
                          })
                        })()}
                      </SelectContent>
                    </Select>
                  ) : column.type === "checkbox" ? (
                    <Select
                      value={defaultValue || "false"}
                      onValueChange={setDefaultValue}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Activado (Sí)</SelectItem>
                        <SelectItem value="false">Desactivado (No)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : column.type === "select" ||
                    column.type === "multiselect" ? (
                    <Select
                      value={defaultValue || "__none__"}
                      onValueChange={(v) =>
                        setDefaultValue(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sin valor por defecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          Sin valor por defecto
                        </SelectItem>
                        {options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={
                        isNumericType
                          ? "number"
                          : column.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      placeholder="Dejar vacío si no aplica"
                      className="h-9"
                    />
                  )}
                </div>
              )}

            {/* Initial Value Formula */}
            {column.type !== "formula" && column.type !== "autonumber" && (
              <FormulaInputWithRef
                label="Valor Inicial Dinámico"
                value={initialValueFormula}
                onChange={setInitialValueFormula}
                helpText="Fórmula que calcula el valor inicial al crear una nueva fila. Sobreescribe el valor por defecto si se especifica"
                columns={table?.columns || []}
                project={project}
                currentProjectId={projectId}
              />
            )}

            {/* Autonumber config */}
            {column.type === "autonumber" && (
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <Label className="text-xs font-semibold">Formato de Auto-número</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Prefijo</Label>
                    <Input
                      value={autonumberPrefix}
                      onChange={(e) => setAutonumberPrefix(e.target.value)}
                      placeholder="Ej: INV-, ORD-"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Dígitos</Label>
                    <Input
                      type="number"
                      value={autonumberDigits}
                      onChange={(e) => setAutonumberDigits(e.target.value)}
                      placeholder="3 → 001"
                      min={1}
                      max={10}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Ejemplo: prefijo &quot;INV-&quot; + 3 dígitos → INV-001, INV-002...
                </p>
              </div>
            )}

            {/* Rating max */}
            {column.type === "rating" && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Máximo de estrellas</Label>
                <Select
                  value={String(ratingMax)}
                  onValueChange={(v) => setRatingMax(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} estrellas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ─── Collapsible Sections ─── */}
          <div className="px-4 pb-4">
            <Accordion
              type="multiple"
              defaultValue={[]}
              className="w-full space-y-2"
            >
              {/* ═══ Presentación Visual ═══ */}
              {showPresentacion && (
                <AccordionItem value="presentacion">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-violet-500/15"><Palette className="h-4 w-4 text-violet-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Presentación Visual</span>
                      {displayMode !== "default" && (
                        <SectionBadge>{DISPLAY_MODE_OPTIONS[column.type]?.find(o => o.value === displayMode)?.label}</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    {/* Display Mode */}
                    {currentDisplayModeOptions.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Modo de Visualización</Label>
                        <Select
                          value={displayMode}
                          onValueChange={(v) =>
                            setDisplayMode(v as ColumnDisplayMode)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentDisplayModeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                          Cómo se renderizará este campo en los formularios
                        </p>
                      </div>
                    )}

                    {/* Placeholder */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Marcador de posición</Label>
                      <Input
                        value={placeholder}
                        onChange={(e) => setPlaceholder(e.target.value)}
                        placeholder="Texto placeholder en el campo vacío"
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Help Text */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Texto de ayuda</Label>
                      <Input
                        value={helpText}
                        onChange={(e) => setHelpText(e.target.value)}
                        placeholder="Texto mostrado debajo del campo"
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Prefix/Suffix (number/currency/percentage) */}
                    {isNumericType && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Prefijo</Label>
                          <Input
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="Ej: $, MXN, #"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Sufijo</Label>
                          <Input
                            value={suffix}
                            onChange={(e) => setSuffix(e.target.value)}
                            placeholder="Ej: %, kg, uds"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Text Transform (text/email/phone/url) */}
                    {isTextType && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Transformar texto</Label>
                        <Select
                          value={textTransform}
                          onValueChange={(v) =>
                            setTextTransform(v as typeof textTransform)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin transformación</SelectItem>
                            <SelectItem value="uppercase">MAYÚSCULAS</SelectItem>
                            <SelectItem value="lowercase">minúsculas</SelectItem>
                            <SelectItem value="titlecase">Tipo Título</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Column Width */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Ancho en tabla</Label>
                      <Select
                        value={columnWidth}
                        onValueChange={(v) =>
                          setColumnWidth(v as typeof columnWidth)
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="narrow">Estrecho</SelectItem>
                          <SelectItem value="medium">Medio</SelectItem>
                          <SelectItem value="wide">Ancho</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Option Colors (select/multiselect) */}
                    {isSelectType && options.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Colores de Opciones</Label>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {options.map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                              <span className="text-xs min-w-[80px] truncate">
                                {opt}
                              </span>
                              <input
                                type="color"
                                value={optionColors[opt] || "#6366F1"}
                                onChange={(e) =>
                                  setOptionColors((prev) => ({
                                    ...prev,
                                    [opt]: e.target.value,
                                  }))
                                }
                                className="h-8 w-8 rounded border cursor-pointer"
                              />
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {optionColors[opt] || "—por defecto—"}
                              </span>
                              {optionColors[opt] && (
                                <button
                                  type="button"
                                  className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => {
                                    const next = { ...optionColors }
                                    delete next[opt]
                                    setOptionColors(next)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section Name */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Sección del formulario</Label>
                      <Input
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="Agrupa campos bajo un título de sección"
                        className="h-9 text-xs"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Validación y Restricciones ═══ */}
              {showValidacion && (
                <AccordionItem value="validacion">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-blue-500/15"><Shield className="h-4 w-4 text-blue-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Validación y Restricciones</span>
                      {validationActive && (
                        <SectionBadge>activas</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    {/* Unique */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Valor Único</Label>
                        <p className="text-[10px] text-muted-foreground">
                          No permitir valores duplicados
                        </p>
                      </div>
                      <Switch checked={unique} onCheckedChange={setUnique} />
                    </div>

                    {/* Confirm Input */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Confirmar entrada</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Escribir el valor dos veces
                        </p>
                      </div>
                      <Switch
                        checked={confirmInput}
                        onCheckedChange={setConfirmInput}
                      />
                    </div>

                    {/* Editable Once */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Editable solo al crear</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Solo lectura al editar
                        </p>
                      </div>
                      <Switch
                        checked={editableOnce}
                        onCheckedChange={setEditableOnce}
                      />
                    </div>

                    {/* Number/currency/percentage validation */}
                    {isNumericType && (
                      <div className="space-y-3 p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
                        <Label className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          Restricciones numéricas
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Mínimo</Label>
                            <Input
                              type="number"
                              value={minValue}
                              onChange={(e) => setMinValue(e.target.value)}
                              placeholder="Sin límite"
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Máximo</Label>
                            <Input
                              type="number"
                              value={maxValue}
                              onChange={(e) => setMaxValue(e.target.value)}
                              placeholder="Sin límite"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Incremento</Label>
                            <Input
                              type="number"
                              value={step}
                              onChange={(e) => setStep(e.target.value)}
                              placeholder="1"
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Decimales</Label>
                            <Input
                              type="number"
                              value={decimalPlaces}
                              onChange={(e) => setDecimalPlaces(e.target.value)}
                              placeholder="Auto"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text/email/phone/url validation */}
                    {isTextType && (
                      <div className="space-y-3 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20">
                        <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Restricciones de texto
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Longitud mínima</Label>
                            <Input
                              type="number"
                              value={minLength}
                              onChange={(e) => setMinLength(e.target.value)}
                              placeholder="0"
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Longitud máxima</Label>
                            <Input
                              type="number"
                              value={maxLength}
                              onChange={(e) => setMaxLength(e.target.value)}
                              placeholder="Sin límite"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Patrón regex</Label>
                          <Input
                            value={regex}
                            onChange={(e) => setRegex(e.target.value)}
                            placeholder="Ej: ^[A-Za-z]+$"
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Mensaje de error</Label>
                          <Input
                            value={regexMessage}
                            onChange={(e) => setRegexMessage(e.target.value)}
                            placeholder="Mensaje cuando el patrón no coincide"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Date validation */}
                    {column.type === "date" && (
                      <div className="space-y-3 p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20">
                        <Label className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Restricciones de fecha
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Fecha mínima</Label>
                            <Input
                              type="date"
                              value={dateMin}
                              onChange={(e) => setDateMin(e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Fecha máxima</Label>
                            <Input
                              type="date"
                              value={dateMax}
                              onChange={(e) => setDateMax(e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <Label className="text-xs font-medium">No fechas pasadas</Label>
                            <p className="text-[10px] text-muted-foreground">
                              Solo fechas de hoy en adelante
                            </p>
                          </div>
                          <Switch
                            checked={noPastDates}
                            onCheckedChange={setNoPastDates}
                          />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <Label className="text-xs font-medium">No fechas futuras</Label>
                            <p className="text-[10px] text-muted-foreground">
                              Solo fechas hasta hoy
                            </p>
                          </div>
                          <Switch
                            checked={noFutureDates}
                            onCheckedChange={setNoFutureDates}
                          />
                        </div>
                      </div>
                    )}

                    {!isNumericType && !isTextType && column.type !== "date" && (
                      <p className="text-xs text-muted-foreground py-2">
                        No hay restricciones de validación adicionales para este tipo
                        de columna
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Comportamiento Condicional ═══ */}
              {showCondicional && (
                <AccordionItem value="condicional">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-amber-500/15"><Eye className="h-4 w-4 text-amber-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Comportamiento Condicional</span>
                      {conditionalCount > 0 && (
                        <SectionBadge>{conditionalCount} reglas</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <FormulaInputWithRef
                      label="Mostrar si"
                      value={showIf}
                      onChange={setShowIf}
                      helpText='Fórmula que debe ser verdadera para mostrar este campo. Ej: {col-tipo} = "Ingreso"'
                      columns={table?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Obligatorio si"
                      value={requiredIf}
                      onChange={setRequiredIf}
                      helpText="Campo requerido solo cuando la fórmula es verdadera"
                      columns={table?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Editable si"
                      value={editableIf}
                      onChange={setEditableIf}
                      helpText="Campo editable solo cuando la fórmula es verdadera. Si no, será solo lectura"
                      columns={table?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Válido si"
                      value={validIf}
                      onChange={setValidIf}
                      helpText="Fórmula de validación personalizada. El valor será inválido si es falso"
                      columns={table?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                    <FormulaInputWithRef
                      label="Resetear si"
                      value={resetIf}
                      onChange={setResetIf}
                      helpText="Se reseteará el valor cuando esta condición sea verdadera"
                      columns={table?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Auto-cálculo ═══ */}
              {showAutoCalculo && (
                <AccordionItem value="autocalculo">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-yellow-500/15"><Zap className="h-4 w-4 text-yellow-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Auto-cálculo</span>
                      {autoCompute && (
                        <SectionBadge>activado</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Auto-calcular</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Pre-llenar con resultado de fórmula (editable)
                        </p>
                      </div>
                      <Switch
                        checked={autoCompute}
                        onCheckedChange={setAutoCompute}
                      />
                    </div>
                    {autoCompute && (
                      <FormulaInputWithRef
                        label="Fórmula de auto-cálculo"
                        value={autoComputeFormula}
                        onChange={setAutoComputeFormula}
                        helpText="El campo se llenará automáticamente con el resultado de la fórmula, pero el usuario podrá modificarlo"
                        columns={table?.columns || []}
                        project={project}
                        currentProjectId={projectId}
                      />
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      El campo se pre-llena con el resultado de la fórmula, pero sigue
                      siendo editable por el usuario
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Campo Complementario ═══ */}
              {showComplementario && (
                <AccordionItem value="complementario">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-orange-500/15"><Split className="h-4 w-4 text-orange-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Campo Complementario</span>
                      {complementaryEnabled && (
                        <SectionBadge>activado</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Campo complementario</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Dos campos que suman un total. Al editar uno, el otro se rellena autom&aacute;ticamente. Se configura una sola vez y ambos se vinculan.
                        </p>
                      </div>
                      <Switch
                        checked={complementaryEnabled}
                        onCheckedChange={setComplementaryEnabled}
                      />
                    </div>
                    {complementaryEnabled && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Columna Total</Label>
                          <Select value={complementaryTotalColId} onValueChange={setComplementaryTotalColId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Seleccionar columna total..." />
                            </SelectTrigger>
                            <SelectContent>
                              {table?.columns
                                .filter(c => c.id !== column?.id && (c.type === "formula" || c.type === "currency" || c.type === "number" || c.type === "percentage"))
                                .map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-[10px] opacity-50">{getColumnTypeIcon(c.type)}</span>
                                      {c.name}
                                      <span className="text-[10px] text-muted-foreground">({getColumnTypeLabel(c.type)})</span>
                                    </span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground">
                            La columna cuyo valor es el total. Ambos campos complementarios deben sumar este total.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Otro Campo Complementario</Label>
                          <Select value={complementaryOtherColId} onValueChange={setComplementaryOtherColId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Seleccionar campo complementario..." />
                            </SelectTrigger>
                            <SelectContent>
                              {table?.columns
                                .filter(c => c.id !== column?.id && c.id !== complementaryTotalColId && (c.type === "currency" || c.type === "number" || c.type === "percentage"))
                                .map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-[10px] opacity-50">{getColumnTypeIcon(c.type)}</span>
                                      {c.name}
                                    </span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground">
                            El otro campo que complementa a este. Al editar uno, el otro se rellena con la diferencia.
                          </p>
                        </div>
                        {complementaryEnabled && complementaryTotalColId && complementaryOtherColId && (
                          <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-3 space-y-1.5">
                            <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                              Comportamiento
                            </p>
                            <p className="text-[11px] text-orange-600 dark:text-orange-400">
                              Al escribir en <b>&quot;{column?.name}&quot;</b>, el campo <b>&quot;{table?.columns.find(c => c.id === complementaryOtherColId)?.name}&quot;</b> se rellenar&aacute; autom&aacute;ticamente con: {table?.columns.find(c => c.id === complementaryTotalColId)?.name} − este campo
                            </p>
                            <p className="text-[11px] text-orange-600 dark:text-orange-400">
                              Y viceversa: al escribir en <b>&quot;{table?.columns.find(c => c.id === complementaryOtherColId)?.name}&quot;</b>, <b>&quot;{column?.name}&quot;</b> se rellenar&aacute; con el resto.
                            </p>
                            <p className="text-[10px] text-orange-500/70 dark:text-orange-400/70 mt-1">
                              Ambos campos se vincular&aacute;n autom&aacute;ticamente al guardar.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Referencia ═══ */}
              {showReferencia && (
                <AccordionItem value="referencia">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-rose-500/15"><ExternalLink className="h-4 w-4 text-rose-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Referencia</span>
                      {refTableId && refDisplayColId && (
                        <SectionBadge>configurada</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <ReferenceBuilder
                      refTableId={refTableId}
                      setRefTableId={setRefTableId}
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
                      project={project!}
                      currentTableId={tableId}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Fórmula ═══ */}
              {showFormula && (
                <AccordionItem value="formula">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-orange-500/15"><Code className="h-4 w-4 text-orange-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Fórmula</span>
                      {formula.trim() && (
                        <SectionBadge>definida</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <FormulaBuilder
                      value={formula}
                      onChange={setFormula}
                      columns={table?.columns || []}
                      project={project!}
                      projects={projects}
                      currentProjectId={projectId}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Opciones ═══ */}
              {showOpciones && (
                <AccordionItem value="opciones">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-violet-500/15"><List className="h-4 w-4 text-violet-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Opciones</span>
                      {options.length > 0 && (
                        <SectionBadge>{options.length}</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    {/* Options list */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Lista de opciones</Label>
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
                          className="h-10 gap-1 shrink-0 px-3"
                          onClick={handleAddOption}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {options.map((opt, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
                            >
                              {opt}
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                                onClick={() => handleRemoveOption(idx)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Options */}
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-semibold">Opciones dinámicas desde otra tabla</Label>
                          <p className="text-[10px] text-muted-foreground">
                            Obtener opciones de las filas de otra tabla en vez de
                            definirlas manualmente
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
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Tabla origen</Label>
                            <Select
                              value={dynamicOptionsTableId || "__none__"}
                              onValueChange={(v) => {
                                setDynamicOptionsTableId(
                                  v === "__none__" ? "" : v
                                )
                                setDynamicOptionsColumnId("")
                              }}
                            >
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
                                      .filter((t) => !(p.id === projectId && t.id === tableId))
                                      .map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                          {t.emoji} {t.name}
                                        </SelectItem>
                                      ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Columna a mostrar</Label>
                            <Select
                              value={dynamicOptionsColumnId || "__none__"}
                              onValueChange={(v) =>
                                setDynamicOptionsColumnId(
                                  v === "__none__" ? "" : v
                                )
                              }
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Seleccionar columna..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Ninguna</SelectItem>
                                {dynamicOptionsTableColumns.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {getColumnTypeIcon(c.type)} {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Cascada ═══ */}
              {showCascada && (
                <AccordionItem value="cascada">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-purple-500/15"><ChevronDown className="h-4 w-4 text-purple-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Cascada</span>
                      {dependsOn && (
                        <SectionBadge>configurada</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Depende de</Label>
                      <Select
                        value={dependsOn || "__none__"}
                        onValueChange={(v) => {
                          setDependsOn(v === "__none__" ? "" : v)
                          setCascadeOptions([])
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar columna padre..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            Ninguna (independiente)
                          </SelectItem>
                          {selectColumns.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Columna select de la que depende este campo
                      </p>
                    </div>
                    {dependsOn && parentColumnOptions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          Opciones por valor del padre
                        </Label>
                        {parentColumnOptions.map((opt) => (
                          <div key={opt} className="space-y-1">
                            <p className="text-[11px] text-muted-foreground font-medium">
                              Cuando padre ={" "}
                              <span className="text-purple-700 dark:text-purple-300">
                                {opt}
                              </span>
                              :
                            </p>
                            <Input
                              value={getCascadeChildOptions(opt)}
                              onChange={(e) =>
                                updateCascadeOption(opt, e.target.value)
                              }
                              placeholder="Opciones separadas por coma"
                              className="h-9 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Columna Virtual ═══ */}
              {showVirtual && (
                <AccordionItem value="virtual">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-slate-500/15"><Ghost className="h-4 w-4 text-slate-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Columna Virtual</span>
                      {virtual && (
                        <SectionBadge>activada</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Columna Virtual</Label>
                        <p className="text-[10px] text-muted-foreground">
                          No almacena datos, solo muestra un cálculo
                        </p>
                      </div>
                      <Switch checked={virtual} onCheckedChange={setVirtual} />
                    </div>
                    {virtual && (
                      <FormulaInputWithRef
                        label="Fórmula virtual"
                        value={virtualFormula}
                        onChange={setVirtualFormula}
                        helpText="Las columnas virtuales no almacenan datos, solo muestran el resultado de esta fórmula"
                        columns={table?.columns || []}
                        project={project}
                        currentProjectId={projectId}
                      />
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Las columnas virtuales no almacenan datos, solo muestran un
                      cálculo derivado en tiempo real
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Formato Condicional ═══ */}
              {showFormatoCondicional && (
                <AccordionItem value="formato-condicional">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-pink-500/15"><Palette className="h-4 w-4 text-pink-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Formato Condicional</span>
                      {formatCount > 0 && (
                        <SectionBadge>{formatCount} reglas</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <ConditionalFormatSection
                      rules={conditionalFormat}
                      onAddRule={addConditionalFormatRule}
                      onChangeRule={updateConditionalFormatRule}
                      onRemoveRule={removeConditionalFormatRule}
                      columns={table?.columns || []}
                      project={project}
                      currentProjectId={projectId}
                      formatCount={formatCount}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ═══ Comportamiento ═══ */}
              {showComportamiento && (
                <AccordionItem value="comportamiento">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon color="bg-green-500/15"><Settings className="h-4 w-4 text-green-600" /></SectionIcon>
                      <span className="text-sm font-semibold">Comportamiento</span>
                      {readOnly && (
                        <SectionBadge>solo lectura</SectionBadge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Solo lectura</Label>
                        <p className="text-[10px] text-muted-foreground">
                          El usuario no puede modificar este campo
                        </p>
                      </div>
                      <Switch checked={readOnly} onCheckedChange={setReadOnly} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Mostrar en tabla</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Mostrar esta columna en la vista de tabla
                        </p>
                      </div>
                      <Switch
                        checked={showInTable}
                        onCheckedChange={setShowInTable}
                      />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label className="text-xs font-medium">Mostrar en formulario</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Mostrar este campo en los formularios
                        </p>
                      </div>
                      <Switch
                        checked={showInForm}
                        onCheckedChange={setShowInForm}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>

          </div>{/* end scrollable content area */}

          {/* ─── Fixed Footer ─── */}
          <SheetFooter className="px-4 py-3 border-t bg-background shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 h-11">
                Guardar Cambios
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
