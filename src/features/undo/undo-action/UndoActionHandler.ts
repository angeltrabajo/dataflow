import type { UndoActionCommand } from './UndoActionCommand';
import type { UndoActionResponse } from './UndoActionResponse';
import type { Project } from '@/shared/types/Project';
import { validateUndoActionCommand } from './UndoActionCommand';

export class UndoActionHandler {
  async execute(command: UndoActionCommand): Promise<UndoActionResponse> {
    const errors = validateUndoActionCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const snapshot = command.undoStack[0];
    const currentSnapshot = command.currentProjectsJson;
    const newUndoStack = command.undoStack.slice(1);

    return {
      success: true,
      data: {
        projects: JSON.parse(snapshot) as Project[],
        undoStack: newUndoStack,
        redoStack: [currentSnapshot, ...command.redoStack],
      },
    };
  }
}
