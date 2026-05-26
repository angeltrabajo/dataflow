import { ReorderColumnsHandler } from './ReorderColumnsHandler';
import type { ReorderColumnsCommand } from './ReorderColumnsCommand';
import type { Project, Table, Column } from '@/shared/types/Project';

describe('ReorderColumnsHandler', () => {
  let handler: ReorderColumnsHandler;
  const col1: Column = { id: 'col-1', name: 'A', type: 'text', required: true };
  const col2: Column = { id: 'col-2', name: 'B', type: 'text', required: false };
  const existingTable: Table = {
    id: 'tab-1', name: 'Tabla', emoji: '📊',
    columns: [col1, col2], rows: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [existingTable],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new ReorderColumnsHandler();
  });

  it('debe reordenar columnas exitosamente', async () => {
    // Arrange
    const command: ReorderColumnsCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnIds: ['col-2', 'col-1'],
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    const columns = result.data!.newProjects[0].tables[0].columns;
    expect(columns[0].id).toBe('col-2');
    expect(columns[1].id).toBe('col-1');
  });

  it('debe fallar si columnIds está vacío', async () => {
    // Arrange
    const command: ReorderColumnsCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      columnIds: [],
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si el tableId está vacío', async () => {
    // Arrange
    const command: ReorderColumnsCommand = {
      projectId: 'proj-1',
      tableId: '',
      columnIds: ['col-1'],
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
