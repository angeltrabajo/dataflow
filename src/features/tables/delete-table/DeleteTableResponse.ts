import type { Project } from '@/shared/types/Project';

export interface DeleteTableResponse {
  success: boolean;
  data?: {
    newProjects: Project[];
    selectedTableId: string | null;
    currentView: string;
  };
  errors?: string[];
}
