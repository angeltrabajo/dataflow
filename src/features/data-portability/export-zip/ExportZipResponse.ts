export interface ExportZipResponse {
  success: boolean;
  data?: {
    files: Map<string, string>;
  };
  errors?: string[];
}
