import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * De volgorde van bevindingen binnen een criterium wijzigen, en daarna de codes
 * gelijktrekken met de rapportvolgorde.
 *
 * Twee dingen gingen hier mis, allebei zichtbaar als "Er is een fout opgetreden bij het
 * verplaatsen van de bevinding".
 *
 * 1. Het hernummeren liep parallel via Promise.all. Op findings ligt een unique-constraint
 *    op (project_id, finding_code), en bij een herschikking krijgt bevinding A de code die
 *    B op dat moment nog heeft. Die twee updates raken elkaar en de tweede valt om met een
 *    P2002. Nu gaat het in twee ronden binnen een transactie: eerst alles naar een tijdelijke
 *    code, daarna naar de definitieve. Zo bestaat er geen moment waarop twee bevindingen
 *    dezelfde code dragen.
 *
 * 2. Alles werd hernummerd naar B###, ook voorstellen. Een voorstel draagt een V-code en
 *    telt nergens mee tot de onderzoeker akkoord geeft; het slepen van een bevinding zou dat
 *    stilzwijgend ongedaan maken. Zie docs/adr/0001-akkoord-als-poort.md en lib/finding-code.ts.
 *    Alleen codes die met B beginnen worden hernummerd.
 *
 * De sortOrder werd bovendien buiten de transactie weggeschreven. Bij een fout in het
 * hernummeren bleef die wijziging staan, en dan klopte de volgorde niet meer met de codes --
 * precies de toestand waarin dit project werd aangetroffen.
 */

/** Buiten de B-reeks, zodat een tijdelijke code nooit met een echte kan botsen. */
const TIJDELIJK = (i: number) => `TMP-${i}`;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { findingIds } = body; // De ids van één criterium, in de nieuwe volgorde.

    if (!Array.isArray(findingIds) || findingIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json(
        { error: 'findingIds moet een lijst met ids zijn' },
        { status: 400 }
      );
    }

    const aantal = await prisma.$transaction(async (tx) => {
      // Horen deze bevindingen wel bij dit project? Zonder deze controle kon een
      // verzoek de volgorde van een ander onderzoek omgooien.
      const eigen = await tx.finding.findMany({
        where: { id: { in: findingIds }, projectId: params.id },
        select: { id: true },
      });
      if (eigen.length !== findingIds.length) {
        throw new Error('Een of meer bevindingen horen niet bij dit project');
      }

      for (let index = 0; index < findingIds.length; index++) {
        const findingId = findingIds[index];
        await tx.finding.update({ where: { id: findingId }, data: { sortOrder: index } });
      }

      const alle = await tx.finding.findMany({
        where: { projectId: params.id },
        include: { wcagCriterion: true },
      });

      // Alleen bevindingen die de poort al voorbij zijn. Voorstellen houden hun V-code.
      const teHernummeren = alle.filter((f) => (f.findingCode ?? '').startsWith('B'));

      teHernummeren.sort((a, b) => {
        const partsA = (a.wcagCriterion?.code || '').split('.').map(Number);
        const partsB = (b.wcagCriterion?.code || '').split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const numA = partsA[i] || 0;
          const numB = partsB[i] || 0;
          if (numA !== numB) return numA - numB;
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });

      const nieuweCode = new Map<string, string>();
      teHernummeren.forEach((f, i) => {
        nieuweCode.set(f.id, `B${String(i + 1).padStart(3, '0')}`);
      });

      const wijzigen = teHernummeren.filter((f) => nieuweCode.get(f.id) !== f.findingCode);

      // Ronde 1: naar een tijdelijke code, zodat de doelcodes vrijkomen.
      for (let i = 0; i < wijzigen.length; i++) {
        const f = wijzigen[i];
        await tx.finding.update({ where: { id: f.id }, data: { findingCode: TIJDELIJK(i) } });
      }
      // Ronde 2: naar de definitieve code.
      for (const f of wijzigen) {
        await tx.finding.update({
          where: { id: f.id },
          data: { findingCode: nieuweCode.get(f.id)! },
        });
      }

      return wijzigen.length;
    });

    return NextResponse.json({ success: true, hernummerd: aantal }, { status: 200 });
  } catch (error: any) {
    console.error('Fout bij het herschikken van bevindingen:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Herschikken mislukt' },
      { status: 500 }
    );
  }
}
