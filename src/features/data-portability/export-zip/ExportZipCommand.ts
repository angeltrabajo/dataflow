import type { ProjectExportData } from '@/lib/csv-utils';

export interface ExportZipCommand {
  project: ProjectExportData;
}

export const validateExportZipCommand = (cmd: ExportZipCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.project) errors.push('project es obligatorio');
  return errors;
};
