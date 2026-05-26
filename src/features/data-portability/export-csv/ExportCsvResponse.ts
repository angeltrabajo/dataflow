export interface ExportCsvResponse {
  success: boolean;
  data?: {
    csvContent: string;
  };
  errors?: string[];
}
