import type { Project } from '@/shared/types/Project';

export interface CreateProjectResponse {
  success: boolean;
  data?: {
    project: Project;
    newProjects: Project[];
  };
  errors?: string[];
}
