import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const criteria = await prisma.wCAGCriterion.findMany();

    // Sort criteria numerically by code (e.g., 1.4.2 comes before 1.4.10)
    criteria.sort((a, b) => {
      const aParts = a.code.split('.').map(Number);
      const bParts = b.code.split('.').map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0;
        const bNum = bParts[i] || 0;
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      }
      return 0;
    });

    return NextResponse.json(criteria);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch WCAG criteria' }, { status: 500 });
  }
}
