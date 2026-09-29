'use client';

import { useState } from 'react';

/**
 * "Leer van mijn correctie": zet het verschil tussen Claudes tekst en die van de
 * onderzoeker op de lijst voor Claude Code.
 *
 * De knop analyseert zelf niets. De tool heeft geen verbinding met Claude (bewust: dat
 * zou een aparte rekening betekenen), dus de analyse gebeurt in Claude Code, als de
 * onderzoeker daar "leer van mijn correcties" zegt. Het voorstel dat daaruit komt staat
 * daarna op /admin/schrijfstijl. Zie writing/FRITS-WRITING-WORKFLOW.md.
 *
 * Alleen zichtbaar bij een bevinding die Claude schreef (aiDescription gevuld), en alleen
 * actief als de tekst in het venster er echt van afwijkt. Er wordt vergeleken met wat er
 * nu in de editor staat, niet met wat is opgeslagen: leren en opslaan zijn twee dingen.
 */

const normaal = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

export default function LeerVanCorrectieKnop({
  finding,
  description,
  advice,
}: {
  finding: { id: string; aiDescription?: string | null; aiAdvice?: string | null };
  description: string;
  advice: string;
}) {
  const [stand, setStand] = useState<'klaar' | 'bezig' | 'gedaan' | 'fout'>('klaar');
  const [melding, setMelding] = useState('');

  if (finding.aiDescription == null && finding.aiAdvice == null) return null;

  const veranderd =
    normaal(finding.aiDescription) !== normaal(description) ||
    normaal(finding.aiAdvice) !== normaal(advice);

  const verstuur = async () => {
    setStand('bezig');
    try {
      const res = await fetch('/api/schrijfstijl/correcties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          findingId: finding.id,
          bewerktDescription: description,
          bewerktAdvice: advice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Er ging iets mis');
      setStand('gedaan');
      setMelding(
        data.bijgewerkt
          ? 'Bijgewerkt op de lijst. Zeg in Claude Code: "leer van mijn correcties".'
          : 'Op de lijst gezet. Zeg in Claude Code: "leer van mijn correcties".'
      );
    } catch (e) {
      setStand('fout');
      setMelding(e instanceof Error ? e.message : 'Er ging iets mis');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={verstuur}
        disabled={!veranderd || stand === 'bezig'}
        title={
          veranderd
            ? 'Zet je aanpassing op de lijst, zodat Claude kan nagaan of er een schrijfregel uit volgt'
            : 'Je hebt de tekst van Claude nog niet aangepast'
        }
        className="px-4 py-2 text-sm bg-white text-emerald-800 rounded-lg border border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {stand === 'bezig' ? 'Bezig...' : 'Leer van mijn correctie'}
      </button>
      {melding && (
        <span role="status" className={`text-xs ${stand === 'fout' ? 'text-red-700' : 'text-gray-600'}`}>
          {melding}
        </span>
      )}
    </div>
  );
}
