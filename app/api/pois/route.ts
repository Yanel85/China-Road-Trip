import { NextResponse } from 'next/server';
import { getAllPOIs } from '@/lib/notion';

export async function GET() {
  try {
    const pois = await getAllPOIs();
    return NextResponse.json(pois);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch POIs' }, { status: 500 });
  }
}
