import { ExportCsvHandler } from './ExportCsvHandler';
import type { ExportCsvCommand } from './ExportCsvCommand';

// Mock the tableToCsv function
jest.mock('@/lib/csv-utils', () => ({
  tableToCsv: jest.fn().mockReturnValue('Nombre,Precio\nTest,100'),
}));

describe('ExportCsvHandler', () => {
  let handler: ExportCsvHandler;

  beforeEach(() => {
    handler = new ExportCsvHandler();
  });

  it('debe exportar CSV exitosamente', async () => {
    // Arrange
    const command: ExportCsvCommand = {
      table: {
        name: 'Tabla',
        columns: [{ id: 'col-1', name: 'Nombre', type: 'text' }],
        rows: [{ id: 'row-1', 'col-1': 'Test' }],
      },
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.csvContent).toBeDefined();
  });

  it('debe fallar si table no está definido', async () => {
    // Arrange
    const command: ExportCsvCommand = {
      table: undefined as any,
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
