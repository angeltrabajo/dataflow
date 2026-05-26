import { RedoActionHandler } from './RedoActionHandler';
import type { RedoActionCommand } from './RedoActionCommand';
import type { Project } from '@/shared/types/Project';

describe('RedoActionHandler', () => {
  let handler: RedoActionHandler;
  const project: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new RedoActionHandler();
  });

  it('debe rehacer una acción exitosamente', async () => {
    // Arrange
    const nextState: Project[] = [project];
    const command: RedoActionCommand = {
      undoStack: [],
      redoStack: [JSON.stringify(nextState)],
      currentProjectsJson: JSON.stringify([]),
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.projects).toEqual(nextState);
    expect(result.data!.redoStack).toHaveLength(0);
    expect(result.data!.undoStack).toHaveLength(1);
  });

  it('debe fallar si el redoStack está vacío', async () => {
    // Arrange
    const command: RedoActionCommand = {
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
