import type { Project } from '@/shared/types/Project';

export interface UpdateRowResponse {
  success: boolean;
  data?: {
    newProjects: Project[];
  };
  errors?: string[];
}
