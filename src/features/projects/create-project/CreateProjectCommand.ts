export interface CreateProjectCommand {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export const validateCreateProjectCommand = (cmd: CreateProjectCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.name || cmd.name.trim().length === 0) errors.push('name es obligatorio');
  return errors;
};
