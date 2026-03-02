import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const opdrachtgever = await prisma.opdrachtgever.findUnique({
      where: { id },
    });

    if (!opdrachtgever) {
      return NextResponse.json(
        { error: 'Opdrachtgever not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(opdrachtgever);
  } catch (error) {
    console.error('Error fetching opdrachtgever:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opdrachtgever' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const opdrachtgever = await prisma.opdrachtgever.update({
      where: { id },
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
    console.error('Error updating opdrachtgever:', error);
    return NextResponse.json(
      { error: 'Failed to update opdrachtgever' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.opdrachtgever.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opdrachtgever:', error);
    return NextResponse.json(
      { error: 'Failed to delete opdrachtgever' },
      { status: 500 }
    );
  }
}