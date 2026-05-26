import type { Project } from '@/shared/types/Project';

export interface UpdateProjectCommand {
  projectId: string;
  data: Partial<Project>;
}

export const validateUpdateProjectCommand = (cmd: UpdateProjectCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  return errors;
};
