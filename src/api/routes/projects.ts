import {
  CreateProjectHandler,
  UpdateProjectHandler,
  DeleteProjectHandler,
  ListProjectsHandler,
} from '@/features/projects';
import type {
  CreateProjectCommand,
  UpdateProjectCommand,
  DeleteProjectCommand,
  ListProjectsCommand,
} from '@/features/projects';
import type { Project } from '@/shared/types/Project';
import type {
  CreateProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
  ListProjectsResponse,
} from '@/features/projects';

/**
 * Thin route adapter: delegates to feature handlers.
 * These functions are called by Next.js API route files.
 */

export async function handleListProjects(
  command: ListProjectsCommand,
  currentProjects: Project[]
): Promise<ListProjectsResponse> {
  const handler = new ListProjectsHandler();
  return handler.execute(command, currentProjects);
}

export async function handleCreateProject(
  command: CreateProjectCommand,
  currentProjects: Project[]
): Promise<CreateProjectResponse> {
  const handler = new CreateProjectHandler();
  return handler.execute(command, currentProjects);
}

export async function handleUpdateProject(
  command: UpdateProjectCommand,
  currentProjects: Project[]
): Promise<UpdateProjectResponse> {
  const handler = new UpdateProjectHandler();
  return handler.execute(command, currentProjects);
}

export async function handleDeleteProject(
  command: DeleteProjectCommand,
  currentProjects: Project[]
): Promise<DeleteProjectResponse> {
  const handler = new DeleteProjectHandler();
  return handler.execute(command, currentProjects);
}
