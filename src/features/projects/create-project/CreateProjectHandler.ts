import type { CreateProjectCommand } from './CreateProjectCommand';
import type { CreateProjectResponse } from './CreateProjectResponse';
import type { Project } from '@/shared/types/Project';
import { generateId, now } from '@/shared/utils';
import { validateCreateProjectCommand } from './CreateProjectCommand';

export class CreateProjectHandler {
  async execute(command: CreateProjectCommand, currentProjects: Project[]): Promise<CreateProjectResponse> {
    const errors = validateCreateProjectCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const newProject: Project = {
      ...command,
      id: generateId(),
      tables: [],
      createdAt: now(),
      updatedAt: now(),
    };

    return {
      success: true,
      data: { project: newProject, newProjects: [...currentProjects, newProject] },
    };
  }
}
