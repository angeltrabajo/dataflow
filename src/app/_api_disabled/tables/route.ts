import { NextRequest, NextResponse } from 'next/server';
import {
  handleCreateTable,
  handleUpdateTable,
  handleDeleteTable,
} from '@/api/routes/tables';

/**
 * POST /api/tables — Create a new table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleCreateTable(body, body.currentProjects || []);
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
 * PUT /api/tables — Update a table
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleUpdateTable(body, body.currentProjects || []);
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
 * DELETE /api/tables — Delete a table
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleDeleteTable(body, body.currentProjects || []);
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
