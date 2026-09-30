import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leesUrenregel, URENREGEL_INCLUDE } from '@/lib/uren';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoer = leesUrenregel(await request.json());
    if ('fout' in invoer) {
      return NextResponse.json({ error: invoer.fout }, { status: 400 });
    }
    const regel = await prisma.urenregel.update({
      where: { id: params.id },
      data: invoer,
      include: URENREGEL_INCLUDE,
    });
    return NextResponse.json(regel);
  } catch (error) {
    console.error('Failed to update urenregel:', error);
    return NextResponse.json({ error: 'Uren wijzigen mislukt' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.urenregel.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete urenregel:', error);
    return NextResponse.json({ error: 'Uren verwijderen mislukt' }, { status: 500 });
  }
}
