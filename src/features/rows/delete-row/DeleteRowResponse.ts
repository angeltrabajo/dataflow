import type { Project } from '@/shared/types/Project';

export interface DeleteRowResponse {
  success: boolean;
  data?: {
    newProjects: Project[];
  };
  errors?: string[];
}
