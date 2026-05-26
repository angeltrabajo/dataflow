import type { ViewType } from '@/shared/types/ViewType';

export interface NavigateViewCommand {
  view: ViewType;
  projectId?: string | null;
  tableId?: string | null;
}

export const validateNavigateViewCommand = (cmd: NavigateViewCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.view) errors.push('view es obligatorio');
  return errors;
};
