import type { Project } from '@/shared/types/Project';

export interface DeleteColumnResponse {
  success: boolean;
  data?: {
    newProjects: Project[];
  };
  errors?: string[];
}
