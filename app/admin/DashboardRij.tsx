'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Eén rij in een dashboardblok.
 *
 * Client component om één reden: een lange reden van wachten past niet in een cel en klapt
 * open met een driehoekje. De rest van de rij blijft een link naar het onderzoek, dus dat
 * driehoekje moet het doorklikken tegenhouden — en dat kan alleen met een klikafhandelaar.
 */
export type DashboardRegel = {
  id: string;
  kenmerk: string;
  opdrachtgever: string;
  website: string;
  ronde?: string;
  uitvoerder: string;
  crmNummer?: string | null;
  toelichting: string;
};

/**
 * Boven deze lengte krijgt een toelichting een driehoekje in plaats van hele tekst.
 *
 * Ruim boven de langste actietekst ("herinnering sturen, 24 dagen geen planning van Cardan",
 * 51 tekens) en ruim onder een reden van wachten, die uit hele zinnen bestaat.
 */
const TE_LANG = 70;

export default function DashboardRij({ regel }: { regel: DashboardRegel }) {
  const [open, setOpen] = useState(false);
  const lang = regel.toelichting.length > TE_LANG;

  const cel = 'px-3 py-2 align-top text-sm';

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Kenmerk en opdrachtgever in een cel, onder elkaar: samen zeggen ze om welk
            onderzoek van welke klant het gaat, en zo blijft er breedte over voor de
            actiekolom. */}
        <td className={cel}>
          <Link
            href={`/admin/projects/${regel.id}`}
            className="font-medium text-gray-900 hover:underline"
          >
            {regel.kenmerk}
          </Link>
          {regel.opdrachtgever && (
            <div className="text-gray-500">{regel.opdrachtgever}</div>
          )}
        </td>
        <td className={`${cel} text-gray-900`}>{regel.website}</td>
        <td className={`${cel} text-blue-700`}>{regel.ronde ?? ''}</td>
        <td
          className={`${cel} whitespace-nowrap ${
            regel.uitvoerder === 'Shift2' ? 'text-gray-500' : 'text-amber-700'
          }`}
        >
          {regel.uitvoerder}
        </td>
        <td className={`${cel} whitespace-nowrap`}>
          {regel.crmNummer ? (
            <span className="text-gray-500">{regel.crmNummer}</span>
          ) : (
            <span className="text-amber-600" title="Nog geen CRM-nummer">
              ⚠ ontbreekt
            </span>
          )}
        </td>
        <td className={`${cel} text-gray-500`}>
          {lang ? (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="text-left hover:text-gray-900"
            >
              <span className="mr-1 inline-block text-gray-400">{open ? '▾' : '▸'}</span>
              {open ? 'minder' : regel.toelichting.slice(0, TE_LANG).trimEnd() + '…'}
            </button>
          ) : (
            regel.toelichting
          )}
        </td>
      </tr>
      {lang && open && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-3 pb-3 pt-0 text-sm text-gray-600">
            {regel.toelichting}
          </td>
        </tr>
      )}
    </>
  );
}
