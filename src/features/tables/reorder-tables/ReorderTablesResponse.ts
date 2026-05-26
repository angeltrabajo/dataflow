import type { Project } from '@/shared/types/Project';

export interface ReorderTablesResponse {
  success: boolean;
  data?: {
    newProjects: Project[];
  };
  errors?: string[];
}
