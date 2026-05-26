import { DeleteColumnHandler } from './DeleteColumnHandler';
import type { DeleteColumnCommand } from './DeleteColumnCommand';
import type { Project, Table, Column } from '@/shared/types/Project';

describe('DeleteColumnHandler', () => {
  let handler: DeleteColumnHandler;
  const col1: Column = { id: 'col-1', name: 'Nombre', type: 'text', required: true };
  const col2: Column = { id: 'col-2', name: 'Precio', type: 'currency', required: false };
  const existingTable: Table = {
    id: 'tab-1', name: 'Tabla', emoji: '📊',
    columns: [col1, col2], rows: [{ id: 'row-1', 'col-1': 'Test', 'col-2': 100 }],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [existingTable],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new DeleteColumnHandler();
  });

  it('debe eliminar una columna exitosamente', async () => {
    // Arrange
    const command: DeleteColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnId: 'col-2',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    const table = result.data!.newProjects[0].tables[0];
    expect(table.columns).toHaveLength(1);
    expect(table.columns[0].id).toBe('col-1');
  });

  it('debe fallar si el columnId está vacío', async () => {
    // Arrange
    const command: DeleteColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnId: '',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe limpiar datos de la columna eliminada en las filas', async () => {
    // Arrange
    const command: DeleteColumnCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnId: 'col-2',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    const row = result.data!.newProjects[0].tables[0].rows[0];
    expect(row['col-2']).toBeUndefined();
  });
});
