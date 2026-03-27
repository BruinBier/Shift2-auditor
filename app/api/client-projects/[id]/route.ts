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
    console.log('PATCH request data:', data);
    console.log('Updating client project:', params.id);

    const updateData: any = {};

    // Only include fields that are provided in the request
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.details !== undefined) {
      updateData.details = data.details;
    }
    if (data.projectnummer !== undefined) {
      updateData.projectnummer = data.projectnummer || null;
    }
    if (data.opdrachtgeverId !== undefined) {
      updateData.opdrachtgeverId = data.opdrachtgeverId;
    }

    console.log('Update data:', updateData);

    const clientProject = await prisma.clientProject.update({
      where: { id: params.id },
      data: updateData,
      include: {
        opdrachtgever: true,
      },
    });

    console.log('Successfully updated client project');
    return NextResponse.json(clientProject);
  } catch (error) {
    console.error('Error updating client project:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to update client project', details: error instanceof Error ? error.message : 'Unknown error' },
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