import type { ImportCsvCommand } from './ImportCsvCommand';
import type { ImportCsvResponse } from './ImportCsvResponse';
import { csvToTable } from '@/lib/csv-utils';
import { validateImportCsvCommand } from './ImportCsvCommand';

export class ImportCsvHandler {
  async execute(command: ImportCsvCommand): Promise<ImportCsvResponse> {
    const errors = validateImportCsvCommand(command);
    if (errors.length > 0) return { success: false, errors };

    try {
      const importedData = csvToTable(command.csvText, command.tableName, command.allTables);
      return { success: true, data: importedData };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al importar CSV';
      return { success: false, errors: [message] };
    }
  }
}
