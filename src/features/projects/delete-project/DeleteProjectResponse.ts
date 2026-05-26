import type { Project } from '@/shared/types/Project';

export interface DeleteProjectResponse {
  success: boolean;
  data?: {
    newProjects: Project[];
    selectedProjectId: string | null;
    currentView: string;
  };
  errors?: string[];
}
