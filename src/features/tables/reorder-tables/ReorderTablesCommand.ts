export interface ReorderTablesCommand {
  projectId: string;
  tableIds: string[];
}

export const validateReorderTablesCommand = (cmd: ReorderTablesCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.projectId) errors.push('projectId es obligatorio');
  if (!cmd.tableIds || cmd.tableIds.length === 0) errors.push('tableIds es obligatorio');
  return errors;
};
