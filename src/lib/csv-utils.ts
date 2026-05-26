/**
 * DataFlow CSV Import/Export Module — v2.1
 *
 * Standardized CSV handling for cross-platform compatibility (web → APK).
 *
 * EXPORT FORMAT:
 *   Row 1: A1 = "###DATAFLOW_V2###" + JSON metadata (table config + column schemas)
 *   Row 2: Column names (human-readable headers)
 *   Row 3+: Data values (references as @REF:rowId|displayValue)
 *
 * IMPORT FEATURES:
 *   - Auto-detects DataFlow V2 format with full schema restoration
 *   - Resolves @REF:rowId|displayValue back to row IDs
 *   - Falls back to plain CSV with type inference
 *   - Handles quoted fields, embedded commas, newlines, and special chars
 *   - UTF-8 BOM support for Excel compatibility
 */

import type { Column, ColumnType, Row } from "@/shared/types/Project"

// ═══════════════════════════════════════════════════════════════════
// FORMAT VERSIONING
// ═══════════════════════════════════════════════════════════════════

const FORMAT_MARKER_V2 = "###DATAFLOW_V2###"
const FORMAT_MARKER_V1 = "###DATAFLOW###"

// ═══════════════════════════════════════════════════════════════════
// REFERENCE RESOLUTION CONTEXT
// ═══════════════════════════════════════════════════════════════════

/** Minimal table shape for reference resolution during export/import */
export interface TableDataForRef {
  id: string
  name: string
  columns: Column[]
  rows: Row[]
}

// ═══════════════════════════════════════════════════════════════════
// COMPLETE COLUMN CONFIG — preserves ALL column properties
// ═══════════════════════════════════════════════════════════════════

interface ColumnConfigV2 {
  id: string
  name: string
  type: ColumnType
  required: boolean
  options?: string[]
  optionColors?: Record<string, string>
  defaultValue?: string
  refTableId?: string
  refDisplayColId?: string
  refAutoFill?: { sourceColId: string; targetColId: string }[]
  refOnAdd?: { targetColId: string; operation: string; sourceColId: string }
  refOnDelete?: { targetColId: string; operation: string; sourceColId: string }
  formula?: string
  ratingMax?: number
  autonumberPrefix?: string
  showIf?: string
  requiredIf?: string
  editableIf?: string
  validIf?: string
  resetIf?: string
  autoCompute?: boolean
  autoComputeFormula?: string
  initialValueFormula?: string
  complementaryOf?: { totalColId: string; otherColId: string }
  dependsOn?: string
  cascadeOptions?: { parentValue: string; options: string[] }[]
  virtual?: boolean
  virtualFormula?: string
  placeholder?: string
  helpText?: string
  prefix?: string
  suffix?: string
  displayMode?: string
  sectionName?: string
  columnWidth?: "narrow" | "medium" | "wide"
  minValue?: number
  maxValue?: number
  step?: number
  regex?: string
  regexMessage?: string
  minLength?: number
  maxLength?: number
  decimalPlaces?: number
  unique?: boolean
  dateMin?: string
  dateMax?: string
  noPastDates?: boolean
  noFutureDates?: boolean
  readOnly?: boolean
  editableOnce?: boolean
  showInTable?: boolean
  showInList?: boolean
  showInForm?: boolean
  textTransform?: "uppercase" | "lowercase" | "titlecase" | "none"
  conditionalFormat?: any[]
}

interface TableConfigV2 {
  version: number
  tableName: string
  tableEmoji: string
  columns: ColumnConfigV2[]
}

// ═══════════════════════════════════════════════════════════════════
// COLUMN ↔ CONFIG SERIALIZATION
// ═══════════════════════════════════════════════════════════════════

const OPTIONAL_KEYS: (keyof ColumnConfigV2)[] = [
  "options", "optionColors", "defaultValue",
  "refTableId", "refDisplayColId", "refAutoFill", "refOnAdd", "refOnDelete",
  "formula", "ratingMax", "autonumberPrefix",
  "showIf", "requiredIf", "editableIf", "validIf", "resetIf",
  "autoCompute", "autoComputeFormula", "initialValueFormula",
  "complementaryOf", "dependsOn", "cascadeOptions",
  "virtual", "virtualFormula",
  "placeholder", "helpText", "prefix", "suffix",
  "displayMode", "sectionName", "columnWidth",
  "minValue", "maxValue", "step", "regex", "regexMessage",
  "minLength", "maxLength", "decimalPlaces", "unique",
  "dateMin", "dateMax", "noPastDates", "noFutureDates",
  "textTransform", "conditionalFormat",
  "readOnly", "editableOnce", "showInTable", "showInList", "showInForm",
]

function columnToConfig(col: Column): ColumnConfigV2 {
  const config: ColumnConfigV2 = {
    id: col.id,
    name: col.name,
    type: col.type,
    required: col.required,
  }
  for (const key of OPTIONAL_KEYS) {
    const val = col[key as keyof Column]
    if (val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0)) {
      ;(config as any)[key] = val
    }
  }
  return config
}

function configToColumn(config: ColumnConfigV2): Column {
  const col: Column = {
    id: config.id,
    name: config.name,
    type: config.type as ColumnType,
    required: config.required ?? false,
  }
  for (const key of OPTIONAL_KEYS) {
    if (config[key] !== undefined) {
      ;(col as any)[key] = config[key]
    }
  }
  return col
}

// ═══════════════════════════════════════════════════════════════════
// CSV ESCAPING — RFC 4180 compliant
// ═══════════════════════════════════════════════════════════════════

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes(";") || value.includes('"') ||
      value.includes("\n") || value.includes("\r") || value.includes("\t")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function unescapeCsv(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"')
  }
  return trimmed
}

// ═══════════════════════════════════════════════════════════════════
// CSV ROW PARSER — handles quoted fields, embedded commas/newlines
// ═══════════════════════════════════════════════════════════════════

function parseCsvRows(text: string, delimiter: string = ","): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"'; i += 2; continue
        } else { inQuotes = false; i++; continue }
      } else { currentField += ch; i++; continue }
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === delimiter) {
      currentRow.push(unescapeCsv(currentField))
      currentField = ""; i++; continue
    }
    if (ch === "\r") {
      if (i + 1 < text.length && text[i + 1] === "\n") i++
      currentRow.push(unescapeCsv(currentField))
      currentField = ""; rows.push(currentRow); currentRow = []; i++; continue
    }
    if (ch === "\n") {
      currentRow.push(unescapeCsv(currentField))
      currentField = ""; rows.push(currentRow); currentRow = []; i++; continue
    }
    currentField += ch; i++
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(unescapeCsv(currentField))
    rows.push(currentRow)
  }
  return rows
}

// ═══════════════════════════════════════════════════════════════════
// DELIMITER AUTO-DETECTION
// ═══════════════════════════════════════════════════════════════════

export function detectDelimiter(text: string): string {
  const firstLines = text.split("\n").slice(0, 5).join("\n")
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 }
  let inQuotes = false
  for (const ch of firstLines) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (!inQuotes && ch in counts) counts[ch]++
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0][1] > 0 ? sorted[0][0] : ","
}

// ═══════════════════════════════════════════════════════════════════
// REFERENCE RESOLUTION (export: rowId → display, import: display → rowId)
// ═══════════════════════════════════════════════════════════════════

function resolveRefDisplay(
  refRowId: string,
  col: Column,
  allTables: TableDataForRef[]
): string {
  if (!col.refTableId || !refRowId) return "—"
  const refTable = allTables.find(t => t.id === col.refTableId)
  if (!refTable) return "—"
  const refRow = refTable.rows.find(r => r.id === refRowId)
  if (!refRow) return "—"
  if (col.refDisplayColId) {
    const val = refRow[col.refDisplayColId]
    return val != null ? String(val) : "—"
  }
  const firstTextCol = refTable.columns.find(c => c.type === "text")
  if (firstTextCol) {
    const val = refRow[firstTextCol.id]
    return val != null ? String(val) : "—"
  }
  return refRowId
}

function resolveRefRowId(
  cell: string,
  col: Column,
  allTables?: TableDataForRef[]
): string | undefined {
  if (!cell || !col.refTableId) return undefined
  // Format 1: @REF:rowId|displayValue
  if (cell.startsWith("@REF:")) {
    const pipeIdx = cell.indexOf("|")
    if (pipeIdx > 5) {
      const rowId = cell.slice(5, pipeIdx)
      if (allTables) {
        const refTable = allTables.find(t => t.id === col.refTableId)
        if (refTable) {
          if (refTable.rows.some(r => r.id === rowId)) return rowId
          const displayValue = cell.slice(pipeIdx + 1)
          return matchRefByDisplay(displayValue, col, refTable)
        }
      }
      return rowId
    }
    const rowId = cell.slice(5)
    if (rowId.startsWith("row-")) return rowId
  }
  // Format 2: raw row ID
  if (cell.startsWith("row-")) {
    if (allTables) {
      const refTable = allTables.find(t => t.id === col.refTableId)
      if (refTable && refTable.rows.some(r => r.id === cell)) return cell
    }
    return cell
  }
  // Format 3: plain display text
  if (allTables) {
    const refTable = allTables.find(t => t.id === col.refTableId)
    if (refTable) return matchRefByDisplay(cell, col, refTable)
  }
  return undefined
}

function matchRefByDisplay(
  displayText: string,
  col: Column,
  refTable: TableDataForRef
): string | undefined {
  if (col.refDisplayColId) {
    const match = refTable.rows.find(r => String(r[col.refDisplayColId!]) === displayText)
    if (match) return match.id
  }
  const firstTextCol = refTable.columns.find(c => c.type === "text")
  if (firstTextCol) {
    const match = refTable.rows.find(r => String(r[firstTextCol.id]) === displayText)
    if (match) return match.id
  }
  for (const refCol of refTable.columns) {
    const match = refTable.rows.find(r => String(r[refCol.id]) === displayText)
    if (match) return match.id
  }
  return undefined
}

// ═══════════════════════════════════════════════════════════════════
// SMART TYPE INFERENCE for plain CSV imports
// ═══════════════════════════════════════════════════════════════════

function inferColumnType(values: string[]): ColumnType {
  const nonEmpty = values.filter(v => v !== "" && v !== undefined)
  if (nonEmpty.length === 0) return "text"
  const sample = nonEmpty.slice(0, 50)
  const allNumbers = sample.every(v => {
    const cleaned = v.replace(/[$€£¥%,\s]/g, "").replace(/\.\d{3}$/, "")
    return /^-?\d+([.,]\d+)?$/.test(cleaned)
  })
  if (allNumbers) {
    if (sample.some(v => /^[$€£¥]/.test(v.trim()))) return "currency"
    if (sample.some(v => v.trim().endsWith("%"))) return "percentage"
    return "number"
  }
  const datePatterns = [/^\d{4}-\d{2}-\d{2}$/, /^\d{2}\/\d{2}\/\d{4}$/, /^\d{1,2}-\d{1,2}-\d{2,4}$/]
  if (sample.every(v => datePatterns.some(p => p.test(v.trim())))) return "date"
  const boolValues = new Set(["sí", "si", "no", "true", "false", "1", "0", "✓", "✗"])
  if (sample.every(v => boolValues.has(v.toLowerCase().trim()))) return "checkbox"
  const uniqueValues = new Set(sample.map(v => v.trim()))
  if (uniqueValues.size <= 20 && uniqueValues.size < sample.length * 0.5) return "select"
  if (sample.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))) return "email"
  if (sample.every(v => /^https?:\/\/.+/i.test(v.trim()))) return "url"
  if (sample.every(v => /^[\d\s\-+().]+$/.test(v.trim()) && v.trim().length >= 7)) return "phone"
  return "text"
}

// ═══════════════════════════════════════════════════════════════════
// CELL VALUE CONVERSION
// ═══════════════════════════════════════════════════════════════════

function cellToValue(cell: string, colType: string, col?: Column, allTables?: TableDataForRef[]): any {
  if (cell === "" || cell === undefined || cell === null) return undefined

  // Handle reference resolution
  if (colType === "reference" && col) {
    const resolved = resolveRefRowId(cell, col, allTables)
    return resolved || cell
  }

  switch (colType) {
    case "number": case "currency": case "percentage": case "autonumber": case "rating": {
      const cleaned = String(cell).replace(/[$€£¥%\s]/g, "").replace(/,/g, "")
      const n = Number(cleaned)
      return isNaN(n) ? 0 : n
    }
    case "checkbox": {
      const lower = cell.toLowerCase().trim()
      return ["sí", "si", "true", "1", "✓", "✔", "yes"].includes(lower)
    }
    case "multiselect": {
      if (cell.startsWith("[") && cell.endsWith("]")) {
        try { return JSON.parse(cell) } catch { /* fall through */ }
      }
      return cell.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
    }
    case "date": {
      const trimmed = cell.trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
      const dmy = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
      if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
      return trimmed
    }
    default:
      return cell
  }
}

function valueToCell(value: any, colType: string, col?: Column, allTables?: TableDataForRef[]): string {
  if (value === null || value === undefined) return ""
  if (colType === "checkbox") return value ? "Sí" : "No"
  if (colType === "multiselect" && Array.isArray(value)) return JSON.stringify(value)

  // Resolve reference: output as @REF:rowId|displayValue for portability
  if (colType === "reference" && col && allTables) {
    const refRowId = String(value)
    const displayValue = resolveRefDisplay(refRowId, col, allTables)
    if (displayValue && displayValue !== "—") {
      return `@REF:${refRowId}|${displayValue}`
    }
  }

  return String(value)
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT: Table → CSV string
// ═══════════════════════════════════════════════════════════════════

export interface TableExportData {
  name: string
  emoji: string
  columns: Column[]
  rows: Row[]
  allTables?: TableDataForRef[]
}

export function tableToCsv(table: TableExportData): string {
  const config: TableConfigV2 = {
    version: 2,
    tableName: table.name,
    tableEmoji: table.emoji,
    columns: table.columns.map(columnToConfig),
  }
  const configJson = JSON.stringify(config)
  const lines: string[] = []

  // Row 1: Format marker + complete config
  lines.push(escapeCsv(FORMAT_MARKER_V2 + configJson))

  // Row 2: Column names
  lines.push(table.columns.map((col) => escapeCsv(col.name)).join(","))

  // Row 3+: Data values (references as @REF:rowId|displayValue)
  for (const row of table.rows) {
    const cells = table.columns.map((col) =>
      escapeCsv(valueToCell(row[col.id], col.type, col, table.allTables))
    )
    lines.push(cells.join(","))
  }

  return lines.join("\n")
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT: Project → CSV files map
// ═══════════════════════════════════════════════════════════════════

export interface ProjectExportData {
  name: string
  emoji: string
  description: string
  color: string
  tables: TableExportData[]
}

export function projectToCsvFiles(project: ProjectExportData): Map<string, string> {
  const files = new Map<string, string>()
  const allTables: TableDataForRef[] = project.tables.map(t => ({
    id: t.name, name: t.name, columns: t.columns, rows: t.rows,
  }))

  const manifest = JSON.stringify({
    version: 2,
    projectName: project.name, projectEmoji: project.emoji,
    projectDescription: project.description, projectColor: project.color,
    tableOrder: project.tables.map(t => sanitizeFileName(t.name)),
  }, null, 2)
  files.set("_manifest.json", manifest)

  for (const table of project.tables) {
    files.set(sanitizeFileName(table.name) + ".csv", tableToCsv({ ...table, allTables }))
  }
  return files
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, "").replace(/\s+/g, "_")
}

// ═══════════════════════════════════════════════════════════════════
// IMPORT: CSV string → Table data
// ═══════════════════════════════════════════════════════════════════

export interface ImportedTableData {
  name: string
  columns: Column[]
  rows: Row[]
  isDataFlowFormat: boolean
}

export function csvToTable(csvText: string, tableName: string, allTables?: TableDataForRef[]): ImportedTableData {
  const delimiter = detectDelimiter(csvText)
  const rows = parseCsvRows(csvText.trim(), delimiter)
  if (rows.length < 1) throw new Error("El archivo está vacío")

  const firstCell = rows[0]?.[0] || ""
  let columns: Column[]
  let dataStartRow: number
  let isDataFlowFormat = false
  let resolvedTableName = tableName

  // ─── DataFlow V2 format ───
  const v2Raw = firstCell.startsWith('"') ? firstCell.slice(1, -1).replace(/""/g, '"') : firstCell
  if (v2Raw.startsWith(FORMAT_MARKER_V2)) {
    const configJson = v2Raw.slice(FORMAT_MARKER_V2.length)
    try {
      const config: TableConfigV2 = JSON.parse(configJson)
      columns = config.columns.map(configToColumn)
      resolvedTableName = config.tableName || tableName
      isDataFlowFormat = true
      dataStartRow = 2
    } catch {
      throw new Error("No se pudo leer la configuración del CSV de DataFlow V2")
    }
  }
  // ─── Legacy V1 format ───
  else if (firstCell.startsWith(FORMAT_MARKER_V1) || (firstCell.startsWith('"') && firstCell.includes(FORMAT_MARKER_V1))) {
    const raw = firstCell.startsWith('"') ? firstCell.slice(1, -1).replace(/""/g, '"') : firstCell
    const configJson = raw.slice(FORMAT_MARKER_V1.length)
    try {
      const config = JSON.parse(configJson)
      columns = config.map((c: any) => ({ ...c, type: c.type as ColumnType })) as Column[]
      isDataFlowFormat = true
      dataStartRow = 2
    } catch {
      throw new Error("No se pudo leer la configuración del CSV (formato V1)")
    }
  }
  // ─── Plain CSV — infer types ───
  else {
    const headers = rows[0]
    const dataRows = rows.slice(1)
    columns = headers.map((h, idx) => {
      const colValues = dataRows.map(r => r[idx] ?? "")
      const inferredType = inferColumnType(colValues)
      const col: Column = {
        id: `col-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        name: h || `Columna ${idx + 1}`,
        type: inferredType,
        required: false,
      }
      if (inferredType === "select") {
        col.options = [...new Set(colValues.map(v => v.trim()).filter(Boolean))]
      }
      return col
    })
    dataStartRow = 1
  }

  // Parse data rows
  const dataRows: Row[] = []
  for (let i = dataStartRow; i < rows.length; i++) {
    const rawRow = rows[i]
    if (!rawRow || rawRow.every((cell) => cell === "")) continue
    const row: Row = { id: `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` }
    for (let j = 0; j < columns.length; j++) {
      const cellValue = rawRow[j] ?? ""
      row[columns[j].id] = cellToValue(cellValue, columns[j].type, columns[j], allTables)
    }
    dataRows.push(row)
  }

  return { name: resolvedTableName, columns, rows: dataRows, isDataFlowFormat }
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

export function isDataFlowCsv(csvText: string): boolean {
  const firstLine = csvText.trim().split("\n")[0] || ""
  return firstLine.includes(FORMAT_MARKER_V2) || firstLine.includes(FORMAT_MARKER_V1)
}

export function downloadFile(content: string, fileName: string, mimeType = "text/csv;charset=utf-8") {
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + content], { type: mimeType })

  // Try the <a download> approach first
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  // Don't use display:none - some browsers skip hidden elements for downloads
  a.style.position = "fixed"
  a.style.left = "-9999px"
  a.style.top = "-9999px"
  document.body.appendChild(a)
  a.click()

  // Cleanup after a delay
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 3000)

  // Fallback for Android WebView / mobile: try Web Share API
  // Only use as fallback if the click method might not have worked
  if (navigator.share && /android/i.test(navigator.userAgent)) {
    setTimeout(() => {
      const file = new File([blob], fileName, { type: mimeType })
      navigator.share({ files: [file], title: fileName }).catch(() => {
        // User cancelled or share failed - that's OK, download was already attempted
      })
    }, 500)
  }
}
