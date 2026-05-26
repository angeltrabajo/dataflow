"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { useAppStore, type Project, type Table, type Column } from "@/lib/store"
import { getColumnTypeIcon, evaluateColumnCondition, evaluateAutoCompute } from "@/lib/helpers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Check, Star, ExternalLink, AlertCircle, Repeat, X as XIcon, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

interface QuickRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selected project ID — skips project selection step */
  projectId?: string | null
}

export function QuickRecordModal({ open, onOpenChange, projectId }: QuickRecordModalProps) {
  const { projects, addRow, addRowsBatch, selectTable } = useAppStore()
  const [step, setStep] = useState<1 | 2 | 3>(projectId ? 2 : 1)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId ?? null)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const manuallyEditedRef = useRef<Set<string>>(new Set())

  // ─── Repeatable Section State ───
  const [repeatItems, setRepeatItems] = useState<Record<string, any>[]>([])

  // When the modal opens, initialize step based on projectId
  React.useEffect(() => {
    if (open) {
      if (projectId) {
        setStep(2)
        setSelectedProjectId(projectId)
      } else {
        setStep(1)
        setSelectedProjectId(null)
      }
      setSelectedTableId(null)
      setFormData({})
      setValidationErrors({})
      setRepeatItems([])
      manuallyEditedRef.current.clear()
    }
  }, [open, projectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  )

  const selectedTable = useMemo(
    () => selectedProject?.tables.find((t) => t.id === selectedTableId),
    [selectedProject, selectedTableId]
  )

  // The repeatable section of the selected table (if any)
  const rs = selectedTable?.repeatableSection

  // Build virtual allRows that includes current repeat items (unsaved data)
  // This is critical for SUMAR.SECCION to work correctly in autoCompute
  const virtualAllRows = useMemo(() => {
    if (!rs || repeatItems.length === 0) return selectedTable?.rows || []
    const tempGroupId = '__qr_new_group__'
    const nonGroupRows = selectedTable?.rows || []
    const newGroupRows = repeatItems.map((item, idx) => ({
      ...formData,
      ...item,
      _repeatGroupId: tempGroupId,
      id: `__virtual_${idx}__`,
    } as any))
    return [...nonGroupRows, ...newGroupRows]
  }, [rs, repeatItems, formData, selectedTable?.rows])

  // Auto-compute
  // Also recalculates complementary fields when autoCompute affects them
  useEffect(() => {
    if (!selectedTable || step !== 3) return
    const updates: Record<string, any> = {}
    for (const col of selectedTable.columns) {
      if (col.autoCompute && col.autoComputeFormula && !manuallyEditedRef.current.has(col.id)) {
        const result = evaluateAutoCompute(col.autoComputeFormula, formData, selectedTable.columns, projects, selectedProjectId!, virtualAllRows)
        if (result !== undefined && result !== formData[col.id]) {
          updates[col.id] = result
        }
      }
    }

    // Complementary recalculation after autoCompute
    if (Object.keys(updates).length > 0) {
      for (const col of selectedTable.columns) {
        if (!col.complementaryOf) continue
        const { totalColId, otherColId } = col.complementaryOf
        const totalCol = selectedTable.columns.find(c => c.id === totalColId)
        if (!totalCol) continue

        if (manuallyEditedRef.current.has(col.id) || manuallyEditedRef.current.has(otherColId)) continue

        const affectedByAutoCompute = updates[totalColId] !== undefined || updates[otherColId] !== undefined
        if (!affectedByAutoCompute) continue

        let totalValue: number
        if (totalCol.type === "formula" && totalCol.formula) {
          const result = evaluateAutoCompute(totalCol.formula, { ...formData, ...updates }, selectedTable.columns, projects, selectedProjectId!, virtualAllRows)
          totalValue = Number(result) || 0
        } else if (totalCol.autoCompute && totalCol.autoComputeFormula) {
          const result = evaluateAutoCompute(totalCol.autoComputeFormula, { ...formData, ...updates }, selectedTable.columns, projects, selectedProjectId!, virtualAllRows)
          totalValue = Number(result) || 0
        } else {
          totalValue = Number(updates[totalColId] ?? formData[totalColId]) || 0
        }

        const otherValue = Number(updates[otherColId] ?? formData[otherColId]) || 0
        const expectedValue = Math.max(0, totalValue - otherValue)

        if (expectedValue !== Number(formData[col.id])) {
          updates[col.id] = expectedValue
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }))
    }
  }, [formData, selectedTable, projects, selectedProjectId, step, virtualAllRows])

  // Reset if
  useEffect(() => {
    if (!selectedTable || step !== 3) return
    const resets: Record<string, any> = {}
    for (const col of selectedTable.columns) {
      if (col.resetIf) {
        const shouldReset = evaluateColumnCondition(col.resetIf, formData, selectedTable.columns, projects, selectedProjectId!)
        if (shouldReset && formData[col.id] !== "" && formData[col.id] !== undefined && formData[col.id] !== null) {
          resets[col.id] = col.type === "checkbox" ? false : ""
        }
      }
    }
    if (Object.keys(resets).length > 0) {
      setFormData(prev => ({ ...prev, ...resets }))
    }
  }, [formData, selectedTable, projects, selectedProjectId, step])

  const reset = () => {
    if (projectId) {
      setStep(2)
      setSelectedProjectId(projectId)
    } else {
      setStep(1)
      setSelectedProjectId(null)
    }
    setSelectedTableId(null)
    setFormData({})
    setValidationErrors({})
    setRepeatItems([])
    manuallyEditedRef.current.clear()
  }

  const handleClose = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id)
    setSelectedTableId(null)
    setStep(2)
  }

  const handleSelectTable = (id: string) => {
    setSelectedTableId(id)
    const table = selectedProject?.tables.find(t => t.id === id)
    const initData: Record<string, any> = {}
    if (table) {
      const repeatableColIds = table.repeatableSection ? new Set(table.repeatableSection.columnIds) : new Set<string>()

      table.columns.forEach(col => {
        if (col.type === "formula" || col.type === "autonumber") return
        // Skip repeatable columns from common formData
        if (repeatableColIds.has(col.id)) return

        if (col.defaultValue !== undefined && col.defaultValue !== "") {
          if (col.type === "checkbox") {
            initData[col.id] = col.defaultValue === "true"
          } else if (col.type === "number" || col.type === "currency" || col.type === "percentage") {
            initData[col.id] = Number(col.defaultValue) || (col.defaultValue === "0" ? 0 : "")
          } else {
            initData[col.id] = col.defaultValue
          }
        } else {
          initData[col.id] = col.type === "checkbox" ? false : ""
        }
      })

      // Initialize repeat items if table has a repeatable section
      if (table.repeatableSection) {
        const emptyItem: Record<string, any> = {}
        for (const colId of table.repeatableSection.columnIds) {
          const col = table.columns.find(c => c.id === colId)
          if (col && col.type !== "formula" && col.type !== "autonumber" && !col.virtual) {
            if (col.defaultValue !== undefined && col.defaultValue !== "") {
              if (col.type === "checkbox") {
                emptyItem[col.id] = col.defaultValue === "true"
              } else if (col.type === "number" || col.type === "currency" || col.type === "percentage") {
                emptyItem[col.id] = Number(col.defaultValue) || ""
              } else {
                emptyItem[col.id] = col.defaultValue
              }
            } else {
              emptyItem[col.id] = col.type === "checkbox" ? false : ""
            }
          }
        }
        // Start with minItems (default 1)
        const minItems = table.repeatableSection.minItems ?? 1
        const items = Array.from({ length: minItems }, () => ({ ...emptyItem }))
        setRepeatItems(items)
      } else {
        setRepeatItems([])
      }
    }
    setFormData(initData)
    setValidationErrors({})
    manuallyEditedRef.current.clear()
    lastComplementaryEditRef.current = null
    setStep(3)
  }

  // ─── Repeatable items handlers ───
  const addRepeatItem = () => {
    if (!rs) return
    if (rs.maxItems && rs.maxItems > 0 && repeatItems.length >= rs.maxItems) {
      toast.error(`Máximo ${rs.maxItems} ítems permitidos`)
      return
    }
    const emptyItem: Record<string, any> = {}
    for (const colId of rs.columnIds) {
      const col = selectedTable?.columns.find(c => c.id === colId)
      if (col && col.type !== "formula" && col.type !== "autonumber" && !col.virtual) {
        if (col.defaultValue !== undefined && col.defaultValue !== "") {
          if (col.type === "checkbox") {
            emptyItem[col.id] = col.defaultValue === "true"
          } else if (col.type === "number" || col.type === "currency" || col.type === "percentage") {
            emptyItem[col.id] = Number(col.defaultValue) || ""
          } else {
            emptyItem[col.id] = col.defaultValue
          }
        } else {
          emptyItem[col.id] = col.type === "checkbox" ? false : ""
        }
      }
    }
    setRepeatItems(prev => [...prev, emptyItem])
  }

  const removeRepeatItem = (index: number) => {
    if (!rs) return
    if (rs.minItems && repeatItems.length <= rs.minItems) {
      toast.error(`Mínimo ${rs.minItems} ítems requeridos`)
      return
    }
    setRepeatItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateRepeatItem = (index: number, colId: string, value: any) => {
    setRepeatItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [colId]: value }
      return updated
    })
  }

  // Handle reference auto-fill in repeatable item
  const handleRepeatRefChange = (itemIndex: number, colId: string, refRowId: string) => {
    updateRepeatItem(itemIndex, colId, refRowId)

    if (!selectedTable || !selectedProject) return

    const column = selectedTable.columns.find(c => c.id === colId)
    if (!column?.refAutoFill || !column.refTableId) return

    const refTable = selectedProject.tables.find(t => t.id === column.refTableId)
    if (!refTable) return

    const refRow = refTable.rows.find(r => r.id === refRowId)
    if (!refRow) return

    setRepeatItems(prev => {
      const updated = [...prev]
      const item = { ...updated[itemIndex] }
      for (const mapping of column.refAutoFill!) {
        const sourceValue = refRow[mapping.sourceColId]
        if (sourceValue !== undefined) {
          // Only auto-fill if the target column is in the repeatable section
          if (rs?.columnIds.includes(mapping.targetColId)) {
            item[mapping.targetColId] = sourceValue
          } else {
            // Auto-fill common field in formData
            setFormData(fd => ({ ...fd, [mapping.targetColId]: sourceValue }))
          }
        }
      }
      updated[itemIndex] = item
      return updated
    })
  }

  // Complementary fields: when one complementary field is edited, auto-fill the other
  const lastComplementaryEditRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedTable || step !== 3) return
    if (!lastComplementaryEditRef.current) return

    const editedColId = lastComplementaryEditRef.current
    const editedCol = selectedTable.columns.find(c => c.id === editedColId)
    if (!editedCol?.complementaryOf) return

    const { totalColId, otherColId } = editedCol.complementaryOf
    const totalCol = selectedTable.columns.find(c => c.id === totalColId)
    if (!totalCol) return

    let totalValue: number
    if (totalCol.type === "formula" && totalCol.formula) {
      const result = evaluateAutoCompute(totalCol.formula, formData, selectedTable.columns, projects, selectedProjectId!, virtualAllRows)
      totalValue = Number(result) || 0
    } else if (totalCol.autoCompute && totalCol.autoComputeFormula) {
      const result = evaluateAutoCompute(totalCol.autoComputeFormula, formData, selectedTable.columns, projects, selectedProjectId!, virtualAllRows)
      totalValue = Number(result) || 0
    } else {
      totalValue = Number(formData[totalColId]) || 0
    }

    const editedValue = Number(formData[editedColId]) || 0
    const otherValue = Math.max(0, totalValue - editedValue)

    setFormData(prev => {
      if (prev[otherColId] === otherValue) return prev
      return { ...prev, [otherColId]: otherValue }
    })

    manuallyEditedRef.current.add(otherColId)
    lastComplementaryEditRef.current = null
  }, [formData, selectedTable, projects, selectedProjectId, step, virtualAllRows])

  const handleFieldChange = (colId: string, value: any) => {
    manuallyEditedRef.current.add(colId)
    lastComplementaryEditRef.current = colId
    setFormData((prev) => ({ ...prev, [colId]: value }))
    setValidationErrors(prev => { const next = { ...prev }; delete next[colId]; return next })
  }

  const handleRefChange = (colId: string, refRowId: string) => {
    handleFieldChange(colId, refRowId)

    if (!selectedTable || !selectedProject) return

    const column = selectedTable.columns.find(c => c.id === colId)
    if (!column?.refAutoFill || !column.refTableId) return

    const refTable = selectedProject.tables.find(t => t.id === column.refTableId)
    if (!refTable) return

    const refRow = refTable.rows.find(r => r.id === refRowId)
    if (!refRow) return

    setFormData((prev) => {
      const updated = { ...prev }
      for (const mapping of column.refAutoFill!) {
        const sourceValue = refRow[mapping.sourceColId]
        if (sourceValue !== undefined) {
          updated[mapping.targetColId] = sourceValue
          manuallyEditedRef.current.add(mapping.targetColId)
        }
      }
      return updated
    })
  }

  const handleCascadingParentChange = (colId: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [colId]: value }
      if (selectedTable) {
        for (const col of selectedTable.columns) {
          if (col.dependsOn === colId) {
            updated[col.id] = ""
          }
        }
      }
      return updated
    })
    manuallyEditedRef.current.add(colId)
  }

  const handleSubmit = () => {
    if (!selectedProjectId || !selectedTableId || !selectedTable) return

    const errors: Record<string, string> = {}

    for (const col of selectedTable.columns) {
      if (col.type === "formula" || col.type === "autonumber") continue

      // Skip repeatable section columns - they're validated separately below
      if (rs && rs.columnIds.includes(col.id)) continue

      if (col.showIf && !evaluateColumnCondition(col.showIf, formData, selectedTable.columns, projects, selectedProjectId)) continue
      if (col.showInForm === false) continue
      if (col.virtual) continue

      const value = formData[col.id]
      const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, formData, selectedTable.columns, projects, selectedProjectId))

      if (isRequired && (value == null || value === "")) {
        errors[col.id] = `El campo "${col.name}" es requerido`
        continue
      }

      if (col.validIf && value !== "" && value != null) {
        const isValid = evaluateColumnCondition(col.validIf, formData, selectedTable.columns, projects, selectedProjectId)
        if (!isValid) {
          errors[col.id] = `El valor de "${col.name}" no es válido`
          continue
        }
      }

      if (col.regex && (col.type === "text" || col.type === "email" || col.type === "phone" || col.type === "url") && value) {
        try {
          const re = new RegExp(col.regex)
          if (!re.test(String(value))) {
            errors[col.id] = col.regexMessage || `El valor no coincide con el patrón`
            continue
          }
        } catch { /* skip */ }
      }

      if ((col.type === "text" || col.type === "email" || col.type === "phone" || col.type === "url") && value) {
        if (col.minLength && String(value).length < col.minLength) { errors[col.id] = `Mínimo ${col.minLength} caracteres`; continue }
        if (col.maxLength && String(value).length > col.maxLength) { errors[col.id] = `Máximo ${col.maxLength} caracteres`; continue }
      }

      if ((col.type === "number" || col.type === "currency" || col.type === "percentage") && value !== "" && value != null) {
        const numVal = Number(value)
        if (col.minValue != null && numVal < col.minValue) { errors[col.id] = `El valor mínimo es ${col.minValue}`; continue }
        if (col.maxValue != null && numVal > col.maxValue) { errors[col.id] = `El valor máximo es ${col.maxValue}`; continue }
      }
    }

    // Validate repeatable section items
    if (rs && repeatItems.length > 0) {
      const repeatErrors: Record<string, string> = {}
      for (let itemIdx = 0; itemIdx < repeatItems.length; itemIdx++) {
        const item = repeatItems[itemIdx]
        for (const colId of rs.columnIds) {
          const col = selectedTable.columns.find(c => c.id === colId)
          if (!col || col.type === "formula" || col.type === "autonumber" || col.virtual) continue
          if (col.showIf && !evaluateColumnCondition(col.showIf, { ...formData, ...item }, selectedTable.columns, projects, selectedProjectId)) continue
          if (col.showInForm === false) continue

          const value = item[colId]
          const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, { ...formData, ...item }, selectedTable.columns, projects, selectedProjectId))
          if (isRequired && (value == null || value === "")) {
            repeatErrors[`repeat-${itemIdx}-${colId}`] = `Ítem ${itemIdx + 1}: "${col.name}" es requerido`
          }
        }
      }

      if (Object.keys(repeatErrors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...repeatErrors }))
        const firstError = Object.values(repeatErrors)[0]
        toast.error(firstError)
        return
      }
    }

    // Check min items
    if (rs && rs.minItems && repeatItems.length < rs.minItems) {
      toast.error(`Mínimo ${rs.minItems} ítems requeridos en la sección repetible`)
      return
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error(Object.values(errors)[0])
      return
    }

    // Build submit data (exclude virtual columns, formula, autonumber, and repeatable columns)
    const submitData: Record<string, any> = {}
    for (const col of selectedTable.columns) {
      if (col.type === "formula" || col.type === "autonumber") continue
      if (col.virtual) continue
      // If repeatable section is active, exclude repeatable columns from common data
      if (rs && rs.columnIds.includes(col.id)) continue
      submitData[col.id] = formData[col.id]
    }

    // ─── Handle repeatable section submit ───
    if (rs && repeatItems.length > 0) {
      const groupId = Date.now().toString(36) + Math.random().toString(36).slice(2)
      const rows = repeatItems.map(item => ({
        ...submitData,
        ...item,
      }))
      addRowsBatch(selectedProjectId, selectedTableId, rows, groupId)
      toast.success(`${repeatItems.length} registro${repeatItems.length > 1 ? "s" : ""} agregado${repeatItems.length > 1 ? "s" : ""}`)
    } else {
      addRow(selectedProjectId, selectedTableId, submitData)
      toast.success("Registro agregado")
    }

    handleClose(false)
  }

  // Get visible columns with section grouping
  // When there's a repeatable section, only show common fields in the main form
  const { sections } = useMemo(() => {
    if (!selectedTable) return { sections: { noSection: [], named: {} } }

    const repeatColIds = rs ? new Set(rs.columnIds) : new Set<string>()

    const cols = selectedTable.columns.filter(c => {
      if (c.type === "formula" || c.type === "autonumber") return false
      if (c.showInForm === false) return false
      if (c.showIf && !evaluateColumnCondition(c.showIf, formData, selectedTable.columns, projects, selectedProjectId!)) return false
      // If repeatable section is active, exclude repeatable columns from main form
      if (rs && repeatColIds.has(c.id)) return false
      return true
    })

    const sectionMap = new Map<string, Column[]>()
    const noSection: Column[] = []

    for (const col of cols) {
      if (col.sectionName) {
        const existing = sectionMap.get(col.sectionName) || []
        existing.push(col)
        sectionMap.set(col.sectionName, existing)
      } else {
        noSection.push(col)
      }
    }

    return { sections: { noSection, named: Object.fromEntries(sectionMap) } }
  }, [selectedTable, formData, projects, selectedProjectId, rs])

  const renderField = (col: Column) => {
    const isReadOnly = col.readOnly || (col.editableIf && !evaluateColumnCondition(col.editableIf, formData, selectedTable!.columns, projects, selectedProjectId!))
    const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, formData, selectedTable!.columns, projects, selectedProjectId!))
    const hasError = !!validationErrors[col.id]

    let selectOptions = col.options || []
    if (col.dependsOn && col.cascadeOptions) {
      const parentValue = formData[col.dependsOn]
      if (parentValue) {
        const cascadeEntry = col.cascadeOptions.find(co => co.parentValue === parentValue)
        if (cascadeEntry) selectOptions = cascadeEntry.options
        else selectOptions = []
      } else {
        selectOptions = []
      }
    }

    return (
      <div key={col.id} className="space-y-1.5">
        <Label htmlFor={`qr-${col.id}`} className="text-sm flex items-center gap-1.5">
          <span className="text-[10px] opacity-50">{getColumnTypeIcon(col.type)}</span>
          {col.name}
          {isRequired && <span className="text-destructive ml-0.5">*</span>}
          {col.type === "reference" && <ExternalLink className="h-3 w-3 text-rose-400" />}
          {col.virtual && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">virtual</span>}
          {col.complementaryOf && <span className="text-[9px] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">complementario</span>}
        </Label>
        <QuickFieldInput
          column={{ ...col, options: selectOptions }}
          value={formData[col.id]}
          onChange={(val) => {
            if (col.dependsOn && col.type === "select") {
              handleCascadingParentChange(col.id, val)
            } else {
              handleFieldChange(col.id, val)
            }
          }}
          onRefChange={col.type === "reference" ? (refRowId) => handleRefChange(col.id, refRowId) : undefined}
          project={selectedProject!}
          disabled={!!isReadOnly}
          placeholder={col.placeholder || undefined}
          prefix={col.prefix || undefined}
          suffix={col.suffix || undefined}
          minValue={col.minValue}
          maxValue={col.maxValue}
          step={col.step}
          minLength={col.minLength}
          maxLength={col.maxLength}
        />
        {col.complementaryOf && !col.helpText && (
          <p className="text-[10px] text-orange-500 dark:text-orange-400 flex items-center gap-1">
            <ArrowRight className="h-2.5 w-2.5" />
            {(() => {
              const otherCol = selectedTable?.columns.find(c => c.id === col.complementaryOf!.otherColId)
              const totalCol = selectedTable?.columns.find(c => c.id === col.complementaryOf!.totalColId)
              return `Al escribir aquí, ${otherCol?.name || "el otro campo"} se rellena con ${totalCol?.name || "el total"} − este campo`
            })()}
          </p>
        )}
        {col.helpText && <p className="text-[10px] text-muted-foreground">{col.helpText}</p>}
        {hasError && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validationErrors[col.id]}
          </p>
        )}
      </div>
    )
  }

  // Render a repeatable item field
  const renderRepeatField = (col: Column, itemIdx: number) => {
    const item = repeatItems[itemIdx]
    const combinedData = { ...formData, ...item }
    const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, combinedData, selectedTable!.columns, projects, selectedProjectId!))
    const hasError = !!validationErrors[`repeat-${itemIdx}-${col.id}`]

    let selectOptions = col.options || []
    if (col.dependsOn && col.cascadeOptions) {
      const parentValue = combinedData[col.dependsOn]
      if (parentValue) {
        const cascadeEntry = col.cascadeOptions.find(co => co.parentValue === parentValue)
        if (cascadeEntry) selectOptions = cascadeEntry.options
        else selectOptions = []
      } else {
        selectOptions = []
      }
    }

    return (
      <div key={col.id} className="space-y-1.5">
        <Label className="text-sm flex items-center gap-1.5">
          <span className="text-[10px] opacity-50">{getColumnTypeIcon(col.type)}</span>
          {col.name}
          {isRequired && <span className="text-destructive ml-0.5">*</span>}
          {col.type === "reference" && <ExternalLink className="h-3 w-3 text-rose-400" />}
        </Label>
        <QuickFieldInput
          column={{ ...col, options: selectOptions }}
          value={item[col.id]}
          onChange={(val) => updateRepeatItem(itemIdx, col.id, val)}
          onRefChange={col.type === "reference" ? (refRowId) => handleRepeatRefChange(itemIdx, col.id, refRowId) : undefined}
          project={selectedProject!}
          placeholder={col.placeholder || undefined}
          prefix={col.prefix || undefined}
          suffix={col.suffix || undefined}
          minValue={col.minValue}
          maxValue={col.maxValue}
          step={col.step}
          minLength={col.minLength}
          maxLength={col.maxLength}
        />
        {hasError && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validationErrors[`repeat-${itemIdx}-${col.id}`]}
          </p>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Registro Rápido"}
            {step === 2 && "Selecciona una Tabla"}
            {step === 3 && "Nuevo Registro"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Selecciona el proyecto donde agregar el registro"}
            {step === 2 && `Selecciona la tabla en ${selectedProject?.name || ""}`}
            {step === 3 && `Completa los datos para ${selectedTable?.name || ""}`}
          </DialogDescription>
        </DialogHeader>

        {/* Pre-selected project indicator */}
        {projectId && selectedProject && step === 2 && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5">
            <span className="text-lg">{selectedProject.emoji}</span>
            <span className="font-medium text-sm">{selectedProject.name}</span>
          </div>
        )}

        {/* Step 1: Select Project */}
        {step === 1 && (
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto custom-scrollbar">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay proyectos disponibles</p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent"
                  onClick={() => handleSelectProject(project.id)}
                >
                  <span className="text-xl">{project.emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.tables.length} tablas</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Select Table */}
        {step === 2 && selectedProject && (
          <div className="space-y-2 py-2">
            <Button variant="ghost" size="sm" className="gap-1 mb-2 text-muted-foreground" onClick={() => setStep(1)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </Button>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {selectedProject.tables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Este proyecto no tiene tablas</p>
              ) : (
                selectedProject.tables.map((table) => (
                  <button
                    key={table.id}
                    className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent"
                    onClick={() => handleSelectTable(table.id)}
                  >
                    <span className="text-lg">{table.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{table.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {table.columns.length} columnas
                        {table.repeatableSection && " · Sección repetida"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 3: Fill form */}
        {step === 3 && selectedTable && (
          <div className="space-y-2 py-2">
            <Button variant="ghost" size="sm" className="gap-1 mb-2 text-muted-foreground" onClick={() => setStep(2)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </Button>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {/* Repeatable Section — at the top */}
              {rs && rs.columnIds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-800" />
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Repeat className="h-3.5 w-3.5" />
                      {rs.name}
                    </span>
                    <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-800" />
                  </div>

                  {repeatItems.map((item, itemIdx) => {
                    const repeatCols = selectedTable.columns.filter(c => rs.columnIds.includes(c.id))
                    return (
                      <div
                        key={itemIdx}
                        className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            Ítem {itemIdx + 1}
                          </span>
                          {repeatItems.length > (rs.minItems ?? 1) && (
                            <button
                              type="button"
                              onClick={() => removeRepeatItem(itemIdx)}
                              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                              Quitar
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {repeatCols.map(col => {
                            if (col.type === "formula" || col.type === "autonumber") return null
                            return renderRepeatField(col, itemIdx)
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Add item button */}
                  <button
                    type="button"
                    onClick={addRepeatItem}
                    disabled={!!(rs.maxItems && rs.maxItems > 0 && repeatItems.length >= rs.maxItems)}
                    className="flex items-center justify-center gap-1.5 w-full rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar ítem
                    {rs.maxItems && rs.maxItems > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-1">({repeatItems.length}/{rs.maxItems})</span>
                    )}
                  </button>
                </div>
              )}

              {/* Common fields without section */}
              {sections.noSection.map(col => renderField(col))}

              {/* Common fields grouped by section */}
              {Object.entries(sections.named).map(([sectionName, cols]) => (
                <div key={sectionName} className="space-y-2">
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{sectionName}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {cols.map(col => renderField(col))}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-3.5 w-3.5" />
                {rs && repeatItems.length > 1
                  ? `Guardar ${repeatItems.length} Registros`
                  : "Guardar Registro"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuickFieldInput({
  column,
  value,
  onChange,
  onRefChange,
  project,
  disabled = false,
  placeholder,
  prefix,
  suffix,
  minValue,
  maxValue,
  step,
  minLength,
  maxLength,
}: {
  column: Column
  value: any
  onChange: (val: any) => void
  onRefChange?: (refRowId: string) => void
  project: Project
  disabled?: boolean
  placeholder?: string
  prefix?: string
  suffix?: string
  minValue?: number
  maxValue?: number
  step?: number
  minLength?: number
  maxLength?: number
}) {
  switch (column.type) {
    case "select":
      return (
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={placeholder || "Seleccionar..."} />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "multiselect":
      return (
        <MultiSelectInput
          options={column.options || []}
          selected={Array.isArray(value) ? value : (value ? String(value).split(",").filter(Boolean) : [])}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case "date":
      return (
        <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9" disabled={disabled} placeholder={placeholder} />
      )

    case "number":
      return (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
          <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")} placeholder={placeholder || "0"} className="h-9" disabled={disabled} min={minValue} max={maxValue} step={step} />
          {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
        </div>
      )

    case "currency":
      return (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
          <Input type="number" step={step?.toString() || "0.01"} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")} placeholder={placeholder || "0.00"} className="h-9" disabled={disabled} min={minValue} max={maxValue} />
          {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
        </div>
      )

    case "percentage":
      return (
        <div className="relative flex items-center gap-1">
          {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
          <div className="relative flex-1">
            <Input type="number" step={step?.toString() || "0.1"} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")} placeholder={placeholder || "0"} className="h-9 pr-8" disabled={disabled} min={minValue} max={maxValue} />
            {!suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>}
          </div>
          {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
        </div>
      )

    case "email":
      return <Input type="email" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "correo@ejemplo.com"} className="h-9" disabled={disabled} minLength={minLength} maxLength={maxLength} />

    case "phone":
      return <Input type="tel" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "+52 55 1234 5678"} className="h-9" disabled={disabled} minLength={minLength} maxLength={maxLength} />

    case "url":
      return <Input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "https://ejemplo.com"} className="h-9" disabled={disabled} minLength={minLength} maxLength={maxLength} />

    case "checkbox":
      return (
        <div className="flex items-center gap-2 h-9">
          <Checkbox id={`qr-cb-${column.id}`} checked={!!value} onCheckedChange={(checked) => onChange(!!checked)} disabled={disabled} />
          <label htmlFor={`qr-cb-${column.id}`} className="text-sm text-muted-foreground cursor-pointer">{value ? "Sí" : "No"}</label>
        </div>
      )

    case "rating": {
      const max = column.ratingMax || 5
      const rating = typeof value === "number" ? value : parseInt(String(value)) || 0
      return (
        <div className="flex items-center gap-1.5 h-9">
          {Array.from({ length: max }).map((_, i) => (
            <button key={i} type="button" onClick={() => !disabled && onChange(i + 1 === rating ? 0 : i + 1)} className={`transition-colors ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
              <Star className={`h-5 w-5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`} />
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{rating}/{max}</span>
        </div>
      )
    }

    case "reference": {
      const refTable = project.tables.find(t => t.id === column.refTableId)
      if (!refTable) return <Input value="Tabla no encontrada" disabled className="h-9" />
      const displayCol = column.refDisplayColId
        ? refTable.columns.find(c => c.id === column.refDisplayColId)
        : refTable.columns.find(c => c.type === "text")

      const handleRefSelect = (refRowId: string) => {
        if (onRefChange) onRefChange(refRowId)
        else onChange(refRowId)
      }

      return (
        <Select value={value || undefined} onValueChange={(v) => { handleRefSelect(v === "__none__" ? "" : v) }} disabled={disabled}>
          <SelectTrigger className="h-9"><SelectValue placeholder={placeholder || "Seleccionar registro..."} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Ninguno —</SelectItem>
            {refTable.rows.map((refRow) => (
              <SelectItem key={refRow.id} value={refRow.id}>{displayCol ? (refRow[displayCol.id] ?? "—") : refRow.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case "text":
    default:
      return <Input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || column.name} className="h-9" disabled={disabled} minLength={minLength} maxLength={maxLength} />
  }
}

function MultiSelectInput({
  options,
  selected,
  onChange,
  disabled = false,
}: {
  options: string[]
  selected: string[]
  onChange: (val: any) => void
  disabled?: boolean
}) {
  const toggleOption = (opt: string) => {
    if (disabled) return
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background min-h-[36px]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggleOption(opt)}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            selected.includes(opt)
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {opt}
        </button>
      ))}
      {options.length === 0 && <span className="text-xs text-muted-foreground">Sin opciones definidas</span>}
    </div>
  )
}
