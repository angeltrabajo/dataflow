import { CreateRowHandler } from './CreateRowHandler';
import type { CreateRowCommand } from './CreateRowCommand';
import type { Project, Table, Column } from '@/shared/types/Project';

describe('CreateRowHandler', () => {
  let handler: CreateRowHandler;
  const columns: Column[] = [
    { id: 'col-1', name: 'Nombre', type: 'text', required: true },
    { id: 'col-2', name: 'Cantidad', type: 'number', required: false },
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
    handler = new CreateRowHandler();
  });

  it('debe crear una fila exitosamente', async () => {
    // Arrange
    const command: CreateRowCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      rowData: { 'col-1': 'Test', 'col-2': 5 },
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newRow.id).toBeDefined();
    expect(result.data!.newRow['col-1']).toBe('Test');
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: CreateRowCommand = {
      projectId: '',
      tableId: 'tab-1',
      rowData: {},
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si la tabla no existe', async () => {
    // Arrange
    const command: CreateRowCommand = {
      projectId: 'proj-1',
      tableId: 'no-existe',
      rowData: {},
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Tabla no encontrada');
  });
});
