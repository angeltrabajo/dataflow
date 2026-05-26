import type { CreateTableCommand } from './CreateTableCommand';
import type { CreateTableResponse } from './CreateTableResponse';
import type { Project } from '@/shared/types/Project';
import { generateId, now } from '@/shared/utils';
import { validateCreateTableCommand } from './CreateTableCommand';

export class CreateTableHandler {
  async execute(command: CreateTableCommand, currentProjects: Project[]): Promise<CreateTableResponse> {
    const errors = validateCreateTableCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const newTable = {
      ...command,
      id: generateId(),
      columns: [
        { id: generateId(), name: 'Nombre', type: 'text' as const, required: true },
      ],
      rows: [],
      createdAt: now(),
      updatedAt: now(),
    };

    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? { ...p, tables: [...p.tables, newTable], updatedAt: now() }
        : p
    );

    return { success: true, data: { newTable, newProjects } };
  }
}
