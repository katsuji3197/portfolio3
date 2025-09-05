import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/microcms';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (err) {
    return NextResponse.json({ error: 'failed to fetch' }, { status: 500 });
  }
}
