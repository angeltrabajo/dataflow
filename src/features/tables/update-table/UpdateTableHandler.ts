import type { UpdateTableCommand } from './UpdateTableCommand';
import type { UpdateTableResponse } from './UpdateTableResponse';
import type { Project } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateUpdateTableCommand } from './UpdateTableCommand';

export class UpdateTableHandler {
  async execute(command: UpdateTableCommand, currentProjects: Project[]): Promise<UpdateTableResponse> {
    const errors = validateUpdateTableCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const table = project.tables.find(t => t.id === command.tableId);
    if (!table) return { success: false, errors: ['Tabla no encontrada'] };

    const updatedTable = { ...table, ...command.data, updatedAt: now() };
    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? {
            ...p,
            tables: p.tables.map(t => (t.id === command.tableId ? updatedTable : t)),
            updatedAt: now(),
          }
        : p
    );

    return { success: true, data: { updatedTable, newProjects } };
  }
}
