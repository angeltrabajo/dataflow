import { NextRequest, NextResponse } from 'next/server';
import { handleListProjects, handleCreateProject } from '@/api/routes/projects';

/**
 * GET /api/projects — List all projects
 * Thin adapter: receives HTTP request, calls route handler, returns response.
 */
export async function GET() {
  try {
    const result = handleListProjects({}, []);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, errors: ['Error interno del servidor'] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects — Create a new project
 * Thin adapter: receives HTTP request, creates command, calls route handler, returns response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = handleCreateProject(body, []);
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
