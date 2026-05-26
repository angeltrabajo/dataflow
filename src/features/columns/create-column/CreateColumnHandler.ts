import type { CreateColumnCommand } from './CreateColumnCommand';
import type { CreateColumnResponse } from './CreateColumnResponse';
import type { Project, Column, Row } from '@/shared/types/Project';
import { generateId, now } from '@/shared/utils';
import { validateCreateColumnCommand } from './CreateColumnCommand';

export class CreateColumnHandler {
  async execute(command: CreateColumnCommand, currentProjects: Project[]): Promise<CreateColumnResponse> {
    const errors = validateCreateColumnCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const newColumn: Column = { ...command.column, id: generateId() };

    // If adding an autonumber column, retroactively populate existing rows
    let rowsWithAutonumber: Row[] = table.rows;
    if (newColumn.type === 'autonumber') {
      const sectionColIds = new Set(table.repeatableSection?.columnIds || []);

      if (sectionColIds.has(newColumn.id)) {
        // Section autonumber: each row gets unique number
        rowsWithAutonumber = table.rows.map((row, idx) => {
          const prefix = newColumn.autonumberPrefix || '';
          const digits = newColumn.autonumberDigits || 0;
          const num = idx + 1;
          const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
          return { ...row, [newColumn.id]: `${prefix}${paddedNum}` };
        });
      } else {
        // Global autonumber: same number per group, unique per non-grouped row
        const groupMap = new Map<string, number>();
        let nextNum = 1;
        rowsWithAutonumber = table.rows.map(row => {
          const prefix = newColumn.autonumberPrefix || '';
          const digits = newColumn.autonumberDigits || 0;

          if (row._repeatGroupId) {
            if (!groupMap.has(row._repeatGroupId)) {
              groupMap.set(row._repeatGroupId, nextNum++);
            }
            const num = groupMap.get(row._repeatGroupId)!;
            const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
            return { ...row, [newColumn.id]: `${prefix}${paddedNum}` };
          } else {
            const num = nextNum++;
            const paddedNum = digits > 0 ? String(num).padStart(digits, '0') : String(num);
            return { ...row, [newColumn.id]: `${prefix}${paddedNum}` };
          }
        });
      }
    }

    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? { ...t, columns: [...t.columns, newColumn], rows: rowsWithAutonumber, updatedAt: now() }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    return { success: true, data: { newColumn, newProjects } };
  }
}
