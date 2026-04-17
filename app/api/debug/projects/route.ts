import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Find the nulmeting
    const nulmeting = await prisma.project.findUnique({
      where: { id: 'acb5ef98-eb1b-432a-97ff-552b0a126fc3' },
      select: {
        id: true,
        title: true,
        status: true,
        hasReinspection: true,
        childProjects: {
          select: {
            id: true,
            title: true,
            status: true,
            parentProjectId: true,
          }
        }
      }
    });

    // Find all projects with this parentProjectId
    const herinspecties = await prisma.project.findMany({
      where: { parentProjectId: 'acb5ef98-eb1b-432a-97ff-552b0a126fc3' },
      select: {
        id: true,
        title: true,
        status: true,
        parentProjectId: true,
      }
    });

    return NextResponse.json({
      nulmeting,
      herinspecties,
    }, { status: 200 });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
  }
}