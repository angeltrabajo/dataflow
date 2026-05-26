import { CreateTableHandler } from './CreateTableHandler';
import type { CreateTableCommand } from './CreateTableCommand';
import type { Project } from '@/shared/types/Project';

describe('CreateTableHandler', () => {
  let handler: CreateTableHandler;
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
    handler = new CreateTableHandler();
  });

  it('debe crear una tabla exitosamente con columna "Nombre" por defecto', async () => {
    // Arrange
    const command: CreateTableCommand = {
      projectId: 'proj-1',
      name: 'Mi Tabla',
      emoji: '📊',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newTable.name).toBe('Mi Tabla');
    expect(result.data!.newTable.columns).toHaveLength(1);
    expect(result.data!.newTable.columns[0].name).toBe('Nombre');
  });

  it('debe fallar si el nombre de la tabla está vacío', async () => {
    // Arrange
    const command: CreateTableCommand = {
      projectId: 'proj-1',
      name: '',
      emoji: '',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si el proyecto no existe', async () => {
    // Arrange
    const command: CreateTableCommand = {
      projectId: 'no-existe',
      name: 'Tabla',
      emoji: '📊',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Proyecto no encontrado');
  });
});
