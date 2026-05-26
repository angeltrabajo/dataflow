import { NextRequest, NextResponse } from 'next/server';
import {
  handleCreateRow,
  handleUpdateRow,
  handleDeleteRow,
  handleBatchAddRows,
} from '@/api/routes/rows';

/**
 * POST /api/rows — Create a new row or batch add rows
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.rowsData && Array.isArray(body.rowsData)) {
      // Batch add
      const result = handleBatchAddRows(body, body.currentProjects || []);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result, { status: 201 });
    }
    // Single add
    const result = handleCreateRow(body, body.currentProjects || []);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, errors: ['Error interno del servidor'] },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rows — Update a row
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleUpdateRow(body, body.currentProjects || []);
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
 * DELETE /api/rows — Delete a row
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleDeleteRow(body, body.currentProjects || []);
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
