import type { CreateRowCommand } from './CreateRowCommand';
import type { CreateRowResponse } from './CreateRowResponse';
import type { Project, Row } from '@/shared/types/Project';
import { generateId, now, toNumber, getNextAutonumber } from '@/shared/utils';
import { validateCreateRowCommand } from './CreateRowCommand';

export class CreateRowHandler {
  async execute(command: CreateRowCommand, currentProjects: Project[]): Promise<CreateRowResponse> {
    const errors = validateCreateRowCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const newRow: Row = { ...command.rowData, id: generateId() };

    // Auto-generate autonumber values using MAX-based counter
    for (const col of table.columns) {
      if (col.type === 'autonumber') {
        newRow[col.id] = getNextAutonumber(table.rows, col);
      }
    }

    // Add the row to the table
    let updatedProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? { ...t, rows: [...t.rows, newRow], updatedAt: now() }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    // Process refOnAdd: update referenced rows when a new row is added
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

    return { success: true, data: { newRow, newProjects: updatedProjects } };
  }
}
