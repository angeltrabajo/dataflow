import {
  CreateColumnHandler,
  UpdateColumnHandler,
  DeleteColumnHandler,
  ReorderColumnsHandler,
} from '@/features/columns';
import type {
  CreateColumnCommand,
  UpdateColumnCommand,
  DeleteColumnCommand,
  ReorderColumnsCommand,
} from '@/features/columns';
import type { Project } from '@/shared/types/Project';
import type {
  CreateColumnResponse,
  UpdateColumnResponse,
  DeleteColumnResponse,
  ReorderColumnsResponse,
} from '@/features/columns';

/**
 * Thin route adapter: delegates to feature handlers.
 */

export async function handleCreateColumn(
  command: CreateColumnCommand,
  currentProjects: Project[]
): Promise<CreateColumnResponse> {
  const handler = new CreateColumnHandler();
  return handler.execute(command, currentProjects);
}

export async function handleUpdateColumn(
  command: UpdateColumnCommand,
  currentProjects: Project[]
): Promise<UpdateColumnResponse> {
  const handler = new UpdateColumnHandler();
  return handler.execute(command, currentProjects);
}

export async function handleDeleteColumn(
  command: DeleteColumnCommand,
  currentProjects: Project[]
): Promise<DeleteColumnResponse> {
  const handler = new DeleteColumnHandler();
  return handler.execute(command, currentProjects);
}

export async function handleReorderColumns(
  command: ReorderColumnsCommand,
  currentProjects: Project[]
): Promise<ReorderColumnsResponse> {
  const handler = new ReorderColumnsHandler();
  return handler.execute(command, currentProjects);
}
