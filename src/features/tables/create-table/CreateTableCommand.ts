import type { Table } from '@/shared/types/Project';

export interface CreateTableCommand {
  projectId: string;
  name: string;
  emoji: string;
}

export const validateCreateTableCommand = (cmd: CreateTableCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.name || cmd.name.trim().length === 0) errors.push('name es obligatorio');
  return errors;
};
