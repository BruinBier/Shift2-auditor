import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const opdrachtgevers = await prisma.opdrachtgever.findMany({
      orderBy: { naam: 'asc' },
    });

    return NextResponse.json(opdrachtgevers);
  } catch (error) {
    console.error('Error fetching opdrachtgevers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opdrachtgevers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const opdrachtgever = await prisma.opdrachtgever.create({
      data: {
        kenmerk: data.kenmerk,
        naam: data.naam,
        contactnaam: data.contactnaam || null,
        contactEmail: data.contactEmail || null,
        accountmanager: data.accountmanager || null,
      },
    });

    return NextResponse.json(opdrachtgever);
  } catch (error) {
    console.error('Error creating opdrachtgever:', error);
    return NextResponse.json(
      { error: 'Failed to create opdrachtgever' },
      { status: 500 }
    );
  }
}