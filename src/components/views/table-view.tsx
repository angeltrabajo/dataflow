"use client"

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import type { Row, Column, Project, Table, ConditionalFormatRule, ColumnDisplayMode, RepeatableSection } from "@/shared/types/Project"
import { cn } from "@/lib/utils"
import { formatCurrency, getColumnTypeIcon, getSelectPillColor } from "@/shared/utils/format"
import { formatDate } from "@/shared/utils/date"
import { evaluateFormula, evaluateColumnCondition, resolveReferenceDisplay, formatFormulaResult } from "@/lib/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Settings2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileX,
  Zap,
  Star,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Info,
  XIcon,
  Lightbulb,
  ArrowRight,
  FileSpreadsheet,
  Repeat,
  LayoutList,
  Table2,
  Link2,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  PlusCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EditRowDialog } from "@/components/edit-row-dialog"
import { QuickRecordModal } from "@/components/quick-record-modal"
import { CsvDialog } from "@/components/csv-dialog"
import { DeleteTableDialog } from "@/components/delete-table-dialog"
import { EditTableDialog } from "@/components/edit-table-dialog"
import { toast } from "sonner"

// ═══ TEXT TRANSFORM HELPER ═══
function applyTextTransform(value: string, transform?: string): string {
  if (!transform || transform === "none") return value
  switch (transform) {
    case "uppercase": return value.toUpperCase()
    case "lowercase": return value.toLowerCase()
    case "titlecase": return value.replace(/\b\w/g, c => c.toUpperCase())
    default: return value
  }
}

// ═══ COLUMN WIDTH HELPER ═══
function getColumnWidthClass(columnWidth?: "narrow" | "medium" | "wide"): string {
  if (columnWidth === "narrow") return "max-w-[100px]"
  if (columnWidth === "wide") return "max-w-[300px]"
  return "max-w-[200px]" // medium (default)
}

export function TableView() {
  const {
    projects,
    selectedProjectId,
    selectedTableId,
    selectTable,
    goBack,
    setView,
    deleteRow,
    updateRow,
    deleteRowsBatch,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [editRowOpen, setEditRowOpen] = useState(false)
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [quickRecordOpen, setQuickRecordOpen] = useState(false)
  const [deleteTableOpen, setDeleteTableOpen] = useState(false)
  const [editTableOpen, setEditTableOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "list">("list")

  // Inline cell editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null)
  const [editingValue, setEditingValue] = useState<any>("")

  // ═══ Filter & Sort state ═══
  interface FilterRule {
    id: string
    colId: string
    operator: string
    value: any
  }
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

  const project = projects.find((p) => p.id === selectedProjectId)
  const table = project?.tables.find((t) => t.id === selectedTableId)

  // Tutorial hints
  const isTutorial = project?.id === "proj-tutorial"
  const [hintDismissed, setHintDismissed] = useState<Record<string, boolean>>({})

  const tutorialHint = isTutorial && table ? getTutorialHint(table.id, table.name) : null

  // Visible columns: filter by showInTable (default true if undefined)
  const visibleColumns = table ? table.columns.filter(col => col.showInTable !== false) : []

  // Visible columns for list view: filter by showInList (default true if undefined)
  const listVisibleColumns = table ? table.columns.filter(col => col.showInList !== false) : []

  // ═══ Filter operator helpers ═══
  function getOperatorsForColumnType(colType: string): { value: string; label: string }[] {
    const textOps = [
      { value: "contains", label: "contiene" },
      { value: "equals", label: "es igual a" },
      { value: "notEquals", label: "no es igual a" },
      { value: "startsWith", label: "empieza con" },
      { value: "endsWith", label: "termina con" },
      { value: "isEmpty", label: "está vacío" },
      { value: "isNotEmpty", label: "no está vacío" },
    ]
    const numberOps = [
      { value: "equals", label: "es igual a" },
      { value: "notEquals", label: "no es igual a" },
      { value: "greaterThan", label: "mayor que" },
      { value: "lessThan", label: "menor que" },
      { value: "greaterOrEqual", label: "mayor o igual" },
      { value: "lessOrEqual", label: "menor o igual" },
      { value: "isEmpty", label: "está vacío" },
      { value: "isNotEmpty", label: "no está vacío" },
    ]
    const dateOps = [
      { value: "equals", label: "es igual a" },
      { value: "before", label: "antes de" },
      { value: "after", label: "después de" },
      { value: "isEmpty", label: "está vacío" },
      { value: "isNotEmpty", label: "no está vacío" },
    ]
    const selectOps = [
      { value: "equals", label: "es igual a" },
      { value: "notEquals", label: "no es igual a" },
      { value: "isEmpty", label: "está vacío" },
      { value: "isNotEmpty", label: "no está vacío" },
    ]

    switch (colType) {
      case "text":
      case "email":
      case "phone":
      case "url":
      case "reference":
      case "formula":
        return textOps
      case "number":
      case "currency":
      case "percentage":
      case "autonumber":
        return numberOps
      case "date":
        return dateOps
      case "select":
      case "multiselect":
        return selectOps
      case "checkbox":
        return [
          { value: "isTrue", label: "es verdadero" },
          { value: "isFalse", label: "es falso" },
        ]
      case "rating":
        return [
          { value: "equals", label: "es igual a" },
          { value: "greaterThan", label: "mayor que" },
          { value: "lessThan", label: "menor que" },
        ]
      default:
        return textOps
    }
  }

  function evaluateFilterRule(row: Row, col: Column, operator: string, filterValue: any): boolean {
    const cellValue = row[col.id]

    switch (operator) {
      case "contains": {
        if (cellValue == null) return false
        return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase())
      }
      case "equals": {
        if (col.type === "select" || col.type === "multiselect" || col.type === "reference") {
          return String(cellValue ?? "") === String(filterValue ?? "")
        }
        if (col.type === "number" || col.type === "currency" || col.type === "percentage" || col.type === "rating" || col.type === "autonumber") {
          return Number(cellValue) === Number(filterValue)
        }
        return String(cellValue ?? "").toLowerCase() === String(filterValue ?? "").toLowerCase()
      }
      case "notEquals": {
        if (col.type === "select" || col.type === "multiselect" || col.type === "reference") {
          return String(cellValue ?? "") !== String(filterValue ?? "")
        }
        if (col.type === "number" || col.type === "currency" || col.type === "percentage" || col.type === "rating" || col.type === "autonumber") {
          return Number(cellValue) !== Number(filterValue)
        }
        return String(cellValue ?? "").toLowerCase() !== String(filterValue ?? "").toLowerCase()
      }
      case "startsWith": {
        if (cellValue == null) return false
        return String(cellValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
      }
      case "endsWith": {
        if (cellValue == null) return false
        return String(cellValue).toLowerCase().endsWith(String(filterValue).toLowerCase())
      }
      case "isEmpty":
        return cellValue == null || cellValue === "" || cellValue === undefined
      case "isNotEmpty":
        return cellValue != null && cellValue !== "" && cellValue !== undefined
      case "greaterThan": {
        const num = Number(cellValue)
        return !isNaN(num) && num > Number(filterValue)
      }
      case "lessThan": {
        const num = Number(cellValue)
        return !isNaN(num) && num < Number(filterValue)
      }
      case "greaterOrEqual": {
        const num = Number(cellValue)
        return !isNaN(num) && num >= Number(filterValue)
      }
      case "lessOrEqual": {
        const num = Number(cellValue)
        return !isNaN(num) && num <= Number(filterValue)
      }
      case "before": {
        if (!cellValue || !filterValue) return false
        return new Date(cellValue) < new Date(filterValue)
      }
      case "after": {
        if (!cellValue || !filterValue) return false
        return new Date(cellValue) > new Date(filterValue)
      }
      case "isTrue":
        return cellValue === true || cellValue === "true" || cellValue === 1
      case "isFalse":
        return cellValue === false || cellValue === "false" || cellValue === 0 || cellValue == null
      default:
        return true
    }
  }

  // Filter & sort rows by search, filters, and sort
  const filteredRows = useMemo(() => {
    if (!table || !project) return []

    // Step 1: Search filtering
    let result = table.rows
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((row) =>
        table.columns.some((col) => {
          const val = row[col.id]
          return val != null && String(val).toLowerCase().includes(q)
        })
      )
    }

    // Step 2: Apply filter rules (AND logic)
    if (filters.length > 0) {
      result = result.filter((row) =>
        filters.every((rule) => {
          const col = table.columns.find(c => c.id === rule.colId)
          if (!col) return true
          return evaluateFilterRule(row, col, rule.operator, rule.value)
        })
      )
    }

    // Step 3: Apply sorting
    if (sortColumn && sortDirection) {
      const col = table.columns.find(c => c.id === sortColumn)
      if (col) {
        result = [...result].sort((a, b) => {
          const va = a[sortColumn]
          const vb = b[sortColumn]

          // Handle empty values — push to bottom
          const aEmpty = va == null || va === ""
          const bEmpty = vb == null || vb === ""
          if (aEmpty && bEmpty) return 0
          if (aEmpty) return 1
          if (bEmpty) return -1

          let cmp = 0
          if (col.type === "number" || col.type === "currency" || col.type === "percentage" || col.type === "autonumber" || col.type === "rating") {
            cmp = Number(va) - Number(vb)
          } else if (col.type === "date") {
            cmp = new Date(va).getTime() - new Date(vb).getTime()
          } else if (col.type === "checkbox") {
            const ba = va === true || va === "true" || va === 1 ? 1 : 0
            const bb = vb === true || vb === "true" || vb === 1 ? 1 : 0
            cmp = ba - bb
          } else {
            cmp = String(va).localeCompare(String(vb), "es")
          }

          return sortDirection === "desc" ? -cmp : cmp
        })
      }
    }

    return result
  }, [table, project, searchQuery, filters, sortColumn, sortDirection])

  // ─── Group repeat rows ───
  const rs = table?.repeatableSection

  // Color palette for group borders
  const groupColors = useMemo(() => {
    const palette = [
      "border-l-indigo-400",
      "border-l-emerald-400",
      "border-l-amber-400",
      "border-l-rose-400",
      "border-l-violet-400",
      "border-l-cyan-400",
      "border-l-orange-400",
      "border-l-teal-400",
    ]
    return palette
  }, [])

  // Build a map of groupId → color index
  const groupColorMap = useMemo(() => {
    const map = new Map<string, number>()
    let idx = 0
    if (filteredRows) {
      for (const row of filteredRows) {
        const gid = row._repeatGroupId
        if (gid && !map.has(gid)) {
          map.set(gid, idx % groupColors.length)
          idx++
        }
      }
    }
    return map
  }, [filteredRows, groupColors.length])

  // Determine which row indices are the first in their group
  const isFirstInGroup = useMemo(() => {
    const set = new Set<number>()
    if (filteredRows) {
      let prevGid: string | undefined = undefined
      filteredRows.forEach((row, idx) => {
        const gid = row._repeatGroupId
        if (gid && gid !== prevGid) {
          set.add(idx)
        }
        prevGid = gid
      })
    }
    return set
  }, [filteredRows])

  // Determine if a row has the same common field value as the first row in its group
  const isSameCommonFieldAsFirst = useCallback((row: Row, rowIdx: number, colId: string) => {
    if (!row._repeatGroupId || !rs) return false
    const gid = row._repeatGroupId
    // Find first row in this group
    const firstIdx = filteredRows.findIndex(r => r._repeatGroupId === gid)
    if (firstIdx === rowIdx || firstIdx === -1) return false
    const firstRow = filteredRows[firstIdx]
    return String(row[colId] ?? "") === String(firstRow[colId] ?? "") && row[colId] !== undefined && row[colId] !== ""
  }, [filteredRows, rs])

  if (!project || !table) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Tabla no encontrada</p>
      </div>
    )
  }

  const handleEditRow = (row: Row) => {
    setEditRow(row)
    setEditRowOpen(true)
  }

  const handleDeleteRow = (rowId: string) => {
    deleteRow(project.id, table.id, rowId)
  }

  // Start inline editing a cell
  const startEditing = (rowId: string, colId: string, currentValue: any) => {
    const col = table.columns.find(c => c.id === colId)
    if (!col || col.type === "formula" || col.type === "autonumber") return
    if (col.readOnly) return
    if (col.editableOnce && currentValue !== "" && currentValue != null) return
    setEditingCell({ rowId, colId })
    setEditingValue(currentValue ?? "")
  }

  // Save inline edit
  const saveEdit = () => {
    if (!editingCell) return
    const { rowId, colId } = editingCell
    const col = table.columns.find(c => c.id === colId)

    // Unique validation
    if (col?.unique) {
      const duplicate = table.rows.some(r =>
        r.id !== rowId && String(r[colId]) === String(editingValue)
      )
      if (duplicate) {
        setEditingCell(null)
        setEditingValue("")
        return
      }
    }

    // Process auto-fill when changing a reference field
    if (col?.type === "reference" && col.refAutoFill && col.refTableId) {
      const refTable = project.tables.find(t => t.id === col.refTableId)
      const refRow = refTable?.rows.find(r => r.id === editingValue)
      const updateData: Record<string, any> = { [colId]: editingValue }
      if (refRow) {
        for (const mapping of col.refAutoFill) {
          const sourceValue = refRow[mapping.sourceColId]
          if (sourceValue !== undefined) {
            updateData[mapping.targetColId] = sourceValue
          }
        }
      }
      updateRow(project.id, table.id, rowId, updateData)
    } else {
      updateRow(project.id, table.id, rowId, { [colId]: editingValue })
    }

    setEditingCell(null)
    setEditingValue("")
  }

  // Cancel inline edit
  const cancelEdit = () => {
    setEditingCell(null)
    setEditingValue("")
  }

  // Determine if a column is editable inline
  const isInlineEditable = (col: Column, row: Row): boolean => {
    if (col.type === "formula" || col.type === "autonumber") return false
    if (col.readOnly) return false
    // editableOnce: can only set on creation, not on edit
    // Since we can't tell if a row is "new" in inline mode easily,
    // we'll check if the value is empty (meaning it was just added)
    if (col.editableOnce && row[col.id] !== "" && row[col.id] != null) return false
    return true
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-xl">{table.emoji}</span>
            <div>
              <h1 className="text-lg font-bold">{table.name}</h1>
              <p className="text-xs text-muted-foreground">
                {table.rows.length} registros · {visibleColumns.length} columnas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View mode toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => setViewMode("list")}
                title="Vista lista"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setViewMode("table")}
                title="Vista tabla"
              >
                <Table2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setQuickRecordOpen(true)}
            >
              <Zap className="h-3.5 w-3.5" />
              Registro Rápido
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditRow(null)
                setEditRowOpen(true)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditTableOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Editar Tabla
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("editor")}>
                  <Settings2 className="h-3.5 w-3.5 mr-2" />
                  Estructura
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCsvDialogOpen(true)}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                  Importar / Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTableOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Eliminar Tabla
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en la tabla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={filters.length > 0 ? "default" : "outline"}
                size="sm"
                className="gap-1.5 h-9 shrink-0"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtro
                {filters.length > 0 && (
                  <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] px-1.5 text-[10px]">
                    {filters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-3" align="start">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Filtros</h4>
                  {filters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground hover:text-destructive px-2"
                      onClick={() => setFilters([])}
                    >
                      Limpiar todo
                    </Button>
                  )}
                </div>

                {filters.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    Sin filtros activos. Agrega uno para filtrar los registros.
                  </p>
                )}

                {filters.map((rule, idx) => {
                  const col = table?.columns.find(c => c.id === rule.colId)
                  const operators = col ? getOperatorsForColumnType(col.type) : []
                  const needsValue = !["isEmpty", "isNotEmpty", "isTrue", "isFalse"].includes(rule.operator)

                  return (
                    <div key={rule.id} className="flex items-center gap-1.5">
                      {/* Column select */}
                      <Select
                        value={rule.colId}
                        onValueChange={(val) => {
                          const newCol = table?.columns.find(c => c.id === val)
                          const newOps = newCol ? getOperatorsForColumnType(newCol.type) : []
                          setFilters(prev => prev.map(f =>
                            f.id === rule.id
                              ? { ...f, colId: val, operator: newOps[0]?.value ?? "contains", value: "" }
                              : f
                          ))
                        }}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue placeholder="Columna" />
                        </SelectTrigger>
                        <SelectContent>
                          {table?.columns.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator select */}
                      <Select
                        value={rule.operator}
                        onValueChange={(val) => {
                          setFilters(prev => prev.map(f =>
                            f.id === rule.id
                              ? { ...f, operator: val, value: ["isEmpty", "isNotEmpty", "isTrue", "isFalse"].includes(val) ? "" : f.value }
                              : f
                          ))
                        }}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue placeholder="Operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map(op => (
                            <SelectItem key={op.value} value={op.value} className="text-xs">
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value input */}
                      {needsValue && (
                        <>
                          {col?.type === "select" || col?.type === "multiselect" ? (
                            <Select
                              value={rule.value ?? ""}
                              onValueChange={(val) => {
                                setFilters(prev => prev.map(f =>
                                  f.id === rule.id ? { ...f, value: val } : f
                                ))
                              }}
                            >
                              <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="Valor" />
                              </SelectTrigger>
                              <SelectContent>
                                {(col.options ?? []).map(opt => (
                                  <SelectItem key={opt} value={opt} className="text-xs">
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : col?.type === "checkbox" ? (
                            <Select
                              value={rule.value ?? ""}
                              onValueChange={(val) => {
                                setFilters(prev => prev.map(f =>
                                  f.id === rule.id ? { ...f, value: val } : f
                                ))
                              }}
                            >
                              <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="Valor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true" className="text-xs">Sí</SelectItem>
                                <SelectItem value="false" className="text-xs">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={col?.type === "date" ? "date" : col?.type === "number" || col?.type === "currency" || col?.type === "percentage" || col?.type === "rating" || col?.type === "autonumber" ? "number" : "text"}
                              value={rule.value ?? ""}
                              onChange={(e) => {
                                setFilters(prev => prev.map(f =>
                                  f.id === rule.id ? { ...f, value: e.target.value } : f
                                ))
                              }}
                              className="h-8 w-[110px] text-xs"
                              placeholder="Valor"
                            />
                          )}
                        </>
                      )}

                      {/* Remove filter */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setFilters(prev => prev.filter(f => f.id !== rule.id))
                        }}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 h-8 text-xs"
                  onClick={() => {
                    const firstCol = table?.columns[0]
                    const firstOp = firstCol ? getOperatorsForColumnType(firstCol.type)[0]?.value ?? "contains" : "contains"
                    setFilters(prev => [
                      ...prev,
                      { id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, colId: firstCol?.id ?? "", operator: firstOp, value: "" },
                    ])
                  }}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Agregar filtro
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter pills (visible outside popover) */}
          {filters.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {filters.map(rule => {
                const col = table?.columns.find(c => c.id === rule.colId)
                const operators = col ? getOperatorsForColumnType(col.type) : []
                const opLabel = operators.find(o => o.value === rule.operator)?.label ?? rule.operator
                const needsValue = !["isEmpty", "isNotEmpty", "isTrue", "isFalse"].includes(rule.operator)
                return (
                  <Badge
                    key={rule.id}
                    variant="secondary"
                    className="gap-1 text-[10px] py-0.5 px-1.5 h-6 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => setFilters(prev => prev.filter(f => f.id !== rule.id))}
                  >
                    {col?.name ?? "?"} {opLabel}{needsValue && rule.value ? ` ${rule.value}` : ""}
                    <XIcon className="h-2.5 w-2.5" />
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tutorial hint banner */}
      {tutorialHint && !hintDismissed[table.id] && (
        <div className="mx-4 md:mx-6 mt-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-3 md:p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {tutorialHint.title}
              </h3>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                {tutorialHint.lines.map((line, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    {line.icon ? <span className="shrink-0 mt-0.5">{line.icon}</span> : null}
                    <span>{line.text}</span>
                  </p>
                ))}
              </div>
            </div>
            <button
              onClick={() => setHintDismissed(prev => ({ ...prev, [table.id]: true }))}
              className="shrink-0 p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <XIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>
      )}

      {/* Table content */}
      <div className="flex-1 overflow-auto">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileX className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium mb-1">
              {searchQuery || filters.length > 0 ? "Sin resultados" : "Sin registros"}
            </p>
            <p className="text-sm text-muted-foreground/70 mb-4">
              {searchQuery || filters.length > 0
                ? "Intenta con otro término de búsqueda o ajusta los filtros"
                : "Agrega tu primer registro a esta tabla"}
            </p>
            {!searchQuery && filters.length === 0 && (
              <Button
                onClick={() => {
                  setEditRow(null)
                  setEditRowOpen(true)
                }}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Agregar Registro
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          /* ───── LIST VIEW ───── */
          <div className="p-3 md:p-4 space-y-3">
            {filteredRows.map((row, idx) => {
              const gid = row._repeatGroupId
              const groupColorClass = gid ? groupColors[groupColorMap.get(gid) ?? 0] : ""
              const isGrouped = !!gid
              const isFirst = isGrouped && isFirstInGroup.has(idx)

              // Card title: the first column marked as visible in list view (by form order)
              const titleCol = listVisibleColumns.length > 0 ? listVisibleColumns[0] : null
              const titleValue = titleCol ? row[titleCol.id] : null
              // Other columns (exclude the title one)
              const otherCols = listVisibleColumns.filter(c => c.id !== titleCol?.id)

              return (
                <div
                  key={row.id}
                  className={cn(
                    "rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md",
                    isGrouped && "border-l-4",
                    isGrouped && groupColorClass
                  )}
                >
                  {/* Card header: title + actions */}
                  <div className="flex items-start justify-between px-4 pt-3 pb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isGrouped && isFirst && (
                        <Repeat className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      )}
                      {titleCol ? (
                        <h3 className="font-semibold text-sm truncate flex items-center gap-1.5">
                          {titleValue != null && titleValue !== "" ? (
                            <CellRenderer
                              column={titleCol}
                              value={titleValue}
                              row={row}
                              allColumns={table.columns}
                              projects={projects}
                              currentProjectId={project.id}
                              allRows={table.rows}
                            />
                          ) : (
                            <span className="text-muted-foreground/40">Sin título</span>
                          )}
                        </h3>
                      ) : (
                        <h3 className="font-semibold text-sm text-muted-foreground">
                          Registro {idx + 1}
                        </h3>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleEditRow(row)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (gid && rs) {
                            const groupRows = table.rows.filter((r: Row) => r._repeatGroupId === gid)
                            const groupRowIds = groupRows.map((r: Row) => r.id)
                            if (confirm(`¿Eliminar todo el grupo de ${groupRows.length} registros?`)) {
                              deleteRowsBatch(project.id, table.id, groupRowIds)
                              toast.success(`${groupRows.length} registros eliminados`)
                            }
                          } else {
                            handleDeleteRow(row.id)
                          }
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title={gid && rs ? "Eliminar grupo" : "Eliminar"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card body: fields in a grid */}
                  <div className="px-4 pb-3 pt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    {otherCols.map(col => {
                      const val = row[col.id]
                      const isGlobalField = rs && !rs.columnIds.includes(col.id)
                      const isSharedGlobal = isGrouped && !isFirst && isGlobalField
                      return (
                        <div key={col.id} className="min-w-0">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate flex items-center gap-1">
                            <span className="opacity-50">{getColumnTypeIcon(col.type)}</span>
                            {col.name}
                            {isSharedGlobal && <Link2 className="h-2.5 w-2.5 text-muted-foreground/40" />}
                          </p>
                          <div className="text-sm mt-0.5 truncate">
                            <CellRenderer
                              column={col}
                              value={val}
                              row={row}
                              allColumns={table.columns}
                              projects={projects}
                              currentProjectId={project.id}
                              allRows={table.rows}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ───── TABLE VIEW ───── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-12">
                    #
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.id}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:bg-muted/80 transition-colors"
                      onClick={() => {
                        if (sortColumn === col.id) {
                          if (sortDirection === "asc") setSortDirection("desc")
                          else if (sortDirection === "desc") { setSortColumn(null); setSortDirection(null) }
                        } else {
                          setSortColumn(col.id)
                          setSortDirection("asc")
                        }
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] opacity-50">
                          {getColumnTypeIcon(col.type)}
                        </span>
                        {col.name}
                        {col.required && (
                          <span className="text-destructive">*</span>
                        )}
                        {col.type === "formula" && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1 font-mono text-orange-600 dark:text-orange-400">
                            fx
                          </Badge>
                        )}
                        {col.type === "reference" && (
                          <ExternalLink className="h-3 w-3 text-rose-400" />
                        )}
                        {/* Sort indicator */}
                        {sortColumn === col.id && sortDirection === "asc" && (
                          <ArrowUp className="h-3 w-3 text-foreground" />
                        )}
                        {sortColumn === col.id && sortDirection === "desc" && (
                          <ArrowDown className="h-3 w-3 text-foreground" />
                        )}
                        {sortColumn !== col.id && (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />
                        )}
                      </span>
                      {/* Tutorial: show what each special column does */}
                      {isTutorial && col.type === "formula" && (
                        <span className="block text-[10px] font-normal text-orange-500 dark:text-orange-400 mt-0.5">
                          {col.id === "col-pestado" ? "se calcula solo"
                            : col.id === "col-pvalor" ? "stock × precio"
                            : col.id === "col-cldesc" ? "según tipo cliente"
                            : col.id === "col-vtotal" ? "cant × precio × desc"
                            : col.id === "col-tprogreso" ? "según completada"
                            : col.id === "col-tsem" ? "según prioridad"
                            : col.id === "col-gsigno" ? "según tipo"
                            : col.id === "col-gneto" ? "ingreso+ / egreso-"
                            : "calculado automáticamente"}
                        </span>
                      )}
                      {isTutorial && col.type === "reference" && (
                        <span className="block text-[10px] font-normal text-rose-500 dark:text-rose-400 mt-0.5">
                          {col.refTableId === "tab-productos" ? "viene de Productos"
                            : col.refTableId === "tab-categorias" ? "viene de Categorías"
                            : col.refTableId === "tab-clientes" ? "viene de Clientes"
                            : "viene de otra tabla"}
                        </span>
                      )}
                      {isTutorial && col.id === "col-vprecio" && (
                        <span className="block text-[10px] font-normal text-blue-500 dark:text-blue-400 mt-0.5">
                          se copia al elegir producto
                        </span>
                      )}
                      {isTutorial && col.id === "col-vclitipo" && (
                        <span className="block text-[10px] font-normal text-blue-500 dark:text-blue-400 mt-0.5">
                          se copia al elegir cliente
                        </span>
                      )}
                      {isTutorial && col.id === "col-pcolor" && (
                        <span className="block text-[10px] font-normal text-blue-500 dark:text-blue-400 mt-0.5">
                          se copia al elegir categoría
                        </span>
                      )}
                      {isTutorial && col.id === "col-vefectivo" && (
                        <span className="block text-[10px] font-normal text-orange-500 dark:text-orange-400 mt-0.5">
                          complementario
                        </span>
                      )}
                      {isTutorial && col.id === "col-vtransfer" && (
                        <span className="block text-[10px] font-normal text-orange-500 dark:text-orange-400 mt-0.5">
                          complementario
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground w-12">
                    {" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => {
                  const gid = row._repeatGroupId
                  const groupColorClass = gid ? groupColors[groupColorMap.get(gid) ?? 0] : ""
                  const isGrouped = !!gid
                  return (
                  <tr
                    key={row.id}
                    className={cn(
                      "group border-b border-border/50 hover:bg-muted/30 transition-colors",
                      isGrouped && groupColorClass && "border-l-3",
                      isGrouped && groupColorClass
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-background px-3 py-2.5 text-xs text-muted-foreground">
                      {isGrouped && isFirstInGroup.has(idx) ? (
                        <span className="flex items-center gap-0.5">
                          <Repeat className="h-3 w-3 text-indigo-400" />
                          {idx + 1}
                        </span>
                      ) : isGrouped ? (
                        <span className="text-muted-foreground/25 italic text-xs">″</span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    {visibleColumns.map((col) => {
                      const widthClass = getColumnWidthClass(col.columnWidth)
                      // For grouped rows, show shared indicator for global fields that match the first row
                      const isGlobalField = rs && !rs.columnIds.includes(col.id)
                      const showGroupIndicator = isGrouped && !isFirstInGroup.has(idx) && isGlobalField && isSameCommonFieldAsFirst(row, idx, col.id)
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            "px-3 py-2.5 truncate relative",
                            widthClass,
                            (col.type === "number" || col.type === "autonumber" || col.type === "percentage") && "font-mono text-right",
                            col.type === "currency" && "font-mono",
                            col.type === "formula" && "font-mono italic text-muted-foreground",
                            isInlineEditable(col, row) && !showGroupIndicator && "cursor-pointer hover:bg-accent/50",
                            showGroupIndicator && "cursor-pointer hover:bg-accent/30"
                          )}
                          onClick={() => {
                            if (showGroupIndicator) {
                              // Click on shared global field → open full row editor
                              handleEditRow(row)
                            } else if (isInlineEditable(col, row) && !(editingCell?.rowId === row.id && editingCell?.colId === col.id)) {
                              startEditing(row.id, col.id, row[col.id])
                            }
                          }}
                          onDoubleClick={() => {
                            if (!isInlineEditable(col, row)) {
                              handleEditRow(row)
                            }
                          }}
                          title={showGroupIndicator ? "Campo global compartido — clic para editar el grupo" : undefined}
                        >
                          {showGroupIndicator ? (
                            <span className="flex items-center gap-1 text-muted-foreground/40">
                              <Link2 className="h-2.5 w-2.5 shrink-0" />
                              <span className="italic text-[11px]">″</span>
                            </span>
                          ) : editingCell?.rowId === row.id && editingCell?.colId === col.id ? (
                            <InlineCellEditor
                              column={col}
                              value={editingValue}
                              onChange={setEditingValue}
                              onSave={saveEdit}
                              onCancel={cancelEdit}
                              project={project}
                            />
                          ) : (
                            <CellRenderer
                              column={col}
                              value={row[col.id]}
                              row={row}
                              allColumns={table.columns}
                              projects={projects}
                              currentProjectId={project.id}
                              allRows={table.rows}
                            />
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-50 hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEditRow(row)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {gid && rs ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                const groupRows = table.rows.filter((r: Row) => r._repeatGroupId === gid)
                                const groupRowIds = groupRows.map((r: Row) => r.id)
                                if (confirm(`¿Eliminar todo el grupo de ${groupRows.length} registros?`)) {
                                  deleteRowsBatch(project.id, table.id, groupRowIds)
                                  toast.success(`${groupRows.length} registros eliminados`)
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Eliminar grupo
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteRow(row.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAB — Floating Add Button (list view) */}
      {viewMode === "list" && filteredRows.length > 0 && (
        <button
          onClick={() => {
            setEditRow(null)
            setEditRowOpen(true)
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30"
          title="Agregar Registro"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Edit/Add Row Dialog */}
      <EditRowDialog
        open={editRowOpen}
        onOpenChange={setEditRowOpen}
        project={project}
        table={table}
        row={editRow}
      />

      {/* Quick Record Modal - opens EditRowDialog on table select */}
      <QuickRecordModal
        open={quickRecordOpen}
        onOpenChange={setQuickRecordOpen}
        projectId={project?.id}
        onSelectTable={(projId, tblId) => {
          const proj = projects.find(p => p.id === projId)
          const tbl = proj?.tables.find(t => t.id === tblId)
          if (proj && tbl) {
            setEditRow(null)
            // If same table, reuse existing dialog; otherwise navigate
            if (proj.id === project?.id && tbl.id === table?.id) {
              setEditRowOpen(true)
            } else {
              // Navigate to the selected table and open add row dialog
              selectTable(proj.id, tbl.id)
              // Small delay to let the view update, then open the dialog
              setTimeout(() => setEditRowOpen(true), 100)
            }
          }
        }}
      />

      {/* CSV Import/Export Dialog */}
      {project && table && (
        <CsvDialog
          open={csvDialogOpen}
          onOpenChange={setCsvDialogOpen}
          mode="table"
          projectId={project.id}
          tableId={table.id}
        />
      )}

      {/* Edit Table Dialog */}
      {project && table && (
        <EditTableDialog
          open={editTableOpen}
          onOpenChange={setEditTableOpen}
          projectId={project.id}
          tableId={table.id}
        />
      )}

      {/* Delete Table Confirmation */}
      {project && table && (
        <DeleteTableDialog
          open={deleteTableOpen}
          onOpenChange={setDeleteTableOpen}
          projectId={project.id}
          tableId={table.id}
          tableName={table.name}
          tableEmoji={table.emoji}
        />
      )}
    </div>
  )
}

// ═══ TUTORIAL HINTS ═══
interface HintLine {
  icon?: React.ReactNode
  text: string
}

interface TutorialHint {
  title: string
  lines: HintLine[]
}

function getTutorialHint(tableId: string, tableName: string): TutorialHint | null {
  if (tableId === "tab-categorias") {
    return {
      title: "Tabla simple de apoyo",
      lines: [
        { icon: "🏷️", text: "Esta tabla solo tiene columnas básicas: texto y select." },
        { icon: "🔗", text: "Es el ORIGEN de una referencia: la tabla Productos tiene una columna \"Categoría\" que viene de aquí." },
        { icon: "👉", text: "Prueba: agrega una nueva categoría aquí, luego ve a Productos y podrás elegirla en el dropdown de Categoría." },
      ],
    }
  }

  if (tableId === "tab-productos") {
    return {
      title: "Referencia + Fórmulas + Rating + Checkbox",
      lines: [
        { icon: "🔗", text: "\"Categoría\" es una REFERENCIA a la tabla Categorías: al elegir una, se copia su Color automáticamente." },
        { icon: "📐", text: "\"Estado\" es una FÓRMULA: Stock = 0 → \"Agotado\" | Stock 1-5 → \"Poco stock\" | Stock 6+ → \"Disponible\"" },
        { icon: "📐", text: "\"Valor Inventario\" es una FÓRMULA: Stock × Precio. Se recalcula si cambias cualquiera de los dos." },
        { icon: "⭐", text: "\"Calificación\" es tipo Rating (1-5 estrellas). \"Activo\" es tipo Checkbox." },
        { icon: "📦", text: "Cuando registres una Venta, el Stock se descuenta automáticamente." },
        { icon: "👉", text: "Prueba: cambia el Stock del Borrador (3) a 0 y verás que Estado cambia a \"Agotado\" y Valor Inventario a $0." },
      ],
    }
  }

  if (tableId === "tab-clientes") {
    return {
      title: "Email, Teléfono, URL + Fórmula condicional",
      lines: [
        { icon: "📧", text: "Esta tabla muestra tipos especiales: Email, Teléfono y URL (sitio web)." },
        { icon: "📐", text: "\"Descuento\" es una FÓRMULA: Premium → 10%, Mayoreo → 15%, Regular → 0%." },
        { icon: "🔗", text: "Es el ORIGEN de una referencia: la tabla Ventas tiene una columna \"Cliente\" que viene de aquí." },
        { icon: "👉", text: "Prueba: cambia el Tipo de Carlos a \"Premium\" y verás que su Descuento cambia a 10." },
      ],
    }
  }

  if (tableId === "tab-ventas") {
    return {
      title: "Doble Referencia + Fórmula con Descuento",
      lines: [
        { icon: "🔗", text: "\"Producto\" es una REFERENCIA → al elegir un producto, se copia su precio en \"Precio Unitario\"." },
        { icon: "🔗", text: "\"Cliente\" es otra REFERENCIA → al elegir un cliente, se copia su tipo en \"Tipo Cliente\"." },
        { icon: "📐", text: "\"Total\" es una FÓRMULA: Cantidad × Precio × (1 - Descuento/100)." },
        { icon: "📦", text: "Al registrar una venta, el Stock del producto se DESCUENTA automáticamente en Productos." },
        { icon: "↩️", text: "Si eliminas una venta, el Stock se RESTAURA automáticamente." },
        { icon: "👉", text: "Prueba: agrega una venta de 2 Cuadernos, luego ve a Productos y verás que el Stock bajó en 2." },
      ],
    }
  }

  if (tableId === "tab-tareas") {
    return {
      title: "Multiselect + Fórmulas con Checkbox",
      lines: [
        { icon: "🏷️", text: "\"Etiquetas\" es tipo Multiselect: puedes elegir varias etiquetas a la vez (separadas por coma)." },
        { icon: "📐", text: "\"Progreso\" es una FÓRMULA: si Completada = true → \"100%\", si no → \"0%\"." },
        { icon: "📐", text: "\"Semáforo\" es una FÓRMULA anidada: Hecho / Urgente / Normal / Baja, según prioridad y estado." },
        { icon: "👉", text: "Prueba: marca \"Diseñar logo cliente\" como Completada y verás que Progreso cambia a \"100%\" y Semáforo a \"Hecho\"." },
      ],
    }
  }

  if (tableId === "tab-gastos") {
    return {
      title: "Fórmulas con Signo y Condicionales",
      lines: [
        { icon: "📐", text: "\"Signo\" es una FÓRMULA: Ingreso → \"+\", Egreso → \"-\". Simple pero útil para reportes." },
        { icon: "📐", text: "\"Monto Neto\" es una FÓRMULA: Ingreso → monto positivo, Egreso → monto negativo. Así puedes sumar todo y obtener el balance." },
        { icon: "☑️", text: "\"Deducible\" es un Checkbox: marca los gastos que puedes deducir de impuestos." },
        { icon: "👉", text: "Prueba: cambia la primera fila de Ingreso a Egreso y verás que Signo cambia a \"-\" y Monto Neto se vuelve negativo." },
      ],
    }
  }

  return null
}

// ═══ INLINE CELL EDITOR ═══
function InlineCellEditor({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  project,
}: {
  column: Column
  value: any
  onChange: (val: any) => void
  onSave: () => void
  onCancel: () => void
  project: Project
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the input when editing starts
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 0)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  // For select and reference types, use a Select dropdown
  if (column.type === "select") {
    return (
      <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
        <Select
          open={true}
          value={value || undefined}
          onValueChange={(v) => {
            onChange(v)
            // Auto-save on select
            setTimeout(() => {
              onChange(v)
              onSave()
            }, 50)
          }}
        >
          <SelectTrigger className="h-7 text-xs w-full min-w-[120px]">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (column.type === "reference") {
    const refTable = project.tables.find(t => t.id === column.refTableId)
    if (!refTable) {
      return <span className="text-xs text-red-500">Tabla no encontrada</span>
    }
    const displayCol = column.refDisplayColId
      ? refTable.columns.find(c => c.id === column.refDisplayColId)
      : refTable.columns.find(c => c.type === "text")

    return (
      <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
        <Select
          open={true}
          value={value || undefined}
          onValueChange={(v) => {
            const val = v === "__none__" ? "" : v
            onChange(val)
            // Auto-save on select
            setTimeout(() => {
              onSave()
            }, 50)
          }}
        >
          <SelectTrigger className="h-7 text-xs w-full min-w-[150px]">
            <SelectValue placeholder="Seleccionar..." />
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
      </div>
    )
  }

  if (column.type === "checkbox") {
    return (
      <div className="flex items-center gap-1" ref={ref}>
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) => {
            onChange(!!checked)
            setTimeout(() => onSave(), 50)
          }}
        />
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (column.type === "date") {
    return (
      <Input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={handleKeyDown}
        className="h-7 text-xs w-[130px]"
      />
    )
  }

  if (column.type === "number" || column.type === "currency" || column.type === "percentage") {
    return (
      <Input
        ref={inputRef}
        type="number"
        step={column.type === "currency" ? "0.01" : column.type === "percentage" ? "0.1" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        onBlur={onSave}
        onKeyDown={handleKeyDown}
        className="h-7 text-xs w-[100px]"
        placeholder="0"
      />
    )
  }

  if (column.type === "rating") {
    const max = column.ratingMax || 5
    const rating = typeof value === "number" ? value : parseInt(String(value)) || 0
    return (
      <div className="flex items-center gap-1" ref={ref}>
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              const newVal = i + 1 === rating ? 0 : i + 1
              onChange(newVal)
              setTimeout(() => onSave(), 50)
            }}
            className="transition-colors"
          >
            <Star
              className={cn(
                "h-4 w-4",
                i < rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/30 hover:text-amber-300"
              )}
            />
          </button>
        ))}
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground ml-1">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // Default: text input
  return (
    <Input
      ref={inputRef}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={handleKeyDown}
      className="h-7 text-xs w-full min-w-[120px]"
      placeholder={column.name}
    />
  )
}

// ═══ CELL RENDERER ═══
function CellRenderer({
  column,
  value,
  row,
  allColumns,
  projects,
  currentProjectId,
  allRows,
}: {
  column: Column
  value: any
  row: Row
  allColumns: Column[]
  projects: any[]
  currentProjectId: string
  allRows?: Row[]
}) {
  // ═══ CONDITIONAL FORMATTING ═══
  let conditionalStyle: React.CSSProperties = {}
  let conditionalIcon = ""

  if (column.conditionalFormat && column.conditionalFormat.length > 0) {
    for (const rule of column.conditionalFormat) {
      const matches = evaluateColumnCondition(rule.condition, row, allColumns, projects, currentProjectId)
      if (matches) {
        if (rule.bgColor) conditionalStyle.backgroundColor = rule.bgColor
        if (rule.textColor) conditionalStyle.color = rule.textColor
        if (rule.icon) conditionalIcon = rule.icon
        break // First matching rule wins
      }
    }
  }

  // Helper to wrap content with conditional formatting
  const wrapWithConditional = (content: React.ReactNode): React.ReactNode => {
    if (Object.keys(conditionalStyle).length > 0 || conditionalIcon) {
      return (
        <span className="flex items-center gap-1" style={conditionalStyle}>
          {conditionalIcon && <span className="shrink-0">{conditionalIcon}</span>}
          {content}
        </span>
      )
    }
    return content
  }

  // ═══ DISPLAY MODE: PROGRESS ═══
  if (column.displayMode === "progress" && (column.type === "number" || column.type === "percentage")) {
    const numVal = typeof value === "number" ? value : parseFloat(String(value)) || 0
    const pct = column.type === "percentage" ? Math.min(100, Math.max(0, numVal)) : Math.min(100, Math.max(0, numVal))
    const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
    const displayText = column.type === "percentage" ? `${numVal.toFixed(1)}%` : String(numVal)

    return wrapWithConditional(
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[40px]">
          <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{displayText}</span>
      </div>
    )
  }

  // ═══ DISPLAY MODE: COLOR ═══
  if (column.displayMode === "color" && column.type === "text") {
    const colorVal = String(value ?? "")
    const isHexColor = /^#[0-9A-Fa-f]{6}$/.test(colorVal)
    if (isHexColor) {
      return wrapWithConditional(
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-4 rounded border border-border shrink-0"
            style={{ backgroundColor: colorVal }}
          />
          <span className="text-xs font-mono">{colorVal}</span>
        </span>
      )
    }
  }

  // Formula columns are always computed
  if (column.type === "formula") {
    const result = evaluateFormula(column.formula || "", row, allColumns, projects, currentProjectId, allRows)
    if (result === "" || result == null) return <span className="text-muted-foreground/40">—</span>

    // Special formatting for known result types
    const resultStr = formatFormulaResult(result, column.formula || "")

    // Color coding for status-like results
    if (typeof result === "string") {
      const lowerResult = result.toLowerCase()
      if (["ok", "disponible", "completada", "activo", "hecho"].some(s => lowerResult.includes(s))) {
        return wrapWithConditional(
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{resultStr}</span>
        )
      }
      if (["excedido", "agotado", "cancelada", "inactivo"].some(s => lowerResult.includes(s))) {
        return wrapWithConditional(
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">{resultStr}</span>
        )
      }
      if (["cerca del límite", "bajo stock", "poco stock", "pendiente", "urgente"].some(s => lowerResult.includes(s))) {
        return wrapWithConditional(
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{resultStr}</span>
        )
      }
      // Simple text results like +/-
      return wrapWithConditional(<span className="text-xs">{resultStr}</span>)
    }

    // Numeric results - format based on referenced column types
    if (typeof result === "number") {
      const refColIds = (column.formula?.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1))
      // Check if any referenced column is a currency type
      const hasCurrencyRef = refColIds.some(id => {
        const refCol = allColumns?.find(c => c.id === id)
        return refCol?.type === "currency"
      })
      if (hasCurrencyRef) {
        return wrapWithConditional(<span className="text-xs">{result.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</span>)
      }
      // Check if any referenced column is a percentage type
      const hasPercentageRef = refColIds.some(id => {
        const refCol = allColumns?.find(c => c.id === id)
        return refCol?.type === "percentage"
      })
      if (hasPercentageRef && result <= 1) {
        return wrapWithConditional(<span className="text-xs">{(result * 100).toFixed(1)}%</span>)
      }
      return wrapWithConditional(<span className="text-xs">{resultStr}</span>)
    }

    return wrapWithConditional(<span className="text-xs">{resultStr}</span>)
  }

  if (value == null || value === "") {
    return <span className="text-muted-foreground/40">—</span>
  }

  switch (column.type) {
    case "text": {
      const displayVal = applyTextTransform(String(value), column.textTransform)
      return wrapWithConditional(<span className="truncate">{displayVal}</span>)
    }

    case "number": {
      let displayVal = Number(value).toLocaleString("es-MX")
      return wrapWithConditional(<span className="font-mono">{displayVal}</span>)
    }

    case "autonumber": {
      const displayVal = value != null && value !== "" ? String(value) : "—"
      return wrapWithConditional(<span className="font-mono">{displayVal}</span>)
    }

    case "currency": {
      const num = typeof value === "string" ? parseFloat(value) : value
      const formatted = formatCurrency(Math.abs(num))
      if (num < 0) {
        return wrapWithConditional(<span className="text-red-600 dark:text-red-400 font-mono">-{formatted}</span>)
      }
      return wrapWithConditional(<span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatted}</span>)
    }

    case "percentage": {
      const displayVal = `${Number(value).toFixed(1)}%`
      return wrapWithConditional(<span className="font-mono">{displayVal}</span>)
    }

    case "date": {
      return wrapWithConditional(<span className="whitespace-nowrap">{formatDate(String(value))}</span>)
    }

    case "select": {
      const optionColor = column.optionColors?.[String(value)]
      const optionIndex = column.options?.indexOf(String(value)) ?? 0
      const colorClass = getSelectPillColor(optionIndex >= 0 ? optionIndex : 0)

      // displayMode "badge" is already the default for select
      if (optionColor) {
        const colorStyle = {
          backgroundColor: optionColor + "20",
          color: optionColor,
          borderColor: optionColor + "40",
        }
        return wrapWithConditional(
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border" style={colorStyle}>
            {String(value)}
          </span>
        )
      }

      return wrapWithConditional(
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            colorClass
          )}
        >
          {String(value)}
        </span>
      )
    }

    case "multiselect": {
      const values = Array.isArray(value) ? value : String(value).split(",")
      return wrapWithConditional(
        <div className="flex flex-wrap gap-1">
          {values.map((v: string, i: number) => {
            const trimmed = v.trim()
            const optionColor = column.optionColors?.[trimmed]
            const optionIndex = column.options?.indexOf(trimmed) ?? i
            const colorClass = getSelectPillColor(optionIndex >= 0 ? optionIndex : i)

            if (optionColor) {
              const colorStyle = {
                backgroundColor: optionColor + "20",
                color: optionColor,
                borderColor: optionColor + "40",
              }
              return (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                  style={colorStyle}
                >
                  {trimmed}
                </span>
              )
            }

            return (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  colorClass
                )}
              >
                {trimmed}
              </span>
            )
          })}
        </div>
      )
    }

    case "email": {
      const displayVal = applyTextTransform(String(value), column.textTransform)
      return wrapWithConditional(
        <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-700 truncate">
          {displayVal}
        </span>
      )
    }

    case "phone":
      return wrapWithConditional(<span className="whitespace-nowrap">{String(value)}</span>)

    case "url": {
      const displayVal = applyTextTransform(String(value), column.textTransform)
      return wrapWithConditional(
        <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-700 truncate">
          {displayVal}
        </span>
      )
    }

    case "checkbox": {
      // displayMode "toggle" shows a colored dot instead of check/x icons
      if (column.displayMode === "toggle") {
        return wrapWithConditional(
          value ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Sí</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">No</span>
            </span>
          )
        )
      }

      return wrapWithConditional(
        value ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground/30" />
        )
      )
    }

    case "rating": {
      const max = column.ratingMax || 5
      const rating = typeof value === "number" ? value : parseInt(String(value)) || 0
      return wrapWithConditional(
        <div className="flex items-center gap-0.5">
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/20"
              )}
            />
          ))}
        </div>
      )
    }

    case "reference": {
      const displayValue = resolveReferenceDisplay(
        String(value),
        column.refTableId,
        column.refDisplayColId,
        projects,
        currentProjectId
      )
      return wrapWithConditional(
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          <ExternalLink className="h-3 w-3" />
          {displayValue}
        </span>
      )
    }

    default:
      return wrapWithConditional(<span>{String(value)}</span>)
  }
}
