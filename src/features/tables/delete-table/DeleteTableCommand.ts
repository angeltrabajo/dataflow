export interface DeleteTableCommand {
  projectId: string;
  tableId: string;
  selectedTableId: string | null;
  currentView: string;
}

export const validateDeleteTableCommand = (cmd: DeleteTableCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableId) errors.push('tableId es obligatorio');
  return errors;
};
