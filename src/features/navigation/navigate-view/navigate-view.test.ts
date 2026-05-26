import { NavigateViewHandler } from './NavigateViewHandler';
import type { NavigateViewCommand } from './NavigateViewCommand';

describe('NavigateViewHandler', () => {
  let handler: NavigateViewHandler;

  beforeEach(() => {
    handler = new NavigateViewHandler();
  });

  it('debe navegar al dashboard exitosamente', async () => {
    // Arrange
    const command: NavigateViewCommand = {
      view: 'dashboard',
    };

    // Act
    const result = await handler.execute(command, 'proj-1', 'tab-1', 'table');

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.view).toBe('dashboard');
    expect(result.data!.selectedProjectId).toBeNull();
    expect(result.data!.selectedTableId).toBeNull();
  });

  it('debe navegar a una vista específica con IDs', async () => {
    // Arrange
    const command: NavigateViewCommand = {
      view: 'table',
      projectId: 'proj-2',
      tableId: 'tab-2',
    };

    // Act
    const result = await handler.execute(command, 'proj-1', 'tab-1', 'dashboard');

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.view).toBe('table');
    expect(result.data!.selectedProjectId).toBe('proj-2');
    expect(result.data!.selectedTableId).toBe('tab-2');
  });

  it('debe fallar si la vista es desconocida', async () => {
    // Arrange
    const command: NavigateViewCommand = {
      view: 'unknown' as any,
    };

    // Act
    const result = await handler.execute(command, null, null, 'dashboard');

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
