import type { DeleteRowCommand } from './DeleteRowCommand';
import type { DeleteRowResponse } from './DeleteRowResponse';
import type { Project } from '@/shared/types/Project';
import { now, toNumber } from '@/shared/utils';
import { validateDeleteRowCommand } from './DeleteRowCommand';

export class DeleteRowHandler {
  async execute(command: DeleteRowCommand, currentProjects: Project[]): Promise<DeleteRowResponse> {
    const errors = validateDeleteRowCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const rowToDelete = table.rows.find(r => r.id === command.rowId);
    if (!rowToDelete) return { success: false, errors: ['Fila no encontrada'] };

    // Remove the row
    let updatedProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? { ...t, rows: t.rows.filter(r => r.id !== command.rowId), updatedAt: now() }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    // Process refOnDelete: update referenced rows when a row is deleted
    for (const col of table.columns) {
      if (col.type === 'reference' && col.refOnDelete && col.refOnDelete.length > 0 && col.refTableId) {
        const refRowId = rowToDelete[col.id];
        if (!refRowId) continue;

        for (const op of col.refOnDelete) {
          const sourceVal = toNumber(rowToDelete[op.sourceColId]);
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
    }

    // Clean up orphaned repeat groups: if only 1 row remains in a group, remove its _repeatGroupId
    const updatedTable = updatedProjects
      .find(p => p.id === command.projectId)
      ?.tables.find(t => t.id === command.tableId);

    if (updatedTable) {
      const groupCounts: Record<string, number> = {};
      for (const r of updatedTable.rows) {
        if (r._repeatGroupId) {
          groupCounts[r._repeatGroupId] = (groupCounts[r._repeatGroupId] || 0) + 1;
        }
      }
      const orphanedGroups = Object.entries(groupCounts)
        .filter(([_, count]) => count <= 1)
        .map(([gid]) => gid);

      if (orphanedGroups.length > 0) {
        const orphanSet = new Set(orphanedGroups);
        updatedProjects = updatedProjects.map(p =>
          p.id === command.projectId
            ? {
                ...p,
                tables: p.tables.map(t =>
                  t.id === command.tableId
                    ? {
                        ...t,
                        rows: t.rows.map(r =>
                          r._repeatGroupId && orphanSet.has(r._repeatGroupId)
                            ? (() => { const { _repeatGroupId, ...rest } = r; return rest; })()
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

    return { success: true, data: { newProjects: updatedProjects } };
  }
}
