import type { UpdateProjectCommand } from './UpdateProjectCommand';
import type { UpdateProjectResponse } from './UpdateProjectResponse';
import type { Project } from '@/shared/types/Project';
import { now } from '@/shared/utils';
import { validateUpdateProjectCommand } from './UpdateProjectCommand';

export class UpdateProjectHandler {
  async execute(command: UpdateProjectCommand, currentProjects: Project[]): Promise<UpdateProjectResponse> {
    const errors = validateUpdateProjectCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const project = currentProjects.find(p => p.id === command.projectId);
    if (!project) return { success: false, errors: ['Proyecto no encontrado'] };

    const updatedProject: Project = { ...project, ...command.data, updatedAt: now() };
    const newProjects = currentProjects.map(p =>
      p.id === command.projectId ? updatedProject : p
    );

    return { success: true, data: { updatedProject, newProjects } };
  }
}
