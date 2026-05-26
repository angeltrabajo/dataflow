import type { BatchAddRowsCommand } from './BatchAddRowsCommand';
import type { BatchAddRowsResponse } from './BatchAddRowsResponse';
import type { Project, Row } from '@/shared/types/Project';
import { generateId, now, toNumber, getNextAutonumber } from '@/shared/utils';
import { validateBatchAddRowsCommand } from './BatchAddRowsCommand';

export class BatchAddRowsHandler {
  async execute(command: BatchAddRowsCommand, currentProjects: Project[]): Promise<BatchAddRowsResponse> {
    const errors = validateBatchAddRowsCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const newRows: Row[] = command.rowsData.map(r => ({
      ...r,
      id: generateId(),
      _repeatGroupId: command.repeatGroupId,
    }));

    // Auto-generate autonumber values for each batch row
    const sectionColIds = new Set(table.repeatableSection?.columnIds || []);
    const autonumberCols = table.columns.filter(c => c.type === 'autonumber');

    if (autonumberCols.length > 0) {
      const virtualRows = [...table.rows];

      // Pre-compute global autonumber values (shared across all rows in the batch)
      const globalAutonumberValues: Record<string, string> = {};
      for (const col of autonumberCols) {
        if (!sectionColIds.has(col.id)) {
          globalAutonumberValues[col.id] = getNextAutonumber(virtualRows, col);
        }
      }

      for (const newRow of newRows) {
        for (const col of autonumberCols) {
          if (sectionColIds.has(col.id)) {
            // Section autonumber: unique per row
            const prefix = col.autonumberPrefix || '';
            const digits = col.autonumberDigits || 0;

            let maxNum = 0;
            for (const row of virtualRows) {
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
            newRow[col.id] = `${prefix}${paddedNum}`;
          } else {
            // Global autonumber: use the shared value
            newRow[col.id] = globalAutonumberValues[col.id];
          }
        }
        virtualRows.push(newRow);
      }
    }

    // Add the rows to the table
    let updatedProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? { ...t, rows: [...t.rows, ...newRows], updatedAt: now() }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    // Process refOnAdd and refAutoFillReverse for each new row
    for (const newRow of newRows) {
      for (const col of table.columns) {
        if (col.type === 'reference' && col.refOnAdd && col.refOnAdd.length > 0 && col.refTableId) {
          const refRowId = newRow[col.id];
          if (!refRowId) continue;

          for (const op of col.refOnAdd) {
            const sourceVal = toNumber(newRow[op.sourceColId]);
            if (isNaN(sourceVal) || sourceVal === 0) continue;

            const targetColId = op.targetColId;

            updatedProjects = updatedProjects.map(p =>
              p.id === command.projectId
                ? {
                    ...p,
                    tables: p.tables.map(t =>
                      t.id === col.refTableId
                        ? {
                            ...t,
                            rows: t.rows.map(r =>
                              r.id === refRowId
                                ? { ...r, [targetColId]: toNumber(r[targetColId]) + (op.operation === 'subtract' ? -sourceVal : sourceVal) }
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
          }
        }

        // refAutoFillReverse: copy data FROM current table TO referenced row
        if (col.type === 'reference' && col.refAutoFillReverse && col.refAutoFillReverse.length > 0 && col.refTableId) {
          const refRowId = newRow[col.id];
          if (!refRowId) continue;

          const reverseUpdates: Record<string, unknown> = {};
          for (const mapping of col.refAutoFillReverse) {
            const sourceValue = newRow[mapping.sourceColId];
            if (sourceValue !== undefined) {
              reverseUpdates[mapping.targetColId] = sourceValue;
            }
          }

          if (Object.keys(reverseUpdates).length > 0) {
            updatedProjects = updatedProjects.map(p =>
              p.id === command.projectId
                ? {
                    ...p,
                    tables: p.tables.map(t =>
                      t.id === col.refTableId
                        ? {
                            ...t,
                            rows: t.rows.map(r =>
                              r.id === refRowId ? { ...r, ...reverseUpdates } : r
                            ),
                            updatedAt: now(),
                          }
                        : t
                    ),
                    updatedAt: now(),
                  }
                : p
            );
          }
        }
      }
    }

    return { success: true, data: { newRows, newProjects: updatedProjects } };
  }
}
