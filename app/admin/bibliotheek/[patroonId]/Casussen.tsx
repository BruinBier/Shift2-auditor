'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Casuseditor, { type CasusVelden } from './Casuseditor';

type Oefenset = { id: string; titel: string; paginaCss: string };

const NIEUW: CasusVelden = {
  id: '',
  titel: '',
  html: '',
  css: '',
  js: '',
  correcteCode: '',
  uitleg: '',
  isValkuil: false,
  oefensets: [],
  volgorde: 0,
};

export default function Casussen({
  patroon,
  casussen,
  oefensets,
}: {
  patroon: { id: string; oordeel: string; criteria: string[] };
  casussen: CasusVelden[];
  oefensets: Oefenset[];
}) {
  const router = useRouter();
  const [bewerkt, setBewerkt] = useState<string | null>(null);

  const klaar = () => {
    setBewerkt(null);
    router.refresh();
  };

  return (
    <div className="grid gap-4 max-w-5xl">
      {patroon.oordeel === 'twijfel' && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Dit patroon staat op twijfel. Zijn casussen tellen niet mee in de oefensets tot er een oordeel is.
        </p>
      )}
      <p className="text-sm text-gray-600">
        Oordeel en criteria horen bij het patroon. Een casus toont altijd het oordeel van zijn patroon.
      </p>

      {casussen.length === 0 && bewerkt !== 'nieuw' && (
        <p className="bg-white rounded-lg border border-gray-200 p-6 text-gray-500">
          Nog geen casussen. Een patroon heeft er minstens één nodig voordat het vastgesteld wordt.
        </p>
      )}

      <ul className="grid gap-3">
        {casussen.map((c) => (
          <li key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {bewerkt === c.id ? (
              <Casuseditor patroonId={patroon.id} casus={c} oefensets={oefensets} onKlaar={klaar}
                onAnnuleer={() => setBewerkt(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-gray-600">{c.id}</span>
                <span className="font-medium">{c.titel}</span>
                {c.isValkuil && <span className="text-xs rounded border border-gray-300 px-1.5">valkuil</span>}
                <span className="text-xs text-gray-600">
                  {c.oefensets.length > 0 ? `in ${c.oefensets.join(', ')}` : 'in geen oefenset'}
                </span>
                <span className="ml-auto flex gap-3 text-sm">
                  {c.oefensets[0] && (
                    <a href={`/oefenen/${c.oefensets[0]}#${c.id}`} className="text-shift2-primary underline">
                      Bekijk in oefenmodus
                    </a>
                  )}
                  <button type="button" className="text-shift2-primary underline" onClick={() => setBewerkt(c.id)}
                    aria-label={`Casus ${c.id} bewerken`}>
                    Bewerken
                  </button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {bewerkt === 'nieuw' ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Casuseditor patroonId={patroon.id} casus={NIEUW} oefensets={oefensets} onKlaar={klaar}
            onAnnuleer={() => setBewerkt(null)} />
        </div>
      ) : (
        <div>
          <button type="button" onClick={() => setBewerkt('nieuw')}
            className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium">
            + Nieuwe casus
          </button>
        </div>
      )}
    </div>
  );
}
