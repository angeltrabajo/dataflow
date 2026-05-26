import { DeleteProjectHandler } from './DeleteProjectHandler';
import type { DeleteProjectCommand } from './DeleteProjectCommand';
import type { Project } from '@/shared/types/Project';

describe('DeleteProjectHandler', () => {
  let handler: DeleteProjectHandler;
  const existingProject: Project = {
    id: 'proj-1',
    name: 'Proyecto',
    emoji: '📁',
    description: '',
    color: '#000',
    tables: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new DeleteProjectHandler();
  });

  it('debe eliminar un proyecto exitosamente', async () => {
    // Arrange
    const command: DeleteProjectCommand = {
      projectId: 'proj-1',
      selectedProjectId: 'proj-1',
      currentView: 'project',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newProjects).toHaveLength(0);
  });

  it('debe resetear la selección si se elimina el proyecto seleccionado', async () => {
    // Arrange
    const command: DeleteProjectCommand = {
      projectId: 'proj-1',
      selectedProjectId: 'proj-1',
      currentView: 'project',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.selectedProjectId).toBeNull();
    expect(result.data!.currentView).toBe('dashboard');
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: DeleteProjectCommand = {
      projectId: '',
      selectedProjectId: null,
      currentView: 'dashboard',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
