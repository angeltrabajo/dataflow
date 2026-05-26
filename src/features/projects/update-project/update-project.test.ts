import { UpdateProjectHandler } from './UpdateProjectHandler';
import type { UpdateProjectCommand } from './UpdateProjectCommand';
import type { Project } from '@/shared/types/Project';

describe('UpdateProjectHandler', () => {
  let handler: UpdateProjectHandler;
  const existingProject: Project = {
    id: 'proj-1',
    name: 'Original',
    emoji: '📁',
    description: 'Desc',
    color: '#000',
    tables: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new UpdateProjectHandler();
  });

  it('debe actualizar un proyecto exitosamente', async () => {
    // Arrange
    const command: UpdateProjectCommand = {
      projectId: 'proj-1',
      data: { name: 'Actualizado' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.updatedProject.name).toBe('Actualizado');
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: UpdateProjectCommand = {
      projectId: '',
      data: {},
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si el proyecto no existe', async () => {
    // Arrange
    const command: UpdateProjectCommand = {
      projectId: 'no-existe',
      data: { name: 'Test' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Proyecto no encontrado');
  });
});
