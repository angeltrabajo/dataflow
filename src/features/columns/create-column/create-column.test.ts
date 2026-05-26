import { CreateColumnHandler } from './CreateColumnHandler';
import type { CreateColumnCommand } from './CreateColumnCommand';
import type { Project, Table, Column } from '@/shared/types/Project';

describe('CreateColumnHandler', () => {
  let handler: CreateColumnHandler;
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
    handler = new CreateColumnHandler();
  });

  it('debe crear una columna exitosamente', async () => {
    // Arrange
    const command: CreateColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      column: { name: 'Precio', type: 'currency', required: false },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newColumn.name).toBe('Precio');
    expect(result.data!.newColumn.id).toBeDefined();
  });

  it('debe fallar si el nombre de la columna está vacío', async () => {
    // Arrange
    const command: CreateColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      column: { name: '', type: 'text', required: false },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si la tabla no existe', async () => {
    // Arrange
    const command: CreateColumnCommand = {
      projectId: 'proj-1',
      tableId: 'no-existe',
      column: { name: 'Test', type: 'text', required: false },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Tabla no encontrada');
  });
});
