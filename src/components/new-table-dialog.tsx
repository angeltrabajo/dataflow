"use client"

import React, { useState } from "react"
import { useAppStore } from "@/lib/store"
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
import { toast } from "sonner"

interface NewTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string | null
}

export function NewTableDialog({ open, onOpenChange, projectId }: NewTableDialogProps) {
  const { addTable, selectTable } = useAppStore()
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("📋")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !projectId) return

    const tableData = {
      name: name.trim(),
      emoji: emoji || "📋",
    }

    addTable(projectId, tableData)

    // Find the newly added table to navigate to it
    const projects = useAppStore.getState().projects
    const project = projects.find((p) => p.id === projectId)
    const newTable = project?.tables[project.tables.length - 1]
    if (newTable) {
      selectTable(projectId, newTable.id)
    }

    toast.success("Tabla creada")
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setEmoji("📋")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Tabla</DialogTitle>
            <DialogDescription>
              Agrega una nueva tabla al proyecto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-3">
              <div className="space-y-2">
                <Label htmlFor="table-emoji">Icono</Label>
                <Input
                  id="table-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-16 text-center text-lg p-1"
                  maxLength={2}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="table-name">Nombre *</Label>
                <Input
                  id="table-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi Tabla"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!name.trim()}
            >
              Crear Tabla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
