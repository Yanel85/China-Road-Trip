import { NextResponse } from 'next/server';
import { getAllPOIs } from '@/lib/notion';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const allPois = await getAllPOIs();
    const poi = allPois.find((p) => p.poiId === id || p.id === id);
    
    if (!poi) {
      return NextResponse.json({ error: 'POI not found' }, { status: 404 });
    }
    
    return NextResponse.json(poi);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch POI' }, { status: 500 });
  }
}
