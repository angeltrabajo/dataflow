import { ReorderTablesHandler } from './ReorderTablesHandler';
import type { ReorderTablesCommand } from './ReorderTablesCommand';
import type { Project, Table } from '@/shared/types/Project';

describe('ReorderTablesHandler', () => {
  let handler: ReorderTablesHandler;
  const table1: Table = {
    id: 'tab-1', name: 'A', emoji: '📊', columns: [], rows: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const table2: Table = {
    id: 'tab-2', name: 'B', emoji: '📈', columns: [], rows: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const existingProject: Project = {
    id: 'proj-1', name: 'Proyecto', emoji: '📁', description: '', color: '#000',
    tables: [table1, table2],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    handler = new ReorderTablesHandler();
  });

  it('debe reordenar tablas exitosamente', async () => {
    // Arrange
    const command: ReorderTablesCommand = {
      projectId: 'proj-1',
      tableIds: ['tab-2', 'tab-1'],
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.newProjects[0].tables[0].id).toBe('tab-2');
    expect(result.data!.newProjects[0].tables[1].id).toBe('tab-1');
  });

  it('debe fallar si tableIds está vacío', async () => {
    // Arrange
    const command: ReorderTablesCommand = {
      projectId: 'proj-1',
      tableIds: [],
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si el projectId está vacío', async () => {
    // Arrange
    const command: ReorderTablesCommand = {
      projectId: '',
      tableIds: ['tab-1'],
    };

    // Act
    const result = await handler.execute(command, [existingProject]);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
