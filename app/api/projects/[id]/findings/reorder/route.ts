import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { findingIds } = body; // Array of finding IDs in the new order (for one criterion)

    if (!Array.isArray(findingIds)) {
      return NextResponse.json({ error: 'Invalid request: findingIds must be an array' }, { status: 400 });
    }

    // Update sortOrder for the findings in this criterion
    const updatePromises = findingIds.map((findingId, index) =>
      prisma.finding.update({
        where: { id: findingId },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updatePromises);

    // Now renumber ALL findings in the project
    // Get all findings for this project
    const allFindings = await prisma.finding.findMany({
      where: { projectId: params.id },
      include: { wcagCriterion: true }
    });

    // Sort findings by WCAG criterion code (numerically) and then by sortOrder
    allFindings.sort((a, b) => {
      // First sort by WCAG criterion code
      const codeA = a.wcagCriterion?.code || '';
      const codeB = b.wcagCriterion?.code || '';

      // Split the code into parts and compare numerically
      const partsA = codeA.split('.').map(Number);
      const partsB = codeB.split('.').map(Number);

      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA !== numB) {
          return numA - numB;
        }
      }

      // If same criterion, sort by sortOrder
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    // Renumber all findings: B001, B002, B003, etc.
    const renumberPromises = allFindings.map((finding, index) => {
      const newFindingCode = `B${String(index + 1).padStart(3, '0')}`;
      console.log(`Renumbering finding ${finding.id} from ${finding.findingCode} to ${newFindingCode}`);
      return prisma.finding.update({
        where: { id: finding.id },
        data: { findingCode: newFindingCode }
      });
    });

    await Promise.all(renumberPromises);
    console.log(`Successfully renumbered ${renumberPromises.length} findings`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error reordering findings:', error);
    return NextResponse.json({ error: 'Failed to reorder findings' }, { status: 500 });
  }
}