import type { Row, Project } from '@/shared/types/Project';

export interface CreateRowResponse {
  success: boolean;
  data?: {
    newRow: Row;
    newProjects: Project[];
  };
  errors?: string[];
}
