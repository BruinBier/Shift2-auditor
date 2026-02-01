import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; testId: string } }
) {
  try {
    const { id: projectId, testId } = params;

    // Get all scope URLs for this project where this test was found
    const affectedUrls = await prisma.projectScopeUrl.findMany({
      where: {
        projectId,
        crawlerResults: {
          some: {
            testId,
            found: true, // Only URLs where the test found an issue
          },
        },
      },
      include: {
        crawlerResults: {
          where: {
            testId,
            found: true,
          },
          select: {
            id: true,
            count: true,
            details: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        url: 'asc',
      },
    });

    // Transform the data to a more useful format
    const urlsWithResults = affectedUrls.map((scopeUrl) => ({
      id: scopeUrl.id,
      url: scopeUrl.url,
      title: scopeUrl.title,
      crawledAt: scopeUrl.crawledAt,
      result: scopeUrl.crawlerResults[0], // Should only be one result per test per URL
    }));

    return NextResponse.json(urlsWithResults);
  } catch (error) {
    console.error('Error fetching affected URLs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affected URLs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
