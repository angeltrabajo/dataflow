import { BatchAddRowsHandler } from './BatchAddRowsHandler';
import type { BatchAddRowsCommand } from './BatchAddRowsCommand';
import type { Project, Table, Column } from '@/shared/types/Project';

describe('BatchAddRowsHandler', () => {
  let handler: BatchAddRowsHandler;
  const columns: Column[] = [
    { id: 'col-1', name: 'Nombre', type: 'text', required: true },
  ];
  const existingTable: Table = {
    id: 'tab-1', name: 'Tabla', emoji: '📊',
    columns, rows: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [existingTable],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new BatchAddRowsHandler();
  });

  it('debe agregar múltiples filas exitosamente', async () => {
    // Arrange
    const command: BatchAddRowsCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowsData: [
        { 'col-1': 'Fila 1' },
        { 'col-1': 'Fila 2' },
      ],
      repeatGroupId: 'rg-1',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newRows).toHaveLength(2);
    expect(result.data!.newRows[0]._repeatGroupId).toBe('rg-1');
  });

  it('debe fallar si rowsData está vacío', async () => {
    // Arrange
    const command: BatchAddRowsCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowsData: [],
      repeatGroupId: 'rg-1',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si repeatGroupId está vacío', async () => {
    // Arrange
    const command: BatchAddRowsCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowsData: [{ 'col-1': 'Test' }],
      repeatGroupId: '',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
