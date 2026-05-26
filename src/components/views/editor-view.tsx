"use client"

import React, { useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import type { Column, ColumnType, Project, Table, RepeatableSection } from "@/shared/types/Project"
import { cn } from "@/lib/utils"
import { getColumnTypeLabel, getColumnTypeIcon, getColumnTypeColor } from "@/shared/utils/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Plus,
  ExternalLink,
  Code,
  Star,
  Eye,
  Link2,
  Columns3,
  GripVertical,
  Trash2,
  ArrowRightLeft,
  ChevronRight,
  Info,
  Repeat,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { AddColumnDialog } from "@/components/add-column-dialog"
import { EditColumnDialog } from "@/components/edit-column-dialog"
import { ColumnPreview } from "@/components/editor/column-preview"
import { DeleteTableDialog } from "@/components/delete-table-dialog"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ═══════════════════════════════════════════════════════════════
// HELPER: Get the most important feature badges for a column
// ═══════════════════════════════════════════════════════════════

function getTopFeatureBadges(col: Column): { label: string; color: string }[] {
  const badges: { label: string; color: string }[] = []

  // Only show the 2 most important features
  if (col.virtual) badges.push({ label: "Virtual", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400" })
  if (col.autoCompute || col.autoComputeFormula) badges.push({ label: "Auto", color: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300" })
  if (col.complementaryOf) badges.push({ label: "Complementario", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300" })
  if (col.dependsOn) badges.push({ label: "Cascada", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300" })
  if (col.showIf) badges.push({ label: "Condicional", color: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300" })
  if (col.conditionalFormat && col.conditionalFormat.length > 0) badges.push({ label: "Formato", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300" })
  if (col.unique) badges.push({ label: "Único", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300" })
  if (col.readOnly) badges.push({ label: "Solo lectura", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" })

  return badges.slice(0, 2)
}

// ═══════════════════════════════════════════════════════════════
// SORTABLE COLUMN ROW
// ═══════════════════════════════════════════════════════════════

interface SortableColumnRowProps {
  column: Column
  project: Project
  table: Table
  onEdit: (colId: string) => void
  onToggleRequired: (colId: string, currentRequired: boolean, colName: string) => void
  onToggleShowInList: (colId: string, currentShow: boolean, colName: string) => void
  onDelete: (colId: string, colName: string) => void
  onInlineEditName: (colId: string, currentName: string) => void
  editingNameId: string | null
  editingNameValue: string
  onEditingNameChange: (value: string) => void
  onEditingNameSave: () => void
  onEditingNameCancel: () => void
}

function SortableColumnRow({
  column,
  project,
  table,
  onEdit,
  onToggleRequired,
  onToggleShowInList,
  onDelete,
  onInlineEditName,
  editingNameId,
  editingNameValue,
  onEditingNameChange,
  onEditingNameSave,
  onEditingNameCancel,
}: SortableColumnRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const featureBadges = getTopFeatureBadges(column)
  const isEditingName = editingNameId === column.id

  // Build type badge content
  const typeBadgeContent = useMemo(() => {
    if (column.type === "reference" && column.refTableId) {
      const refTable = project.tables.find(t => t.id === column.refTableId)
      return refTable ? `→ ${refTable.name}` : "→ tabla"
    }
    if (column.type === "formula") {
      return "fx"
    }
    if ((column.type === "select" || column.type === "multiselect") && column.options) {
      return `${column.options.length} opc.`
    }
    if (column.type === "rating") {
      return `⭐ /${column.ratingMax || 5}`
    }
    return getColumnTypeLabel(column.type)
  }, [column, project])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-2 border-b last:border-b-0 bg-background hover:bg-muted/30 transition-colors min-h-[52px]",
        isDragging && "opacity-60 bg-muted/50 shadow-lg rounded-lg z-50"
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        aria-label="Arrastrar columna"
        className={cn(
          "touch-none flex items-center justify-center w-11 h-11 rounded shrink-0 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing",
          isDragging && "cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Type Icon */}
      <span
        className={cn(
          "inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold shrink-0",
          getColumnTypeColor(column.type)
        )}
      >
        {getColumnTypeIcon(column.type)}
      </span>

      {/* Column Name (tappable for inline edit) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isEditingName ? (
            <Input
              value={editingNameValue}
              onChange={(e) => onEditingNameChange(e.target.value)}
              onBlur={onEditingNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditingNameSave()
                if (e.key === "Escape") onEditingNameCancel()
              }}
              className="h-9 text-sm py-0 px-1.5 font-medium"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              type="button"
              className="text-sm font-medium truncate hover:underline underline-offset-2 text-left"
              onClick={(e) => {
                e.stopPropagation()
                onInlineEditName(column.id, column.name)
              }}
            >
              {column.name}
              {column.required && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </button>
          )}

          {/* Type Badge */}
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 shrink-0 font-medium",
              getColumnTypeColor(column.type)
            )}
          >
            {typeBadgeContent}
          </Badge>
        </div>

        {/* Feature indicators */}
        {featureBadges.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            {featureBadges.map((badge, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center text-[10px] px-1 py-0 rounded font-medium",
                  badge.color
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Show in List Toggle */}
      <div className="flex items-center shrink-0" title="Mostrar en vista lista">
        <Switch
          checked={column.showInList !== false}
          onCheckedChange={() => onToggleShowInList(column.id, column.showInList !== false, column.name)}
          aria-label="Mostrar en vista lista"
          className="data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-muted-foreground/30"
        />
      </div>

      {/* Required Toggle */}
      <div className="flex items-center shrink-0" title="Campo requerido">
        <Switch
          checked={column.required}
          onCheckedChange={() => onToggleRequired(column.id, column.required, column.name)}
          aria-label="Campo requerido"
        />
      </div>

      {/* Delete button */}
      <button
        type="button"
        aria-label="Eliminar columna"
        className="flex items-center justify-center w-11 h-11 rounded shrink-0 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
        onClick={() => {
          if (confirm(`¿Eliminar columna "${column.name}"? Esta acción no se puede deshacer.`)) {
            onDelete(column.id, column.name)
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Edit chevron (tappable to open EditColumnDialog) */}
      <button
        type="button"
        aria-label="Editar columna"
        className="flex items-center justify-center w-11 h-11 rounded shrink-0 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
        onClick={() => onEdit(column.id)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONNECTIONS TAB COMPONENT
// ═══════════════════════════════════════════════════════════════

function ConnectionsTab({
  project,
  table,
  onEditColumn,
  onViewOtherTable,
}: {
  project: Project
  table: Table
  onEditColumn: (colId: string) => void
  onViewOtherTable: (projectId: string, tableId: string) => void
}) {
  // Outgoing references: columns of type "reference" in this table
  const outgoingRefs = useMemo(() => {
    return table.columns.filter(c => c.type === "reference" && c.refTableId)
  }, [table.columns])

  // Incoming references: columns in OTHER tables that reference THIS table
  const incomingRefs = useMemo(() => {
    const refs: {
      sourceTable: Table
      sourceColumn: Column
      refTableId: string
    }[] = []

    for (const otherTable of project.tables) {
      if (otherTable.id === table.id) continue
      for (const col of otherTable.columns) {
        if (col.type === "reference" && col.refTableId === table.id) {
          refs.push({
            sourceTable: otherTable,
            sourceColumn: col,
            refTableId: col.refTableId,
          })
        }
      }
    }

    return refs
  }, [project.tables, table.id])

  const hasConnections = outgoingRefs.length > 0 || incomingRefs.length > 0

  return (
    <div className="space-y-4">
      {/* Outgoing References */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <ArrowRightLeft className="h-4 w-4 text-rose-500" />
          Referencias Salientes ({outgoingRefs.length})
        </h3>

        {outgoingRefs.length > 0 ? (
          <div className="space-y-2">
            {outgoingRefs.map(col => {
              const refTable = project.tables.find(t => t.id === col.refTableId)
              if (!refTable) return null

              // Resolve auto-fill info
              const autoFillInfo = (col.refAutoFill || []).map(m => {
                const sourceCol = refTable.columns.find(c => c.id === m.sourceColId)
                const targetCol = table.columns.find(c => c.id === m.targetColId)
                return sourceCol && targetCol
                  ? `${sourceCol.name} → ${targetCol.name}`
                  : null
              }).filter(Boolean)

              // Resolve on-add info
              const onAddInfo = col.refOnAdd
                ? (() => {
                    const targetCol = refTable.columns.find(c => c.id === col.refOnAdd!.targetColId)
                    const sourceCol = table.columns.find(c => c.id === col.refOnAdd!.sourceColId)
                    return targetCol && sourceCol
                      ? `${targetCol.name} ${col.refOnAdd!.operation === "subtract" ? "−" : "+"} ${sourceCol.name}`
                      : null
                  })()
                : null

              return (
                <div
                  key={col.id}
                  className="rounded-lg border p-3 space-y-1.5 bg-background"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{table.emoji}</span>
                    <span className="text-sm font-medium">{table.name}</span>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-base">{refTable.emoji}</span>
                    <span className="text-sm font-medium">{refTable.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Columna: <span className="font-medium text-foreground">{col.name}</span>
                  </p>
                  {autoFillInfo.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Se copia: <span className="font-medium text-foreground">{autoFillInfo.join(", ")}</span>
                    </p>
                  )}
                  {onAddInfo && (
                    <p className="text-xs text-muted-foreground">
                      Al agregar: <span className="font-medium text-foreground">{onAddInfo}</span>
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onEditColumn(col.id)}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            Esta tabla no tiene referencias salientes
          </p>
        )}
      </div>

      {/* Incoming References */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Link2 className="h-4 w-4 text-sky-500" />
          Referencias Entrantes ({incomingRefs.length})
        </h3>

        {incomingRefs.length > 0 ? (
          <div className="space-y-2">
            {incomingRefs.map(({ sourceTable, sourceColumn }) => {
              // Resolve auto-fill info (from source table's perspective)
              const autoFillInfo = (sourceColumn.refAutoFill || []).map(m => {
                const sourceCol = table.columns.find(c => c.id === m.sourceColId)
                const targetCol = sourceTable.columns.find(c => c.id === m.targetColId)
                return sourceCol && targetCol
                  ? `${sourceCol.name} → ${targetCol.name}`
                  : null
              }).filter(Boolean)

              // Resolve on-add info
              const onAddInfo = sourceColumn.refOnAdd
                ? (() => {
                    const targetCol = table.columns.find(c => c.id === sourceColumn.refOnAdd!.targetColId)
                    const sourceCol = sourceTable.columns.find(c => c.id === sourceColumn.refOnAdd!.sourceColId)
                    return targetCol && sourceCol
                      ? `${targetCol.name} ${sourceColumn.refOnAdd!.operation === "subtract" ? "−" : "+"} ${sourceCol.name}`
                      : null
                  })()
                : null

              return (
                <div
                  key={`${sourceTable.id}-${sourceColumn.id}`}
                  className="rounded-lg border p-3 space-y-1.5 bg-background"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{sourceTable.emoji}</span>
                    <span className="text-sm font-medium">{sourceTable.name}</span>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-base">{table.emoji}</span>
                    <span className="text-sm font-medium">{table.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Columna en {sourceTable.name}: <span className="font-medium text-foreground">{sourceColumn.name}</span>
                  </p>
                  {autoFillInfo.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Se copia: <span className="font-medium text-foreground">{autoFillInfo.join(", ")}</span>
                    </p>
                  )}
                  {onAddInfo && (
                    <p className="text-xs text-muted-foreground">
                      Al agregar: <span className="font-medium text-foreground">{onAddInfo}</span>
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onViewOtherTable(project.id, sourceTable.id)}
                    >
                      Ver tabla
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            Ninguna tabla referencia a esta tabla
          </p>
        )}
      </div>

      {/* Empty state */}
      {!hasConnections && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <Link2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Esta tabla no tiene conexiones
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-[240px]">
            Las conexiones se crean al agregar columnas de tipo Referencia
          </p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PREVIEW TAB COMPONENT
// ═══════════════════════════════════════════════════════════════

function PreviewTab({
  table,
  project,
  projects,
  currentProjectId,
}: {
  table: Table
  project: Project
  projects: Project[]
  currentProjectId: string
}) {
  // Only show columns visible in forms
  const visibleColumns = useMemo(() => {
    return table.columns.filter(c => c.showInForm !== false)
  }, [table.columns])

  const rs = table.repeatableSection

  // Split columns into common and repeatable
  const { commonColumns, repeatColumns } = useMemo(() => {
    if (!rs) return { commonColumns: visibleColumns, repeatColumns: [] as Column[] }
    const repeatColIds = new Set(rs.columnIds)
    return {
      commonColumns: visibleColumns.filter(c => !repeatColIds.has(c.id)),
      repeatColumns: visibleColumns.filter(c => repeatColIds.has(c.id)),
    }
  }, [visibleColumns, rs])

  // Group by section (for common columns)
  const sections = useMemo(() => {
    const result: { name: string | null; columns: Column[] }[] = []
    let currentSection: { name: string | null; columns: Column[] } = { name: null, columns: [] }

    for (const col of commonColumns) {
      if (col.sectionName && col.sectionName !== currentSection.name) {
        if (currentSection.columns.length > 0) {
          result.push(currentSection)
        }
        currentSection = { name: col.sectionName, columns: [col] }
      } else {
        currentSection.columns.push(col)
      }
    }

    if (currentSection.columns.length > 0) {
      result.push(currentSection)
    }

    return result
  }, [commonColumns])

  if (visibleColumns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <Eye className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Sin columnas visibles
        </p>
        <p className="text-xs text-muted-foreground/70">
          Agrega columnas para ver la vista previa del formulario
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Esta es una vista previa de cómo verán los datos al agregar un registro
        </p>
      </div>

      <div className="rounded-lg border bg-background p-4 space-y-4">
        {/* Common fields sections */}
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.name && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 mt-2 first:mt-0">
                {section.name}
              </h3>
            )}
            <div className="space-y-3">
              {section.columns.map(col => (
                <ColumnPreview
                  key={col.id}
                  column={col}
                  project={project}
                  projects={projects}
                  currentProjectId={currentProjectId}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Repeatable section */}
        {rs && repeatColumns.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-800" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                {rs.name}
              </span>
              <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-800" />
            </div>

            {/* One instance of repeatable fields */}
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Ítem 1</span>
                {rs.minItems !== 1 && (
                  <button type="button" className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {repeatColumns.map(col => (
                  <ColumnPreview
                    key={col.id}
                    column={col}
                    project={project}
                    projects={projects}
                    currentProjectId={currentProjectId}
                  />
                ))}
              </div>
            </div>

            {/* Add item button */}
            <button
              type="button"
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar ítem
            </button>

            {rs.minItems && rs.minItems > 1 && (
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Mínimo {rs.minItems} ítems
              </p>
            )}
            {rs.maxItems && rs.maxItems > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
                Máximo {rs.maxItems} ítems
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT: EditorView
// ═══════════════════════════════════════════════════════════════

export function EditorView() {
  const {
    projects,
    selectedProjectId,
    selectedTableId,
    setView,
    goBack,
    selectTable,
    deleteColumn,
    updateColumn,
    reorderColumns,
    updateTable,
  } = useAppStore()

  const [addColumnOpen, setAddColumnOpen] = useState(false)
  const [editColumnId, setEditColumnId] = useState<string | null>(null)
  const [editColumnOpen, setEditColumnOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"columnas" | "conexiones" | "preview">("columnas")
  const [repeatSectionOpen, setRepeatSectionOpen] = useState(true)
  const [deleteTableOpen, setDeleteTableOpen] = useState(false)

  // Inline name editing state
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState("")

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const project = projects.find((p) => p.id === selectedProjectId)
  const table = project?.tables.find((t) => t.id === selectedTableId)

  if (!project || !table) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Tabla no encontrada</p>
      </div>
    )
  }

  // ─── Handlers ───

  const handleDeleteColumn = (colId: string, colName: string) => {
    deleteColumn(project.id, table.id, colId)
    toast.success(`Columna "${colName}" eliminada`)
  }

  const handleToggleRequired = (colId: string, currentRequired: boolean, colName: string) => {
    updateColumn(project.id, table.id, colId, { required: !currentRequired })
    toast.success(`Columna "${colName}" ${!currentRequired ? "requerida" : "opcional"}`)
  }

  const handleToggleShowInList = (colId: string, currentShow: boolean, colName: string) => {
    updateColumn(project.id, table.id, colId, { showInList: !currentShow })
    toast.success(`Columna "${colName}" ${!currentShow ? "visible en lista" : "oculta en lista"}`)
  }

  const handleEditColumn = (colId: string) => {
    setEditColumnId(colId)
    setEditColumnOpen(true)
  }

  const handleInlineEditName = (colId: string, currentName: string) => {
    setEditingNameId(colId)
    setEditingNameValue(currentName)
  }

  const handleEditingNameChange = (value: string) => {
    setEditingNameValue(value)
  }

  const handleEditingNameSave = () => {
    if (editingNameId && editingNameValue.trim()) {
      const col = table.columns.find(c => c.id === editingNameId)
      if (col && col.name !== editingNameValue.trim()) {
        updateColumn(project.id, table.id, editingNameId, { name: editingNameValue.trim() })
        toast.success(`Columna renombrada a "${editingNameValue.trim()}"`)
      }
    }
    setEditingNameId(null)
    setEditingNameValue("")
  }

  const handleEditingNameCancel = () => {
    setEditingNameId(null)
    setEditingNameValue("")
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentOrder = table.columns.map(c => c.id)
    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
    reorderColumns(project.id, table.id, newOrder)
  }

  const handleViewOtherTable = (projectId: string, tableId: string) => {
    selectTable(projectId, tableId, "editor")
  }

  // ─── Render ───

  return (
    <div className="flex flex-col h-full">
      {/* ═══ Header ═══ */}
      <div className="shrink-0 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 mb-2 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => goBack()}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              Estructura: <span className="text-base">{table.emoji} {table.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {table.columns.length} columna{table.columns.length !== 1 ? "s" : ""} · {table.rows.length} registro{table.rows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteTableOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar Tabla
          </Button>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "columnas" | "conexiones" | "preview")}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="shrink-0 border-b px-4">
          <TabsList className="h-10 w-full bg-transparent p-0 gap-0">
            <TabsTrigger
              value="columnas"
              className="flex-1 gap-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none data-[state=active]:bg-transparent h-10 text-xs font-medium"
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columnas
            </TabsTrigger>
            <TabsTrigger
              value="conexiones"
              className="flex-1 gap-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-sky-500 rounded-none data-[state=active]:bg-transparent h-10 text-xs font-medium"
            >
              <Link2 className="h-3.5 w-3.5" />
              Conexiones
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex-1 gap-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none data-[state=active]:bg-transparent h-10 text-xs font-medium"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ Tab: Columnas ═══ */}
        <TabsContent value="columnas" className="flex-1 overflow-y-auto m-0 custom-scrollbar">
          {/* Repeatable Section Config */}
          <div className="border-b">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              onClick={() => setRepeatSectionOpen(!repeatSectionOpen)}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Repeat className="h-4 w-4 text-indigo-500" />
                Sección Repetible
                {table.repeatableSection && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {table.repeatableSection.columnIds.length} cols
                  </Badge>
                )}
              </span>
              {repeatSectionOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {repeatSectionOpen && (
              <div className="px-4 pb-4 space-y-3">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Habilitar sección repetible</Label>
                  <Switch
                    checked={!!table.repeatableSection}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateTable(project.id, table.id, {
                          repeatableSection: { name: "Items", columnIds: [], minItems: 1 }
                        })
                        toast.success("Sección repetible habilitada")
                      } else {
                        updateTable(project.id, table.id, { repeatableSection: undefined })
                        toast.success("Sección repetible deshabilitada")
                      }
                    }}
                  />
                </div>

                {table.repeatableSection && (
                  <>
                    {/* Section Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nombre de la sección</Label>
                      <Input
                        value={table.repeatableSection.name}
                        onChange={(e) => {
                          updateTable(project.id, table.id, {
                            repeatableSection: { ...table.repeatableSection!, name: e.target.value }
                          })
                        }}
                        placeholder="Items"
                        className="h-9"
                      />
                    </div>

                    {/* Column Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Columnas en la sección repetible</Label>
                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar rounded-lg border p-2 bg-muted/30">
                        {table.columns
                          .filter(c => c.type !== "formula" && c.type !== "autonumber")
                          .map(col => {
                            const isSelected = table.repeatableSection!.columnIds.includes(col.id)
                            return (
                              <label
                                key={col.id}
                                className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-muted/50 cursor-pointer"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const currentIds = table.repeatableSection!.columnIds
                                    const newIds = checked
                                      ? [...currentIds, col.id]
                                      : currentIds.filter(id => id !== col.id)
                                    updateTable(project.id, table.id, {
                                      repeatableSection: { ...table.repeatableSection!, columnIds: newIds }
                                    })
                                  }}
                                />
                                <span className="text-xs">{col.name}</span>
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4 ml-auto"
                                >
                                  {getColumnTypeLabel(col.type)}
                                </Badge>
                              </label>
                            )
                          })}
                      </div>
                      {table.repeatableSection.columnIds.length === 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          Selecciona al menos una columna para la sección repetible
                        </p>
                      )}
                    </div>

                    {/* Min/Max Items */}
                    <div className="flex gap-3">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-xs text-muted-foreground">Mín. ítems</Label>
                        <Input
                          type="number"
                          min={1}
                          value={table.repeatableSection.minItems ?? 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1
                            updateTable(project.id, table.id, {
                              repeatableSection: { ...table.repeatableSection!, minItems: Math.max(1, val) }
                            })
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-xs text-muted-foreground">Máx. ítems</Label>
                        <Input
                          type="number"
                          min={0}
                          value={table.repeatableSection.maxItems ?? ""}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : undefined
                            updateTable(project.id, table.id, {
                              repeatableSection: { ...table.repeatableSection!, maxItems: val && val > 0 ? val : undefined }
                            })
                          }}
                          placeholder="Sin límite"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {table.columns.length > 0 ? (
            <div className="flex flex-col">
              {/* DnD Column List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={table.columns.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {table.columns.map((col) => (
                    <SortableColumnRow
                      key={col.id}
                      column={col}
                      project={project}
                      table={table}
                      onEdit={handleEditColumn}
                      onToggleRequired={handleToggleRequired}
                      onToggleShowInList={handleToggleShowInList}
                      onDelete={handleDeleteColumn}
                      onInlineEditName={handleInlineEditName}
                      editingNameId={editingNameId}
                      editingNameValue={editingNameValue}
                      onEditingNameChange={handleEditingNameChange}
                      onEditingNameSave={handleEditingNameSave}
                      onEditingNameCancel={handleEditingNameCancel}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add Column Button */}
              <div className="p-3">
                <Button
                  onClick={() => setAddColumnOpen(true)}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                  variant="default"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Columna
                </Button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Columns3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium mb-1">Sin columnas</p>
              <p className="text-sm text-muted-foreground/70 mb-6 max-w-[260px]">
                Agrega columnas para definir la estructura de tu tabla
              </p>
              <Button
                onClick={() => setAddColumnOpen(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Agregar Columna
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab: Conexiones ═══ */}
        <TabsContent value="conexiones" className="flex-1 overflow-y-auto m-0 p-4 custom-scrollbar">
          <ConnectionsTab
            project={project}
            table={table}
            onEditColumn={handleEditColumn}
            onViewOtherTable={handleViewOtherTable}
          />
        </TabsContent>

        {/* ═══ Tab: Preview ═══ */}
        <TabsContent value="preview" className="flex-1 overflow-y-auto m-0 p-4 custom-scrollbar">
          <PreviewTab
            table={table}
            project={project}
            projects={projects}
            currentProjectId={project.id}
          />
        </TabsContent>
      </Tabs>

      {/* ═══ Add Column Dialog (Step Wizard Sheet) ═══ */}
      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        projectId={project.id}
        tableId={table.id}
      />

      {/* ═══ Edit Column Dialog (Bottom Sheet with Live Preview) ═══ */}
      <EditColumnDialog
        open={editColumnOpen}
        onOpenChange={setEditColumnOpen}
        projectId={project.id}
        tableId={table.id}
        columnId={editColumnId}
      />

      {/* Delete Table Confirmation */}
      <DeleteTableDialog
        open={deleteTableOpen}
        onOpenChange={setDeleteTableOpen}
        projectId={project.id}
        tableId={table.id}
        tableName={table.name}
        tableEmoji={table.emoji}
      />
    </div>
  )
}
