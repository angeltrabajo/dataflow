import { NextRequest, NextResponse } from 'next/server';
import { handleImportCsv, handleExportCsv } from '@/api/routes/data-portability';

/**
 * POST /api/data-portability/import — Import CSV data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleImportCsv({
      csvText: body.csvText,
      tableName: body.tableName,
      allTables: body.allTables,
    });
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

/**
 * PUT /api/data-portability/export — Export table as CSV
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleExportCsv({ table: body.table });
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
