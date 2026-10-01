import {
  isHeronderzoek,
  isAanvullendOnderzoek,
  onderzoekWoord,
  eerderOnderzoek,
  type OnderzoekSoortInvoer,
} from '@/lib/onderzoek-soort';

/**
 * De automatische samenvatting bovenaan het rapport: periode, steekproef en score.
 *
 * Stond op drie plekken apart -- het rapport op het scherm (OverDitOnderzoek.tsx), de
 * generator voor HTML/Word/PDF (generate-report-html.ts) en het voorbeeld op het
 * tabblad Conclusie -- en die liepen uit elkaar: het voorbeeld kende geen heronderzoek
 * en geen aanvullend onderzoek. Nu maken alle drie de tekst hier.
 *
 * Geeft alleen het cijfermatige deel. De feedback van de onderzoeker en het slotadvies
 * zet de aanroeper eronder; een zelf geschreven samenvatting (managementSummary)
 * vervangt alleen dit deel.
 */

export type SamenvattingInvoer = {
  project: OnderzoekSoortInvoer;
  /** Het sjabloon van het onderzoekstype (HTML met {placeholders}), of leeg. */
  sjabloon?: string | null;
  totalPages: number;
  uniqueForms: number;
  totalCriteria: number;
  passedCriteria: number;
  failedCriteria: number;
  /** Al opgemaakt, bijvoorbeeld "7 augustus 2026"; "[datum]" als het ontbreekt. */
  dateStart: string;
  dateEnd: string;
  standaard?: string | null;
  niveau?: string | null;
  /** Periode van de nulmeting, alleen bij een herinspectie met parent. */
  nulmetingPeriode?: string | null;
  /** Afgekeurde criteria bij de nulmeting; 0 als die niet in de tool staat. */
  nulmetingFailedCriteria?: number;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function samenvattingHtml(i: SamenvattingInvoer): string {
  const her = isHeronderzoek(i.project);
  const aanvullend = isAanvullendOnderzoek(i.project);
  // "Dit heronderzoek". Een aanvullend onderzoek heet in de samenvatting gewoon "dit
  // onderzoek", zoals Cardan het doet; dat het een vervolg is, blijkt uit de zin over
  // opgeloste punten en uit de feedback. Frits, 2026-10-01.
  const ditWoord = aanvullend ? 'onderzoek' : onderzoekWoord(i.project, 'bepaald');
  // De steekproef is overgenomen uit het eerdere onderzoek; er wordt geen nieuwe
  // samengesteld. "Samengesteld" zou de lezer op het verkeerde been zetten.
  const steekproefZin = aanvullend
    ? `Tijdens dit onderzoek zijn {totalPages} pagina's onderzocht.`
    : `Voor dit ${ditWoord} zijn dezelfde {totalPages} gepubliceerde webpagina's opnieuw beoordeeld.`;
  const eerder = eerderOnderzoek(i.project);
  const nulmetingFailed = i.nulmetingFailedCriteria ?? 0;
  const percentage =
    i.totalCriteria > 0 ? Math.round((i.passedCriteria / i.totalCriteria) * 100) : 0;
  const criteriaWoord = i.failedCriteria === 1 ? 'succescriterium' : 'succescriteria';
  // Alles opgelost: zeg dat, en noem hoeveel het er waren. "Bij 0 succescriteria zijn
  // afwijkingen vastgesteld" leest als een onderzoek waarin niets te vinden was.
  //
  // Een aanvullend onderzoek kent het aantal van het eerdere onderzoek niet (dat staat
  // niet in de tool), en krijgt daarom een vaste zin. Formulering van Frits, 2026-09-30.
  const allesOpgelost =
    her && i.failedCriteria === 0 && (aanvullend || nulmetingFailed > 0);
  // "het vorige onderzoek (februari 2026)" als de periode op Details is ingevuld.
  const periode = i.project.eerderOnderzoekPeriode?.trim();
  const vorige = periode ? `het vorige onderzoek (${escapeHtml(periode)})` : 'het vorige onderzoek';
  const opgelostZin = aanvullend
    ? `Uit het onderzoek blijkt dat de laatste openstaande punten uit ${vorige} zijn opgelost. Hiermee voldoet de onderzochte content aan de toegankelijkheidseisen.`
    : `Er zijn geen afwijkingen meer vastgesteld; bij ${eerder} waren dat er nog ${nulmetingFailed}.`;
  // Een aanvullend onderzoek zegt altijd hoe het staat met de punten uit het vorige
  // onderzoek, ook als er nog iets openstaat. Frits, 2026-10-01.
  const nogOpenZin = `Uit het onderzoek blijkt dat nog niet alle openstaande punten uit ${vorige} zijn opgelost. Bij ${i.failedCriteria} ${criteriaWoord} zijn nog afwijkingen vastgesteld.`;
  const slotZin = allesOpgelost
    ? opgelostZin
    : aanvullend
      ? nogOpenZin
      : null;

  if (i.sjabloon) {
    let t = String(i.sjabloon);
    if (her) {
      t = t
        .replace(/Dit onderzoek is/g, `Dit ${ditWoord} is`)
        .replace(
          /Voor dit deelonderzoek is een representatieve steekproef samengesteld van \{totalPages\} gepubliceerde webpagina's met verschillende contenttypen\./g,
          steekproefZin,
        )
        .replace(/\bdit deelonderzoek\b/g, `dit ${ditWoord}`);
      if (i.nulmetingPeriode) {
        t = t.replace(
          /(Dit heronderzoek is door Shift2 uitgevoerd tussen \{dateStart\} en \{dateEnd\}\.)/,
          `$1 De nulmeting vond plaats tussen ${escapeHtml(i.nulmetingPeriode)}.`,
        );
      }
      if (slotZin) {
        t = t.replace(
          /Bij \{failedCriteria\} \{criteriaFailedSingularPlural\} zijn afwijkingen vastgesteld\./,
          slotZin,
        );
      }
    }
    return t
      .replace(/\{dateStart\}/g, i.dateStart)
      .replace(/\{dateEnd\}/g, i.dateEnd)
      .replace(/\{totalPages\}/g, String(i.totalPages))
      .replace(/\{uniqueForms\}/g, String(i.uniqueForms))
      .replace(/\{totalCriteria\}/g, String(i.totalCriteria))
      .replace(/\{passedCriteria\}/g, String(i.passedCriteria))
      .replace(/\{percentage\}/g, String(percentage))
      .replace(/\{failedCriteria\}/g, String(i.failedCriteria))
      .replace(/\{compliesFully\}/g, percentage === 100 ? 'volledig' : 'niet volledig')
      .replace(/\{formsSingularPlural\}/g, i.uniqueForms === 1 ? 'formulier' : 'formulieren')
      .replace(/\{pagesSingularPlural\}/g, i.totalPages === 1 ? 'processtap' : 'processtappen')
      .replace(/\{criteriaFailedSingularPlural\}/g, criteriaWoord)
      .replace(/\{standard\}/g, i.standaard || 'WCAG 2.2')
      .replace(/\{level\}/g, i.niveau || 'A en AA');
  }

  const onderzoek = her ? ditWoord : 'deelonderzoek';
  const nulmetingZin =
    her && i.nulmetingPeriode ? ` De nulmeting vond plaats tussen ${escapeHtml(i.nulmetingPeriode)}.` : '';
  return (
    `<p>Dit ${her ? ditWoord : 'onderzoek'} is door Shift2 uitgevoerd tussen ${escapeHtml(i.dateStart)} en ${escapeHtml(i.dateEnd)}.${nulmetingZin} ` +
    (her
      ? steekproefZin.replace('{totalPages}', String(i.totalPages))
      : `Voor dit ${onderzoek} is een representatieve steekproef samengesteld van ${i.totalPages} gepubliceerde webpagina's met verschillende contenttypen.`) +
    `</p>\n` +
    `<p>De onderzochte content voldoet ${percentage === 100 ? 'volledig' : 'niet volledig'} aan WCAG 2.2 niveau A en AA. ` +
    `In dit ${onderzoek} zijn ${i.totalCriteria} succescriteria beoordeeld. ` +
    `Er wordt voldaan aan ${i.passedCriteria} van deze ${i.totalCriteria} succescriteria (${percentage}%). ` +
    `${slotZin ?? `Bij ${i.failedCriteria} ${criteriaWoord} zijn afwijkingen vastgesteld.`}</p>`
  );
}
