import type { Column } from '@/shared/types/Project';

export interface UpdateColumnCommand {
  projectId: string;
  tableId: string;
  columnId: string;
  data: Partial<Column>;
}

export const validateUpdateColumnCommand = (cmd: UpdateColumnCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.columnId) errors.push('columnId es obligatorio');
  return errors;
};
