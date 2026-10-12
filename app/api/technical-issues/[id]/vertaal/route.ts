import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { vertaal, VertaalFout } from '@/lib/azure-translator';

/**
 * Vertaalt titel en beschrijving van een technisch issue naar het Engels en bewaart de
 * uitkomst bij het issue. Vertaalt wat er in de database staat, dus sla eerst op.
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const issue = await prisma.technicalIssue.findUnique({
    where: { id: params.id },
    select: { title: true, description: true },
  });
  if (!issue) return NextResponse.json({ error: 'Issue niet gevonden' }, { status: 404 });

  try {
    const [titleEn, descriptionEn] = await vertaal([issue.title, issue.description]);
    const bijgewerkt = await prisma.technicalIssue.update({
      where: { id: params.id },
      data: { titleEn, descriptionEn, vertaaldOp: new Date() },
      select: { titleEn: true, descriptionEn: true, vertaaldOp: true },
    });
    return NextResponse.json(bijgewerkt);
  } catch (error) {
    if (error instanceof VertaalFout) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error('Vertalen mislukt:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Vertalen mislukt' }, { status: 500 });
  }
}
