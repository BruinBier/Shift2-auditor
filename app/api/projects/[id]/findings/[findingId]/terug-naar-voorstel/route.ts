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
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; findingId: string }> }
) {
  try {
    const params = await context.params;

    const finding = await prisma.finding.findUnique({
      where: { id: params.findingId },
      select: { id: true, projectId: true, status: true },
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
    return NextResponse.json({ findingCode: nieuweCode });
  } catch (error) {
    console.error('Error resetting finding to voorstel:', error);
    return NextResponse.json(
      { error: 'Terugzetten naar voorstel is niet gelukt' },
      { status: 500 }
    );
  }
}
