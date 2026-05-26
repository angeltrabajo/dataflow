import type { TableDataForRef, ImportedTableData } from '@/lib/csv-utils';

export interface ImportCsvCommand {
  csvText: string;
  tableName: string;
  allTables?: TableDataForRef[];
}

export const validateImportCsvCommand = (cmd: ImportCsvCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.csvText || cmd.csvText.trim().length === 0) errors.push('csvText es obligatorio');
  if (!cmd.tableName || cmd.tableName.trim().length === 0) errors.push('tableName es obligatorio');
  return errors;
};
