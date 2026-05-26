import type { ExportZipCommand } from './ExportZipCommand';
import type { ExportZipResponse } from './ExportZipResponse';
import { projectToCsvFiles } from '@/lib/csv-utils';
import { validateExportZipCommand } from './ExportZipCommand';

export class ExportZipHandler {
  async execute(command: ExportZipCommand): Promise<ExportZipResponse> {
    const errors = validateExportZipCommand(command);
    if (errors.length > 0) return { success: false, errors };

    try {
      const files = projectToCsvFiles(command.project);
      return { success: true, data: { files } };
    } catch {
      return { success: false, errors: ['Error al exportar proyecto a ZIP'] };
    }
  }
}
