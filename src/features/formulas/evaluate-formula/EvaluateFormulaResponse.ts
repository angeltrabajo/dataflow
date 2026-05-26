export interface EvaluateFormulaResponse {
  success: boolean;
  data?: {
    value: unknown;
  };
  errors?: string[];
}
