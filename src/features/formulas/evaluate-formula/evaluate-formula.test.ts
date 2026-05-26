import { EvaluateFormulaHandler } from './EvaluateFormulaHandler';
import type { EvaluateFormulaCommand } from './EvaluateFormulaCommand';
import type { Column, Project } from '@/shared/types/Project';

// Mock the evaluateFormula function
jest.mock('@/lib/helpers', () => ({
  evaluateFormula: jest.fn().mockReturnValue(42),
}));

describe('EvaluateFormulaHandler', () => {
  let handler: EvaluateFormulaHandler;

  beforeEach(() => {
    handler = new EvaluateFormulaHandler();
  });

  it('debe evaluar una fórmula exitosamente', async () => {
    // Arrange
    const command: EvaluateFormulaCommand = {
      formula: '{col-1} * 2',
      row: { id: 'row-1', 'col-1': 21 },
      columns: [{ id: 'col-1', name: 'Valor', type: 'number', required: false }],
      allProjects: [],
      currentProjectId: 'proj-1',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.value).toBe(42);
  });

  it('debe fallar si la fórmula está vacía', async () => {
    // Arrange
    const command: EvaluateFormulaCommand = {
      formula: '',
      row: { id: 'row-1' },
      columns: [],
      allProjects: [],
      currentProjectId: 'proj-1',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('debe retornar error si la evaluación falla', async () => {
    // Arrange - override mock for this test
    const { evaluateFormula } = jest.requireMock('@/lib/helpers');
    (evaluateFormula as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid formula');
    });

    const command: EvaluateFormulaCommand = {
      formula: 'INVALID',
      row: { id: 'row-1' },
      columns: [],
      allProjects: [],
      currentProjectId: 'proj-1',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
