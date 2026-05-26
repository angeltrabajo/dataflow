import { UpdateColumnHandler } from './UpdateColumnHandler';
import type { UpdateColumnCommand } from './UpdateColumnCommand';
import type { Project, Table, Column } from '@/shared/types/Project';

describe('UpdateColumnHandler', () => {
  let handler: UpdateColumnHandler;
  const existingColumn: Column = {
    id: 'col-1', name: 'Nombre', type: 'text', required: true,
  };
  const existingTable: Table = {
    id: 'tab-1', name: 'Tabla', emoji: '📊',
    columns: [existingColumn], rows: [{ id: 'row-1', 'col-1': 'Test' }],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [existingTable],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new UpdateColumnHandler();
  });

  it('debe actualizar una columna exitosamente', async () => {
    // Arrange
    const command: UpdateColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnId: 'col-1',
      data: { name: 'Nombre Completo' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.updatedColumn.name).toBe('Nombre Completo');
  });

  it('debe fallar si la columna no existe', async () => {
    // Arrange
    const command: UpdateColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnId: 'no-existe',
      data: { name: 'Test' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Columna no encontrada');
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: UpdateColumnCommand = {
      projectId: '',
      tableId: 'tab-1',
      columnId: 'col-1',
      data: {},
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
