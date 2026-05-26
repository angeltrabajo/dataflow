import type { UpdateRowCommand } from './UpdateRowCommand';
import type { UpdateRowResponse } from './UpdateRowResponse';
import type { Project } from '@/shared/types/Project';
import { now, toNumber, applyRefDelta, getGlobalColumnIds } from '@/shared/utils';
import { validateUpdateRowCommand } from './UpdateRowCommand';

export class UpdateRowHandler {
  async execute(command: UpdateRowCommand, currentProjects: Project[]): Promise<UpdateRowResponse> {
    const errors = validateUpdateRowCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const oldRow = table.rows.find(r => r.id === command.rowId);
    if (!oldRow) return { success: false, errors: ['Fila no encontrada'] };

    // Identify global field changes for repeatable group propagation
    const globalColIds = getGlobalColumnIds(table);
    const repeatGroupId = oldRow._repeatGroupId;
    const globalChanges: Record<string, unknown> = {};

    if (repeatGroupId && globalColIds.size > 0) {
      for (const key of Object.keys(command.data)) {
        if (key !== 'id' && key !== '_repeatGroupId' && globalColIds.has(key)) {
          globalChanges[key] = command.data[key];
        }
      }
    }

    let updatedProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? {
                    ...t,
                    rows: t.rows.map(r => {
                      if (r.id === command.rowId) return { ...r, ...command.data };
                      // Propagate global field changes to sibling rows in same repeat group
                      if (
                        repeatGroupId &&
                        r._repeatGroupId === repeatGroupId &&
                        Object.keys(globalChanges).length > 0
                      ) {
                        return { ...r, ...globalChanges };
                      }
                      return r;
                    }),
                    updatedAt: now(),
                  }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    // Handle reference changes: correctly update referenced rows when a row is modified
    for (const col of table.columns) {
      if (col.type !== 'reference' || !col.refTableId) continue;

      // refOnAdd delta tracking
      if (col.refOnAdd && col.refOnAdd.length > 0) {
        for (const op of col.refOnAdd) {
          const sourceColId = op.sourceColId;
          const targetColId = op.targetColId;
          const operation = op.operation;

          const oldRefId = oldRow[col.id];
          const newRefId = col.id in command.data ? command.data[col.id] : oldRow[col.id];

          const oldSourceVal = toNumber(oldRow[sourceColId]);
          const newSourceVal = toNumber(sourceColId in command.data ? command.data[sourceColId] : oldRow[sourceColId]);

          const refChanged = oldRefId !== newRefId;
          const sourceChanged = oldSourceVal !== newSourceVal;

          if (!refChanged && !sourceChanged) continue;

          if (refChanged) {
            if (oldRefId && oldSourceVal !== 0) {
              const delta = operation === 'subtract' ? oldSourceVal : -oldSourceVal;
              updatedProjects = applyRefDelta(updatedProjects, command.projectId, col.refTableId, oldRefId as string, targetColId, delta);
            }
            if (newRefId && newSourceVal !== 0) {
              const delta = operation === 'subtract' ? -newSourceVal : newSourceVal;
              updatedProjects = applyRefDelta(updatedProjects, command.projectId, col.refTableId, newRefId as string, targetColId, delta);
            }
          } else {
            const delta = newSourceVal - oldSourceVal;
            if (newRefId && delta !== 0) {
              const adjustedDelta = operation === 'subtract' ? -delta : delta;
              updatedProjects = applyRefDelta(updatedProjects, command.projectId, col.refTableId, newRefId as string, targetColId, adjustedDelta);
            }
          }
        }
      }

      // refOnEdit: update referenced row when source column value changes during edit
      if (col.refOnEdit && col.refOnEdit.length > 0) {
        for (const op of col.refOnEdit) {
          const sourceColId = op.sourceColId;
          const targetColId = op.targetColId;
          const operation = op.operation;

          const oldRefId = oldRow[col.id];
          const newRefId = col.id in command.data ? command.data[col.id] : oldRow[col.id];

          const oldSourceVal = toNumber(oldRow[sourceColId]);
          const newSourceVal = toNumber(sourceColId in command.data ? command.data[sourceColId] : oldRow[sourceColId]);

          const refChanged = oldRefId !== newRefId;
          const sourceChanged = oldSourceVal !== newSourceVal;

          if (!refChanged && !sourceChanged) continue;

          if (refChanged) {
            // Reference changed: reverse effect on old referenced row, apply on new
            if (oldRefId && oldSourceVal !== 0) {
              const delta = operation === 'subtract' ? oldSourceVal : -oldSourceVal;
              updatedProjects = applyRefDelta(updatedProjects, command.projectId, col.refTableId, oldRefId as string, targetColId, delta);
            }
            if (newRefId && newSourceVal !== 0) {
              const delta = operation === 'subtract' ? -newSourceVal : newSourceVal;
              updatedProjects = applyRefDelta(updatedProjects, command.projectId, col.refTableId, newRefId as string, targetColId, delta);
            }
          } else {
            // Source value changed: apply delta to the same referenced row
            const delta = newSourceVal - oldSourceVal;
            if (newRefId && delta !== 0) {
              const adjustedDelta = operation === 'subtract' ? -delta : delta;
              updatedProjects = applyRefDelta(updatedProjects, command.projectId, col.refTableId, newRefId as string, targetColId, adjustedDelta);
            }
          }
        }
      }

      // refAutoFillReverse: update referenced row with data from current row on edit
      if (col.refAutoFillReverse && col.refAutoFillReverse.length > 0) {
        const refRowId = col.id in command.data ? command.data[col.id] : oldRow[col.id];
        if (!refRowId) continue;

        // Check if any source column in the mapping was changed
        const mergedRow = { ...oldRow, ...command.data };
        const reverseUpdates: Record<string, unknown> = {};
        let hasChanges = false;
        for (const mapping of col.refAutoFillReverse) {
          const sourceValue = mergedRow[mapping.sourceColId];
          if (sourceValue !== undefined) {
            reverseUpdates[mapping.targetColId] = sourceValue;
            if (mapping.sourceColId in command.data) hasChanges = true;
          }
        }

        // Also apply if reference itself changed
        const refChanged = col.id in command.data && command.data[col.id] !== oldRow[col.id];
        if ((hasChanges || refChanged) && Object.keys(reverseUpdates).length > 0) {
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

    return { success: true, data: { newProjects: updatedProjects } };
  }
}
