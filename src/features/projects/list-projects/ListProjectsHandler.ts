import type { ListProjectsCommand } from './ListProjectsCommand';
import type { ListProjectsResponse } from './ListProjectsResponse';
import type { Project } from '@/shared/types/Project';

export class ListProjectsHandler {
  async execute(_command: ListProjectsCommand, currentProjects: Project[]): Promise<ListProjectsResponse> {
    return { success: true, data: { projects: currentProjects } };
  }
}
