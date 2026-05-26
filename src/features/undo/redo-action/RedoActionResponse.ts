import type { Project } from '@/shared/types/Project';

export interface RedoActionResponse {
  success: boolean;
  data?: {
    projects: Project[];
    undoStack: string[];
    redoStack: string[];
  };
  errors?: string[];
}
