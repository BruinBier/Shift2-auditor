import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Een bevinding óók als technisch issue registreren, en haar zelf laten staan.
 *
 * Anders dan `doorzetten` in de beoordeling-route: die wijst het voorstel af, omdat het
 * dan alleen nog een platformgebrek is. Hier blijft de bevinding (vaak omgezet naar
 * opmerking) in het rapport, en gaat hetzelfde punt daarnaast naar de leverancier. Op
 * LEU-01 was dat de footerrij met "Cookie-instellingen aanpassen" onder 1.4.10: de
 * redacteur kan er niets aan doen, maar het rapport moet het wel noemen.
 *
 * `supplier` is het domein van de pagina waar de bevinding op staat, zonder "www.";
 * zonder pagina het domein van de eerste scope-URL. Is de bevinding al gekoppeld, dan
 * komt hetzelfde issue terug in plaats van een tweede.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; findingId: string }> }
) {
  try {
    const params = await context.params;

    const finding = await prisma.finding.findUnique({
      where: { id: params.findingId },
      include: {
        wcagCriterion: { select: { code: true, titleNl: true } },
        technicalIssue: { select: { id: true, title: true } },
        occurrences: { include: { sampleItem: { select: { url: true } } } },
      },
    });

    if (!finding || finding.projectId !== params.id) {
      return NextResponse.json({ error: 'Bevinding niet gevonden' }, { status: 404 });
    }
    if (finding.technicalIssue) {
      return NextResponse.json({ technicalIssue: finding.technicalIssue, bestond: true });
    }

    let url = finding.occurrences.map((o) => o.sampleItem?.url).find(Boolean) ?? null;
    if (!url) {
      const scope = await prisma.projectScopeUrl.findFirst({
        where: { projectId: params.id },
        select: { url: true },
      });
      url = scope?.url ?? null;
    }
    let supplier: string | null = null;
    try {
      if (url) supplier = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      supplier = null;
    }

    // De eerste zin van de bevinding als titel: die zegt wat er mis is. De criteriumcode
    // ervoor, zodat de lijst op /technische-issues te sorteren blijft.
    const eersteZin = finding.description.split(/(?<=[.!?])\s/)[0].trim();
    const title = `${finding.wcagCriterion?.code ?? ''} ${eersteZin}`.trim().slice(0, 200);

    const issue = await prisma.technicalIssue.create({
      data: {
        title,
        description: finding.description,
        // Het advies aan de redactie wordt het verzoek aan de leverancier.
        request: finding.advice || null,
        wcagCriterionId: finding.wcagCriterionId,
        impact: finding.impact,
        supplier,
      },
      select: { id: true, title: true },
    });

    await prisma.finding.update({
      where: { id: finding.id },
      data: { technicalIssueId: issue.id },
    });

    return NextResponse.json({ technicalIssue: issue, bestond: false }, { status: 201 });
  } catch (error: any) {
    console.error('Fout bij registreren technisch issue:', error);
    return NextResponse.json(
      { error: 'Registreren als technisch issue mislukt', details: error?.message },
      { status: 500 }
    );
  }
}
