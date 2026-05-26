export interface RedoActionCommand {
  undoStack: string[];
  redoStack: string[];
  currentProjectsJson: string;
}

export const validateRedoActionCommand = (cmd: RedoActionCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.redoStack || cmd.redoStack.length === 0) errors.push('redoStack está vacío');
  return errors;
};
