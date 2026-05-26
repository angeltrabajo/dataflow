import type { RedoActionCommand } from './RedoActionCommand';
import type { RedoActionResponse } from './RedoActionResponse';
import type { Project } from '@/shared/types/Project';
import { validateRedoActionCommand } from './RedoActionCommand';

export class RedoActionHandler {
  async execute(command: RedoActionCommand): Promise<RedoActionResponse> {
    const errors = validateRedoActionCommand(command);
    if (errors.length > 0) return { success: false, errors };

    const snapshot = command.redoStack[0];
    const currentSnapshot = command.currentProjectsJson;
    const newRedoStack = command.redoStack.slice(1);

    return {
      success: true,
      data: {
        projects: JSON.parse(snapshot) as Project[],
        undoStack: [currentSnapshot, ...command.undoStack],
        redoStack: newRedoStack,
      },
    };
  }
}
