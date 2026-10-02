import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { controleer, leesWerkmap } from '@/lib/projecten-excel';
import { haalStandOp, leesUpload } from '@/lib/projecten-excel-stand';

export const dynamic = 'force-dynamic';

class TussentijdsGewijzigd extends Error {}

/**
 * Voert een bevestigde import door. Krijgt hetzelfde bestand plus de vingerafdruk
 * van het overzicht dat de gebruiker heeft gezien, en rekent dat overzicht
 * opnieuw uit. Klopt het niet meer, of staat er een fout in, dan gebeurt er
 * niets. Alles gaat in één transactie: of alles, of niets.
 */
export async function POST(request: Request) {
  try {
    const upload = await leesUpload(request);
    if (!upload.ok) return NextResponse.json({ error: upload.fout }, { status: 400 });
    const bevestigd = upload.form.get('vingerafdruk');
    if (typeof bevestigd !== 'string' || !bevestigd) {
      return NextResponse.json({ error: 'De import is niet bevestigd. Controleer het bestand eerst.' }, { status: 400 });
    }

    const gelezen = await leesWerkmap(upload.buffer);
    if (!gelezen.ok) return NextResponse.json({ error: gelezen.fouten[0].bericht }, { status: 400 });
    const { projecten, opdrachtgevers } = await haalStandOp();
    const controle = controleer(gelezen, projecten, opdrachtgevers);

    if (controle.fouten.length) {
      return NextResponse.json(
        { error: `Er staan ${controle.fouten.length} fouten in het bestand. Er is niets gewijzigd.`, controle },
        { status: 422 }
      );
    }
    if (controle.vingerafdruk !== bevestigd) {
      return NextResponse.json(
        {
          error:
            'Het overzicht klopt niet meer met wat er nu in de tool staat; er is intussen iets gewijzigd. Er is niets doorgevoerd. Controleer het bestand opnieuw.',
          controle,
        },
        { status: 409 }
      );
    }

    const updatedAtVan = new Map(projecten.map(p => [p.id, p.updatedAt]));
    await prisma.$transaction(async tx => {
      for (const g of controle.gewijzigd) {
        // Alleen bijwerken als het project niet tussen controle en nu is gewijzigd.
        const { count } = await tx.clientProject.updateMany({
          where: { id: g.id, updatedAt: updatedAtVan.get(g.id) },
          data: g.data,
        });
        if (count !== 1) throw new TussentijdsGewijzigd(g.name);
      }
      for (const n of controle.nieuw) {
        await tx.clientProject.create({
          data: {
            name: n.name,
            opdrachtgeverId: n.opdrachtgeverId,
            projectnummer: n.projectnummer,
            cardanKenmerk: n.cardanKenmerk,
            contactnaam: n.contactnaam,
            contactEmail: n.contactEmail,
          },
        });
      }
    });

    return NextResponse.json({
      aangemaakt: controle.nieuw.length,
      bijgewerkt: controle.gewijzigd.length,
      ongewijzigd: controle.ongewijzigd.length,
    });
  } catch (error) {
    if (error instanceof TussentijdsGewijzigd) {
      return NextResponse.json(
        {
          error: `"${error.message}" is tijdens de import in de tool gewijzigd. Er is niets doorgevoerd. Controleer het bestand opnieuw.`,
        },
        { status: 409 }
      );
    }
    console.error('Excel-import van projecten mislukt:', error);
    return NextResponse.json({ error: 'De import is mislukt. Er is niets gewijzigd.' }, { status: 500 });
  }
}
