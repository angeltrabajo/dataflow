import { UpdateRowHandler } from './UpdateRowHandler';
import type { UpdateRowCommand } from './UpdateRowCommand';
import type { Project, Table, Column, Row } from '@/shared/types/Project';

describe('UpdateRowHandler', () => {
  let handler: UpdateRowHandler;
  const columns: Column[] = [
    { id: 'col-1', name: 'Nombre', type: 'text', required: true },
  ];
  const existingRow: Row = { id: 'row-1', 'col-1': 'Original' };
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
    handler = new UpdateRowHandler();
  });

  it('debe actualizar una fila exitosamente', async () => {
    // Arrange
    const command: UpdateRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowId: 'row-1',
      data: { 'col-1': 'Actualizado' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    const updatedRow = result.data!.newProjects[0].tables[0].rows[0];
    expect(updatedRow['col-1']).toBe('Actualizado');
  });

  it('debe fallar si la fila no existe', async () => {
    // Arrange
    const command: UpdateRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowId: 'no-existe',
      data: { 'col-1': 'Test' },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Fila no encontrada');
  });

  it('debe fallar si el rowId está vacío', async () => {
    // Arrange
    const command: UpdateRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowId: '',
      data: {},
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
