import { CreateProjectHandler } from './CreateProjectHandler';
import type { CreateProjectCommand } from './CreateProjectCommand';
import type { Project } from '@/shared/types/Project';

describe('CreateProjectHandler', () => {
  let handler: CreateProjectHandler;

  beforeEach(() => {
    handler = new CreateProjectHandler();
  });

  it('debe crear un proyecto exitosamente', async () => {
    // Arrange
    const command: CreateProjectCommand = {
      name: 'Mi Proyecto',
      emoji: '📁',
      description: 'Un proyecto de prueba',
      color: '#6366F1',
    };
    const existingProjects: Project[] = [];

    // Act
    const result = await handler.execute(command, existingProjects);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.project.name).toBe('Mi Proyecto');
    expect(result.data!.newProjects).toHaveLength(1);
  });

  it('debe fallar si el nombre está vacío', async () => {
    // Arrange
    const command: CreateProjectCommand = {
      name: '',
      emoji: '',
      description: '',
      color: '',
    };

    // Act
    const result = await handler.execute(command, []);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('debe generar un id y timestamps para el nuevo proyecto', async () => {
    // Arrange
    const command: CreateProjectCommand = {
      name: 'Proyecto con timestamps',
      emoji: '📂',
      description: '',
      color: '#000000',
    };

    // Act
    const result = await handler.execute(command, []);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.project.id).toBeDefined();
    expect(result.data!.project.createdAt).toBeDefined();
    expect(result.data!.project.updatedAt).toBeDefined();
  });
});
