export interface DeleteProjectCommand {
  projectId: string;
  selectedProjectId: string | null;
  currentView: string;
}

export const validateDeleteProjectCommand = (cmd: DeleteProjectCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  return errors;
};
