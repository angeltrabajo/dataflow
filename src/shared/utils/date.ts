/**
 * Get current timestamp as ISO string.
 */
export const now = (): string => new Date().toISOString();

/**
 * Format a date value for display (es-MX locale).
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const dateStr = value.includes("T") ? value : value + "T00:00:00";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return value;
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return value;
  }
}

/**
 * Format a date as relative time (e.g., "Hace 5 min").
 */
export function formatRelativeDate(isoString: string | null | undefined): string {
  if (!isoString) return "Nunca";
  try {
    const date = new Date(isoString);
    const currentTime = new Date();
    const diffMs = currentTime.getTime() - date.getTime();
    const diffMins = Math.floor(Math.abs(diffMs) / 60000);
    const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
    const diffDays = Math.floor(Math.abs(diffMs) / 86400000);
    const prefix = diffMs < 0 ? "En " : "Hace ";
    if (diffMins < 1) return "Justo ahora";
    if (diffMins < 60) return `${prefix}${diffMins} min`;
    if (diffHours < 24) return `${prefix}${diffHours}h`;
    if (diffDays < 7) return `${prefix}${diffDays}d`;
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  } catch {
    return "Desconocido";
  }
}
