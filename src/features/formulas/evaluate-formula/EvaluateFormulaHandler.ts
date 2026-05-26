import type { EvaluateFormulaCommand } from './EvaluateFormulaCommand';
import type { EvaluateFormulaResponse } from './EvaluateFormulaResponse';
import { evaluateFormula } from '@/lib/helpers';
import { validateEvaluateFormulaCommand } from './EvaluateFormulaCommand';

export class EvaluateFormulaHandler {
  async execute(command: EvaluateFormulaCommand): Promise<EvaluateFormulaResponse> {
    const errors = validateEvaluateFormulaCommand(command);
    if (errors.length > 0) return { success: false, errors };

    try {
      const value = evaluateFormula(
        command.formula,
        command.row,
        command.columns,
        command.allProjects,
        command.currentProjectId,
        command.allRows
      );
      return { success: true, data: { value } };
    } catch {
      return { success: false, errors: ['Error al evaluar la fórmula'] };
    }
  }
}
