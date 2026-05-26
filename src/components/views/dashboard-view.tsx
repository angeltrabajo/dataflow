"use client"

import React, { useState } from "react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/helpers"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  ArrowRight,
  Zap,
  FolderPlus,
} from "lucide-react"
import { NewProjectDialog } from "@/components/new-project-dialog"
import { QuickRecordModal } from "@/components/quick-record-modal"

export function DashboardView() {
  const { projects, selectProject } = useAppStore()
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [quickRecordOpen, setQuickRecordOpen] = useState(false)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
            DataFlow
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
          Panel Principal
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus proyectos, tablas y datos desde un solo lugar.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-5">
          <Button
            onClick={() => setQuickRecordOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Zap className="h-4 w-4" />
            Registro Rápido
          </Button>
          <Button
            variant="outline"
            onClick={() => setNewProjectOpen(true)}
            className="gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Projects section */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proyectos</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {projects.map((project) => {
          return (
            <Card
              key={project.id}
              className="group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              onClick={() => selectProject(project.id)}
            >
              {/* Color bar */}
              <div
                className="h-1.5"
                style={{ backgroundColor: project.color }}
              />
              <CardHeader className="pb-4 pt-4 px-4 md:px-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{project.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity mt-1" />
                </div>
              </CardHeader>
            </Card>
          )
        })}

        {/* Add project card */}
        <Card
          className="group cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
          onClick={() => setNewProjectOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 min-h-[160px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-400 transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Nuevo Proyecto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
      <QuickRecordModal open={quickRecordOpen} onOpenChange={setQuickRecordOpen} />
    </div>
  )
}
