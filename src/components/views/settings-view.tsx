"use client"

import React from "react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

export function SettingsView() {
  const { theme, setTheme, projects } = useAppStore()

  const handleExport = () => {
    const data = JSON.stringify({ projects, version: "1.0", exportDate: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const fileName = `dataflow-export-${new Date().toISOString().slice(0,10)}.json`

    // Try <a download> approach
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.style.position = "fixed"
    a.style.left = "-9999px"
    a.style.top = "-9999px"
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 3000)

    // Fallback for Android WebView
    if (navigator.share && /android/i.test(navigator.userAgent)) {
      setTimeout(() => {
        const file = new File([blob], fileName, { type: "application/json" })
        navigator.share({ files: [file], title: "DataFlow Export" }).catch(() => {})
      }, 500)
    }

    toast.success("Datos exportados correctamente")
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string)
          if (imported.projects && Array.isArray(imported.projects)) {
            // Validate structure
            const validProjects = imported.projects.every((p: any) => p.id && p.name && Array.isArray(p.tables))
            if (!validProjects) {
              toast.error("Formato de archivo no válido: estructura de proyectos incorrecta")
              return
            }
            // Confirm before replacing data
            if (window.confirm(`Se importarán ${imported.projects.length} proyecto(s). Esto reemplazará todos los datos actuales. ¿Deseas continuar?`)) {
              useAppStore.setState({ projects: imported.projects, selectedProjectId: null, selectedTableId: null, currentView: "dashboard" })
              toast.success(`${imported.projects.length} proyecto(s) importados correctamente`)
            }
          } else {
            toast.error("Formato de archivo no válido: no se encontró la lista de proyectos")
          }
        } catch {
          toast.error("Error al leer el archivo JSON")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleDeleteAll = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.")) {
      useAppStore.setState({ projects: [], selectedProjectId: null, selectedTableId: null, currentView: "dashboard" })
      toast.success("Todos los datos han sido eliminados")
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personaliza tu experiencia en DataFlow
        </p>
      </div>

      <div className="space-y-4">
        {/* Theme */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tema</CardTitle>
            <CardDescription>Elige la apariencia de la aplicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1.5 h-auto py-3",
                  theme === "light" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Claro</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1.5 h-auto py-3",
                  theme === "dark" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Oscuro</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1.5 h-auto py-3"
                onClick={() => {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                  setTheme(prefersDark ? "dark" : "light")
                }}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">Sistema</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos</CardTitle>
            <CardDescription>Exporta o importa tus datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 flex-1" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>
              <Button variant="outline" className="gap-2 flex-1" onClick={handleImport}>
                <Upload className="h-4 w-4" />
                Importar JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Exporta todos tus proyectos y datos como archivo JSON. Puedes importarlos después para restaurar.
            </p>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Zona de Peligro
            </CardTitle>
            <CardDescription>
              Estas acciones no se pueden deshacer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Eliminar todos los datos</p>
                <p className="text-xs text-muted-foreground">
                  Borrará todos los proyectos, tablas y registros
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={handleDeleteAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
