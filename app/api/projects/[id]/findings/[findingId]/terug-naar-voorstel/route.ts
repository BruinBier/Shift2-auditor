import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { zetTerugNaarVoorstel } from '@/lib/finding-code';

/**
 * Een eerder akkoord op één bevinding herzien.
 *
 * `zetTerugNaarVoorstel` bestond al -- hij draait automatisch mee als een hertest een
 * eerder akkoord ongeldig maakt (zie criterion-checks/route.ts). Deze route is de losse
 * knop ernaast: de onderzoeker die op de kaart terugkomt op een B-nummer, zonder dat er
 * een nieuwe meting aan te pas komt.
 *
 * B-code wordt weer V-code uit de voorstel-reeks; de oude B-code blijft bewust "gebruikt"
 * (het gat is de lezing waard: hier stond ooit iets waar je op terugkwam), zie
 * docs/adr/0001-akkoord-als-poort.md.
 *
 * Naast de bevinding zelf moet ook het CRITERIUMOORDEEL zijn akkoord verliezen. Zonder dat
 * bleef de knop "Pagina akkoord voor 1.3.1" grijs en "afgevinkt" staan terwijl er alweer een
 * open voorstel op diezelfde kaart stond -- precies de tegenstelling die de akkoord-poort
 * moet voorkomen. `criterion-checks/route.ts` doet het omgekeerde al (een vervallen
 * criteriumoordeel trekt zijn bevindingen terug naar voorstel); hier is de bevinding het
 * startpunt en het criteriumoordeel de bijwerking.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; findingId: string }> }
) {
  try {
    const params = await context.params;

    const finding = await prisma.finding.findUnique({
      where: { id: params.findingId },
      select: {
        id: true,
        projectId: true,
        status: true,
        wcagCriterionId: true,
        occurrences: { select: { sampleItemId: true } },
      },
    });
    if (!finding || finding.projectId !== params.id) {
      return NextResponse.json({ error: 'Bevinding niet gevonden' }, { status: 404 });
    }
    if (finding.status === 'voorstel') {
      return NextResponse.json(
        { error: 'Dit is al een voorstel, er is niets om terug te draaien' },
        { status: 409 }
      );
    }

    const nieuweCode = await zetTerugNaarVoorstel(params.id, finding.id);

    // Het akkoord op elk criteriumoordeel waar deze bevinding bij hoort, vervalt mee -- op
    // elke pagina waar hij voorkomt, niet alleen de kaart waarop nu geklikt is.
    const sampleItemIds = finding.occurrences.map((o) => o.sampleItemId);
    let akkoordVervallenOp = 0;
    if (sampleItemIds.length) {
      const resultaat = await prisma.sampleCriterionCheck.updateMany({
        where: {
          sampleItemId: { in: sampleItemIds },
          wcagCriterionId: finding.wcagCriterionId,
          akkoord: 'akkoord',
        },
        data: { akkoord: null },
      });
      akkoordVervallenOp = resultaat.count;
    }

    return NextResponse.json({ findingCode: nieuweCode, akkoordVervallenOp });
  } catch (error) {
    console.error('Error resetting finding to voorstel:', error);
    return NextResponse.json(
      { error: 'Terugzetten naar voorstel is niet gelukt' },
      { status: 500 }
    );
  }
}
