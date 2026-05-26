import type { Row } from '@/shared/types/Project';

export interface BatchAddRowsCommand {
  projectId: string;
  tableId: string;
  rowsData: Omit<Row, 'id'>[];
  repeatGroupId: string;
}

export const validateBatchAddRowsCommand = (cmd: BatchAddRowsCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.rowsData || cmd.rowsData.length === 0) errors.push('rowsData es obligatorio');
  if (!cmd.repeatGroupId) errors.push('repeatGroupId es obligatorio');
  return errors;
};
