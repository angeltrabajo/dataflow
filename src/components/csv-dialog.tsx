"use client"

import React, { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import {
  tableToCsv,
  csvToTable,
  projectToCsvFiles,
  downloadFile,
  type ImportedTableData,
  type TableDataForRef,
} from "@/lib/csv-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  FileArchive,
} from "lucide-react"
import JSZip from "jszip"

interface CsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "table" | "project"
  projectId: string
  tableId?: string
}

export function CsvDialog({ open, onOpenChange, mode, projectId, tableId }: CsvDialogProps) {
  const { projects } = useAppStore()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    type: "export" | "import"
    success: boolean
    message: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const project = projects.find((p) => p.id === projectId)
  const table = project?.tables.find((t) => t.id === tableId)

  // ─── Export ──────────────────────────────────────────────────

  const handleExportTable = () => {
    if (!table || !project) return
    try {
      const allTables: TableDataForRef[] = project.tables.map(t => ({ id: t.id, name: t.name, columns: t.columns, rows: t.rows }))
      const csv = tableToCsv({
        name: table.name,
        emoji: table.emoji,
        columns: table.columns,
        rows: table.rows,
        allTables,
      })
      const fileName = `${table.name.replace(/\s+/g, "_")}.csv`
      downloadFile(csv, fileName)
      setResult({ type: "export", success: true, message: `"${table.name}" exportada correctamente` })
    } catch (err: any) {
      setResult({ type: "export", success: false, message: err.message || "Error al exportar" })
    }
  }

  const handleExportProject = async () => {
    if (!project) return
    try {
      if (project.tables.length === 1) {
        const t = project.tables[0]
        const allTables: TableDataForRef[] = project.tables.map(t => ({ id: t.id, name: t.name, columns: t.columns, rows: t.rows }))
        const csv = tableToCsv({ name: t.name, emoji: t.emoji, columns: t.columns, rows: t.rows, allTables })
        downloadFile(csv, `${t.name.replace(/\s+/g, "_")}.csv`)
        setResult({ type: "export", success: true, message: `"${project.name}" exportado (1 tabla)` })
      } else {
        const zip = new JSZip()
        const files = projectToCsvFiles({
          name: project.name, emoji: project.emoji,
          description: project.description, color: project.color,
          tables: project.tables,
        })
        files.forEach((content, fileName) => zip.file(fileName, content))
        const blob = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${project.name.replace(/\s+/g, "_")}.zip`
        a.style.position = "fixed"
        a.style.left = "-9999px"
        a.style.top = "-9999px"
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          if (a.parentNode) document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 3000)
        // Fallback: try Web Share API on Android WebView
        if (navigator.share && /android/i.test(navigator.userAgent)) {
          const file = new File([blob], `${project.name.replace(/\s+/g, "_")}.zip`, { type: "application/zip" })
          navigator.share({ files: [file], title: `${project.name} Export` }).catch(() => {})
        }
        setResult({ type: "export", success: true, message: `"${project.name}" exportado como ZIP (${project.tables.length} tablas)` })
      }
    } catch (err: any) {
      setResult({ type: "export", success: false, message: err.message || "Error al exportar" })
    }
  }

  // ─── Import ──────────────────────────────────────────────────

  const handleImportFile = async (file: File) => {
    setImporting(true)
    setResult(null)
    try {
      const fileName = file.name.toLowerCase()
      if (fileName.endsWith(".zip")) {
        await handleImportZip(file)
      } else if (fileName.endsWith(".csv")) {
        await handleImportCsv(file)
      } else {
        throw new Error("Formato no soportado. Usa archivos .csv o .zip")
      }
    } catch (err: any) {
      setResult({ type: "import", success: false, message: err.message || "Error al importar" })
    } finally {
      setImporting(false)
    }
  }

  const handleImportCsv = async (file: File) => {
    const text = await file.text()
    const tableName = file.name.replace(/\.csv$/i, "")
    const allTables: TableDataForRef[] | undefined = project?.tables.map(t => ({ id: t.id, name: t.name, columns: t.columns, rows: t.rows }))
    const imported = csvToTable(text, tableName, allTables)
    if (!project) throw new Error("Proyecto no encontrado")
    addTableToProject(project.id, imported)
    setResult({ type: "import", success: true, message: `"${imported.name}" importada — ${imported.columns.length} columnas, ${imported.rows.length} registros` })
  }

  const handleImportZip = async (file: File) => {
    if (!project) throw new Error("Proyecto no encontrado")
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    const csvFiles: string[] = []
    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.toLowerCase().endsWith(".csv") && !zipEntry.dir) csvFiles.push(relativePath)
    })
    if (csvFiles.length === 0) throw new Error("El ZIP no contiene archivos CSV")
    let importedCount = 0
    for (const csvPath of csvFiles) {
      const content = await zip.file(csvPath)!.async("string")
      const tableName = csvPath.split("/").pop()!.replace(/\.csv$/i, "")
      const allTables: TableDataForRef[] = project.tables.map(t => ({ id: t.id, name: t.name, columns: t.columns, rows: t.rows }))
      const imported = csvToTable(content, tableName, allTables)
      addTableToProject(project.id, imported)
      importedCount++
    }
    setResult({ type: "import", success: true, message: `${importedCount} tabla(s) importada(s) desde ZIP` })
  }

  const addTableToProject = (projId: string, imported: ImportedTableData): string => {
    const tableId = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const newTable = {
      id: tableId,
      name: imported.name,
      emoji: "📋",
      columns: imported.columns.map((col) => ({
        ...col,
        id: col.id || `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      })),
      rows: imported.rows.map((row) => ({
        ...row,
        id: row.id || `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    useAppStore.setState((state) => ({
      projects: state.projects.map((p) =>
        p.id === projId
          ? { ...p, tables: [...p.tables, newTable], updatedAt: new Date().toISOString() }
          : p
      ),
    }))
    return tableId
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImportFile(file)
      e.target.value = ""
    }
  }

  const isZip = mode === "project" && (project?.tables.length ?? 0) > 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setResult(null); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Importar / Exportar CSV
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "table"
              ? `Tabla: ${table?.name || ""}`
              : `Proyecto: ${project?.name || ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-3">
          {/* ── Export Section ── */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-sm font-medium">Exportar</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {mode === "table" ? "CSV" : isZip ? "ZIP" : "CSV"}
              </span>
            </div>
            <div className="px-3.5 py-3 space-y-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mode === "table"
                  ? "Descarga esta tabla como CSV. La configuración de columnas (tipos, fórmulas, referencias) se guarda en la primera celda."
                  : isZip
                    ? `Se descargará un ZIP con ${project?.tables.length} archivos CSV, uno por tabla.`
                    : "Se descargará un archivo CSV con los datos de la tabla."}
              </p>
              <Button
                onClick={mode === "table" ? handleExportTable : handleExportProject}
                size="sm"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              >
                <Download className="h-3 w-3" />
                {mode === "table" ? "Descargar CSV" : isZip ? "Descargar ZIP" : "Descargar CSV"}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-[10px] text-muted-foreground">o</span>
            </div>
          </div>

          {/* ── Import Section ── */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-sm font-medium">Importar</span>
              </div>
              <span className="text-[10px] text-muted-foreground">CSV / ZIP</span>
            </div>
            <div className="px-3.5 py-3 space-y-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sube un archivo <strong>.csv</strong> para crear una tabla nueva
                {mode === "project" && <> o un <strong>.zip</strong> con múltiples CSV</>}.
                Los archivos exportados desde DataFlow restauran tipos, fórmulas y referencias.
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                size="sm"
                variant="outline"
                className="w-full gap-2 h-8 text-xs"
              >
                <Upload className="h-3 w-3" />
                {importing ? "Importando..." : "Seleccionar archivo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.zip"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* ── Result message ── */}
          {result && (
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                result.success
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              }`}
            >
              {result.success ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              {result.message}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
