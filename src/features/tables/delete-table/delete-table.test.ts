import { DeleteTableHandler } from './DeleteTableHandler';
import type { DeleteTableCommand } from './DeleteTableCommand';
import type { Project, Table } from '@/shared/types/Project';

describe('DeleteTableHandler', () => {
  let handler: DeleteTableHandler;
  const existingTable: Table = {
    id: 'tab-1',
    name: 'Tabla',
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
    handler = new DeleteTableHandler();
  });

  it('debe eliminar una tabla exitosamente', async () => {
    // Arrange
    const command: DeleteTableCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      selectedTableId: 'tab-1',
      currentView: 'table',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newProjects[0].tables).toHaveLength(0);
  });

  it('debe resetear la selección si se elimina la tabla seleccionada', async () => {
    // Arrange
    const command: DeleteTableCommand = {
      projectId: 'proj-1',
      tableId: 'tab-1',
      selectedTableId: 'tab-1',
      currentView: 'table',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.selectedTableId).toBeNull();
    expect(result.data!.currentView).toBe('project');
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: DeleteTableCommand = {
      projectId: '',
      tableId: 'tab-1',
      selectedTableId: null,
      currentView: 'dashboard',
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
