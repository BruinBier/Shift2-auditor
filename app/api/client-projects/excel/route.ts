import { NextResponse } from 'next/server';
import { maakWerkmap } from '@/lib/projecten-excel';
import { haalStandOp } from '@/lib/projecten-excel-stand';

export const dynamic = 'force-dynamic';

/** Exporteert alle klantprojecten naar een zelfstandig .xlsx-bestand. */
export async function GET() {
  try {
    const { projecten, opdrachtgevers } = await haalStandOp();
    const nu = new Date();
    const wb = await maakWerkmap(projecten, opdrachtgevers, nu);
    const buffer = await wb.xlsx.writeBuffer();
    const datum = nu.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' }); // 2026-10-02
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="shift2-projecten-${datum}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Excel-export van projecten mislukt:', error);
    return NextResponse.json({ error: 'De export is mislukt. Probeer het opnieuw.' }, { status: 500 });
  }
}
