"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useAppStore, type Project, type Table, type Row, type Column, type ColumnDisplayMode, type ConditionalFormatRule, type RepeatableSection } from "@/lib/store"
import { getColumnTypeIcon, evaluateColumnCondition, evaluateAutoCompute, formatDate } from "@/lib/helpers"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
import { Check, Star, ExternalLink, AlertCircle, Minus, Plus, Repeat, X as XIcon, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface EditRowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  table: Table
  row: Row | null // null = adding new row
}

function getInitialFormData(
  table: Table,
  row: Row | null,
  projects: Project[],
  projectId: string
): Record<string, any> {
  if (row) {
    const data: Record<string, any> = {}
    table.columns.forEach((col) => {
      data[col.id] = row[col.id] ?? ""
    })
    // Preserve _repeatGroupId so SUMAR.SECCION can find sibling rows
    if ((row as any)._repeatGroupId) {
      data._repeatGroupId = (row as any)._repeatGroupId
    }
    return data
  }
  // New row: use default values (two-pass approach)
  const data: Record<string, any> = {}

  // First pass: set all default values for all columns
  // This ensures that when col A's initialValueFormula references col B,
  // col B already has its default value set.
  table.columns.forEach((col) => {
    if (col.type === "formula" || col.type === "autonumber") return
    if (col.virtual) return // Virtual columns don't store data

    if (col.defaultValue !== undefined && col.defaultValue !== "") {
      if (col.type === "checkbox") {
        data[col.id] = col.defaultValue === "true"
      } else if (col.type === "number" || col.type === "currency" || col.type === "percentage") {
        data[col.id] = Number(col.defaultValue) || (col.defaultValue === "0" ? 0 : "")
      } else {
        data[col.id] = col.defaultValue
      }
    } else {
      data[col.id] = col.type === "checkbox" ? false : ""
    }
  })

  // Second pass: evaluate initialValueFormula for each column
  // Now all default values are in place, so formulas can reference them
  table.columns.forEach((col) => {
    if (col.type === "formula" || col.type === "autonumber") return
    if (col.virtual) return

    if (col.initialValueFormula) {
      const result = evaluateAutoCompute(col.initialValueFormula, data, table.columns, projects, projectId, table.rows)
      if (result !== undefined && result !== "" && result !== "⚠ Error") {
        data[col.id] = col.type === "checkbox" ? (result === true || result === "true") :
                       col.type === "number" || col.type === "currency" || col.type === "percentage" ? Number(result) : result
      }
    }
  })

  return data
}

export function EditRowDialog({ open, onOpenChange, project, table, row }: EditRowDialogProps) {
  const { addRow, updateRow, addRowsBatch, deleteRowsBatch, projects } = useAppStore()

  const rs = table.repeatableSection

  // ─── Repeatable Section State ───
  // When editing a grouped row, load all rows from that group
  const [repeatItems, setRepeatItems] = useState<Record<string, any>[]>([])
  const [editingGroupRowIds, setEditingGroupRowIds] = useState<string[]>([])
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  // Detect if the row being edited is part of a repeatable group
  const isRepeatGroupEdit = useMemo(() => {
    if (!rs || !row) return false
    return !!row._repeatGroupId
  }, [rs, row])

  // Initialize repeat items when editing a group
  useEffect(() => {
    if (!open) return
    if (rs && isRepeatGroupEdit && row) {
      const groupId = row._repeatGroupId
      const groupRows = table.rows.filter((r: Row) => r._repeatGroupId === groupId)
      setEditingGroupRowIds(groupRows.map((r: Row) => r.id))
      setEditingGroupId(groupId)
      // Split into common fields (from first row) and repeatable items
      const repeatColIds = new Set(rs.columnIds)
      const items = groupRows.map((r: Row) => {
        const itemData: Record<string, any> = {}
        for (const col of table.columns) {
          if (repeatColIds.has(col.id)) {
            itemData[col.id] = r[col.id] ?? ""
          }
        }
        return itemData
      })
      setRepeatItems(items)
    } else if (rs && !row) {
      // New row with repeatable section: start with one empty item
      // Generate a temporary group ID so SUMAR.SECCION can find siblings in virtualAllRows
      const tempGroupId = '__new_group_' + Date.now().toString(36) + '__'
      const emptyItem: Record<string, any> = {}
      for (const colId of rs.columnIds) {
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
      setRepeatItems([emptyItem])
      setEditingGroupRowIds([])
      setEditingGroupId(tempGroupId)
    } else {
      setRepeatItems([])
      setEditingGroupRowIds([])
      setEditingGroupId(null)
    }
  }, [open, rs, isRepeatGroupEdit, row, table.rows, table.columns])

  const [formData, setFormData] = useState<Record<string, any>>(() => getInitialFormData(table, row, projects, project.id))
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [confirmValues, setConfirmValues] = useState<Record<string, any>>({})
  const manuallyEditedRef = useRef<Set<string>>(new Set())

  // Ensure formData has _repeatGroupId for SUMAR.SECCION (set after editingGroupId is known)
  useEffect(() => {
    if (editingGroupId && !formData._repeatGroupId) {
      setFormData(prev => ({ ...prev, _repeatGroupId: editingGroupId }))
    }
  }, [editingGroupId, formData._repeatGroupId])

  // Reset form data when dialog opens or row changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(table, row, projects, project.id))
      setValidationErrors({})
      setConfirmValues({})
      manuallyEditedRef.current.clear()
      lastComplementaryEditRef.current = null
    }
  }, [open, row?.id])

  const isEditing = row !== null

  // Build virtual allRows that includes current repeat items (unsaved data)
  // This is critical for SUMAR.SECCION to work correctly in autoCompute/initialValueFormula
  const virtualAllRows = useMemo(() => {
    if (!rs || !editingGroupId || repeatItems.length === 0) return table.rows
    // Replace saved group rows with current repeat items + global fields
    const nonGroupRows = table.rows.filter(r => r._repeatGroupId !== editingGroupId)
    const newGroupRows: Row[] = repeatItems.map((item, idx) => ({
      ...formData,
      ...item,
      _repeatGroupId: editingGroupId,
      id: `__virtual_${idx}__`,
    } as Row))
    return [...nonGroupRows, ...newGroupRows]
  }, [rs, editingGroupId, repeatItems, formData, table.rows])

  // Auto-compute: recompute when formData or repeatItems change
  // Also recalculates complementary fields when autoCompute affects them
  useEffect(() => {
    const updates: Record<string, any> = {}
    for (const col of table.columns) {
      if (col.autoCompute && col.autoComputeFormula && !manuallyEditedRef.current.has(col.id)) {
        const result = evaluateAutoCompute(col.autoComputeFormula, formData, table.columns, projects, project.id, virtualAllRows)
        if (result !== undefined && result !== formData[col.id]) {
          updates[col.id] = result
        }
      }
    }

    // Complementary recalculation after autoCompute
    // When autoCompute updates a total or complementary field, recalculate the paired field
    if (Object.keys(updates).length > 0) {
      for (const col of table.columns) {
        if (!col.complementaryOf) continue
        const { totalColId, otherColId } = col.complementaryOf
        const totalCol = table.columns.find(c => c.id === totalColId)
        if (!totalCol) continue

        // Skip if either complementary field was manually edited
        if (manuallyEditedRef.current.has(col.id) || manuallyEditedRef.current.has(otherColId)) continue

        // Only recalculate if autoCompute affected the total or the other complementary field
        const affectedByAutoCompute = updates[totalColId] !== undefined || updates[otherColId] !== undefined
        if (!affectedByAutoCompute) continue

        // Get the total value (prioritize autoCompute result)
        let totalValue: number
        if (totalCol.type === "formula" && totalCol.formula) {
          const result = evaluateAutoCompute(totalCol.formula, { ...formData, ...updates }, table.columns, projects, project.id, virtualAllRows)
          totalValue = Number(result) || 0
        } else if (totalCol.autoCompute && totalCol.autoComputeFormula) {
          const result = evaluateAutoCompute(totalCol.autoComputeFormula, { ...formData, ...updates }, table.columns, projects, project.id, virtualAllRows)
          totalValue = Number(result) || 0
        } else {
          totalValue = Number(updates[totalColId] ?? formData[totalColId]) || 0
        }

        // Get the other complementary value (prioritize autoCompute result)
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
  }, [formData, table.columns, projects, project.id, virtualAllRows])

  // Complementary fields: when one complementary field is edited, auto-fill the other
  const lastComplementaryEditRef = useRef<string | null>(null)
  useEffect(() => {
    // Only process if a field was just manually edited
    if (!lastComplementaryEditRef.current) return

    const editedColId = lastComplementaryEditRef.current
    const editedCol = table.columns.find(c => c.id === editedColId)
    if (!editedCol?.complementaryOf) return

    const { totalColId, otherColId } = editedCol.complementaryOf
    const totalCol = table.columns.find(c => c.id === totalColId)
    if (!totalCol) return

    // Get the total value: if it's a formula column, evaluate it
    let totalValue: number
    if (totalCol.type === "formula" && totalCol.formula) {
      const result = evaluateAutoCompute(totalCol.formula, formData, table.columns, projects, project.id, virtualAllRows)
      totalValue = Number(result) || 0
    } else if (totalCol.autoCompute && totalCol.autoComputeFormula) {
      const result = evaluateAutoCompute(totalCol.autoComputeFormula, formData, table.columns, projects, project.id, virtualAllRows)
      totalValue = Number(result) || 0
    } else {
      totalValue = Number(formData[totalColId]) || 0
    }

    const editedValue = Number(formData[editedColId]) || 0
    const otherValue = Math.max(0, totalValue - editedValue)

    // Always update the other complementary field when this one is edited
    setFormData(prev => {
      if (prev[otherColId] === otherValue) return prev
      return { ...prev, [otherColId]: otherValue }
    })

    // Protect the other field from being overridden by auto-calculation
    // When the user edits a complementary field, the other field's value is
    // determined by the complementary logic (Total - editedField), not by
    // its autoCompute formula. Adding it to manuallyEditedRef prevents
    // the auto-calculation effect from overwriting the complementary value.
    manuallyEditedRef.current.add(otherColId)

    lastComplementaryEditRef.current = null
  }, [formData, table.columns, projects, project.id, virtualAllRows])

  // Virtual column formula: compute display values
  useEffect(() => {
    const updates: Record<string, any> = {}
    for (const col of table.columns) {
      if (col.virtual && col.virtualFormula) {
        const result = evaluateAutoCompute(col.virtualFormula, formData, table.columns, projects, project.id, virtualAllRows)
        if (result !== undefined && result !== formData[col.id]) {
          updates[col.id] = result
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }))
    }
  }, [formData, table.columns, projects, project.id, virtualAllRows])

  // Reset if: check conditions
  useEffect(() => {
    const resets: Record<string, any> = {}
    for (const col of table.columns) {
      if (col.resetIf) {
        const shouldReset = evaluateColumnCondition(col.resetIf, formData, table.columns, projects, project.id)
        if (shouldReset && formData[col.id] !== "" && formData[col.id] !== undefined && formData[col.id] !== null) {
          resets[col.id] = col.type === "checkbox" ? false : ""
        }
      }
    }
    if (Object.keys(resets).length > 0) {
      setFormData(prev => ({ ...prev, ...resets }))
    }
  }, [formData, table.columns, projects, project.id])

  const applyTextTransform = useCallback((col: Column, value: any): any => {
    if (col.textTransform && col.textTransform !== "none" && value && typeof value === "string") {
      switch (col.textTransform) {
        case "uppercase": return value.toUpperCase()
        case "lowercase": return value.toLowerCase()
        case "titlecase": return value.replace(/\b\w/g, c => c.toUpperCase())
      }
    }
    return value
  }, [])

  const handleFieldChange = useCallback((colId: string, value: any) => {
    manuallyEditedRef.current.add(colId)
    lastComplementaryEditRef.current = colId
    setFormData((prev) => ({ ...prev, [colId]: value }))

    // Clear validation error for this field
    setValidationErrors(prev => {
      const next = { ...prev }
      delete next[colId]
      return next
    })
  }, [])

  const handleRefChange = useCallback((colId: string, refRowId: string) => {
    manuallyEditedRef.current.add(colId)
    handleFieldChange(colId, refRowId)

    const column = table.columns.find(c => c.id === colId)
    if (!column?.refAutoFill || !column.refTableId) return

    const refTable = project.tables.find(t => t.id === column.refTableId)
    if (!refTable) return

    const refRow = refTable.rows.find(r => r.id === refRowId)
    if (!refRow) return

    // Auto-fill each mapped column
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
  }, [table.columns, project.tables, handleFieldChange])

  // Cascading: when parent changes, reset child
  const handleCascadingParentChange = useCallback((colId: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [colId]: value }
      // Find child columns that depend on this column
      for (const col of table.columns) {
        if (col.dependsOn === colId) {
          updated[col.id] = ""
        }
      }
      return updated
    })
    manuallyEditedRef.current.add(colId)
  }, [table.columns])

  // Get dynamic options from another table
  const getDynamicOptions = useCallback((col: Column): string[] => {
    if (!col.dynamicOptionsTableId || !col.dynamicOptionsColumnId) return []
    const refTable = projects
      .flatMap(p => p.tables)
      .find(t => t.id === col.dynamicOptionsTableId)
    if (!refTable) return []
    const refCol = refTable.columns.find(c => c.id === col.dynamicOptionsColumnId)
    if (!refCol) return []
    // Collect unique non-empty values from that column
    const values = refTable.rows
      .map(r => r[refCol.id])
      .filter(v => v != null && v !== "")
      .map(v => String(v))
    return [...new Set(values)]
  }, [projects])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const errors: Record<string, string> = {}

    // Validate each column
    for (const col of table.columns) {
      if (col.type === "formula" || col.type === "autonumber") continue

      // Skip repeatable section columns - they're validated separately below
      if (rs && rs.columnIds.includes(col.id)) continue

      // Skip if hidden by showIf
      if (col.showIf && !evaluateColumnCondition(col.showIf, formData, table.columns, projects, project.id)) continue

      // Skip if not shown in form
      if (col.showInForm === false) continue

      // Skip virtual columns
      if (col.virtual) continue

      const value = formData[col.id]

      // Required check (static or conditional)
      const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, formData, table.columns, projects, project.id))
      if (isRequired && (value == null || value === "")) {
        errors[col.id] = `El campo "${col.name}" es requerido`
        continue
      }

      // Unique validation
      if (col.unique && value !== "" && value != null) {
        const duplicates = table.rows.filter(r => {
          if (isEditing && row && r.id === row.id) return false // Skip current row when editing
          return String(r[col.id]) === String(value)
        })
        if (duplicates.length > 0) {
          errors[col.id] = `El valor "${value}" ya existe en la columna "${col.name}"`
          continue
        }
      }

      // Date constraints
      if (col.type === "date" && value) {
        const dateVal = new Date(value + "T00:00:00")
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (col.noPastDates && dateVal < today) {
          errors[col.id] = "No se permiten fechas pasadas"
          continue
        }
        if (col.noFutureDates && dateVal > today) {
          errors[col.id] = "No se permiten fechas futuras"
          continue
        }
        if (col.dateMin) {
          const minDate = new Date(col.dateMin + "T00:00:00")
          if (dateVal < minDate) {
            errors[col.id] = `La fecha mínima es ${formatDate(col.dateMin)}`
            continue
          }
        }
        if (col.dateMax) {
          const maxDate = new Date(col.dateMax + "T00:00:00")
          if (dateVal > maxDate) {
            errors[col.id] = `La fecha máxima es ${formatDate(col.dateMax)}`
            continue
          }
        }
      }

      // validIf check
      if (col.validIf && value !== "" && value != null) {
        const isValid = evaluateColumnCondition(col.validIf, formData, table.columns, projects, project.id)
        if (!isValid) {
          errors[col.id] = `El valor de "${col.name}" no es válido según la condición`
          continue
        }
      }

      // Regex check for text types
      if (col.regex && (col.type === "text" || col.type === "email" || col.type === "phone" || col.type === "url") && value) {
        try {
          const re = new RegExp(col.regex)
          if (!re.test(String(value))) {
            errors[col.id] = col.regexMessage || `El valor no coincide con el patrón requerido`
            continue
          }
        } catch {
          // Invalid regex pattern, skip validation
        }
      }

      // Min/max length for text
      if ((col.type === "text" || col.type === "email" || col.type === "phone" || col.type === "url") && value) {
        if (col.minLength && String(value).length < col.minLength) {
          errors[col.id] = `Mínimo ${col.minLength} caracteres`
          continue
        }
        if (col.maxLength && String(value).length > col.maxLength) {
          errors[col.id] = `Máximo ${col.maxLength} caracteres`
          continue
        }
      }

      // Min/max value for number types
      if ((col.type === "number" || col.type === "currency" || col.type === "percentage") && value !== "" && value != null) {
        const numVal = Number(value)
        if (col.minValue != null && numVal < col.minValue) {
          errors[col.id] = `El valor mínimo es ${col.minValue}`
          continue
        }
        if (col.maxValue != null && numVal > col.maxValue) {
          errors[col.id] = `El valor máximo es ${col.maxValue}`
          continue
        }
      }

      // Confirm input validation
      if (col.confirmInput && value !== "" && value != null) {
        const confirmVal = confirmValues[col.id]
        if (confirmVal === undefined || confirmVal === "") {
          errors[col.id] = `Debe confirmar el valor de "${col.name}"`
          continue
        }
        if (String(value) !== String(confirmVal)) {
          errors[col.id] = `Los valores de "${col.name}" no coinciden`
          continue
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Show first error as toast
      const firstError = Object.values(errors)[0]
      toast.error(firstError)
      return
    }

    // Validate repeatable section items
    if (rs && repeatItems.length > 0) {
      const repeatErrors: Record<string, string> = {}
      for (let itemIdx = 0; itemIdx < repeatItems.length; itemIdx++) {
        const item = repeatItems[itemIdx]
        for (const colId of rs.columnIds) {
          const col = table.columns.find(c => c.id === colId)
          if (!col || col.type === "formula" || col.type === "autonumber" || col.virtual) continue
          if (col.showIf && !evaluateColumnCondition(col.showIf, { ...formData, ...item }, table.columns, projects, project.id)) continue
          if (col.showInForm === false) continue

          const value = item[colId]
          const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, { ...formData, ...item }, table.columns, projects, project.id))
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

    // Build submit data (exclude virtual columns, formula, autonumber)
    const submitData: Record<string, any> = {}
    for (const col of table.columns) {
      if (col.type === "formula" || col.type === "autonumber") continue
      if (col.virtual) continue
      // If repeatable section is active, exclude repeatable columns from common data
      if (rs && rs.columnIds.includes(col.id)) continue
      submitData[col.id] = formData[col.id]
    }

    // ─── Handle repeatable section submit ───
    if (rs && repeatItems.length > 0) {
      if (isRepeatGroupEdit && editingGroupId) {
        // Editing existing group: delete old rows, add new ones
        deleteRowsBatch(project.id, table.id, editingGroupRowIds)
        const rows = repeatItems.map(item => ({
          ...submitData,
          ...item,
        }))
        addRowsBatch(project.id, table.id, rows, editingGroupId)
        toast.success("Registro actualizado")
      } else {
        // Adding new group
        const groupId = Date.now().toString(36) + Math.random().toString(36).slice(2)
        const rows = repeatItems.map(item => ({
          ...submitData,
          ...item,
        }))
        addRowsBatch(project.id, table.id, rows, groupId)
        toast.success(`${repeatItems.length} registro${repeatItems.length > 1 ? "s" : ""} agregado${repeatItems.length > 1 ? "s" : ""}`)
      }
    } else if (isEditing && row) {
      updateRow(project.id, table.id, row.id, submitData)
      toast.success("Registro actualizado")
    } else {
      addRow(project.id, table.id, submitData)
      toast.success("Registro agregado")
    }

    onOpenChange(false)
  }

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData(getInitialFormData(table, row, projects, project.id))
      setValidationErrors({})
      setConfirmValues({})
      manuallyEditedRef.current.clear()
      lastComplementaryEditRef.current = null
      setRepeatItems([])
      setEditingGroupRowIds([])
      setEditingGroupId(null)
    }
    onOpenChange(newOpen)
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
  const handleRepeatRefChange = useCallback((itemIndex: number, colId: string, refRowId: string) => {
    updateRepeatItem(itemIndex, colId, refRowId)

    const column = table.columns.find(c => c.id === colId)
    if (!column?.refAutoFill || !column.refTableId) return

    const refTable = project.tables.find(t => t.id === column.refTableId)
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
  }, [table.columns, project.tables, rs])

  // Get visible columns with section grouping
  // When there's a repeatable section, only show common fields in the main form
  const { visibleColumns, sections } = useMemo(() => {
    const repeatColIds = rs ? new Set(rs.columnIds) : new Set<string>()
    const cols = table.columns.filter(c => {
      // Skip formula and autonumber
      if (c.type === "formula" || c.type === "autonumber") return false
      // Skip if showInForm is false
      if (c.showInForm === false) return false
      // Skip if showIf condition is not met
      if (c.showIf && !evaluateColumnCondition(c.showIf, formData, table.columns, projects, project.id)) return false
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

    return {
      visibleColumns: cols,
      sections: { noSection, named: Object.fromEntries(sectionMap) }
    }
  }, [table.columns, formData, projects, project.id, rs])

  // Render a field for a column
  const renderField = (col: Column) => {
    // Determine if field is editable
    const isEditableOnce = col.editableOnce && isEditing
    const isVirtual = !!col.virtual
    const isReadOnly = isVirtual || col.readOnly || isEditableOnce || (col.editableIf && !evaluateColumnCondition(col.editableIf, formData, table.columns, projects, project.id))
    const isRequired = col.required || (col.requiredIf && evaluateColumnCondition(col.requiredIf, formData, table.columns, projects, project.id))
    const hasError = !!validationErrors[col.id]

    // Get cascading options for select
    let selectOptions = col.options || []
    if (col.dependsOn && col.cascadeOptions) {
      const parentValue = formData[col.dependsOn]
      if (parentValue) {
        const cascadeEntry = col.cascadeOptions.find(co => co.parentValue === parentValue)
        if (cascadeEntry) {
          selectOptions = cascadeEntry.options
        } else {
          selectOptions = [] // No options for this parent value
        }
      } else {
        selectOptions = [] // No parent selected
      }
    }

    // Get dynamic options from another table
    if (col.dynamicOptionsTableId && col.dynamicOptionsColumnId && !col.dependsOn) {
      const dynamicOpts = getDynamicOptions(col)
      if (dynamicOpts.length > 0) {
        selectOptions = dynamicOpts
      }
    }

    // Determine display mode
    const displayMode: ColumnDisplayMode = col.displayMode || "default"

    return (
      <div key={col.id} className="space-y-1.5">
        <Label htmlFor={`er-${col.id}`} className="text-sm flex items-center gap-1.5">
          <span className="text-[10px] opacity-50">{getColumnTypeIcon(col.type)}</span>
          {col.name}
          {isRequired && <span className="text-destructive ml-0.5">*</span>}
          {col.type === "reference" && <ExternalLink className="h-3 w-3 text-rose-400" />}
          {isVirtual && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">virtual</span>}
          {isReadOnly && !isVirtual && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">solo lectura</span>}
          {isEditableOnce && <span className="text-[9px] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">editable solo al crear</span>}
          {col.complementaryOf && <span className="text-[9px] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">complementario</span>}
        </Label>
        <RowFieldInput
          column={{ ...col, options: selectOptions }}
          value={formData[col.id]}
          onChange={(val) => {
            // Apply text transform
            const transformed = applyTextTransform(col, val)
            if (col.dependsOn && col.type === "select") {
              handleCascadingParentChange(col.id, transformed)
            } else {
              handleFieldChange(col.id, transformed)
            }
          }}
          onRefChange={col.type === "reference" ? (refRowId) => handleRefChange(col.id, refRowId) : undefined}
          project={project}
          projects={projects}
          disabled={!!isReadOnly}
          placeholder={col.placeholder || undefined}
          prefix={col.prefix || undefined}
          suffix={col.suffix || undefined}
          minValue={col.minValue}
          maxValue={col.maxValue}
          step={col.step}
          minLength={col.minLength}
          maxLength={col.maxLength}
          displayMode={displayMode}
          optionColors={col.optionColors}
          dateMin={col.dateMin}
          dateMax={col.dateMax}
        />
        {col.confirmInput && !isReadOnly && (
          <div className="space-y-1">
            <Label className="text-xs">Confirmar {col.name}</Label>
            <Input
              type={getInputType(col)}
              value={confirmValues[col.id] || ""}
              onChange={(e) => {
                const val = applyTextTransform(col, e.target.value)
                setConfirmValues(prev => ({ ...prev, [col.id]: val }))
              }}
              placeholder="Escribir de nuevo para confirmar"
              className="h-9"
              disabled={!!isReadOnly}
              minLength={col.minLength}
              maxLength={col.maxLength}
            />
          </div>
        )}
        {col.complementaryOf && !col.helpText && (
          <p className="text-[10px] text-orange-500 dark:text-orange-400 flex items-center gap-1">
            <ArrowRight className="h-2.5 w-2.5" />
            {(() => {
              const otherCol = table.columns.find(c => c.id === col.complementaryOf!.otherColId)
              const totalCol = table.columns.find(c => c.id === col.complementaryOf!.totalColId)
              return `Al escribir aquí, ${otherCol?.name || "el otro campo"} se rellena con ${totalCol?.name || "el total"} − este campo`
            })()}
          </p>
        )}
        {col.helpText && (
          <p className="text-[10px] text-muted-foreground">{col.helpText}</p>
        )}
        {hasError && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validationErrors[col.id]}
          </p>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Registro" : "Nuevo Registro"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Editando registro en ${table.name}`
                : `Agrega un nuevo registro a ${table.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 pr-1">
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
                  const repeatCols = table.columns.filter(c => rs.columnIds.includes(c.id))
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
                          const colWithDefaults = { ...col }
                          return (
                            <div key={col.id} className="space-y-1.5">
                              <Label className="text-sm flex items-center gap-1.5">
                                <span className="text-[10px] opacity-50">{getColumnTypeIcon(col.type)}</span>
                                {col.name}
                                {col.required && <span className="text-destructive ml-0.5">*</span>}
                                {col.type === "reference" && <ExternalLink className="h-3 w-3 text-rose-400" />}
                              </Label>
                              <RowFieldInput
                                column={colWithDefaults}
                                value={item[col.id]}
                                onChange={(val) => updateRepeatItem(itemIdx, col.id, val)}
                                onRefChange={col.type === "reference" ? (refRowId) => handleRepeatRefChange(itemIdx, col.id, refRowId) : undefined}
                                project={project}
                                projects={projects}
                                placeholder={col.placeholder || undefined}
                                prefix={col.prefix || undefined}
                                suffix={col.suffix || undefined}
                                minValue={col.minValue}
                                maxValue={col.maxValue}
                                step={col.step}
                                displayMode={col.displayMode || "default"}
                                optionColors={col.optionColors}
                                dateMin={col.dateMin}
                                dateMax={col.dateMax}
                              />
                            </div>
                          )
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
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar ítem
                </button>
                {rs.maxItems && rs.maxItems > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    {repeatItems.length} / {rs.maxItems} ítems
                  </p>
                )}
              </div>
            )}

            {/* Fields without section */}
            {sections.noSection.map(col => renderField(col))}

            {/* Fields grouped by section */}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-3.5 w-3.5" />
              {isEditing ? "Guardar Cambios" : "Agregar Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getInputType(col: Column): string {
  switch (col.type) {
    case "email": return "email"
    case "phone": return "tel"
    case "url": return "url"
    case "number":
    case "currency":
    case "percentage": return "number"
    case "date": return "date"
    default: return "text"
  }
}

function RowFieldInput({
  column,
  value,
  onChange,
  onRefChange,
  project,
  projects,
  disabled = false,
  placeholder,
  prefix,
  suffix,
  minValue,
  maxValue,
  step,
  minLength,
  maxLength,
  displayMode = "default",
  optionColors,
  dateMin,
  dateMax,
}: {
  column: Column
  value: any
  onChange: (val: any) => void
  onRefChange?: (refRowId: string) => void
  project: Project
  projects: any[]
  disabled?: boolean
  placeholder?: string
  prefix?: string
  suffix?: string
  minValue?: number
  maxValue?: number
  step?: number
  minLength?: number
  maxLength?: number
  displayMode?: ColumnDisplayMode
  optionColors?: Record<string, string>
  dateMin?: string
  dateMax?: string
}) {
  const isNumberType = column.type === "number" || column.type === "currency" || column.type === "percentage"

  switch (column.type) {
    case "select": {
      // Display mode: buttons
      if (displayMode === "buttons") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {column.options?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => !disabled && onChange(opt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent",
                  value === opt
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600"
                    : "border-input bg-background text-foreground"
                )}
              >
                {optionColors && optionColors[opt] && (
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: optionColors[opt] }} />
                )}
                {opt}
              </button>
            ))}
            {(!column.options || column.options.length === 0) && (
              <span className="text-xs text-muted-foreground">Sin opciones definidas</span>
            )}
          </div>
        )
      }

      // Display mode: chips
      if (displayMode === "chips") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {column.options?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => !disabled && onChange(opt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  value === opt
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {optionColors && optionColors[opt] && (
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: optionColors[opt] }} />
                )}
                {opt}
              </button>
            ))}
            {(!column.options || column.options.length === 0) && (
              <span className="text-xs text-muted-foreground">Sin opciones definidas</span>
            )}
          </div>
        )
      }

      // Display mode: badge (read-only)
      if (displayMode === "badge") {
        if (!value) {
          return <span className="text-xs text-muted-foreground">—</span>
        }
        const color = optionColors?.[value]
        return (
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            style={color ? { backgroundColor: color + "20", color: color, borderColor: color + "40" } : undefined}
          >
            {optionColors && optionColors[value] && (
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: optionColors[value] }} />
            )}
            {value}
          </Badge>
        )
      }

      // Default select dropdown with option colors
      return (
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={placeholder || "Seleccionar..."} />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                <span className="inline-flex items-center gap-1.5">
                  {optionColors && optionColors[opt] && (
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: optionColors[opt] }} />
                  )}
                  {opt}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case "multiselect": {
      const selected = Array.isArray(value) ? value : (value ? String(value).split(",").filter(Boolean) : [])

      // Display mode: buttons (toggle buttons, can select multiple)
      if (displayMode === "buttons") {
        const toggleOption = (opt: string) => {
          if (disabled) return
          if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt))
          } else {
            onChange([...selected, opt])
          }
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {column.options?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent",
                  selected.includes(opt)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600"
                    : "border-input bg-background text-foreground"
                )}
              >
                {optionColors && optionColors[opt] && (
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: optionColors[opt] }} />
                )}
                {opt}
              </button>
            ))}
            {(!column.options || column.options.length === 0) && (
              <span className="text-xs text-muted-foreground">Sin opciones definidas</span>
            )}
          </div>
        )
      }

      // Default multiselect chips
      return (
        <MultiSelectInput
          options={column.options || []}
          selected={selected}
          onChange={onChange}
          disabled={disabled}
          optionColors={optionColors}
        />
      )
    }

    case "date":
      return (
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9"
          disabled={disabled}
          placeholder={placeholder}
          min={dateMin || undefined}
          max={dateMax || undefined}
        />
      )

    case "number":
    case "currency":
    case "percentage": {
      // Display mode: slider
      if (displayMode === "slider") {
        const sliderMin = minValue ?? 0
        const sliderMax = maxValue ?? 100
        const sliderStep = step ?? 1
        const numValue = typeof value === "number" ? value : (parseFloat(String(value)) || 0)

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
              <Slider
                value={[numValue]}
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                onValueChange={([v]) => onChange(v)}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-sm font-medium min-w-[3ch] text-right">
                {column.type === "percentage" ? `${numValue}%` : numValue}
              </span>
              {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
            </div>
          </div>
        )
      }

      // Display mode: stepper
      if (displayMode === "stepper") {
        const numValue = typeof value === "number" ? value : (parseFloat(String(value)) || 0)
        const stepperStep = step ?? 1

        const handleStepUp = () => {
          if (disabled) return
          const newVal = numValue + stepperStep
          if (maxValue != null && newVal > maxValue) return
          onChange(newVal)
        }

        const handleStepDown = () => {
          if (disabled) return
          const newVal = numValue - stepperStep
          if (minValue != null && newVal < minValue) return
          onChange(newVal)
        }

        return (
          <div className="flex items-center gap-1">
            {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleStepDown}
              disabled={disabled || (minValue != null && numValue <= minValue)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="number"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
              placeholder={placeholder || "0"}
              className="h-9 text-center"
              disabled={disabled}
              min={minValue}
              max={maxValue}
              step={step}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleStepUp}
              disabled={disabled || (maxValue != null && numValue >= maxValue)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
          </div>
        )
      }

      // Display mode: progress (read-only display)
      if (displayMode === "progress") {
        const numValue = typeof value === "number" ? value : (parseFloat(String(value)) || 0)
        const progressMax = maxValue ?? 100
        const progressPct = Math.min(100, Math.max(0, (numValue / progressMax) * 100))

        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
              <Progress value={progressPct} className="flex-1 h-3" />
              <span className="text-xs font-medium min-w-[3ch] text-right">
                {column.type === "percentage" ? `${numValue}%` : numValue}
              </span>
              {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
            </div>
          </div>
        )
      }

      // Default number/currency/percentage input
      if (column.type === "currency") {
        return (
          <div className="flex items-center gap-1">
            {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
            <Input
              type="number"
              step={step?.toString() || "0.01"}
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
              placeholder={placeholder || "0.00"}
              className="h-9"
              disabled={disabled}
              min={minValue}
              max={maxValue}
            />
            {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
          </div>
        )
      }

      if (column.type === "percentage") {
        return (
          <div className="relative flex items-center gap-1">
            {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
            <div className="relative flex-1">
              <Input
                type="number"
                step={step?.toString() || "0.1"}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
                placeholder={placeholder || "0"}
                className="h-9 pr-8"
                disabled={disabled}
                min={minValue}
                max={maxValue}
              />
              {!suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>}
            </div>
            {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
          </div>
        )
      }

      // number type default
      return (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            placeholder={placeholder || "0"}
            className="h-9"
            disabled={disabled}
            min={minValue}
            max={maxValue}
            step={step}
          />
          {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
        </div>
      )
    }

    case "email":
      return (
        <Input
          type="email"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "correo@ejemplo.com"}
          className="h-9"
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
        />
      )

    case "phone":
      return (
        <Input
          type="tel"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "+52 55 1234 5678"}
          className="h-9"
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
        />
      )

    case "url":
      return (
        <Input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://ejemplo.com"}
          className="h-9"
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
        />
      )

    case "checkbox": {
      // Display mode: toggle
      if (displayMode === "toggle") {
        return (
          <div className="flex items-center gap-2 h-9">
            <Switch
              id={`sw-${column.id}`}
              checked={!!value}
              onCheckedChange={(checked) => onChange(!!checked)}
              disabled={disabled}
            />
            <label htmlFor={`sw-${column.id}`} className="text-sm text-muted-foreground cursor-pointer">
              {value ? "Sí" : "No"}
            </label>
          </div>
        )
      }

      // Default checkbox
      return (
        <div className="flex items-center gap-2 h-9">
          <Checkbox
            id={`cb-${column.id}`}
            checked={!!value}
            onCheckedChange={(checked) => onChange(!!checked)}
            disabled={disabled}
          />
          <label htmlFor={`cb-${column.id}`} className="text-sm text-muted-foreground cursor-pointer">
            {value ? "Sí" : "No"}
          </label>
        </div>
      )
    }

    case "rating": {
      const max = column.ratingMax || 5
      const rating = typeof value === "number" ? value : parseInt(String(value)) || 0
      return (
        <div className="flex items-center gap-1.5 h-9">
          {Array.from({ length: max }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && onChange(i + 1 === rating ? 0 : i + 1)}
              className={`transition-colors ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  i < rating
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/30 hover:text-amber-300"
                )}
              />
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{rating}/{max}</span>
        </div>
      )
    }

    case "reference": {
      const refTable = project.tables.find(t => t.id === column.refTableId)
      if (!refTable) {
        return <Input value="Tabla no encontrada" disabled className="h-9" />
      }
      const displayCol = column.refDisplayColId
        ? refTable.columns.find(c => c.id === column.refDisplayColId)
        : refTable.columns.find(c => c.type === "text")

      const handleRefSelect = (refRowId: string) => {
        if (onRefChange) {
          onRefChange(refRowId)
        } else {
          onChange(refRowId)
        }
      }

      return (
        <Select value={value || undefined} onValueChange={(v) => {
          const val = v === "__none__" ? "" : v
          handleRefSelect(val)
        }} disabled={disabled}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={placeholder || "Seleccionar registro..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Ninguno —</SelectItem>
            {refTable.rows.map((refRow) => (
              <SelectItem key={refRow.id} value={refRow.id}>
                {displayCol ? (refRow[displayCol.id] ?? "—") : refRow.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case "text":
    default: {
      // Display mode: textarea
      if (displayMode === "textarea") {
        return (
          <Textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || column.name}
            className="min-h-[80px]"
            rows={3}
            disabled={disabled}
          />
        )
      }

      // Display mode: color
      if (displayMode === "color") {
        return (
          <div className="flex items-center gap-2 h-9">
            <Input
              type="color"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-12 p-1 cursor-pointer"
              disabled={disabled}
            />
            <Input
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "#000000"}
              className="h-9 flex-1"
              disabled={disabled}
              minLength={minLength}
              maxLength={maxLength}
            />
          </div>
        )
      }

      // Default text input
      return (
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || column.name}
          className="h-9"
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
        />
      )
    }
  }
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function MultiSelectInput({
  options,
  selected,
  onChange,
  disabled = false,
  optionColors,
}: {
  options: string[]
  selected: string[]
  onChange: (val: any) => void
  disabled?: boolean
  optionColors?: Record<string, string>
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
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            selected.includes(opt)
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {optionColors && optionColors[opt] && (
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: optionColors[opt] }} />
          )}
          {opt}
        </button>
      ))}
      {options.length === 0 && (
        <span className="text-xs text-muted-foreground">Sin opciones definidas</span>
      )}
    </div>
  )
}
