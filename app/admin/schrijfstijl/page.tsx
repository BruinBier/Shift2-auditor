import Navigation from '@/app/components/Navigation';
import { prisma } from '@/lib/prisma';
import { leesGids, leesGeschiedenis } from '@/lib/schrijfstijl/gids';
import Schrijfstijl from './Schrijfstijl';

export const dynamic = 'force-dynamic';

/**
 * Schrijfstijl: waar Frits beslist wat de schrijfgids leert van zijn correcties.
 *
 * De gids zelf staat in writing/FRITS-WRITING-GUIDE.md; deze pagina toont de voorstellen die
 * Claude Code uit correcties heeft gehaald, en de geschiedenis van de gids. De werkwijze staat
 * in writing/FRITS-WRITING-WORKFLOW.md.
 */
export default async function SchrijfstijlPage() {
  const [correcties, gids, geschiedenis] = await Promise.all([
    prisma.schrijfcorrectie.findMany({
      orderBy: { ingediendOp: 'desc' },
      include: {
        finding: {
          select: { id: true, findingCode: true, projectId: true, project: { select: { kenmerk: true } } },
        },
      },
    }),
    Promise.resolve(leesGids()),
    Promise.resolve(leesGeschiedenis()),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Schrijfstijl</h1>
        <p className="text-sm text-gray-700 mt-2 max-w-3xl">
          Pas je een bevinding aan die Claude schreef, klik dan op &quot;Leer van mijn correctie&quot;. Zeg
          daarna in Claude Code: <strong>&quot;leer van mijn correcties&quot;</strong>. Claude zoekt uit of er
          een schrijfregel uit volgt, en zet het voorstel hier neer. De schrijfgids verandert pas als jij
          hier op een knop drukt.
        </p>
        <Schrijfstijl
          correcties={JSON.parse(JSON.stringify(correcties))}
          regelAantal={gids.regels.length}
          geschiedenis={[...geschiedenis].reverse()}
        />
      </main>
    </div>
  );
}
