import {
  isHeronderzoek,
  isAanvullendOnderzoek,
  onderzoekWoord,
  eerderOnderzoek,
  vorigOnderzoek,
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

/**
 * Zonder witruimte tussen de alinea's. Het rapport op het scherm zet de samenvatting
 * in een blok met whitespace-pre-line, en daar werd elke lege regel tussen twee
 * <p>'s een lege regel op het scherm (MAAS-01, 2026-10-01). Word/PDF merkte het niet.
 */
export function samenvattingHtml(i: SamenvattingInvoer): string {
  return samenvattingRuw(i).replace(/>\s+</g, '><').trim();
}

function samenvattingRuw(i: SamenvattingInvoer): string {
  const her = isHeronderzoek(i.project);
  const aanvullend = isAanvullendOnderzoek(i.project);
  // "Dit heronderzoek". Een aanvullend onderzoek heet in de samenvatting ook
  // "heronderzoek", maar alleen in de eerste zin; daarna "dit onderzoek". Drie keer
  // "onderzoek" in wisselende vormen las als drie onderzoeken. Frits, 2026-10-01.
  const ditWoord = aanvullend ? 'onderzoek' : onderzoekWoord(i.project, 'bepaald');
  const openingWoord = aanvullend ? 'heronderzoek' : ditWoord;
  // Wat op Details staat ("het onderzoek van 27 november 2025"), anders "het vorige
  // onderzoek"; zie vorigOnderzoek in lib/onderzoek-soort.ts.
  const vorige = escapeHtml(vorigOnderzoek(i.project));
  // De steekproef is overgenomen uit het eerdere onderzoek; er wordt geen nieuwe
  // samengesteld. "Samengesteld" zou de lezer op het verkeerde been zetten.
  const steekproefZin = aanvullend
    ? `Daarbij zijn dezelfde {totalPages} pagina's onderzocht als in ${vorige}.`
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
  const opgelostZin = aanvullend
    ? `De punten die na ${vorige} nog openstonden, zijn allemaal opgelost.`
    : `Er zijn geen afwijkingen meer vastgesteld; bij ${eerder} waren dat er nog ${nulmetingFailed}.`;
  // Een aanvullend onderzoek zegt altijd hoe het staat met de punten uit het vorige
  // onderzoek, ook als er nog iets openstaat. Frits, 2026-10-01.
  const nogOpenZin = `De punten die na ${vorige} nog openstonden, zijn nog niet allemaal opgelost. Bij ${i.failedCriteria} ${criteriaWoord} zijn nog afwijkingen vastgesteld.`;
  const slotZin = allesOpgelost
    ? opgelostZin
    : aanvullend
      ? nogOpenZin
      : null;

  // Aanvullend onderzoek waarin alles is opgelost: eigen opbouw. Het sjabloon zegt
  // dan twee keer dat de content voldoet ("voldoet volledig aan WCAG" en "voldoet aan
  // de toegankelijkheidseisen") en zet de uitkomst achter de cijfers. Nu eerst wat
  // er is opgelost, dan wat dat betekent. Frits, 2026-10-01.
  if (aanvullend && allesOpgelost) {
    return (
      `<p class="mb-3">Dit heronderzoek is door Shift2 uitgevoerd tussen ${escapeHtml(i.dateStart)} en ${escapeHtml(i.dateEnd)}. ` +
      `${steekproefZin.replace('{totalPages}', String(i.totalPages))}</p>\n\n` +
      // De cijferzin staat er ook hier, zoals in elk ander rapport: de lezer zoekt het
      // aantal beoordeelde en behaalde criteria op dezelfde plek. Frits, 2026-10-08 (MAAS-01).
      `<p class="mb-3">${opgelostZin} ` +
      `In dit ${ditWoord} zijn ${i.totalCriteria} succescriteria beoordeeld. ` +
      `Er wordt voldaan aan ${i.passedCriteria} van deze ${i.totalCriteria} succescriteria (${percentage}%). ` +
      `De onderzochte content voldoet daarmee aan ${escapeHtml(i.standaard || 'WCAG 2.2')} niveau ${escapeHtml(i.niveau || 'A en AA')}.</p>`
    );
  }

  if (i.sjabloon) {
    let t = String(i.sjabloon);
    if (her) {
      t = t
        .replace(/Dit onderzoek is/g, `Dit ${openingWoord} is`)
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
    `<p>Dit ${her ? openingWoord : 'onderzoek'} is door Shift2 uitgevoerd tussen ${escapeHtml(i.dateStart)} en ${escapeHtml(i.dateEnd)}.${nulmetingZin} ` +
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

const TELWOORDEN = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];

/**
 * De tekst onder "Bevindingen" bij een aanvullend onderzoek zonder afwijkingen.
 *
 * Daar stond "Er zijn geen bevindingen vastgesteld.", onder een inleiding die aankondigt
 * dat de afwijkingen hieronder worden beschreven. Dat leest als een onderzoek waarin niets
 * te vinden was, terwijl de punten uit het vorige onderzoek zijn opgelost. Frits,
 * 2026-10-08 (MAAS-01).
 *
 * Het aantal is het aantal succescriteria met een opgeloste afkeuring in dit onderzoek: de
 * bevindingen uit het vorige onderzoek staan er met status `resolved` in. Opmerkingen
 * tellen niet mee, die keurden niets af. Geeft null als het geen aanvullend onderzoek is;
 * dan geldt de bestaande tekst.
 */
export function opgelosteBevindingenTekst(
  project: OnderzoekSoortInvoer,
  findings: { type?: string | null; impact?: string | null; status?: string | null; wcagCriterionId?: string | null; wcagCriterion?: { id?: string; code?: string } | null }[],
): string | null {
  if (!isAanvullendOnderzoek(project)) return null;
  const criteria = new Set(
    findings
      .filter((f) => (f.type != null ? f.type !== 'opmerking' : f.impact != null) && f.status === 'resolved')
      .map((f) => f.wcagCriterionId ?? f.wcagCriterion?.id ?? f.wcagCriterion?.code)
      .filter(Boolean),
  );
  const n = criteria.size;
  const vorige = vorigOnderzoek(project);
  const zin = `Alle bevindingen uit ${vorige} zijn opgelost.`;
  if (n === 0) return zin;
  if (n === 1) {
    return `${zin} Het succescriterium waaraan toen niet werd voldaan, voldoet nu aan de toegankelijkheidseisen.`;
  }
  return `${zin} De ${TELWOORDEN[n] ?? n} succescriteria waaraan toen niet werd voldaan, voldoen nu allemaal aan de toegankelijkheidseisen.`;
}
