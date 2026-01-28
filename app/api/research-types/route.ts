import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const researchTypes = await prisma.researchType.findMany({
      orderBy: { name: 'asc' },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    // Transform criteria to array of IDs for frontend
    const transformed = researchTypes.map(type => ({
      ...type,
      selectedCriteria: type.criteria.map(c => c.wcagCriterionId),
      criteria: undefined, // Remove the criteria object, we only need selectedCriteria
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching research types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research types' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const researchType = await prisma.researchType.create({
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
    console.error('Error creating research type:', error);
    return NextResponse.json(
      { error: 'Failed to create research type' },
      { status: 500 }
    );
  }
}