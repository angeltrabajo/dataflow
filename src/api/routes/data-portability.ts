import {
  ImportCsvHandler,
  ExportCsvHandler,
  ExportZipHandler,
} from '@/features/data-portability';
import type {
  ImportCsvCommand,
  ExportCsvCommand,
  ExportZipCommand,
} from '@/features/data-portability';
import type {
  ImportCsvResponse,
  ExportCsvResponse,
  ExportZipResponse,
} from '@/features/data-portability';

/**
 * Thin route adapter: delegates to feature handlers.
 */

export async function handleImportCsv(command: ImportCsvCommand): Promise<ImportCsvResponse> {
  const handler = new ImportCsvHandler();
  return handler.execute(command);
}

export async function handleExportCsv(command: ExportCsvCommand): Promise<ExportCsvResponse> {
  const handler = new ExportCsvHandler();
  return handler.execute(command);
}

export async function handleExportZip(command: ExportZipCommand): Promise<ExportZipResponse> {
  const handler = new ExportZipHandler();
  return handler.execute(command);
}
