import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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