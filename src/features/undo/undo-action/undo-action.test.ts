import { UndoActionHandler } from './UndoActionHandler';
import type { UndoActionCommand } from './UndoActionCommand';
import type { Project } from '@/shared/types/Project';

describe('UndoActionHandler', () => {
  let handler: UndoActionHandler;
  const project: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new UndoActionHandler();
  });

  it('debe deshacer una acción exitosamente', async () => {
    // Arrange
    const previousState: Project[] = [];
    const command: UndoActionCommand = {
      undoStack: [JSON.stringify(previousState)],
      redoStack: [],
      currentProjectsJson: JSON.stringify([project]),
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.projects).toEqual(previousState);
    expect(result.data!.undoStack).toHaveLength(0);
    expect(result.data!.redoStack).toHaveLength(1);
  });

  it('debe fallar si el undoStack está vacío', async () => {
    // Arrange
    const command: UndoActionCommand = {
      undoStack: [],
      redoStack: [],
      currentProjectsJson: JSON.stringify([project]),
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
