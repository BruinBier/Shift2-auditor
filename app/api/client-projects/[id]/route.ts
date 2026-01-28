import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientProject = await prisma.clientProject.findUnique({
      where: { id: params.id },
      include: {
        opdrachtgever: true,
        projects: true,
      },
    });

    if (!clientProject) {
      return NextResponse.json(
        { error: 'Client project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(clientProject);
  } catch (error) {
    console.error('Error fetching client project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const clientProject = await prisma.clientProject.update({
      where: { id: params.id },
      data: {
        name: data.name,
        details: data.details,
      },
      include: {
        opdrachtgever: true,
      },
    });

    return NextResponse.json(clientProject);
  } catch (error) {
    console.error('Error updating client project:', error);
    return NextResponse.json(
      { error: 'Failed to update client project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.clientProject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client project:', error);
    return NextResponse.json(
      { error: 'Failed to delete client project' },
      { status: 500 }
    );
  }
}