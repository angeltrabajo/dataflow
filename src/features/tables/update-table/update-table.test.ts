import { UpdateTableHandler } from './UpdateTableHandler';
import type { UpdateTableCommand } from './UpdateTableCommand';
import type { Project, Table } from '@/shared/types/Project';

describe('UpdateTableHandler', () => {
  let handler: UpdateTableHandler;
  const existingTable: Table = {
    id: 'tab-1',
    name: 'Tabla Original',
    emoji: '📊',
    columns: [],
    rows: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1',
    name: 'Proyecto',
    emoji: '📁',
    description: '',
    color: '#000',
    tables: [existingTable],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new UpdateTableHandler();
  });

  it('debe actualizar una tabla exitosamente', async () => {
    // Arrange
    const command: UpdateTableCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      data: { name: 'Tabla Actualizada' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.updatedTable.name).toBe('Tabla Actualizada');
  });

  it('debe fallar si la tabla no existe', async () => {
    // Arrange
    const command: UpdateTableCommand = {
      projectId: 'proj-1',
      tableId: 'no-existe',
      data: { name: 'Test' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Tabla no encontrada');
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: UpdateTableCommand = {
      projectId: '',
      tableId: 'tab-1',
      data: {},
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
