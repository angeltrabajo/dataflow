import type { Column, Project } from '@/shared/types/Project';

export interface CreateColumnResponse {
  success: boolean;
  data?: {
    newColumn: Column;
    newProjects: Project[];
  };
  errors?: string[];
}
