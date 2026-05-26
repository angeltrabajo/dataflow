"use client"

import React, { useState } from "react"
import { useAppStore } from "@/lib/store"
import { PRESET_COLORS } from "@/shared/utils/format"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const { addProject } = useAppStore()
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("📁")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    addProject({
      name: name.trim(),
      emoji: emoji || "📁",
      description: description.trim(),
      color,
    })

    toast.success("Proyecto creado")
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setEmoji("📁")
    setDescription("")
    setColor(PRESET_COLORS[0])
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto</DialogTitle>
            <DialogDescription>
              Crea un nuevo proyecto para organizar tus datos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Emoji + Name row */}
            <div className="flex gap-3">
              <div className="space-y-2">
                <Label htmlFor="project-emoji">Icono</Label>
                <Input
                  id="project-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-16 text-center text-lg p-1"
                  maxLength={2}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="project-name">Nombre *</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi Proyecto"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="project-desc">Descripción</Label>
              <Input
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve del proyecto"
              />
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      color === c
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
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
              Crear Proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
