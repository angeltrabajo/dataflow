import type { Column } from '@/shared/types/Project';

export interface CreateColumnCommand {
  projectId: string;
  tableId: string;
  column: Omit<Column, 'id'>;
}

export const validateCreateColumnCommand = (cmd: CreateColumnCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.column.name || cmd.column.name.trim().length === 0) errors.push('column.name es obligatorio');
  return errors;
};
