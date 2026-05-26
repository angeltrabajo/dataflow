import type { Table, Project } from '@/shared/types/Project';

export interface CreateTableResponse {
  success: boolean;
  data?: {
    newTable: Table;
    newProjects: Project[];
  };
  errors?: string[];
}
