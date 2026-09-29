import { notFound } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { lees } from '@/lib/pdf-bouwer/opslag';
import Bouwer from './Bouwer';

export const dynamic = 'force-dynamic';

export default async function PdfBouwerDocumentPage({ params }: { params: { id: string } }) {
  const doc = await lees(params.id);
  if (!doc) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Bouwer initieel={doc} />
    </div>
  );
}
