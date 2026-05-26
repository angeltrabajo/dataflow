import type { Table, Project } from '@/shared/types/Project';

export interface UpdateTableResponse {
  success: boolean;
  data?: {
    updatedTable: Table;
    newProjects: Project[];
  };
  errors?: string[];
}
