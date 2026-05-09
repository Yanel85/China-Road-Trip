import { NextResponse } from 'next/server';
import { getRouteById } from '@/lib/notion';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const route = await getRouteById(id);
    
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
    
    return NextResponse.json(route);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
  }
}
