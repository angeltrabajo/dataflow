import type { ReorderTablesCommand } from './ReorderTablesCommand';
import type { ReorderTablesResponse } from './ReorderTablesResponse';
import type { Project, Table } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateReorderTablesCommand } from './ReorderTablesCommand';

export class ReorderTablesHandler {
  async execute(command: ReorderTablesCommand, currentProjects: Project[]): Promise<ReorderTablesResponse> {
    const errors = validateReorderTablesCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: command.tableIds
              .map(id => p.tables.find(t => t.id === id))
              .filter(Boolean) as Table[],
            updatedAt: now(),
          }
        : p
    );

    return { success: true, data: { newProjects } };
  }
}
