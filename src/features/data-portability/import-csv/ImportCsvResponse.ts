import type { ImportedTableData } from '@/lib/csv-utils';

export interface ImportCsvResponse {
  success: boolean;
  data?: ImportedTableData;
  errors?: string[];
}
