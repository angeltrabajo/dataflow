import type { Project } from '@/shared/types/Project';

export interface ListProjectsResponse {
  success: boolean;
  data?: {
    projects: Project[];
  };
  errors?: string[];
}
