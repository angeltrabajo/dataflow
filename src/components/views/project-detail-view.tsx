"use client"

import React, { useState } from "react"
import { useAppStore, type Project, type Table } from "@/lib/store"
import { cn, formatRelativeDate } from "@/lib/helpers"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Zap,
  Plus,
  Table2,
  ArrowRight,
  MoreVertical,
  Lightbulb,
  XIcon,
  FileSpreadsheet,
} from "lucide-react"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { NewTableDialog } from "@/components/new-table-dialog"
import { QuickRecordModal } from "@/components/quick-record-modal"
import { EditRowDialog } from "@/components/edit-row-dialog"
import { CsvDialog } from "@/components/csv-dialog"
import { DeleteTableDialog } from "@/components/delete-table-dialog"
import { EditTableDialog } from "@/components/edit-table-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ProjectDetailView() {
  const {
    projects,
    selectedProjectId,
    selectTable,
    goBack,
    deleteProject,
  } = useAppStore()

  const project = projects.find((p) => p.id === selectedProjectId)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [newTableOpen, setNewTableOpen] = useState(false)
  const [quickRecordOpen, setQuickRecordOpen] = useState(false)
  const [tutorialDismissed, setTutorialDismissed] = useState(false)
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [deleteTableInfo, setDeleteTableInfo] = useState<{ tableId: string; tableName: string; tableEmoji: string } | null>(null)
  const [editTableInfo, setEditTableInfo] = useState<{ tableId: string } | null>(null)

  // EditRowDialog state for quick record
  const [editRowOpen, setEditRowOpen] = useState(false)
  const [editRowProject, setEditRowProject] = useState<Project | null>(null)
  const [editRowTable, setEditRowTable] = useState<Table | null>(null)

  const handleQuickRecordSelect = (projectId: string, tableId: string) => {
    const proj = projects.find(p => p.id === projectId)
    const tbl = proj?.tables.find(t => t.id === tableId)
    if (proj && tbl) {
      setEditRowProject(proj)
      setEditRowTable(tbl)
      setEditRowOpen(true)
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 mb-3 text-muted-foreground hover:text-foreground"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: project.color + "20" }}
            >
              {project.emoji}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={() => setNewTableOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva Tabla
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCsvDialogOpen(true)}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                  Importar / Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditProjectOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Editar Proyecto
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    deleteProject(project.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Eliminar Proyecto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tutorial welcome banner */}
      {project.id === "proj-tutorial" && !tutorialDismissed && (
        <div className="mb-6 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                Bienvenido al Tutorial
              </h3>
              <div className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
                <p>
                  Este proyecto tiene <strong>6 tablas conectadas</strong> que demuestran cómo funcionan las <strong>referencias</strong>, las <strong>fórmulas</strong> y todos los <strong>tipos de columna</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="rounded-md bg-white/60 dark:bg-white/10 p-2.5">
                    <p className="font-semibold text-xs mb-1">🏷️ Categorías</p>
                    <p className="text-[11px]">Tabla simple. Origen de la referencia en Productos.</p>
                  </div>
                  <div className="rounded-md bg-white/60 dark:bg-white/10 p-2.5">
                    <p className="font-semibold text-xs mb-1">📦 Productos</p>
                    <p className="text-[11px]">Ref a Categorías + 2 fórmulas + Rating + Checkbox.</p>
                  </div>
                  <div className="rounded-md bg-white/60 dark:bg-white/10 p-2.5">
                    <p className="font-semibold text-xs mb-1">👥 Clientes</p>
                    <p className="text-[11px]">Email, Teléfono, URL + fórmula de descuento.</p>
                  </div>
                  <div className="rounded-md bg-white/60 dark:bg-white/10 p-2.5">
                    <p className="font-semibold text-xs mb-1">🛒 Ventas</p>
                    <p className="text-[11px]">Doble ref (Producto + Cliente) + fórmula con descuento.</p>
                  </div>
                  <div className="rounded-md bg-white/60 dark:bg-white/10 p-2.5">
                    <p className="font-semibold text-xs mb-1">✅ Tareas</p>
                    <p className="text-[11px]">Multiselect + fórmulas con checkbox y prioridad.</p>
                  </div>
                  <div className="rounded-md bg-white/60 dark:bg-white/10 p-2.5">
                    <p className="font-semibold text-xs mb-1">💰 Gastos</p>
                    <p className="text-[11px]">Fórmulas condicionales: signo y monto neto.</p>
                  </div>
                </div>
                <p className="text-xs mt-2">
                  Cada tabla tiene un <strong>banner azul</strong> con explicaciones y pruebas que puedes hacer. La conexión clave: al registrar una Venta, el Stock se <strong>descuenta</strong> solo; al eliminarla, se <strong>restaura</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setTutorialDismissed(true)}
              className="shrink-0 p-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              <XIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>
        </div>
      )}

      {/* Color bar */}
      <div
        className="h-1 rounded-full mb-6"
        style={{ backgroundColor: project.color }}
      />

      {/* Tables grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tablas</h2>
        <span className="text-sm text-muted-foreground">
          {project.tables.length} {project.tables.length === 1 ? "tabla" : "tablas"}
        </span>
      </div>

      {project.tables.length === 0 ? (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Table2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium mb-1">Sin tablas aún</p>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Crea tu primera tabla para empezar a organizar datos
            </p>
            <Button
              onClick={() => setNewTableOpen(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Nueva Tabla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {project.tables.map((table) => (
            <Card
              key={table.id}
              className="group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all duration-200 relative"
              onClick={() => selectTable(project.id, table.id)}
            >
              <CardHeader className="pb-2 pt-4 px-4 md:px-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{table.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{table.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {table.columns.length} columnas
                        {project.id === "proj-tutorial" && table.id === "tab-categorias" && " · tabla de apoyo (origen de ref)"}
                        {project.id === "proj-tutorial" && table.id === "tab-productos" && " · ref + 2 fórmulas + rating"}
                        {project.id === "proj-tutorial" && table.id === "tab-clientes" && " · email + teléfono + fórmula"}
                        {project.id === "proj-tutorial" && table.id === "tab-ventas" && " · doble ref + fórmula con desc"}
                        {project.id === "proj-tutorial" && table.id === "tab-tareas" && " · multiselect + fórmulas"}
                        {project.id === "proj-tutorial" && table.id === "tab-gastos" && " · fórmulas condicionales"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditTableInfo({ tableId: table.id })
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Editar Tabla
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTableInfo({
                              tableId: table.id,
                              tableName: table.name,
                              tableEmoji: table.emoji,
                            })
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Eliminar Tabla
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 md:px-5 pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {table.rows.length} {table.rows.length === 1 ? "registro" : "registros"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(table.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add table card */}
          <Card
            className="group cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
            onClick={() => setNewTableOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 min-h-[120px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-400 transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Nueva Tabla
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <EditProjectDialog
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        project={project}
      />
      <NewTableDialog
        open={newTableOpen}
        onOpenChange={setNewTableOpen}
        projectId={project.id}
      />
      <QuickRecordModal open={quickRecordOpen} onOpenChange={setQuickRecordOpen} projectId={project.id} onSelectTable={handleQuickRecordSelect} />

      {/* Edit Row Dialog — opened by Quick Record */}
      {editRowProject && editRowTable && (
        <EditRowDialog
          open={editRowOpen}
          onOpenChange={setEditRowOpen}
          project={editRowProject}
          table={editRowTable}
          row={null}
        />
      )}

      {/* CSV Import/Export Dialog */}
      <CsvDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        mode="project"
        projectId={project.id}
      />

      {/* Edit Table Dialog */}
      <EditTableDialog
        open={editTableInfo !== null}
        onOpenChange={(open) => !open && setEditTableInfo(null)}
        projectId={project.id}
        tableId={editTableInfo?.tableId ?? ""}
      />

      {/* Delete Table Confirmation */}
      <DeleteTableDialog
        open={deleteTableInfo !== null}
        onOpenChange={(open) => !open && setDeleteTableInfo(null)}
        projectId={project.id}
        tableId={deleteTableInfo?.tableId ?? ""}
        tableName={deleteTableInfo?.tableName ?? ""}
        tableEmoji={deleteTableInfo?.tableEmoji ?? ""}
      />
    </div>
  )
}
