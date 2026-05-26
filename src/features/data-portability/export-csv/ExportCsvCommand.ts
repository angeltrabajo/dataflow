import type { TableExportData } from '@/lib/csv-utils';

export interface ExportCsvCommand {
  table: TableExportData;
}

export const validateExportCsvCommand = (cmd: ExportCsvCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.table) errors.push('table es obligatorio');
  return errors;
};
