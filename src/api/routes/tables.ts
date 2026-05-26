import {
  CreateTableHandler,
  UpdateTableHandler,
  DeleteTableHandler,
  ReorderTablesHandler,
} from '@/features/tables';
import type {
  CreateTableCommand,
  UpdateTableCommand,
  DeleteTableCommand,
  ReorderTablesCommand,
} from '@/features/tables';
import type { Project } from '@/shared/types/Project';
import type {
  CreateTableResponse,
  UpdateTableResponse,
  DeleteTableResponse,
  ReorderTablesResponse,
} from '@/features/tables';

/**
 * Thin route adapter: delegates to feature handlers.
 */

export async function handleCreateTable(
  command: CreateTableCommand,
  currentProjects: Project[]
): Promise<CreateTableResponse> {
  const handler = new CreateTableHandler();
  return handler.execute(command, currentProjects);
}

export async function handleUpdateTable(
  command: UpdateTableCommand,
  currentProjects: Project[]
): Promise<UpdateTableResponse> {
  const handler = new UpdateTableHandler();
  return handler.execute(command, currentProjects);
}

export async function handleDeleteTable(
  command: DeleteTableCommand,
  currentProjects: Project[]
): Promise<DeleteTableResponse> {
  const handler = new DeleteTableHandler();
  return handler.execute(command, currentProjects);
}

export async function handleReorderTables(
  command: ReorderTablesCommand,
  currentProjects: Project[]
): Promise<ReorderTablesResponse> {
  const handler = new ReorderTablesHandler();
  return handler.execute(command, currentProjects);
}
