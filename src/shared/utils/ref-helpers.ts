import type { Project } from '@/shared/types/Project';
import { toNumber } from './validation';
import { now } from './date';

/**
 * Get column IDs that are NOT in the repeatable section (i.e., "global" columns).
 */
export const getGlobalColumnIds = (
  table: { repeatableSection?: { columnIds: string[] }; columns: { id: string }[] }
): Set<string> => {
  const rs = table.repeatableSection;
  if (!rs) return new Set();
  const sectionIds = new Set(rs.columnIds);
  return new Set(table.columns.filter(c => !sectionIds.has(c.id)).map(c => c.id));
};

/**
 * Check if a column is inside the repeatable section.
 */
export const isSectionColumn = (
  table: { repeatableSection?: { columnIds: string[] } },
  colId: string
): boolean => {
  const rs = table.repeatableSection;
  if (!rs) return false;
  return rs.columnIds.includes(colId);
};

/**
 * Compute the next autonumber value for a column, considering existing rows.
 * Uses MAX value instead of count to avoid duplicates after row deletion.
 */
export const getNextAutonumber = (
  rows: { [key: string]: unknown }[],
  col: { id: string; autonumberPrefix?: string; autonumberDigits?: number }
): string => {
  const prefix = col.autonumberPrefix || '';
  const digits = col.autonumberDigits || 0;

  let maxNum = 0;
  for (const row of rows) {
    const val = row[col.id];
    if (val != null && val !== '') {
      const numStr = prefix
        ? String(val).replace(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '')
        : String(val);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const paddedNum = digits > 0 ? String(nextNum).padStart(digits, '0') : String(nextNum);
  return `${prefix}${paddedNum}`;
};

/**
 * Apply a numeric delta to a referenced row's column.
 * Pure function: returns a new projects array.
 */
export const applyRefDelta = (
  projects: Project[],
  projectId: string,
  refTableId: string,
  refRowId: string,
  targetColId: string,
  delta: number
): Project[] => {
  return projects.map(p =>
    p.id === projectId
      ? {
          ...p,
          tables: p.tables.map(t =>
            t.id === refTableId
              ? {
                  ...t,
                  rows: t.rows.map(r =>
                    r.id === refRowId
                      ? { ...r, [targetColId]: toNumber(r[targetColId]) + delta }
                      : r
                  ),
                  updatedAt: now(),
                }
              : t
          ),
          updatedAt: now(),
        }
      : p
  );
};
