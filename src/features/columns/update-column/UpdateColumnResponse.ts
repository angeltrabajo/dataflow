import type { Column, Project } from '@/shared/types/Project';

export interface UpdateColumnResponse {
  success: boolean;
  data?: {
    updatedColumn: Column;
    newProjects: Project[];
  };
  errors?: string[];
}
