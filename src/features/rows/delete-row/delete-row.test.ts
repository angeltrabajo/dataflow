import { DeleteRowHandler } from './DeleteRowHandler';
import type { DeleteRowCommand } from './DeleteRowCommand';
import type { Project, Table, Column, Row } from '@/shared/types/Project';

describe('DeleteRowHandler', () => {
  let handler: DeleteRowHandler;
  const columns: Column[] = [
    { id: 'col-1', name: 'Nombre', type: 'text', required: true },
  ];
  const existingRow: Row = { id: 'row-1', 'col-1': 'Test' };
  const existingTable: Table = {
    id: 'tab-1', name: 'Tabla', emoji: '📊',
    columns, rows: [existingRow],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [existingTable],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new DeleteRowHandler();
  });

  it('debe eliminar una fila exitosamente', async () => {
    // Arrange
    const command: DeleteRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowId: 'row-1',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newProjects[0].tables[0].rows).toHaveLength(0);
  });

  it('debe fallar si la fila no existe', async () => {
    // Arrange
    const command: DeleteRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowId: 'no-existe',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Fila no encontrada');
  });

  it('debe fallar si el rowId está vacío', async () => {
    // Arrange
    const command: DeleteRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowId: '',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
