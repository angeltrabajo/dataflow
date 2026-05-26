import type { ReorderColumnsCommand } from './ReorderColumnsCommand';
import type { ReorderColumnsResponse } from './ReorderColumnsResponse';
import type { Project, Column } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateReorderColumnsCommand } from './ReorderColumnsCommand';

export class ReorderColumnsHandler {
  async execute(command: ReorderColumnsCommand, currentProjects: Project[]): Promise<ReorderColumnsResponse> {
    const errors = validateReorderColumnsCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t =>
              t.id === command.tableId
                ? {
                    ...t,
                    columns: command.columnIds
                      .map(id => t.columns.find(c => c.id === id))
                      .filter(Boolean) as Column[],
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
