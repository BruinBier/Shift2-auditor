import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    const quickFinding = await prisma.quickFinding.findUnique({
      where: {
        crawlerTestId: testId,
      },
      include: {
        findings: {
          select: {
            id: true,
            projectId: true,
            findingCode: true,
          },
        },
      },
    });

    if (!quickFinding) {
      return NextResponse.json(
        { error: 'No QuickFinding template linked to this crawler test' },
        { status: 404 }
      );
    }

    return NextResponse.json(quickFinding);
  } catch (error) {
    console.error('Error fetching QuickFinding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QuickFinding' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}