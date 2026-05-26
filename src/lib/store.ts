"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Re-export types from shared/types so existing imports still work
export type {
  ColumnType,
  ColumnDisplayMode,
  ConditionalFormatRule,
  Column,
  Row,
  RepeatableSection,
  Table,
  Project,
} from "@/shared/types/Project"

export type { ViewType, ThemeMode } from "@/shared/types/ViewType"

// Import types for internal use
import type {
  Column,
  Row,
  Table,
  Project,
} from "@/shared/types/Project"

import type { ViewType, ThemeMode } from "@/shared/types/ViewType"

// Import feature handlers from domain barrels
import {
  CreateProjectHandler,
  UpdateProjectHandler,
  DeleteProjectHandler,
  ListProjectsHandler,
} from "@/features/projects"

import {
  CreateTableHandler,
  UpdateTableHandler,
  DeleteTableHandler,
  ReorderTablesHandler,
} from "@/features/tables"

import {
  CreateColumnHandler,
  UpdateColumnHandler,
  DeleteColumnHandler,
  ReorderColumnsHandler,
} from "@/features/columns"

import {
  CreateRowHandler,
  UpdateRowHandler,
  DeleteRowHandler,
  BatchAddRowsHandler,
} from "@/features/rows"

import { UndoActionHandler, RedoActionHandler } from "@/features/undo"

import { NavigateViewHandler } from "@/features/navigation"
import { SetThemeHandler } from "@/features/theme"

export interface AppState {
  projects: Project[]
  currentView: ViewType
  selectedProjectId: string | null
  selectedTableId: string | null
  theme: ThemeMode

  // Navigation
  setView: (view: ViewType) => void
  selectProject: (id: string) => void
  selectTable: (projectId: string, tableId: string, view?: ViewType) => void
  goBack: () => void

  // Theme
  setTheme: (theme: ThemeMode) => void

  // Project CRUD
  addProject: (project: Omit<Project, "id" | "tables" | "createdAt" | "updatedAt">) => void
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Table CRUD
  addTable: (projectId: string, table: Omit<Table, "id" | "columns" | "rows" | "createdAt" | "updatedAt">) => void
  updateTable: (projectId: string, tableId: string, data: Partial<Table>) => void
  deleteTable: (projectId: string, tableId: string) => void
  reorderTables: (projectId: string, tableIds: string[]) => void

  // Column CRUD
  addColumn: (projectId: string, tableId: string, column: Omit<Column, "id">) => void
  updateColumn: (projectId: string, tableId: string, columnId: string, data: Partial<Column>) => void
  deleteColumn: (projectId: string, tableId: string, columnId: string) => void
  reorderColumns: (projectId: string, tableId: string, columnIds: string[]) => void

  // Row CRUD
  addRow: (projectId: string, tableId: string, row: Omit<Row, "id">) => string  // Returns new row ID
  addRowsBatch: (projectId: string, tableId: string, rows: Omit<Row, "id">[], repeatGroupId: string) => string[]  // Returns new row IDs
  updateRow: (projectId: string, tableId: string, rowId: string, data: Partial<Row>) => void
  deleteRow: (projectId: string, tableId: string, rowId: string) => void
  deleteRowsBatch: (projectId: string, tableId: string, rowIds: string[]) => void

  // Undo/Redo
  undoStack: string[]
  redoStack: string[]
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  // Helpers
  getProject: (id: string) => Project | undefined
  getTable: (projectId: string, tableId: string) => Table | undefined
}

// Helper: wrap a mutation to capture an undo snapshot before applying it
function withUndo(
  state: AppState,
  newProjects: Project[]
): { projects: Project[]; undoStack: string[]; redoStack: string[]; canUndo: boolean; canRedo: boolean } {
  const snapshot = JSON.stringify(state.projects)
  const newUndoStack = [snapshot, ...state.undoStack].slice(0, 50)
  return {
    projects: newProjects,
    undoStack: newUndoStack,
    redoStack: [],
    canUndo: true,
    canRedo: false,
  }
}

// Seed data — Tutorial project: comprehensive examples of all column types, references & formulas
const seedProjects: Project[] = [
  {
    id: "proj-tutorial",
    name: "Tutorial",
    emoji: "📚",
    description: "Aprende referencias, fórmulas y todos los tipos de columna con ejemplos prácticos",
    color: "#6366F1",
    createdAt: "2026-04-24T10:00:00.000Z",
    updatedAt: "2026-04-24T10:00:00.000Z",
    tables: [
      // ══════════════════════════════════════════════════════════
      // TABLA 1: CATEGORÍAS
      // ══════════════════════════════════════════════════════════
      {
        id: "tab-categorias",
        name: "Categorías",
        emoji: "🏷️",
        columns: [
          { id: "col-cnombre", name: "Categoría", type: "text", required: true },
          { id: "col-ctipo", name: "Tipo", type: "select", required: false,
            options: ["Producto", "Servicio"], defaultValue: "Producto" },
          { id: "col-ccolor", name: "Color", type: "select", required: false,
            options: ["Rojo", "Azul", "Verde", "Amarillo", "Negro"] },
        ],
        rows: [
          { id: "row-c1", "col-cnombre": "Papelería", "col-ctipo": "Producto", "col-ccolor": "Azul" },
          { id: "row-c2", "col-cnombre": "Electrónica", "col-ctipo": "Producto", "col-ccolor": "Negro" },
          { id: "row-c3", "col-cnombre": "Limpieza", "col-ctipo": "Producto", "col-ccolor": "Verde" },
          { id: "row-c4", "col-cnombre": "Servicios", "col-ctipo": "Servicio", "col-ccolor": "Amarillo" },
        ],
        createdAt: "2026-04-24T10:00:00.000Z",
        updatedAt: "2026-04-24T10:00:00.000Z",
      },

      // ══════════════════════════════════════════════════════════
      // TABLA 2: PRODUCTOS
      // ══════════════════════════════════════════════════════════
      {
        id: "tab-productos",
        name: "Productos",
        emoji: "📦",
        columns: [
          { id: "col-pnombre", name: "Producto", type: "text", required: true },
          {
            id: "col-pcat", name: "Categoría", type: "reference", required: false,
            refTableId: "tab-categorias",
            refDisplayColId: "col-cnombre",
            refAutoFill: [{ sourceColId: "col-ccolor", targetColId: "col-pcolor" }],
          },
          { id: "col-pcolor", name: "Color", type: "text", required: false },
          { id: "col-pprecio", name: "Precio", type: "currency", required: true },
          { id: "col-pstock", name: "Stock", type: "number", required: false, defaultValue: "0" },
          { id: "col-pestado", name: "Estado", type: "formula", required: false,
            formula: 'SI({col-pstock} = 0, "Agotado", SI({col-pstock} <= 5, "Poco stock", "Disponible"))' },
          { id: "col-pvalor", name: "Valor Inventario", type: "formula", required: false,
            formula: "{col-pstock} * {col-pprecio}" },
          { id: "col-pactivo", name: "Activo", type: "checkbox", required: false, defaultValue: "true" },
          { id: "col-prating", name: "Calificación", type: "rating", required: false, ratingMax: 5 },
        ],
        rows: [
          { id: "row-p1", "col-pnombre": "Lápiz", "col-pcat": "row-c1", "col-pcolor": "Azul", "col-pprecio": 15, "col-pstock": 95, "col-pactivo": true, "col-prating": 3 },
          { id: "row-p2", "col-pnombre": "Cuaderno", "col-pcat": "row-c1", "col-pcolor": "Azul", "col-pprecio": 45, "col-pstock": 48, "col-pactivo": true, "col-prating": 4 },
          { id: "row-p3", "col-pnombre": "Borrador", "col-pcat": "row-c1", "col-pcolor": "Azul", "col-pprecio": 10, "col-pstock": 3, "col-pactivo": true, "col-prating": 2 },
          { id: "row-p4", "col-pnombre": "Regla", "col-pcat": "row-c1", "col-pcolor": "Azul", "col-pprecio": 25, "col-pstock": 0, "col-pactivo": false, "col-prating": 3 },
          { id: "row-p5", "col-pnombre": "Marcadores", "col-pcat": "row-c1", "col-pcolor": "Azul", "col-pprecio": 35, "col-pstock": 17, "col-pactivo": true, "col-prating": 5 },
          { id: "row-p6", "col-pnombre": "Cable USB", "col-pcat": "row-c2", "col-pcolor": "Negro", "col-pprecio": 89, "col-pstock": 30, "col-pactivo": true, "col-prating": 4 },
          { id: "row-p7", "col-pnombre": "Jabón Líquido", "col-pcat": "row-c3", "col-pcolor": "Verde", "col-pprecio": 55, "col-pstock": 22, "col-pactivo": true, "col-prating": 4 },
        ],
        createdAt: "2026-04-24T10:00:00.000Z",
        updatedAt: "2026-04-24T10:00:00.000Z",
      },

      // ══════════════════════════════════════════════════════════
      // TABLA 3: CLIENTES
      // ══════════════════════════════════════════════════════════
      {
        id: "tab-clientes",
        name: "Clientes",
        emoji: "👥",
        columns: [
          { id: "col-clnombre", name: "Nombre", type: "text", required: true },
          { id: "col-clemail", name: "Email", type: "email", required: false },
          { id: "col-cltel", name: "Teléfono", type: "phone", required: false },
          { id: "col-cltipo", name: "Tipo", type: "select", required: true,
            options: ["Regular", "Premium", "Mayoreo"], defaultValue: "Regular" },
          { id: "col-clweb", name: "Sitio Web", type: "url", required: false },
          { id: "col-clactivo", name: "Activo", type: "checkbox", required: false, defaultValue: "true" },
          { id: "col-cldesc", name: "Descuento", type: "formula", required: false,
            formula: 'SI({col-cltipo} = "Premium", 10, SI({col-cltipo} = "Mayoreo", 15, 0))' },
        ],
        rows: [
          { id: "row-cl1", "col-clnombre": "Ana García", "col-clemail": "ana@correo.com", "col-cltel": "+52 55 1234 5678", "col-cltipo": "Premium", "col-clweb": "https://ana.mx", "col-clactivo": true },
          { id: "row-cl2", "col-clnombre": "Carlos López", "col-clemail": "carlos@correo.com", "col-cltel": "+52 33 9876 5432", "col-cltipo": "Regular", "col-clweb": "", "col-clactivo": true },
          { id: "row-cl3", "col-clnombre": "María Rodríguez", "col-clemail": "maria@correo.com", "col-cltel": "+52 81 5555 1234", "col-cltipo": "Mayoreo", "col-clweb": "https://maria.dev", "col-clactivo": true },
          { id: "row-cl4", "col-clnombre": "Roberto Martínez", "col-clemail": "roberto@correo.com", "col-cltel": "+52 55 1111 2222", "col-cltipo": "Regular", "col-clweb": "", "col-clactivo": false },
        ],
        createdAt: "2026-04-24T10:00:00.000Z",
        updatedAt: "2026-04-24T10:00:00.000Z",
      },

      // ══════════════════════════════════════════════════════════
      // TABLA 4: VENTAS
      // ══════════════════════════════════════════════════════════
      {
        id: "tab-ventas",
        name: "Ventas",
        emoji: "🛒",
        columns: [
          { id: "col-vfecha", name: "Fecha", type: "date", required: true },
          {
            id: "col-vprod", name: "Producto", type: "reference", required: true,
            refTableId: "tab-productos",
            refDisplayColId: "col-pnombre",
            refAutoFill: [{ sourceColId: "col-pprecio", targetColId: "col-vprecio" }],
            refOnAdd: [{ targetColId: "col-pstock", operation: "subtract", sourceColId: "col-vcant" }],
            refOnDelete: [{ targetColId: "col-pstock", operation: "add", sourceColId: "col-vcant" }],
          },
          {
            id: "col-vcli", name: "Cliente", type: "reference", required: false,
            refTableId: "tab-clientes",
            refDisplayColId: "col-clnombre",
            refAutoFill: [{ sourceColId: "col-cltipo", targetColId: "col-vclitipo" }],
          },
          { id: "col-vclitipo", name: "Tipo Cliente", type: "text", required: false },
          { id: "col-vcant", name: "Cantidad", type: "number", required: true, defaultValue: "1" },
          { id: "col-vprecio", name: "Precio Unitario", type: "currency", required: false },
          { id: "col-vdesc", name: "Descuento %", type: "percentage", required: false, defaultValue: "0" },
          { id: "col-vestado", name: "Estado", type: "select", required: true,
            options: ["Pendiente", "Completada", "Cancelada"], defaultValue: "Pendiente" },
          { id: "col-vtotal", name: "Total", type: "formula", required: false,
            formula: "{col-vcant} * {col-vprecio} * (1 - {col-vdesc} / 100)" },
          {
            id: "col-vefectivo", name: "Efectivo", type: "currency", required: false,
            complementaryOf: { totalColId: "col-vtotal", otherColId: "col-vtransfer" }
          },
          {
            id: "col-vtransfer", name: "Transferencia", type: "currency", required: false,
            complementaryOf: { totalColId: "col-vtotal", otherColId: "col-vefectivo" }
          },
          { id: "col-vnotas", name: "Notas", type: "text", required: false },
        ],
        repeatableSection: {
          name: "Productos Vendidos",
          columnIds: ["col-vprod", "col-vcant", "col-vprecio", "col-vdesc", "col-vtotal"],
          minItems: 1,
          maxItems: 20,
        },
        rows: [
          { id: "row-v1a", _repeatGroupId: "rg-v1", "col-vfecha": "2026-04-20", "col-vprod": "row-p1", "col-vcli": "row-cl1", "col-vclitipo": "Premium", "col-vcant": 5, "col-vprecio": 15, "col-vdesc": 10, "col-vestado": "Completada", "col-vefectivo": 40, "col-vtransfer": 27.5, "col-vnotas": "Cliente frecuente" },
          { id: "row-v1b", _repeatGroupId: "rg-v1", "col-vfecha": "2026-04-20", "col-vprod": "row-p2", "col-vcli": "row-cl1", "col-vclitipo": "Premium", "col-vcant": 2, "col-vprecio": 45, "col-vdesc": 10, "col-vestado": "Completada", "col-vefectivo": 0, "col-vtransfer": 81, "col-vnotas": "Cliente frecuente" },
          { id: "row-v2", "col-vfecha": "2026-04-21", "col-vprod": "row-p2", "col-vcli": "row-cl2", "col-vclitipo": "Regular", "col-vcant": 2, "col-vprecio": 45, "col-vdesc": 0, "col-vestado": "Completada", "col-vefectivo": 90, "col-vtransfer": 0, "col-vnotas": "" },
          { id: "row-v3", "col-vfecha": "2026-04-22", "col-vprod": "row-p5", "col-vcli": "row-cl3", "col-vclitipo": "Mayoreo", "col-vcant": 3, "col-vprecio": 35, "col-vdesc": 15, "col-vestado": "Completada", "col-vefectivo": 44.63, "col-vtransfer": 44.62, "col-vnotas": "Precio mayoreo" },
          { id: "row-v4a", _repeatGroupId: "rg-v4", "col-vfecha": "2026-04-23", "col-vprod": "row-p6", "col-vcli": "row-cl1", "col-vclitipo": "Premium", "col-vcant": 1, "col-vprecio": 89, "col-vdesc": 10, "col-vestado": "Pendiente", "col-vefectivo": 50, "col-vtransfer": 30.1, "col-vnotas": "Envío express" },
          { id: "row-v4b", _repeatGroupId: "rg-v4", "col-vfecha": "2026-04-23", "col-vprod": "row-p3", "col-vcli": "row-cl1", "col-vclitipo": "Premium", "col-vcant": 4, "col-vprecio": 10, "col-vdesc": 10, "col-vestado": "Pendiente", "col-vefectivo": 36, "col-vtransfer": 0, "col-vnotas": "Envío express" },
        ],
        createdAt: "2026-04-24T10:00:00.000Z",
        updatedAt: "2026-04-24T10:00:00.000Z",
      },

      // ══════════════════════════════════════════════════════════
      // TABLA 5: TAREAS
      // ══════════════════════════════════════════════════════════
      {
        id: "tab-tareas",
        name: "Tareas",
        emoji: "✅",
        columns: [
          { id: "col-tnombre", name: "Tarea", type: "text", required: true },
          { id: "col-tfecha", name: "Fecha Límite", type: "date", required: false },
          { id: "col-tprioridad", name: "Prioridad", type: "select", required: true,
            options: ["Alta", "Media", "Baja"], defaultValue: "Media" },
          { id: "col-tetiquetas", name: "Etiquetas", type: "multiselect", required: false,
            options: ["Urgente", "Interno", "Cliente", "Diseño", "Desarrollo", "Ventas"] },
          { id: "col-tcompletada", name: "Completada", type: "checkbox", required: false, defaultValue: "false" },
          { id: "col-tprogreso", name: "Progreso", type: "formula", required: false,
            formula: 'SI({col-tcompletada} = true, "100%", "0%")' },
          { id: "col-tsem", name: "Semáforo", type: "formula", required: false,
            formula: 'SI({col-tcompletada} = true, "Hecho", SI({col-tprioridad} = "Alta", "Urgente", SI({col-tprioridad} = "Media", "Normal", "Baja")))' },
        ],
        rows: [
          { id: "row-t1", "col-tnombre": "Diseñar logo cliente", "col-tfecha": "2026-04-28", "col-tprioridad": "Alta", "col-tetiquetas": "Cliente,Diseño", "col-tcompletada": false },
          { id: "row-t2", "col-tnombre": "Actualizar inventario", "col-tfecha": "2026-04-30", "col-tprioridad": "Media", "col-tetiquetas": "Interno", "col-tcompletada": true },
          { id: "row-t3", "col-tnombre": "Enviar cotización", "col-tfecha": "2026-04-25", "col-tprioridad": "Alta", "col-tetiquetas": "Cliente,Ventas", "col-tcompletada": false },
          { id: "row-t4", "col-tnombre": "Revisar servidor", "col-tfecha": "2026-05-05", "col-tprioridad": "Baja", "col-tetiquetas": "Interno,Desarrollo", "col-tcompletada": false },
          { id: "row-t5", "col-tnombre": "Preparar reporte mensual", "col-tfecha": "2026-04-30", "col-tprioridad": "Media", "col-tetiquetas": "Interno,Ventas", "col-tcompletada": true },
        ],
        createdAt: "2026-04-24T10:00:00.000Z",
        updatedAt: "2026-04-24T10:00:00.000Z",
      },

      // ══════════════════════════════════════════════════════════
      // TABLA 6: GASTOS
      // ══════════════════════════════════════════════════════════
      {
        id: "tab-gastos",
        name: "Gastos e Ingresos",
        emoji: "💰",
        columns: [
          { id: "col-gfecha", name: "Fecha", type: "date", required: true },
          { id: "col-gtipo", name: "Tipo", type: "select", required: true,
            options: ["Ingreso", "Egreso"], defaultValue: "Ingreso" },
          { id: "col-gcat", name: "Categoría", type: "select", required: false,
            options: ["Ventas", "Servicios", "Compras", "Salarios", "Otros"] },
          { id: "col-gdesc", name: "Descripción", type: "text", required: false },
          { id: "col-gmonto", name: "Monto", type: "currency", required: true },
          { id: "col-gdeducible", name: "Deducible", type: "checkbox", required: false, defaultValue: "false" },
          { id: "col-gsigno", name: "Signo", type: "formula", required: false,
            formula: 'SI({col-gtipo} = "Ingreso", "+", "-")' },
          { id: "col-gneto", name: "Monto Neto", type: "formula", required: false,
            formula: 'SI({col-gtipo} = "Ingreso", {col-gmonto}, {col-gmonto} * -1)' },
        ],
        rows: [
          { id: "row-g1", "col-gfecha": "2026-04-01", "col-gtipo": "Ingreso", "col-gcat": "Servicios", "col-gdesc": "Consultoría web", "col-gmonto": 15000, "col-gdeducible": false },
          { id: "row-g2", "col-gfecha": "2026-04-03", "col-gtipo": "Egreso", "col-gcat": "Compras", "col-gdesc": "Laptop nueva", "col-gmonto": 25000, "col-gdeducible": true },
          { id: "row-g3", "col-gfecha": "2026-04-10", "col-gtipo": "Ingreso", "col-gcat": "Ventas", "col-gdesc": "Venta de productos", "col-gmonto": 8500, "col-gdeducible": false },
          { id: "row-g4", "col-gfecha": "2026-04-15", "col-gtipo": "Egreso", "col-gcat": "Salarios", "col-gdesc": "Nómina quincenal", "col-gmonto": 12000, "col-gdeducible": true },
          { id: "row-g5", "col-gfecha": "2026-04-20", "col-gtipo": "Egreso", "col-gcat": "Otros", "col-gdesc": "Servicio de limpieza", "col-gmonto": 2500, "col-gdeducible": false },
        ],
        createdAt: "2026-04-24T10:00:00.000Z",
        updatedAt: "2026-04-24T10:00:00.000Z",
      },
    ],
  },
]

// Read saved theme from localStorage before creating the store
const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light"
  try {
    const stored = localStorage.getItem("dataflow-storage")
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.state?.theme === "dark" || parsed?.state?.theme === "light") return parsed.state.theme
    }
    // Fallback: check legacy key
    const saved = localStorage.getItem("dataflow-theme")
    if (saved === "dark" || saved === "light") return saved
  } catch {}
  return "light"
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  projects: seedProjects,
  currentView: "dashboard" as ViewType,
  selectedProjectId: null,
  selectedTableId: null,
  theme: getInitialTheme(),
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  // Navigation — delegates to NavigateViewHandler
  setView: (view) => {
    const handler = new NavigateViewHandler()
    handler.execute(
      { view },
      get().selectedProjectId,
      get().selectedTableId,
      get().currentView,
    ).then((result) => {
      if (result.success) {
        set({
          currentView: result.data!.view as ViewType,
          selectedProjectId: result.data!.selectedProjectId,
          selectedTableId: result.data!.selectedTableId,
        })
      }
    })
  },

  selectProject: (id) => set({ selectedProjectId: id, selectedTableId: null, currentView: "project" }),

  selectTable: (projectId, tableId, view?) =>
    set({ selectedProjectId: projectId, selectedTableId: tableId, currentView: view || "table" }),

  goBack: () => {
    const state = get()
    if (state.currentView === "editor") {
      set({ currentView: "table" })
    } else if (state.currentView === "table") {
      set({ currentView: "project", selectedTableId: null })
    } else if (state.currentView === "project") {
      set({ currentView: "dashboard", selectedProjectId: null })
    }
  },

  // Theme — delegates to SetThemeHandler
  setTheme: (theme) => {
    const handler = new SetThemeHandler()
    handler.execute({ theme }).then((result) => {
      if (result.success) {
        set({ theme: result.data!.theme })
        if (theme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    })
  },

  // Project CRUD — delegates to feature handlers
  addProject: (project) => {
    const handler = new CreateProjectHandler()
    handler.execute(project, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  updateProject: (id, data) => {
    const handler = new UpdateProjectHandler()
    handler.execute({ projectId: id, data }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  deleteProject: (id) => {
    const handler = new DeleteProjectHandler()
    const state = get()
    handler.execute(
      { projectId: id, selectedProjectId: state.selectedProjectId, currentView: state.currentView },
      state.projects,
    ).then((result) => {
      if (result.success) {
        set((s) => ({
          ...withUndo(s, result.data!.newProjects),
          selectedProjectId: result.data!.selectedProjectId,
          currentView: result.data!.currentView as ViewType,
        }))
      }
    })
  },

  // Table CRUD — delegates to feature handlers
  addTable: (projectId, table) => {
    const handler = new CreateTableHandler()
    handler.execute({ projectId, ...table }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  updateTable: (projectId, tableId, data) => {
    const handler = new UpdateTableHandler()
    handler.execute({ projectId, tableId, data }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  deleteTable: (projectId, tableId) => {
    const handler = new DeleteTableHandler()
    const state = get()
    handler.execute(
      { projectId, tableId, selectedTableId: state.selectedTableId, currentView: state.currentView },
      state.projects,
    ).then((result) => {
      if (result.success) {
        set((s) => ({
          ...withUndo(s, result.data!.newProjects),
          selectedTableId: result.data!.selectedTableId,
          currentView: result.data!.currentView as ViewType,
        }))
      }
    })
  },

  reorderTables: (projectId, tableIds) => {
    const handler = new ReorderTablesHandler()
    handler.execute({ projectId, tableIds }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  // Column CRUD — delegates to feature handlers
  addColumn: (projectId, tableId, column) => {
    const handler = new CreateColumnHandler()
    handler.execute({ projectId, tableId, column }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  updateColumn: (projectId, tableId, columnId, data) => {
    const handler = new UpdateColumnHandler()
    handler.execute({ projectId, tableId, columnId, data }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  deleteColumn: (projectId, tableId, columnId) => {
    const handler = new DeleteColumnHandler()
    handler.execute({ projectId, tableId, columnId }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  reorderColumns: (projectId, tableId, columnIds) => {
    const handler = new ReorderColumnsHandler()
    handler.execute({ projectId, tableId, columnIds }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  // Row CRUD — delegates to feature handlers
  addRow: (projectId, tableId, row) => {
    const handler = new CreateRowHandler()
    let newRowId = ""
    handler.execute({ projectId, tableId, rowData: row }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
        newRowId = result.data!.newRow.id
      }
    })
    return newRowId
  },

  addRowsBatch: (projectId, tableId, rows, repeatGroupId) => {
    const handler = new BatchAddRowsHandler()
    let newIds: string[] = []
    handler.execute({ projectId, tableId, rowsData: rows, repeatGroupId }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
        newIds = result.data!.newRows.map(r => r.id)
      }
    })
    return newIds
  },

  updateRow: (projectId, tableId, rowId, data) => {
    const handler = new UpdateRowHandler()
    handler.execute({ projectId, tableId, rowId, data }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  deleteRow: (projectId, tableId, rowId) => {
    const handler = new DeleteRowHandler()
    handler.execute({ projectId, tableId, rowId }, get().projects).then((result) => {
      if (result.success) {
        set((state) => ({
          ...withUndo(state, result.data!.newProjects),
        }))
      }
    })
  },

  deleteRowsBatch: async (projectId, tableId, rowIds) => {
    // Batch delete: apply each delete sequentially through the handler
    let currentProjects = get().projects
    for (const rowId of rowIds) {
      const handler = new DeleteRowHandler()
      const result = await handler.execute({ projectId, tableId, rowId }, currentProjects)
      if (result.success) {
        currentProjects = result.data!.newProjects
      }
    }
    set((state) => ({
      ...withUndo(state, currentProjects),
    }))
  },

  // Undo/Redo — delegates to feature handlers
  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return
    const handler = new UndoActionHandler()
    handler.execute({
      undoStack: state.undoStack,
      redoStack: state.redoStack,
      currentProjectsJson: JSON.stringify(state.projects),
    }).then((result) => {
      if (result.success) {
        set({
          projects: result.data!.projects,
          undoStack: result.data!.undoStack,
          redoStack: result.data!.redoStack,
          canUndo: result.data!.undoStack.length > 0,
          canRedo: result.data!.redoStack.length > 0,
        })
      }
    })
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return
    const handler = new RedoActionHandler()
    handler.execute({
      undoStack: state.undoStack,
      redoStack: state.redoStack,
      currentProjectsJson: JSON.stringify(state.projects),
    }).then((result) => {
      if (result.success) {
        set({
          projects: result.data!.projects,
          undoStack: result.data!.undoStack,
          redoStack: result.data!.redoStack,
          canUndo: result.data!.undoStack.length > 0,
          canRedo: result.data!.redoStack.length > 0,
        })
      }
    })
  },

  // Helpers
  getProject: (id) => get().projects.find(p => p.id === id),
  getTable: (projectId, tableId) => {
    const project = get().projects.find(p => p.id === projectId)
    return project?.tables.find(t => t.id === tableId)
  },
}),
    {
      name: "dataflow-storage",
    }
  )
)
