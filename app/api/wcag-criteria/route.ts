import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const criteria = await prisma.wCAGCriterion.findMany({
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(criteria);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch WCAG criteria' }, { status: 500 });
  }
}
