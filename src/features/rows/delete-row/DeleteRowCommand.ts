export interface DeleteRowCommand {
  projectId: string;
  tableId: string;
  rowId: string;
}

export const validateDeleteRowCommand = (cmd: DeleteRowCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  if (!cmd.rowId) errors.push('rowId es obligatorio');
  return errors;
};
