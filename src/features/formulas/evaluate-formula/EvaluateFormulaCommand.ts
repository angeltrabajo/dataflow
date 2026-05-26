import type { Row, Column, Project } from '@/shared/types/Project';

export interface EvaluateFormulaCommand {
  formula: string;
  row: Row;
  columns: Column[];
  allProjects: Project[];
  currentProjectId: string;
  allRows?: Row[];
}

export const validateEvaluateFormulaCommand = (cmd: EvaluateFormulaCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.formula) errors.push('formula es obligatorio');
  return errors;
};
