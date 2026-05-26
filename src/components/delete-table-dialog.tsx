"use client"

import React from "react"
import { useAppStore } from "@/lib/store"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface DeleteTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  tableId: string
  tableName: string
  tableEmoji: string
  /** Optional callback after table is deleted */
  onDeleted?: () => void
}

export function DeleteTableDialog({
  open,
  onOpenChange,
  projectId,
  tableId,
  tableName,
  tableEmoji,
  onDeleted,
}: DeleteTableDialogProps) {
  const deleteTable = useAppStore((s) => s.deleteTable)

  const handleDelete = () => {
    deleteTable(projectId, tableId)
    toast.success(`Tabla "${tableName}" eliminada`)
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Eliminar tabla {tableEmoji} {tableName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente todos los registros,
            columnas, fórmulas y configuraciones de esta tabla.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar Tabla
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
