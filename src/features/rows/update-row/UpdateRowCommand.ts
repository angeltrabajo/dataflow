import type { Row } from '@/shared/types/Project';

export interface UpdateRowCommand {
  projectId: string;
  tableId: string;
  rowId: string;
  data: Partial<Row>;
}

export const validateUpdateRowCommand = (cmd: UpdateRowCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.rowId) errors.push('rowId es obligatorio');
  return errors;
};
