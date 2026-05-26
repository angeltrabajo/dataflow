import type { DeleteColumnCommand } from './DeleteColumnCommand';
import type { DeleteColumnResponse } from './DeleteColumnResponse';
import type { Project, Column } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateDeleteColumnCommand } from './DeleteColumnCommand';

export class DeleteColumnHandler {
  async execute(command: DeleteColumnCommand, currentProjects: Project[]): Promise<DeleteColumnResponse> {
    const errors = validateDeleteColumnCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const rsColumnIds = table.repeatableSection?.columnIds.filter(id => id !== command.columnId) ?? [];

    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? {
                    ...t,
                    // Remove the column
                    columns: t.columns
                      .filter(c => c.id !== command.columnId)
                      // Clean complementaryOf references to the deleted column
                      .map((c): Column => {
                        if (c.complementaryOf) {
                          if (
                            c.complementaryOf.totalColId === command.columnId ||
                            c.complementaryOf.otherColId === command.columnId
                          ) {
                            const { complementaryOf, ...rest } = c;
                            return rest as Column;
                          }
                        }
                        return c;
                      }),
                    // Clean up row data for that column
                    rows: t.rows.map(r => {
                      const newRow = { ...r };
                      delete newRow[command.columnId];
                      return newRow;
                    }),
                    // Clean up repeatableSection: remove column, disable if empty
                    repeatableSection: t.repeatableSection
                      ? rsColumnIds.length > 0
                        ? { ...t.repeatableSection, columnIds: rsColumnIds }
                        : undefined
                      : undefined,
                    updatedAt: now(),
                  }
                : t
            ),
            updatedAt: now(),
          }
        : p
    );

    return { success: true, data: { newProjects } };
  }
}
