import { ExportZipHandler } from './ExportZipHandler';
import type { ExportZipCommand } from './ExportZipCommand';

// Mock the projectToCsvFiles function
jest.mock('@/lib/csv-utils', () => ({
  projectToCsvFiles: jest.fn().mockReturnValue(new Map([['tabla.csv', 'data']])),
}));

describe('ExportZipHandler', () => {
  let handler: ExportZipHandler;

  beforeEach(() => {
    handler = new ExportZipHandler();
  });

  it('debe exportar proyecto a ZIP exitosamente', async () => {
    // Arrange
    const command: ExportZipCommand = {
      project: {
        name: 'Proyecto',
        tables: [],
      },
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.files).toBeDefined();
  });

  it('debe fallar si project no está definido', async () => {
    // Arrange
    const command: ExportZipCommand = {
      project: undefined as any,
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
