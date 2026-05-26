import type { DeleteProjectCommand } from './DeleteProjectCommand';
import type { DeleteProjectResponse } from './DeleteProjectResponse';
import type { Project } from '@/shared/types/Project';
import { validateDeleteProjectCommand } from './DeleteProjectCommand';

export class DeleteProjectHandler {
  async execute(command: DeleteProjectCommand, currentProjects: Project[]): Promise<DeleteProjectResponse> {
    const errors = validateDeleteProjectCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const newProjects = currentProjects.filter(p => p.id !== command.projectId);
    const isSelected = command.selectedProjectId === command.projectId;

    return {
      success: true,
      data: {
        newProjects,
        selectedProjectId: isSelected ? null : command.selectedProjectId,
        currentView: isSelected ? 'dashboard' : command.currentView,
      },
    };
  }
}
