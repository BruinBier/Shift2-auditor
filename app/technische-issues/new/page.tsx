import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import TechnicalIssueForm from '../TechnicalIssueForm';

export const dynamic = 'force-dynamic';

export default async function NewTechnicalIssuePage() {
  const criteria = await prisma.wCAGCriterion.findMany({
    select: { id: true, code: true, titleNl: true, level: true },
    orderBy: { code: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1000px] mx-auto px-8 py-8">
        <div className="mb-4">
          <Link href="/technische-issues" className="text-sm text-shift2-primary hover:underline">
            ← Terug naar Technische issues
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nieuw technisch issue</h1>
        <TechnicalIssueForm mode="create" criteria={criteria} />
      </main>
    </div>
  );
}
