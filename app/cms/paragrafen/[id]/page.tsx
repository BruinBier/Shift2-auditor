import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { prisma } from '@/lib/prisma';
import ParagraafDetail from './ParagraafDetail';

export const dynamic = 'force-dynamic';

export default async function CmsParagraafDetailPage({ params }: { params: { id: string } }) {
  const paragraph = await prisma.cmsParagraph.findUnique({
    where: { id: params.id },
    include: {
      helpteksten: {
        orderBy: [{ order: 'asc' }, { title: 'asc' }],
        include: {
          screenshots: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
        },
      },
    },
  });

  if (!paragraph) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="text-xs text-gray-500 mb-1">
          <Link href="/cms" className="hover:underline">
            CMS
          </Link>{' '}
          /{' '}
          <Link href="/cms/paragrafen" className="hover:underline">
            Paragrafen
          </Link>{' '}
          / {paragraph.name}
        </div>
        <ParagraafDetail paragraph={paragraph} />
      </main>
    </div>
  );
}
