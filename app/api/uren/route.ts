import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leesUrenregel, URENREGEL_INCLUDE } from '@/lib/uren';

export async function GET() {
  try {
    const regels = await prisma.urenregel.findMany({
      orderBy: [{ datum: 'desc' }, { createdAt: 'desc' }],
      include: URENREGEL_INCLUDE,
    });
    return NextResponse.json(regels);
  } catch (error) {
    console.error('Failed to fetch urenregels:', error);
    return NextResponse.json({ error: 'Uren ophalen mislukt' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoer = leesUrenregel(await request.json());
    if ('fout' in invoer) {
      return NextResponse.json({ error: invoer.fout }, { status: 400 });
    }
    const regel = await prisma.urenregel.create({ data: invoer, include: URENREGEL_INCLUDE });
    return NextResponse.json(regel, { status: 201 });
  } catch (error) {
    console.error('Failed to create urenregel:', error);
    return NextResponse.json({ error: 'Uren opslaan mislukt' }, { status: 500 });
  }
}
