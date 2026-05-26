export interface UndoActionCommand {
  undoStack: string[];
  redoStack: string[];
  currentProjectsJson: string;
}

export const validateUndoActionCommand = (cmd: UndoActionCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.undoStack || cmd.undoStack.length === 0) errors.push('undoStack está vacío');
  return errors;
};
