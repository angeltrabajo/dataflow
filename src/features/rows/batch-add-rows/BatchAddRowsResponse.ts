import type { Row, Project } from '@/shared/types/Project';

export interface BatchAddRowsResponse {
  success: boolean;
  data?: {
    newRows: Row[];
    newProjects: Project[];
  };
  errors?: string[];
}
