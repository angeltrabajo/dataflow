import type { NavigateViewCommand } from './NavigateViewCommand';
import type { NavigateViewResponse } from './NavigateViewResponse';
import { validateNavigateViewCommand } from './NavigateViewCommand';

export class NavigateViewHandler {
  async execute(
    command: NavigateViewCommand,
    currentSelectedProjectId: string | null,
    currentSelectedTableId: string | null,
    currentView: string
  ): Promise<NavigateViewResponse> {
    const errors = validateNavigateViewCommand(command);
    if (errors.length > 0) return { success: false, errors };

    // If a specific view is requested with IDs, set them directly
    if (command.projectId !== undefined || command.tableId !== undefined) {
      return {
        success: true,
        data: {
          view: command.view,
          selectedProjectId: command.projectId !== undefined ? command.projectId : currentSelectedProjectId,
          selectedTableId: command.tableId !== undefined ? command.tableId : currentSelectedTableId,
        },
      };
    }

    // Default navigation based on the view type
    switch (command.view) {
      case 'dashboard':
        return {
          success: true,
          data: { view: 'dashboard', selectedProjectId: null, selectedTableId: null },
        };
      case 'project':
        return {
          success: true,
          data: { view: 'project', selectedProjectId: currentSelectedProjectId, selectedTableId: null },
        };
      case 'table':
      case 'editor':
        return {
          success: true,
          data: {
            view: command.view,
            selectedProjectId: currentSelectedProjectId,
            selectedTableId: currentSelectedTableId,
          },
        };
      case 'settings':
        return {
          success: true,
          data: { view: 'settings', selectedProjectId: currentSelectedProjectId, selectedTableId: currentSelectedTableId },
        };
      default:
        return { success: false, errors: [`Vista desconocida: ${command.view}`] };
    }
  }
}
