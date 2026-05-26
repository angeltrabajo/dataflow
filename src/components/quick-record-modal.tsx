"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Zap } from "lucide-react"

interface QuickRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selected project ID — skips project selection step */
  projectId?: string | null
  /** Called when user selects a table — parent should open EditRowDialog */
  onSelectTable?: (projectId: string, tableId: string) => void
}

export function QuickRecordModal({ open, onOpenChange, projectId, onSelectTable }: QuickRecordModalProps) {
  const { projects, selectTable } = useAppStore()
  const [step, setStep] = useState<1 | 2>(projectId ? 2 : 1)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId ?? null)

  // When the modal opens, initialize step based on projectId
  useEffect(() => {
    if (open) {
      if (projectId) {
        setStep(2)
        setSelectedProjectId(projectId)
      } else {
        setStep(1)
        setSelectedProjectId(null)
      }
    }
  }, [open, projectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  )

  const reset = () => {
    if (projectId) {
      setStep(2)
      setSelectedProjectId(projectId)
    } else {
      setStep(1)
      setSelectedProjectId(null)
    }
  }

  const handleClose = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id)
    setStep(2)
  }

  const handleSelectTable = (tableId: string) => {
    if (!selectedProjectId) return

    // Close this modal first
    onOpenChange(false)

    // Notify parent to open EditRowDialog
    if (onSelectTable) {
      onSelectTable(selectedProjectId, tableId)
    } else {
      // Fallback: navigate to the table view (legacy behavior)
      selectTable(selectedProjectId, tableId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            Registro Rápido
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Selecciona el proyecto donde agregar el registro"}
            {step === 2 && `Selecciona la tabla en ${selectedProject?.name || ""}`}
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
            {!projectId && (
              <Button variant="ghost" size="sm" className="gap-1 mb-2 text-muted-foreground" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3.5 w-3.5" /> Volver
              </Button>
            )}
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
                        {table.rows.length > 0 && ` · ${table.rows.length} registros`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
