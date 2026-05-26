export interface DeleteColumnCommand {
  projectId: string;
  tableId: string;
  columnId: string;
}

export const validateDeleteColumnCommand = (cmd: DeleteColumnCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.columnId) errors.push('columnId es obligatorio');
  return errors;
};
