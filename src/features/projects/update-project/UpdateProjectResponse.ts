import type { Project } from '@/shared/types/Project';

export interface UpdateProjectResponse {
  success: boolean;
  data?: {
    updatedProject: Project;
    newProjects: Project[];
  };
  errors?: string[];
}
