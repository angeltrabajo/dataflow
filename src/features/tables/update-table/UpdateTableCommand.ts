import type { Table } from '@/shared/types/Project';

export interface UpdateTableCommand {
  projectId: string;
  tableId: string;
  data: Partial<Table>;
}

export const validateUpdateTableCommand = (cmd: UpdateTableCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  return errors;
};
