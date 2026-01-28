import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const opdrachtgeverId = searchParams.get('opdrachtgeverId');

    const clientProjects = await prisma.clientProject.findMany({
      where: opdrachtgeverId ? { opdrachtgeverId } : undefined,
      include: {
        opdrachtgever: true,
        projects: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clientProjects);
  } catch (error) {
    console.error('Error fetching client projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const clientProject = await prisma.clientProject.create({
      data: {
        name: data.name,
        opdrachtgeverId: data.opdrachtgeverId,
        details: data.details || null,
      },
      include: {
        opdrachtgever: true,
      },
    });

    return NextResponse.json(clientProject);
  } catch (error) {
    console.error('Error creating client project:', error);
    return NextResponse.json(
      { error: 'Failed to create client project' },
      { status: 500 }
    );
  }
}