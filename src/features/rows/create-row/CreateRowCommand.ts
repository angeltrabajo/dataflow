import type { Row } from '@/shared/types/Project';

export interface CreateRowCommand {
  projectId: string;
  tableId: string;
  rowData: Omit<Row, 'id'>;
}

export const validateCreateRowCommand = (cmd: CreateRowCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  return errors;
};
