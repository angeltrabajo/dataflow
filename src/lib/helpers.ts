export { cn } from "./utils"
import type { ColumnType, Column, Row, Table, Project } from "@/shared/types/Project"

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return ""
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return ""
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(num)
}

const months = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
]

export function formatDate(value: string | null | undefined): string {
  if (!value) return ""
  try {
    // Don't append T00:00:00 if the value already contains a T (ISO datetime)
    const dateStr = value.includes("T") ? value : value + "T00:00:00"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return value
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return value
  }
}

export function formatRelativeDate(isoString: string | null | undefined): string {
  if (!isoString) return "Nunca"
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(Math.abs(diffMs) / 60000)
    const diffHours = Math.floor(Math.abs(diffMs) / 3600000)
    const diffDays = Math.floor(Math.abs(diffMs) / 86400000)
    const prefix = diffMs < 0 ? "En " : "Hace "

    if (diffMins < 1) return "Justo ahora"
    if (diffMins < 60) return `${prefix}${diffMins} min`
    if (diffHours < 24) return `${prefix}${diffHours}h`
    if (diffDays < 7) return `${prefix}${diffDays}d`

    const day = date.getDate()
    const month = months[date.getMonth()]
    return `${day} ${month}`
  } catch {
    return "Desconocido"
  }
}

export function getColumnTypeLabel(type: ColumnType): string {
  const labels: Record<ColumnType, string> = {
    text: "Texto",
    number: "Número",
    currency: "Moneda",
    percentage: "Porcentaje",
    date: "Fecha",
    select: "Selección",
    multiselect: "Multi-selección",
    email: "Email",
    phone: "Teléfono",
    url: "URL",
    checkbox: "Casilla",
    rating: "Calificación",
    reference: "Referencia",
    formula: "Fórmula",
    autonumber: "Auto-número",
  }
  return labels[type]
}

export function getColumnTypeIcon(type: ColumnType): string {
  const icons: Record<ColumnType, string> = {
    text: "Aa",
    number: "#",
    currency: "$",
    percentage: "%",
    date: "📅",
    select: "☰",
    multiselect: "☑",
    email: "@",
    phone: "📞",
    url: "🔗",
    checkbox: "✓",
    rating: "⭐",
    reference: "↗",
    formula: "fx",
    autonumber: "##",
  }
  return icons[type]
}

export function getColumnTypeColor(type: ColumnType): string {
  const colors: Record<ColumnType, string> = {
    text: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    number: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    currency: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    percentage: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    date: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    select: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    multiselect: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    email: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    phone: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    url: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    checkbox: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    rating: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    reference: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    formula: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    autonumber: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  }
  return colors[type]
}

const selectPillColors = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
]

export function getSelectPillColor(index: number): string {
  return selectPillColors[index % selectPillColors.length]
}

export const PRESET_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  "#84CC16", "#14B8A6",
]

// ═══ SPANISH FORMULA FUNCTIONS REFERENCE ═══

export interface SpanishFormulaFn {
  name: string
  description: string
  example: string
  category: "logica" | "matematicas" | "texto" | "fecha" | "busqueda" | "seccion"
}

export const SPANISH_FORMULA_FNS: Record<string, SpanishFormulaFn> = {
  SI: {
    name: "SI",
    description: "Lógica condicional. Si la condición es verdadera devuelve el segundo argumento, sino el tercero.",
    example: 'SI({col-tipo} = "Ingreso", "+", "-")',
    category: "logica",
  },
  BUSCARV: {
    name: "BUSCARV",
    description: "Busca un valor en una columna de referencia y devuelve el valor de otra columna del registro referenciado. Alternativa más simple: usa notación de punto como {col-vprod.col-pprecio}.",
    example: "BUSCARV({col-vprod}, col-pprecio)",
    category: "busqueda",
  },
  Y: {
    name: "Y",
    description: "Devuelve verdadero si todas las condiciones son verdaderas (AND lógico).",
    example: 'Y({col-monto} > 0, {col-tipo} = "Ingreso")',
    category: "logica",
  },
  O: {
    name: "O",
    description: "Devuelve verdadero si al menos una condición es verdadera (OR lógico).",
    example: 'O({col-estado} = "Activo", {col-estado} = "Pendiente")',
    category: "logica",
  },
  NO: {
    name: "NO",
    description: "Niega un valor lógico (NOT). Devuelve verdadero si el valor es falso.",
    example: "NO({col-activo})",
    category: "logica",
  },
  ESBLANCO: {
    name: "ESBLANCO",
    description: "Devuelve verdadero si el valor está vacío o es blanco.",
    example: 'ESBLANCO({col-notas})',
    category: "logica",
  },
  "SI.ERROR": {
    name: "SI.ERROR",
    description: "Si el primer valor genera error, devuelve el valor alternativo.",
    example: 'SI.ERROR({col-monto} / {col-cant}, 0)',
    category: "logica",
  },
  SUMAR: {
    name: "SUMAR",
    description: "Suma todos los valores proporcionados.",
    example: "SUMAR({col-precio}, {col-envio}, {col-impuesto})",
    category: "matematicas",
  },
  CONTAR: {
    name: "CONTAR",
    description: "Cuenta cuántos valores no están vacíos.",
    example: "CONTAR({col-nombre}, {col-email}, {col-tel})",
    category: "matematicas",
  },
  PROMEDIO: {
    name: "PROMEDIO",
    description: "Calcula el promedio de los valores proporcionados.",
    example: "PROMEDIO({col-enero}, {col-febrero}, {col-marzo})",
    category: "matematicas",
  },
  REDONDEAR: {
    name: "REDONDEAR",
    description: "Redondea un número al número especificado de decimales.",
    example: "REDONDEAR({col-precio}, 2)",
    category: "matematicas",
  },
  ABS: {
    name: "ABS",
    description: "Devuelve el valor absoluto de un número.",
    example: "ABS({col-balance})",
    category: "matematicas",
  },
  POTENCIA: {
    name: "POTENCIA",
    description: "Eleva un número a la potencia indicada.",
    example: "POTENCIA({col-base}, 2)",
    category: "matematicas",
  },
  RAIZ: {
    name: "RAIZ",
    description: "Calcula la raíz cuadrada de un número.",
    example: "RAIZ({col-area})",
    category: "matematicas",
  },
  CONCATENAR: {
    name: "CONCATENAR",
    description: "Une varios textos en uno solo.",
    example: 'CONCATENAR({col-nombre}, " - ", {col-empresa})',
    category: "texto",
  },
  IZQUIERDA: {
    name: "IZQUIERDA",
    description: "Extrae los primeros N caracteres de un texto.",
    example: 'IZQUIERDA({col-codigo}, 3)',
    category: "texto",
  },
  DERECHA: {
    name: "DERECHA",
    description: "Extrae los últimos N caracteres de un texto.",
    example: 'DERECHA({col-codigo}, 4)',
    category: "texto",
  },
  LARGO: {
    name: "LARGO",
    description: "Devuelve la cantidad de caracteres de un texto.",
    example: "LARGO({col-descripcion})",
    category: "texto",
  },
  MAYUSC: {
    name: "MAYUSC",
    description: "Convierte el texto a mayúsculas.",
    example: "MAYUSC({col-nombre})",
    category: "texto",
  },
  MINUSC: {
    name: "MINUSC",
    description: "Convierte el texto a minúsculas.",
    example: "MINUSC({col-email})",
    category: "texto",
  },
  "SUMAR.SECCION": {
    name: "SUMAR.SECCION",
    description: "Suma una expresión para todas las filas del mismo grupo de sección repetible. Fuera de una sección repetible, evalúa la expresión para la fila actual.",
    example: "SUMAR.SECCION({col-vcant} * {col-vprecio})",
    category: "seccion",
  },
  "SUMAR.SI": {
    name: "SUMAR.SI",
    description: "Suma los valores de una columna en otra tabla donde se cumple una condición.",
    example: "SUMAR.SI(tab-ventas, col-vprod, {col-vprod}, col-vcant)",  // usa IDs de tabla y columna del proyecto Tutorial
    category: "busqueda",
  },
  "CONTAR.SI": {
    name: "CONTAR.SI",
    description: "Cuenta los registros en otra tabla donde se cumple una condición.",
    example: "CONTAR.SI(tab-ventas, col-vprod, {col-vprod})",  // usa IDs de tabla y columna del proyecto Tutorial
    category: "busqueda",
  },
  HOY: {
    name: "HOY",
    description: "Devuelve la fecha actual (sin hora).",
    example: "HOY()",
    category: "fecha",
  },
  AHORA: {
    name: "AHORA",
    description: "Devuelve la fecha y hora actuales.",
    example: "AHORA()",
    category: "fecha",
  },
}

export const FORMULA_CATEGORIES: { key: SpanishFormulaFn["category"]; label: string }[] = [
  { key: "logica", label: "Lógica" },
  { key: "matematicas", label: "Matemáticas" },
  { key: "texto", label: "Texto" },
  { key: "fecha", label: "Fecha" },
  { key: "busqueda", label: "Búsqueda" },
  { key: "seccion", label: "Sección" },
]

// ═══ FORMULA EVALUATION ENGINE ═══

/**
 * Evaluate a formula expression for a given row.
 * Supports:
 * - Column references: {colId}
 * - Cross-table references: {refColId.targetColId} — access a column from a row referenced via a reference column
 *   (chained supported: {ref1.ref2.targetColId})
 * - Arithmetic: +, -, *, /
 * - Both English (IF, LOOKUP) and Spanish (SI, BUSCARV) function names
 * - Spanish functions: SUMAR, CONTAR, PROMEDIO, CONCATENAR, IZQUIERDA, DERECHA,
 *   LARGO, MAYUSC, MINUSC, HOY, AHORA, Y, O, NO, ESBLANCO, SI.ERROR,
 *   REDONDEAR, ABS, POTENCIA, RAIZ, SUMAR.SI, CONTAR.SI
 * - String literals: "text"
 * - Number literals
 */
export function evaluateFormula(
  formula: string,
  row: Row,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): any {
  if (!formula || !formula.trim()) return ""

  try {
    const expr = formula.trim()
    return parseExpression(expr, row, columns, allProjects, currentProjectId, allRows)
  } catch (e) {
    return "⚠ Error"
  }
}

function parseExpression(
  expr: string,
  row: Row,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): any {
  expr = expr.trim()

  const upper = expr.toUpperCase()

  // SUMAR.SECCION(expression) — sum expression across all rows in repeat group
  if (upper.startsWith("SUMAR.SECCION(")) {
    const inner = extractFunctionArgs(expr.slice(13)) // "SUMAR.SECCION" is 13 chars
    if (inner.length === 1) {
      const innerExpr = inner[0].trim()
      if (!allRows || !(row as any)._repeatGroupId) {
        // Not in a repeatable section: evaluate for current row only
        return parseExpression(innerExpr, row, columns, allProjects, currentProjectId, allRows)
      }
      const groupId = (row as any)._repeatGroupId as string
      const siblingRows = allRows.filter(r => (r as any)._repeatGroupId === groupId)
      let sum = 0
      for (const siblingRow of siblingRows) {
        const val = parseExpression(innerExpr, siblingRow, columns, allProjects, currentProjectId, allRows)
        const num = toNumber(val)
        if (!isNaN(num)) sum += num
      }
      return sum
    }
    return "⚠ SUMAR.SECCION requiere 1 argumento"
  }

  // SI() / IF(condition, trueVal, falseVal)
  if (upper.startsWith("SI(") || upper.startsWith("IF(")) {
    const funcNameLen = 2
    const inner = extractFunctionArgs(expr.slice(funcNameLen))
    if (inner.length === 3) {
      const condition = parseCondition(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows)
      if (condition) {
        return parseExpression(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows)
      } else {
        return parseExpression(inner[2].trim(), row, columns, allProjects, currentProjectId, allRows)
      }
    }
    return "⚠ SI requiere 3 argumentos"
  }

  // BUSCARV() / LOOKUP({refColId}, targetColId)
  if (upper.startsWith("BUSCARV(") || upper.startsWith("LOOKUP(")) {
    const funcNameLen = upper.startsWith("BUSCARV(") ? 7 : 6
    const inner = extractFunctionArgs(expr.slice(funcNameLen))
    if (inner.length === 2) {
      const refColExpr = inner[0].trim()
      const targetColId = inner[1].trim()
      const refRowId = resolveValue(refColExpr, row, columns, allProjects, currentProjectId, allRows)
      if (!refRowId || refRowId === "—") return 0

      // Find the referenced table
      const refColExprClean = refColExpr.replace(/^\{|\}$/g, "")
      const refColumn = columns.find(c => c.id === refColExprClean)
      if (!refColumn || refColumn.type !== "reference" || !refColumn.refTableId) return 0

      const project = allProjects.find(p => p.id === currentProjectId)
      if (!project) return 0

      const refTable = project.tables.find(t => t.id === refColumn.refTableId)
      if (!refTable) return 0

      const refRow = refTable.rows.find(r => r.id === refRowId)
      if (!refRow) return 0

      const val = refRow[targetColId]
      return typeof val === "number" ? val : (parseFloat(String(val)) || 0)
    }
    return "⚠ BUSCARV requiere 2 argumentos"
  }

  // SUMAR(val1, val2, ...)
  if (upper.startsWith("SUMAR(")) {
    const inner = extractFunctionArgs(expr.slice(5))
    let sum = 0
    for (const arg of inner) {
      const val = resolveValue(arg.trim(), row, columns, allProjects, currentProjectId, allRows)
      const num = toNumber(val)
      if (!isNaN(num)) sum += num
    }
    return sum
  }

  // CONTAR(val1, val2, ...)
  if (upper.startsWith("CONTAR(")) {
    const inner = extractFunctionArgs(expr.slice(6))
    let count = 0
    for (const arg of inner) {
      const val = resolveValue(arg.trim(), row, columns, allProjects, currentProjectId, allRows)
      if (val != null && val !== "" && val !== undefined) count++
    }
    return count
  }

  // PROMEDIO(val1, val2, ...)
  if (upper.startsWith("PROMEDIO(")) {
    const inner = extractFunctionArgs(expr.slice(8))
    let sum = 0
    let count = 0
    for (const arg of inner) {
      const val = resolveValue(arg.trim(), row, columns, allProjects, currentProjectId, allRows)
      const num = toNumber(val)
      if (!isNaN(num)) {
        sum += num
        count++
      }
    }
    return count > 0 ? sum / count : 0
  }

  // CONCATENAR(text1, text2, ...)
  if (upper.startsWith("CONCATENAR(")) {
    const inner = extractFunctionArgs(expr.slice(10))
    return inner.map(arg => {
      const val = resolveValue(arg.trim(), row, columns, allProjects, currentProjectId, allRows)
      return String(val ?? "")
    }).join("")
  }

  // IZQUIERDA(text, n)
  if (upper.startsWith("IZQUIERDA(")) {
    const inner = extractFunctionArgs(expr.slice(9))
    if (inner.length === 2) {
      const text = String(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows) ?? "")
      const n = Math.max(0, Math.round(toNumber(resolveValue(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows)) || 0))
      return text.slice(0, n)
    }
    return "⚠ IZQUIERDA requiere 2 argumentos"
  }

  // DERECHA(text, n)
  if (upper.startsWith("DERECHA(")) {
    const inner = extractFunctionArgs(expr.slice(7))
    if (inner.length === 2) {
      const text = String(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows) ?? "")
      const n = Math.max(0, Math.round(toNumber(resolveValue(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows)) || 0))
      if (n === 0) return ""
      return text.slice(-n)
    }
    return "⚠ DERECHA requiere 2 argumentos"
  }

  // LARGO(text)
  if (upper.startsWith("LARGO(")) {
    const inner = extractFunctionArgs(expr.slice(5))
    if (inner.length === 1) {
      const text = String(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows) ?? "")
      return text.length
    }
    return "⚠ LARGO requiere 1 argumento"
  }

  // MAYUSC(text)
  if (upper.startsWith("MAYUSC(")) {
    const inner = extractFunctionArgs(expr.slice(6))
    if (inner.length === 1) {
      const text = String(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows) ?? "")
      return text.toUpperCase()
    }
    return "⚠ MAYUSC requiere 1 argumento"
  }

  // MINUSC(text)
  if (upper.startsWith("MINUSC(")) {
    const inner = extractFunctionArgs(expr.slice(6))
    if (inner.length === 1) {
      const text = String(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows) ?? "")
      return text.toLowerCase()
    }
    return "⚠ MINUSC requiere 1 argumento"
  }

  // HOY()
  if (upper.startsWith("HOY(")) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  }

  // AHORA()
  if (upper.startsWith("AHORA(")) {
    return new Date().toISOString()
  }

  // Y(cond1, cond2, ...) — AND logic
  if (upper.startsWith("Y(")) {
    const inner = extractFunctionArgs(expr.slice(1))
    for (const arg of inner) {
      const cond = parseCondition(arg.trim(), row, columns, allProjects, currentProjectId, allRows)
      if (!cond) return false
    }
    return inner.length > 0
  }

  // O(cond1, cond2, ...) — OR logic
  if (upper.startsWith("O(")) {
    const inner = extractFunctionArgs(expr.slice(1))
    for (const arg of inner) {
      const cond = parseCondition(arg.trim(), row, columns, allProjects, currentProjectId, allRows)
      if (cond) return true
    }
    return false
  }

  // NO(cond) — NOT logic
  if (upper.startsWith("NO(")) {
    const inner = extractFunctionArgs(expr.slice(2))
    if (inner.length === 1) {
      const cond = parseCondition(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows)
      return !cond
    }
    return "⚠ NO requiere 1 argumento"
  }

  // ESBLANCO(val)
  if (upper.startsWith("ESBLANCO(")) {
    const inner = extractFunctionArgs(expr.slice(8))
    if (inner.length === 1) {
      const val = resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows)
      return val == null || val === "" || val === undefined
    }
    return "⚠ ESBLANCO requiere 1 argumento"
  }

  // SI.ERROR(val, alt)
  if (upper.startsWith("SI.ERROR(")) {
    const inner = extractFunctionArgs(expr.slice(8))
    if (inner.length === 2) {
      try {
        const val = parseExpression(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows)
        if (typeof val === "string" && val.startsWith("⚠")) {
          return resolveValue(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows)
        }
        return val
      } catch {
        return resolveValue(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows)
      }
    }
    return "⚠ SI.ERROR requiere 2 argumentos"
  }

  // REDONDEAR(num, decimals)
  if (upper.startsWith("REDONDEAR(")) {
    const inner = extractFunctionArgs(expr.slice(9))
    if (inner.length === 2) {
      const num = toNumber(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows))
      const decimals = Math.max(0, Math.round(toNumber(resolveValue(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows)) || 0))
      if (!isNaN(num)) {
        const factor = Math.pow(10, decimals)
        return Math.round(num * factor) / factor
      }
      return 0
    }
    return "⚠ REDONDEAR requiere 2 argumentos"
  }

  // ABS(num)
  if (upper.startsWith("ABS(")) {
    const inner = extractFunctionArgs(expr.slice(3))
    if (inner.length === 1) {
      const num = toNumber(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows))
      return isNaN(num) ? 0 : Math.abs(num)
    }
    return "⚠ ABS requiere 1 argumento"
  }

  // POTENCIA(base, exp)
  if (upper.startsWith("POTENCIA(")) {
    const inner = extractFunctionArgs(expr.slice(8))
    if (inner.length === 2) {
      const base = toNumber(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows))
      const exp = toNumber(resolveValue(inner[1].trim(), row, columns, allProjects, currentProjectId, allRows))
      if (!isNaN(base) && !isNaN(exp)) {
        return Math.pow(base, exp)
      }
      return 0
    }
    return "⚠ POTENCIA requiere 2 argumentos"
  }

  // RAIZ(num)
  if (upper.startsWith("RAIZ(")) {
    const inner = extractFunctionArgs(expr.slice(4))
    if (inner.length === 1) {
      const num = toNumber(resolveValue(inner[0].trim(), row, columns, allProjects, currentProjectId, allRows))
      if (!isNaN(num) && num >= 0) {
        return Math.sqrt(num)
      }
      return 0
    }
    return "⚠ RAIZ requiere 1 argumento"
  }

  // SUMAR.SI(tablaId, colCondId, valorCond, colSumaId)
  if (upper.startsWith("SUMAR.SI(")) {
    const inner = extractFunctionArgs(expr.slice(8))
    if (inner.length === 4) {
      const tablaId = inner[0].trim()
      const colCondId = inner[1].trim()
      const valorCondExpr = inner[2].trim()
      const colSumaId = inner[3].trim()

      const project = allProjects.find(p => p.id === currentProjectId)
      if (!project) return 0

      const targetTable = project.tables.find(t => t.id === tablaId)
      if (!targetTable) return 0

      const valorCond = resolveValue(valorCondExpr, row, columns, allProjects, currentProjectId, allRows)

      let sum = 0
      for (const targetRow of targetTable.rows) {
        const condVal = targetRow[colCondId]
        if (String(condVal) === String(valorCond)) {
          const sumVal = toNumber(targetRow[colSumaId])
          if (!isNaN(sumVal)) sum += sumVal
        }
      }
      return sum
    }
    return "⚠ SUMAR.SI requiere 4 argumentos"
  }

  // CONTAR.SI(tablaId, colCondId, valorCond)
  if (upper.startsWith("CONTAR.SI(")) {
    const inner = extractFunctionArgs(expr.slice(9))
    if (inner.length === 3) {
      const tablaId = inner[0].trim()
      const colCondId = inner[1].trim()
      const valorCondExpr = inner[2].trim()

      const project = allProjects.find(p => p.id === currentProjectId)
      if (!project) return 0

      const targetTable = project.tables.find(t => t.id === tablaId)
      if (!targetTable) return 0

      const valorCond = resolveValue(valorCondExpr, row, columns, allProjects, currentProjectId, allRows)

      let count = 0
      for (const targetRow of targetTable.rows) {
        const condVal = targetRow[colCondId]
        if (String(condVal) === String(valorCond)) {
          count++
        }
      }
      return count
    }
    return "⚠ CONTAR.SI requiere 3 argumentos"
  }

  // Try to evaluate as arithmetic expression
  return evaluateArithmetic(expr, row, columns, allProjects, currentProjectId, allRows)
}

function extractFunctionArgs(expr: string): string[] {
  // Remove the outer parentheses
  let s = expr
  if (s.startsWith("(")) s = s.slice(1)
  if (s.endsWith(")")) s = s.slice(0, -1)

  const args: string[] = []
  let depth = 0
  let current = ""
  let inString = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '"' && (i === 0 || s[i - 1] !== "\\")) {
      inString = !inString
      current += ch
    } else if (!inString && ch === "(") {
      depth++
      current += ch
    } else if (!inString && ch === ")") {
      depth--
      current += ch
    } else if (!inString && ch === "," && depth === 0) {
      args.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  if (current) args.push(current)
  return args
}

function parseCondition(
  condExpr: string,
  row: Row,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): boolean {
  // Check for boolean values (from nested function calls like Y(), O(), NO(), ESBLANCO())
  const trimmed = condExpr.trim()
  const upperTrimmed = trimmed.toUpperCase()

  // Direct boolean
  if (upperTrimmed === "TRUE" || upperTrimmed === "VERDADERO") return true
  if (upperTrimmed === "FALSE" || upperTrimmed === "FALSO") return false

  // Nested boolean functions
  if (upperTrimmed.startsWith("Y(") || upperTrimmed.startsWith("O(") ||
      upperTrimmed.startsWith("NO(") || upperTrimmed.startsWith("ESBLANCO(")) {
    const result = parseExpression(trimmed, row, columns, allProjects, currentProjectId, allRows)
    return !!result
  }

  // Check for comparison operators
  const operators = ["<>", "<=", ">=", "=", "<", ">"]
  for (const op of operators) {
    const idx = condExpr.indexOf(op)
    if (idx !== -1) {
      const left = condExpr.slice(0, idx).trim()
      const right = condExpr.slice(idx + op.length).trim()
      const leftVal = resolveValue(left, row, columns, allProjects, currentProjectId, allRows)
      const rightVal = resolveValue(right, row, columns, allProjects, currentProjectId, allRows)

      const leftNum = toNumber(leftVal)
      const rightNum = toNumber(rightVal)

      // If both are numbers, compare numerically
      if (!isNaN(leftNum) && !isNaN(rightNum)) {
        switch (op) {
          case "=": return leftNum === rightNum
          case "<>": return leftNum !== rightNum
          case "<": return leftNum < rightNum
          case ">": return leftNum > rightNum
          case "<=": return leftNum <= rightNum
          case ">=": return leftNum >= rightNum
        }
      }

      // String comparison
      const leftStr = String(leftVal ?? "")
      const rightStr = String(rightVal ?? "")
      switch (op) {
        case "=": return leftStr === rightStr
        case "<>": return leftStr !== rightStr
        case "<": return leftStr < rightStr
        case ">": return leftStr > rightStr
        case "<=": return leftStr <= rightStr
        case ">=": return leftStr >= rightStr
      }
    }
  }

  // If it's a column reference or value, treat truthy values as true
  const val = resolveValue(trimmed, row, columns, allProjects, currentProjectId, allRows)
  if (typeof val === "boolean") return val
  if (typeof val === "number") return val !== 0
  if (typeof val === "string") return val !== "" && val !== "false" && val !== "0"

  return false
}

function resolveCrossTableRef(
  path: string,
  row: Row,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string
): any {
  const parts = path.split(".")

  if (parts.length === 1) {
    // Simple column reference: {colId}
    return row ? (row[parts[0]] ?? "") : ""
  }

  // Cross-table reference: {refColId.targetColId} or chained {ref1.ref2.targetColId}
  let currentRow: Row | null = row
  let currentColumns: Column[] = columns

  for (let i = 0; i < parts.length - 1; i++) {
    const colId = parts[i]
    const refRowId = currentRow?.[colId]
    if (!refRowId || refRowId === "") return ""

    const refColumn = currentColumns.find(c => c.id === colId)
    if (!refColumn || refColumn.type !== "reference" || !refColumn.refTableId) return ""

    const project = allProjects.find(p => p.id === currentProjectId)
    if (!project) return ""

    const refTable = project.tables.find(t => t.id === refColumn.refTableId)
    if (!refTable) return ""

    const refRow = refTable.rows.find(r => r.id === refRowId)
    if (!refRow) return ""

    currentRow = refRow
    currentColumns = refTable.columns
  }

  const targetColId = parts[parts.length - 1]
  return currentRow?.[targetColId] ?? ""
}

function resolveValue(
  expr: string,
  row: Row,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): any {
  expr = expr.trim()

  // Column reference: {colId} or cross-table {refColId.targetColId}
  if (expr.startsWith("{") && expr.endsWith("}")) {
    const path = expr.slice(1, -1)
    return resolveCrossTableRef(path, row, columns, allProjects, currentProjectId)
  }

  // String literal: "text"
  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr.slice(1, -1)
  }

  // Number literal
  const num = parseFloat(expr)
  if (!isNaN(num) && expr === String(num)) {
    return num
  }

  // Boolean literals
  const upper = expr.toUpperCase()
  if (upper === "TRUE" || upper === "VERDADERO") return true
  if (upper === "FALSE" || upper === "FALSO") return false

  // Nested function calls - check all supported function names
  const funcPrefixes = [
    "SUMAR.SECCION(", "SI(", "IF(", "BUSCARV(", "LOOKUP(", "SUMAR(", "CONTAR(", "PROMEDIO(",
    "CONCATENAR(", "IZQUIERDA(", "DERECHA(", "LARGO(", "MAYUSC(", "MINUSC(",
    "HOY(", "AHORA(", "Y(", "O(", "NO(", "ESBLANCO(", "SI.ERROR(",
    "REDONDEAR(", "ABS(", "POTENCIA(", "RAIZ(", "SUMAR.SI(", "CONTAR.SI("
  ]
  for (const prefix of funcPrefixes) {
    if (upper.startsWith(prefix)) {
      return parseExpression(expr, row, columns, allProjects, currentProjectId, allRows)
    }
  }

  return expr
}

function toNumber(val: any): number {
  if (typeof val === "number") return val
  if (val == null || val === "") return 0
  const num = parseFloat(String(val))
  return isNaN(num) ? 0 : num
}

function evaluateArithmetic(
  expr: string,
  row: Row,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): any {
  // First, resolve all column references and function calls
  // We'll do a simple left-to-right evaluation with operator precedence

  // Tokenize: find all {colId}, numbers, operators, and function calls
  const tokens = tokenizeArithmetic(expr)
  if (tokens.length === 0) return ""

  // Resolve tokens to values
  const resolved = tokens.map(t => {
    if (t.type === "ref") {
      // Support dot notation: {refColId.targetColId} for cross-table references
      const val = resolveCrossTableRef(t.value, row, columns, allProjects, currentProjectId)
      return { ...t, resolved: toNumber(val) }
    }
    if (t.type === "number") {
      return { ...t, resolved: parseFloat(t.value) }
    }
    if (t.type === "func") {
      const result = parseExpression(t.value, row, columns, allProjects, currentProjectId, allRows)
      return { ...t, resolved: toNumber(result) }
    }
    if (t.type === "string") {
      return { ...t, resolved: t.value }
    }
    if (t.type === "group") {
      // Recursively evaluate the parenthesized sub-expression
      const result = evaluateArithmetic(t.value, row, columns, allProjects, currentProjectId, allRows)
      return { ...t, resolved: toNumber(result) }
    }
    return t // operator
  })

  // Check if all resolved values are strings (not arithmetic)
  const hasOperators = resolved.some(t => t.type === "operator")
  if (!hasOperators) {
    // Single value
    const val = resolved[0]
    if (val?.type === "string") return val.resolved
    return val?.resolved ?? ""
  }

  // Evaluate with operator precedence: * and / first, then + and -
  // First pass: * and /
  let values = [...resolved]
  let i = 0
  while (i < values.length) {
    if (values[i].type === "operator" && (values[i].value === "*" || values[i].value === "/")) {
      const left = values[i - 1]?.resolved ?? 0
      const right = values[i + 1]?.resolved ?? 0
      const result = values[i].value === "*" ? left * right : (right !== 0 ? left / right : 0)
      values.splice(i - 1, 3, { type: "number", value: String(result), resolved: result })
      i = Math.max(0, i - 1)
    } else {
      i++
    }
  }

  // Second pass: + and -
  i = 0
  while (i < values.length) {
    if (values[i].type === "operator" && (values[i].value === "+" || values[i].value === "-")) {
      const left = values[i - 1]?.resolved ?? 0
      const right = values[i + 1]?.resolved ?? 0
      const result = values[i].value === "+" ? left + right : left - right
      values.splice(i - 1, 3, { type: "number", value: String(result), resolved: result })
      i = Math.max(0, i - 1)
    } else {
      i++
    }
  }

  return values[0]?.resolved ?? ""
}

interface Token {
  type: "ref" | "number" | "operator" | "func" | "string" | "group"
  value: string
  resolved?: any
}

// All known function name prefixes for tokenization (longer first to avoid partial matches)
const KNOWN_FUNC_PREFIXES = [
  "CONCATENAR", "SUMAR.SECCION", "SUMAR.SI", "CONTAR.SI", "SI.ERROR", "BUSCARV", "PROMEDIO", "ESBLANCO",
  "REDONDEAR", "POTENCIA", "IZQUIERDA", "LOOKUP",
  "SUMAR", "CONTAR", "DERECHA", "MAYUSC", "MINUSC",
  "LARGO", "AHORA", "SI", "IF",
  "HOY", "ABS", "RAIZ",
]

function tokenizeArithmetic(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let s = expr.trim()

  while (i < s.length) {
    // Skip whitespace
    if (s[i] === " ") { i++; continue }

    // Column reference {colId}
    if (s[i] === "{") {
      const end = s.indexOf("}", i)
      if (end !== -1) {
        tokens.push({ type: "ref", value: s.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // String literal "text"
    if (s[i] === '"') {
      const end = s.indexOf('"', i + 1)
      if (end !== -1) {
        tokens.push({ type: "string", value: s.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // Function call: check all known function names
    let funcMatched = false
    for (const funcName of KNOWN_FUNC_PREFIXES) {
      if (s.slice(i, i + funcName.length).toUpperCase() === funcName && s[i + funcName.length] === "(") {
        // Find matching closing paren
        let depth = 0
        let endIdx = i + funcName.length
        for (let j = i + funcName.length; j < s.length; j++) {
          if (s[j] === "(") depth++
          if (s[j] === ")") depth--
          if (depth === 0) { endIdx = j + 1; break }
        }
        tokens.push({ type: "func", value: s.slice(i, endIdx) })
        i = endIdx
        funcMatched = true
        break
      }
    }
    if (funcMatched) continue

    // Opening parenthesis — find matching closing, evaluate inner expression recursively
    if (s[i] === "(") {
      let depth = 0
      let endIdx = i
      for (let j = i; j < s.length; j++) {
        if (s[j] === "(") depth++
        if (s[j] === ")") depth--
        if (depth === 0) { endIdx = j; break }
      }
      if (endIdx > i) {
        // Extract inner expression and store as a "group" token
        const inner = s.slice(i + 1, endIdx)
        tokens.push({ type: "group", value: inner })
        i = endIdx + 1
        continue
      }
    }

    // Unary minus: - at start or after operator/opening
    // We'll mark it as a special "unary" token that the evaluator handles
    if (s[i] === "-") {
      const prev = tokens[tokens.length - 1]
      const isUnary = !prev || prev.type === "operator" || prev.type === "group"
      if (isUnary) {
        // Read the following number, ref, or group
        let numStr = "-"
        i++
        // Collect number after minus
        if (i < s.length && /[0-9.]/.test(s[i])) {
          while (i < s.length && /[0-9.]/.test(s[i])) {
            numStr += s[i]
            i++
          }
          tokens.push({ type: "number", value: numStr })
          continue
        }
        // Otherwise it's a unary minus before a ref/group — insert 0 before it
        tokens.push({ type: "number", value: "0" })
        tokens.push({ type: "operator", value: "-" })
        continue
      }
    }

    // Operator
    if (s[i] === "+" || s[i] === "*" || s[i] === "/") {
      tokens.push({ type: "operator", value: s[i] })
      i++
      continue
    }
    // Binary minus (not unary)
    if (s[i] === "-") {
      tokens.push({ type: "operator", value: s[i] })
      i++
      continue
    }

    // Number
    if (/[0-9.]/.test(s[i])) {
      let num = ""
      while (i < s.length && /[0-9.]/.test(s[i])) {
        num += s[i]
        i++
      }
      tokens.push({ type: "number", value: num })
      continue
    }

    // Skip unknown chars
    i++
  }

  return tokens
}

/**
 * Get display value for a reference column — resolves the referenced row's display column.
 */
export function resolveReferenceDisplay(
  refRowId: string | null | undefined,
  refTableId: string | null | undefined,
  refDisplayColId: string | null | undefined,
  projects: Project[],
  currentProjectId: string
): string {
  if (!refRowId || !refTableId) return "—"

  const project = projects.find(p => p.id === currentProjectId)
  if (!project) return "—"

  const refTable = project.tables.find(t => t.id === refTableId)
  if (!refTable) return "—"

  const refRow = refTable.rows.find(r => r.id === refRowId)
  if (!refRow) return "—"

  if (refDisplayColId) {
    const val = refRow[refDisplayColId]
    return val != null ? String(val) : "—"
  }

  // Fallback: show first text column
  const firstTextCol = refTable.columns.find(c => c.type === "text")
  if (firstTextCol) {
    const val = refRow[firstTextCol.id]
    return val != null ? String(val) : "—"
  }

  return refRow.id
}

/**
 * Format a formula result for display
 */
export function formatFormulaResult(value: any, formula: string): string {
  if (value === "⚠ Error") return value
  if (typeof value === "string" && value.startsWith("⚠")) return value
  if (value == null || value === "") return ""

  // If the formula contains currency-related columns, format as currency
  if (typeof value === "number") {
    // Check if the formula references any currency column
    // Simple heuristic: if it's a decimal, show 2 decimal places
    if (Number.isInteger(value)) {
      return value.toLocaleString("es-MX")
    }
    return value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return String(value)
}

/**
 * Evaluate a condition expression for a column given the current form data.
 * Returns true if the condition is met, false otherwise.
 * Empty/undefined conditions return true (no restriction).
 */
export function evaluateColumnCondition(
  condition: string | null | undefined,
  formData: Record<string, any>,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): boolean {
  if (!condition || !condition.trim()) return true
  try {
    const rowAsRow = formData as Row
    const result = parseCondition(condition.trim(), rowAsRow, columns, allProjects, currentProjectId, allRows)
    return !!result
  } catch {
    return true
  }
}

/**
 * Evaluate an auto-compute formula for a column given the current form data.
 * Returns the computed value, or undefined if the formula is empty or errors.
 */
export function evaluateAutoCompute(
  formula: string,
  formData: Record<string, any>,
  columns: Column[],
  allProjects: Project[],
  currentProjectId: string,
  allRows?: Row[]
): any {
  if (!formula || !formula.trim()) return undefined
  try {
    const rowAsRow = formData as Row
    return evaluateFormula(formula, rowAsRow, columns, allProjects, currentProjectId, allRows)
  } catch {
    return undefined
  }
}
