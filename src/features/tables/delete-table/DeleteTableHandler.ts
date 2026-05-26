import type { DeleteTableCommand } from './DeleteTableCommand';
import type { DeleteTableResponse } from './DeleteTableResponse';
import type { Project } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateDeleteTableCommand } from './DeleteTableCommand';

export class DeleteTableHandler {
  async execute(command: DeleteTableCommand, currentProjects: Project[]): Promise<DeleteTableResponse> {
    const errors = validateDeleteTableCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const newProjects = currentProjects.map(p =>
      p.id === command.projectId
        ? { ...p, tables: p.tables.filter(t => t.id !== command.tableId), updatedAt: now() }
        : p
    );

    const isSelected = command.selectedTableId === command.tableId;

    return {
      success: true,
      data: {
        newProjects,
        selectedTableId: isSelected ? null : command.selectedTableId,
        currentView: isSelected ? 'project' : command.currentView,
      },
    };
  }
}
