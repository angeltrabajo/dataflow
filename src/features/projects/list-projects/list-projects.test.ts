import { ListProjectsHandler } from './ListProjectsHandler';
import type { ListProjectsCommand } from './ListProjectsCommand';
import type { Project } from '@/shared/types/Project';

describe('ListProjectsHandler', () => {
  let handler: ListProjectsHandler;

  beforeEach(() => {
    handler = new ListProjectsHandler();
  });

  it('debe listar proyectos exitosamente', async () => {
    // Arrange
    const command: ListProjectsCommand = {};
    const projects: Project[] = [
      {
        id: 'proj-1',
        name: 'Proyecto 1',
        emoji: '📁',
        description: '',
        color: '#000',
        tables: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    // Act
    const result = await handler.execute(command, projects);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.projects).toHaveLength(1);
    expect(result.data!.projects[0].name).toBe('Proyecto 1');
  });

  it('debe retornar lista vacía si no hay proyectos', async () => {
    // Arrange
    const command: ListProjectsCommand = {};

    // Act
    const result = await handler.execute(command, []);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.projects).toHaveLength(0);
  });
});
