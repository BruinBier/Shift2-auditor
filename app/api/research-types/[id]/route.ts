import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identifier = decodeURIComponent(id);

    // Try to find by name first (more common use case), then by ID
    let researchType = await prisma.researchType.findUnique({
      where: { name: identifier },
      include: {
        criteria: {
          include: {
            wcagCriterion: true,
          },
        },
      },
    });

    // If not found by name, try by ID
    if (!researchType) {
      researchType = await prisma.researchType.findUnique({
        where: { id: identifier },
        include: {
          criteria: {
            include: {
              wcagCriterion: true,
            },
          },
        },
      });
    }

    if (!researchType) {
      return NextResponse.json(
        { error: 'Research type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(researchType);
  } catch (error) {
    console.error('Error fetching research type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research type' },
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

    // Delete existing criteria relationships
    await prisma.researchTypeWCAGCriterion.deleteMany({
      where: { researchTypeId: id },
    });

    // Update research type and create new criteria relationships
    const researchType = await prisma.researchType.update({
      where: { id },
      data: {
        name: data.name,
        version: data.version,
        level: data.level,
        type: data.type,
        description: data.description,
        reportIntro: data.reportIntro || null,
        reportIntroPdf: data.reportIntroPdf || null,
        criteria: {
          create: (data.selectedCriteria || []).map((criterionId: string) => ({
            wcagCriterionId: criterionId,
          })),
        },
      },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    // Transform response
    const response = {
      ...researchType,
      selectedCriteria: researchType.criteria.map(c => c.wcagCriterionId),
      criteria: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating research type:', error);
    return NextResponse.json(
      { error: 'Failed to update research type' },
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
    await prisma.researchType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting research type:', error);
    return NextResponse.json(
      { error: 'Failed to delete research type' },
      { status: 500 }
    );
  }
}