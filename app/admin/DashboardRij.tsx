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
  /** Link naar het onderzoek in het portaal van het bureau, als die er is. */
  uitvoerderUrl?: string | null;
  crmNummer?: string | null;
  /** Bespreekpunten voor het scopegesprek die nog niet zijn afgevinkt, als tekst. */
  bespreekpunten?: string[];
  /**
   * Afspraken met de klant waarvan de datum nadert of verstreken is.
   *
   * Niet alle lopende afspraken. Dit scherm is een werklijst en toont waar je achteraan
   * moet; een afspraak die netjes bij de klant ligt zonder datum vraagt niets van je, en
   * stond hier eerst wel -- dan las een onderzoek waarin alles loopt zoals afgesproken
   * als een onderzoek met vijf achterstallige punten. Die staan op de projectpagina.
   */
  klantafspraken?: { tekst: string; uiterlijk: Date | string }[];
  /** De dag waar de regel over gaat (gesprek of start); "Komt eraan" sorteert erop. */
  wanneer?: Date;
  /**
   * Wat er moet gebeuren of waar je op wacht. Een regeleinde scheidt het wat van het
   * wanneer: "uitnodiging nog niet geaccepteerd" op de eerste regel, "gisteren uitgenodigd
   * voor het adviesgesprek" kleiner eronder. Eerst lezen wat telt, dan hoe lang het al duurt.
   */
  toelichting: string;
};

/**
 * Boven deze lengte krijgt een toelichting een driehoekje in plaats van hele tekst.
 *
 * Ruim boven de langste actietekst ("gesprek nog te voeren" plus "29 dagen geleden
 * uitnodiging adviesgesprek geaccepteerd", 84 tekens) en ruim onder een reden van wachten,
 * die uit hele zinnen bestaat.
 */
const TE_LANG = 100;

export default function DashboardRij({ regel }: { regel: DashboardRegel }) {
  const [open, setOpen] = useState(false);
  const [puntenOpen, setPuntenOpen] = useState(false);
  const [afsprakenOpen, setAfsprakenOpen] = useState(false);
  const lang = regel.toelichting.length > TE_LANG;
  const punten = regel.bespreekpunten ?? [];
  const afspraken = regel.klantafspraken ?? [];

  /**
   * "verlopen", "vandaag", "over 3 dagen". De rij zegt elders ook "gisteren"; een datum
   * in cijfers dwingt je om zelf te rekenen hoe dringend het is.
   */
  const termijn = (datum: Date | string) => {
    const dagen = Math.ceil((new Date(datum).getTime() - Date.now()) / 86400000);
    if (dagen < 0) return 'verlopen';
    if (dagen === 0) return 'vandaag';
    if (dagen === 1) return 'morgen';
    return `over ${dagen} dagen`;
  };

  /** Het eerste wat verloopt bepaalt de toon van de melding. */
  const isVerlopen = afspraken.some((a) => new Date(a.uiterlijk).getTime() < Date.now());

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
        {/* Een domein heeft geen spaties; zonder afbreekregel loopt een lange naam de
            vaste kolom uit. */}
        <td className={`${cel} text-gray-900 [overflow-wrap:anywhere]`}>{regel.website}</td>
        <td className={`${cel} text-blue-700`}>{regel.ronde ?? ''}</td>
        {/* Bij een extern bureau met een link erin: doorklikken naar hun portaal. Dat is
            de plek waar je "Cardan" leest, dus daar verwacht je die doorklik. */}
        <td
          className={`${cel} whitespace-nowrap ${
            regel.uitvoerder === 'Shift2' ? 'text-gray-500' : 'text-amber-700'
          }`}
        >
          {regel.uitvoerderUrl ? (
            <a
              href={regel.uitvoerderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              title={`Open dit onderzoek bij ${regel.uitvoerder}`}
            >
              {regel.uitvoerder} ↗
            </a>
          ) : (
            regel.uitvoerder
          )}
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
            (() => {
              const [wat, wanneer] = regel.toelichting.split('\n');
              return (
                <>
                  <div>{wat}</div>
                  {wanneer && <div className="text-xs text-gray-400">{wanneer}</div>}
                </>
              );
            })()
          )}
          {/* Los van de toelichting, want die gaat over de routekaart; dit is wat je in
              het gesprek zelf niet mag vergeten. Klapt hier uit: doorklikken naar de
              projectpagina bracht je bovenaan een lange pagina, ver van het blok. */}
          {punten.length > 0 && (
            <button
              type="button"
              onClick={() => setPuntenOpen(!puntenOpen)}
              aria-expanded={puntenOpen}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              <span aria-hidden="true">{puntenOpen ? '▾' : '▸'}</span>
              {punten.length === 1
                ? '1 bespreekpunt voor het scopegesprek'
                : `${punten.length} bespreekpunten voor het scopegesprek`}
            </button>
          )}
          {afspraken.length > 0 && (
            <button
              type="button"
              onClick={() => setAfsprakenOpen(!afsprakenOpen)}
              aria-expanded={afsprakenOpen}
              className={`mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline ${
                isVerlopen ? 'text-red-800' : 'text-blue-800'
              }`}
            >
              <span aria-hidden="true">{afsprakenOpen ? '▾' : '▸'}</span>
              {afspraken.length === 1
                ? `Afspraak met de klant: ${termijn(afspraken[0].uiterlijk)}`
                : `${afspraken.length} afspraken met de klant, eerste ${termijn(afspraken[0].uiterlijk)}`}
            </button>
          )}
        </td>
      </tr>
      {punten.length > 0 && puntenOpen && (
        <tr className="bg-amber-50">
          <td colSpan={6} className="px-3 pb-3 pt-2 text-sm text-gray-800">
            <ul className="list-disc pl-5 space-y-1">
              {punten.map((tekst, i) => (
                <li key={i} className="whitespace-pre-wrap">{tekst}</li>
              ))}
            </ul>
            <Link
              href={`/admin/projects/${regel.id}#bespreekpunten`}
              className="mt-2 inline-block text-xs text-shift2-primary hover:underline"
            >
              Naar het blok Bespreekpunten op de projectpagina, om af te vinken of een punt toe te voegen
            </Link>
          </td>
        </tr>
      )}
      {afspraken.length > 0 && afsprakenOpen && (
        <tr className={isVerlopen ? 'bg-red-50' : 'bg-blue-50'}>
          <td colSpan={6} className="px-3 pb-3 pt-2 text-sm text-gray-800">
            <ul className="list-disc pl-5 space-y-1">
              {afspraken.map((a, i) => (
                <li key={i} className="whitespace-pre-wrap">
                  <span className="text-xs font-medium text-gray-500">{termijn(a.uiterlijk)}</span>
                  {' — '}
                  {a.tekst}
                </li>
              ))}
            </ul>
            <Link
              href={`/admin/projects/${regel.id}#klantafspraken`}
              className="mt-2 inline-block text-xs text-shift2-primary hover:underline"
            >
              Naar het blok Afgesproken met de klant op de projectpagina, om af te vinken of een afspraak toe te voegen
            </Link>
          </td>
        </tr>
      )}
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
