import { NextRequest, NextResponse } from 'next/server';
import { handleEvaluateFormula } from '@/api/routes/formulas';

/**
 * POST /api/formulas/evaluate — Evaluate a formula expression
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleEvaluateFormula(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, errors: ['Error interno del servidor'] },
      { status: 500 }
    );
  }
}
