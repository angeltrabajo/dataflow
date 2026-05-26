import type { ExportCsvCommand } from './ExportCsvCommand';
import type { ExportCsvResponse } from './ExportCsvResponse';
import { tableToCsv } from '@/lib/csv-utils';
import { validateExportCsvCommand } from './ExportCsvCommand';

export class ExportCsvHandler {
  async execute(command: ExportCsvCommand): Promise<ExportCsvResponse> {
    const errors = validateExportCsvCommand(command);
    if (errors.length > 0) return { success: false, errors };

    try {
      const csvContent = tableToCsv(command.table);
      return { success: true, data: { csvContent } };
    } catch {
      return { success: false, errors: ['Error al exportar CSV'] };
    }
  }
}
