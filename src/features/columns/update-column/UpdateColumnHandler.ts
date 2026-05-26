import type { UpdateColumnCommand } from './UpdateColumnCommand';
import type { UpdateColumnResponse } from './UpdateColumnResponse';
import type { Project, Row } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateUpdateColumnCommand } from './UpdateColumnCommand';

export class UpdateColumnHandler {
  async execute(command: UpdateColumnCommand, currentProjects: Project[]): Promise<UpdateColumnResponse> {
    const errors = validateUpdateColumnCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const column = table.columns.find(c => c.id === command.columnId);
    if (!column) return { success: false, errors: ['Columna no encontrada'] };

    // Check if updating to autonumber type or changing autonumber prefix/digits
    const isBecomingAutonumber = command.data.type === 'autonumber' && column.type !== 'autonumber';
    const isAutonumberConfigChange =
      (column.type === 'autonumber' || command.data.type === 'autonumber') &&
      (command.data.autonumberPrefix !== undefined || command.data.autonumberDigits !== undefined);

    let updatedRows: Row[] = table.rows;

    if (isBecomingAutonumber) {
      // Column changed TO autonumber: populate all existing rows
      const prefix = command.data.autonumberPrefix || '';
      const digits = command.data.autonumberDigits || 0;
      const sectionColIds = new Set(table.repeatableSection?.columnIds || []);
      const isSectionCol = sectionColIds.has(command.columnId);

      if (isSectionCol) {
        updatedRows = table.rows.map((row, idx) => {
          const num = idx + 1;
          const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
          return { ...row, [command.columnId]: `${prefix}${paddedNum}` };
        });
      } else {
        const groupMap = new Map<string, number>();
        let nextNum = 1;
        updatedRows = table.rows.map(row => {
          if (row._repeatGroupId) {
            if (!groupMap.has(row._repeatGroupId)) {
              groupMap.set(row._repeatGroupId, nextNum++);
            }
            const num = groupMap.get(row._repeatGroupId)!;
            const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
            return { ...row, [command.columnId]: `${prefix}${paddedNum}` };
          } else {
            const num = nextNum++;
            const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
            return { ...row, [command.columnId]: `${prefix}${paddedNum}` };
          }
        });
      }
    } else if (isAutonumberConfigChange) {
      // Autonumber prefix/digits changed: re-format all existing values
      const mergedCol = { ...column, ...command.data };
      const prefix = mergedCol.autonumberPrefix || '';
      const digits = mergedCol.autonumberDigits || 0;
      updatedRows = table.rows.map(row => {
        const val = row[command.columnId];
        if (val == null || val === '') return row;
        // Extract the numeric part (strip old prefix if possible)
        const oldPrefix = column.autonumberPrefix || '';
        const numStr = oldPrefix
          ? String(val).replace(new RegExp('^' + oldPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '')
          : String(val);
        const num = parseInt(numStr, 10);
        if (isNaN(num)) return row;
        const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
        return { ...row, [command.columnId]: `${prefix}${paddedNum}` };
      });
    }

    const updatedColumn = { ...column, ...command.data };
    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? {
                    ...t,
                    columns: t.columns.map(c => (c.id === command.columnId ? updatedColumn : c)),
                    rows: updatedRows,
                    updatedAt: now(),
                  }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    return { success: true, data: { updatedColumn, newProjects } };
  }
}
