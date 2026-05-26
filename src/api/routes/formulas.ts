import { EvaluateFormulaHandler } from '@/features/formulas';
import type { EvaluateFormulaCommand } from '@/features/formulas';
import type { EvaluateFormulaResponse } from '@/features/formulas';

/**
 * Thin route adapter: delegates to feature handlers.
 */

export async function handleEvaluateFormula(
  command: EvaluateFormulaCommand
): Promise<EvaluateFormulaResponse> {
  const handler = new EvaluateFormulaHandler();
  return handler.execute(command);
}
