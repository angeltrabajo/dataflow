export interface ReorderColumnsCommand {
  projectId: string;
  tableId: string;
  columnIds: string[];
}

export const validateReorderColumnsCommand = (cmd: ReorderColumnsCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.columnIds || cmd.columnIds.length === 0) errors.push('columnIds es obligatorio');
  return errors;
};
