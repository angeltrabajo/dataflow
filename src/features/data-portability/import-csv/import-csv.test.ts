import { ImportCsvHandler } from './ImportCsvHandler';
import type { ImportCsvCommand } from './ImportCsvCommand';

// Mock the csvToTable function
jest.mock('@/lib/csv-utils', () => ({
  csvToTable: jest.fn().mockReturnValue({
    table: { id: 'tab-1', name: 'Imported', columns: [], rows: [] },
    refUpdates: [],
  }),
}));

describe('ImportCsvHandler', () => {
  let handler: ImportCsvHandler;

  beforeEach(() => {
    handler = new ImportCsvHandler();
  });

  it('debe importar CSV exitosamente', async () => {
    // Arrange
    const command: ImportCsvCommand = {
      csvText: 'Nombre,Precio\nTest,100',
      tableName: 'Imported',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('debe fallar si el csvText está vacío', async () => {
    // Arrange
    const command: ImportCsvCommand = {
      csvText: '',
      tableName: 'Imported',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe fallar si el tableName está vacío', async () => {
    // Arrange
    const command: ImportCsvCommand = {
      csvText: 'data',
      tableName: '',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
