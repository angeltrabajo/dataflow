import { NextRequest, NextResponse } from 'next/server';
import {
  handleCreateColumn,
  handleUpdateColumn,
  handleDeleteColumn,
} from '@/api/routes/columns';

/**
 * POST /api/columns — Create a new column
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleCreateColumn(body, body.currentProjects || []);
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
 * PUT /api/columns — Update a column
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleUpdateColumn(body, body.currentProjects || []);
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
 * DELETE /api/columns — Delete a column
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleDeleteColumn(body, body.currentProjects || []);
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
