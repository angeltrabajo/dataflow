"use client"

import React, { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface EditTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  tableId: string
}

export function EditTableDialog({ open, onOpenChange, projectId, tableId }: EditTableDialogProps) {
  const { projects, updateTable } = useAppStore()
  const project = projects.find(p => p.id === projectId)
  const table = project?.tables.find(t => t.id === tableId)

  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("")

  useEffect(() => {
    if (table) {
      setName(table.name)
      setEmoji(table.emoji)
    }
  }, [table, open])

  if (!table) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    updateTable(projectId, tableId, { name: name.trim(), emoji })
    toast.success(`Tabla "${name}" actualizada`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Tabla</DialogTitle>
            <DialogDescription>Modifica el nombre y el ícono de la tabla</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ícono (emoji)</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="📦"
                className="h-12 text-2xl text-center"
                maxLength={4}
              />
              <p className="text-[10px] text-muted-foreground">
                Pega un emoji como ícono de la tabla
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-name">Nombre</Label>
              <Input
                id="table-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la tabla"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
