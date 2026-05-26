import {
  CreateRowHandler,
  UpdateRowHandler,
  DeleteRowHandler,
  BatchAddRowsHandler,
} from '@/features/rows';
import type {
  CreateRowCommand,
  UpdateRowCommand,
  DeleteRowCommand,
  BatchAddRowsCommand,
} from '@/features/rows';
import type { Project } from '@/shared/types/Project';
import type {
  CreateRowResponse,
  UpdateRowResponse,
  DeleteRowResponse,
  BatchAddRowsResponse,
} from '@/features/rows';

/**
 * Thin route adapter: delegates to feature handlers.
 */

export async function handleCreateRow(
  command: CreateRowCommand,
  currentProjects: Project[]
): Promise<CreateRowResponse> {
  const handler = new CreateRowHandler();
  return handler.execute(command, currentProjects);
}

export async function handleUpdateRow(
  command: UpdateRowCommand,
  currentProjects: Project[]
): Promise<UpdateRowResponse> {
  const handler = new UpdateRowHandler();
  return handler.execute(command, currentProjects);
}

export async function handleDeleteRow(
  command: DeleteRowCommand,
  currentProjects: Project[]
): Promise<DeleteRowResponse> {
  const handler = new DeleteRowHandler();
  return handler.execute(command, currentProjects);
}

export async function handleBatchAddRows(
  command: BatchAddRowsCommand,
  currentProjects: Project[]
): Promise<BatchAddRowsResponse> {
  const handler = new BatchAddRowsHandler();
  return handler.execute(command, currentProjects);
}
