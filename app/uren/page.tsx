import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import { URENREGEL_INCLUDE } from '@/lib/uren';
import UrenOverzicht from './UrenOverzicht';

export const dynamic = 'force-dynamic';

export default async function UrenPage() {
  const [regels, projecten] = await Promise.all([
    prisma.urenregel.findMany({
      orderBy: [{ datum: 'desc' }, { createdAt: 'desc' }],
      include: URENREGEL_INCLUDE,
    }),
    prisma.project.findMany({
      select: { id: true, kenmerk: true, title: true, version: true, checkPhase: true, parentProjectId: true },
      orderBy: [{ kenmerk: 'asc' }, { version: 'asc' }, { title: 'asc' }],
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Uren</h1>
        <p className="text-sm text-gray-600 mt-1 mb-6">
          Wat je in de urenapp hebt geschreven, zodat je het hier kunt terugzoeken. De urenapp blijft
          de bron.
        </p>
        <UrenOverzicht
          projecten={projecten}
          beginRegels={regels.map((r) => ({
            id: r.id,
            projectId: r.projectId,
            datum: r.datum.toISOString().slice(0, 10),
            uren: r.uren,
            omschrijving: r.omschrijving,
            project: r.project,
          }))}
        />
      </main>
    </div>
  );
}
