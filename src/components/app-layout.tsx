"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Settings,
  Plus,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  Database,
  X,
  MoreHorizontal,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
} from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { NewProjectDialog } from "@/components/new-project-dialog"
import { NewTableDialog } from "@/components/new-table-dialog"
import { DeleteTableDialog } from "@/components/delete-table-dialog"
import { EditTableDialog } from "@/components/edit-table-dialog"
import { DashboardView } from "@/components/views/dashboard-view"
import { ProjectDetailView } from "@/components/views/project-detail-view"
import { TableView } from "@/components/views/table-view"
import { EditorView } from "@/components/views/editor-view"
import { SettingsView } from "@/components/views/settings-view"

export function AppLayout() {
  const {
    projects,
    currentView,
    selectedProjectId,
    selectedTableId,
    setView,
    selectProject,
    selectTable,
    theme,
    setTheme,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useAppStore()

  // Keyboard shortcuts for undo/redo
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault()
      redo()
    }
  }, [undo, redo])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    projects.forEach((p) => { init[p.id] = true })
    return init
  })
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newTableProjectId, setNewTableProjectId] = useState<string | null>(null)
  const [deleteTableInfo, setDeleteTableInfo] = useState<{ projectId: string; tableId: string; tableName: string; tableEmoji: string } | null>(null)
  const [editTableInfo, setEditTableInfo] = useState<{ projectId: string; tableId: string } | null>(null)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
            <Database className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">DataFlow</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Dashboard nav */}
        <div className="px-2 pt-3">
          <Button
            variant={currentView === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => {
              setView("dashboard")
              setSidebarOpen(false)
            }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Panel Principal
          </Button>
        </div>

        <Separator className="my-2" />

        {/* Projects tree */}
        <ScrollArea className="flex-1 px-2">
          <div className="py-1">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Proyectos
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setNewProjectOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {projects.map((project) => {
              const isExpanded = expandedProjects[project.id] !== false
              const isSelected = selectedProjectId === project.id

              return (
                <div key={project.id} className="mb-0.5">
                  <div
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer",
                      isSelected && currentView === "project" && "bg-accent font-medium"
                    )}
                    onClick={() => {
                      selectProject(project.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <button
                      className="flex items-center justify-center p-0 -m-0.5 hover:bg-accent/50 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProject(project.id)
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform text-muted-foreground",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>
                    <span className="shrink-0">{project.emoji}</span>
                    <span className="truncate">{project.name}</span>
                    <span
                      className="ml-auto h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                  </div>

                  {isExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {project.tables.map((table) => (
                        <div
                          key={table.id}
                          className={cn(
                            "group/table flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                            selectedTableId === table.id && (currentView === "table" || currentView === "editor") && "bg-accent font-medium"
                          )}
                        >
                          <button
                            className="flex flex-1 items-center gap-2 min-w-0 text-left"
                            onClick={() => {
                              selectTable(project.id, table.id)
                              setSidebarOpen(false)
                            }}
                          >
                            <span className="shrink-0 text-xs">{table.emoji}</span>
                            <span className="truncate text-muted-foreground">{table.name}</span>
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="shrink-0 flex items-center justify-center h-5 w-5 rounded opacity-50 hover:opacity-100 hover:bg-accent/80 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditTableInfo({
                                    projectId: project.id,
                                    tableId: table.id,
                                  })
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Editar Tabla
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const tableIdx = project.tables.findIndex(t => t.id === table.id)
                                  if (tableIdx > 0) {
                                    const newTables = [...project.tables]
                                    const [moved] = newTables.splice(tableIdx, 1)
                                    newTables.splice(tableIdx - 1, 0, moved)
                                    useAppStore.getState().updateProject(project.id, { tables: newTables })
                                  }
                                }}
                                disabled={project.tables.indexOf(table) === 0}
                              >
                                <ArrowUp className="h-3.5 w-3.5 mr-2" />
                                Mover Arriba
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const tableIdx = project.tables.findIndex(t => t.id === table.id)
                                  if (tableIdx < project.tables.length - 1) {
                                    const newTables = [...project.tables]
                                    const [moved] = newTables.splice(tableIdx, 1)
                                    newTables.splice(tableIdx + 1, 0, moved)
                                    useAppStore.getState().updateProject(project.id, { tables: newTables })
                                  }
                                }}
                                disabled={project.tables.indexOf(table) === project.tables.length - 1}
                              >
                                <ArrowDown className="h-3.5 w-3.5 mr-2" />
                                Mover Abajo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setDeleteTableInfo({
                                    projectId: project.id,
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
                        </div>
                      ))}
                      <button
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() => setNewTableProjectId(project.id)}
                      >
                        <Plus className="h-3 w-3" />
                        Nueva Tabla
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t border-border p-2 space-y-1">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canUndo}
                  onClick={undo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Deshacer (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canRedo}
                  onClick={redo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Rehacer (Ctrl+Y)</TooltipContent>
            </Tooltip>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-sm"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Claro" : "Oscuro"}
            </Button>
          </div>
          <Button
            variant={currentView === "settings" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => {
              setView("settings")
              setSidebarOpen(false)
            }}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="flex h-12 items-center gap-2 border-b border-border px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">
            {currentView === "dashboard" && "Panel Principal"}
            {currentView === "project" && selectedProject?.name}
            {currentView === "table" && "Tabla"}
            {currentView === "editor" && "Estructura"}
            {currentView === "settings" && "Configuración"}
          </span>
        </div>

        {/* Content area */}
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "project" && <ProjectDetailView />}
        {currentView === "table" && <TableView key={selectedTableId} />}
        {currentView === "editor" && <EditorView />}
        {currentView === "settings" && <SettingsView />}
      </main>

      {/* Dialogs */}
      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
      <NewTableDialog
        open={newTableProjectId !== null}
        onOpenChange={(open) => !open && setNewTableProjectId(null)}
        projectId={newTableProjectId}
      />
      <EditTableDialog
        open={editTableInfo !== null}
        onOpenChange={(open) => !open && setEditTableInfo(null)}
        projectId={editTableInfo?.projectId ?? ""}
        tableId={editTableInfo?.tableId ?? ""}
      />
      <DeleteTableDialog
        open={deleteTableInfo !== null}
        onOpenChange={(open) => !open && setDeleteTableInfo(null)}
        projectId={deleteTableInfo?.projectId ?? ""}
        tableId={deleteTableInfo?.tableId ?? ""}
        tableName={deleteTableInfo?.tableName ?? ""}
        tableEmoji={deleteTableInfo?.tableEmoji ?? ""}
      />
    </div>
  )
}
