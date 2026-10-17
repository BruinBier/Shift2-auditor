import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import Patroonformulier from '../Patroonformulier';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Nieuw patroon · Shift2 Auditor' };

export default async function NieuwPatroonPage() {
  const criteria = await prisma.wCAGCriterion.findMany({
    select: { code: true, titleNl: true },
    orderBy: { code: 'asc' },
  });
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <p className="text-sm mb-2">
          <Link href="/admin/bibliotheek" className="text-shift2-primary hover:underline">
            ← Patronen
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nieuw patroon</h1>
        <p className="text-sm text-gray-600 mb-6">
          Een nieuw patroon begint als concept met oordeel twijfel. Daarna voeg je minstens één casus toe.
        </p>
        <Patroonformulier criteria={criteria} />
      </main>
    </div>
  );
}
