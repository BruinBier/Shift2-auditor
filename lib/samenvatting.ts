import { isOpmerking, isOpgelosteOpmerking, hoortInRapport, type FindingLike } from '@/lib/finding-classification';
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
  /**
   * Bij een herinspectie: hoeveel pagina's nieuw zijn ten opzichte van de nulmeting, en
   * hoeveel er zijn vervallen. Zie telWijzigingen in lib/steekproef-wijzigingen.ts.
   */
  steekproefNieuw?: number;
  steekproefVervallen?: number;
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
  //
  // Zijn er pagina's vervangen, dan is "dezelfde" niet waar. Dat zei de samenvatting van
  // BEV-01 v1.1 terwijl Groene verhalen (404) en het oude Wmo-formulier vervangen waren.
  // De zin noemt alleen het aantal; welke pagina's en waarom staat in de feedback van de
  // onderzoeker eronder, anders staat het er twee keer. "Ten opzichte van de nulmeting"
  // als die in de tool staat, zodat er niet "de nulmeting" en "het vorige onderzoek" door
  // elkaar staan. Frits, 2026-10-20.
  const nieuw = i.steekproefNieuw ?? 0;
  const tenOpzichteVan = i.nulmetingPeriode ? 'de nulmeting' : vorige;
  const steekproefZin = aanvullend
    ? `Daarbij zijn dezelfde {totalPages} pagina's onderzocht als in ${vorige}.`
    : nieuw > 0
      ? `Voor dit ${ditWoord} zijn {totalPages} gepubliceerde webpagina's beoordeeld, waarvan ${nieuw} nieuw ten opzichte van ${tenOpzichteVan}.`
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
 * Hoeveel bevindingen uit de nulmeting (of het eerdere onderzoek) inmiddels zijn opgelost,
 * als zin voor de samenvatting van elk heronderzoek. Frits, 2026-10-24 bij BEV-01 v1.1:
 * "in de samenvatting moet nog worden vermeld welke issues uit de nulmeting zijn opgelost;
 * dit moet er standaard in komen voor alle heronderzoeken", en daarna: alleen het aantal.
 *
 * Geteld worden afkeuringen, geen opmerkingen: een opmerking keurde niets af. Alleen wat
 * uit de nulmeting komt (`discoveredInPhase`), want een nieuwe bevinding uit het
 * heronderzoek kan niet al opgelost zijn. Opgelost is status `resolved`
 * (`isOpgelosteBevinding`). De aanroeper zet de zin buiten het automatische deel, zodat hij
 * er ook staat als de onderzoeker de samenvatting zelf schreef.
 *
 * Geeft null bij een nulmeting, of als er uit de nulmeting geen bevindingen zijn.
 */
export function opgelostSindsNulmetingZin(
  project: OnderzoekSoortInvoer,
  findings: (FindingLike & { discoveredInPhase?: string | null })[],
): string | null {
  if (!isHeronderzoek(project)) return null;
  const uitNulmeting = findings.filter(
    (f) =>
      !isOpmerking(f) &&
      f.status !== 'voorstel' &&
      f.status !== 'afgewezen' &&
      (f.discoveredInPhase == null || f.discoveredInPhase === 'nulmeting'),
  );
  const totaal = uitNulmeting.length;
  if (totaal === 0) return null;
  const opgelost = uitNulmeting.filter((f) => f.status === 'resolved').length;
  const eerder = eerderOnderzoek(project);
  if (opgelost === totaal) {
    return totaal === 1
      ? `De bevinding uit ${eerder} is opgelost.`
      : `Alle ${totaal} bevindingen uit ${eerder} zijn opgelost.`;
  }
  if (opgelost === 0) {
    return `Van de ${totaal} bevindingen uit ${eerder} is er nog geen opgelost.`;
  }
  return `Van de ${totaal} bevindingen uit ${eerder} ${opgelost === 1 ? 'is er 1' : `zijn er ${opgelost}`} opgelost.`;
}

/**
 * Zet de zin van `opgelostSindsNulmetingZin` in de feedback van de onderzoeker, direct na
 * de eerste zin van de eerste alinea. Daar staat bij een heronderzoek het algemene oordeel
 * ("Sinds het vorige onderzoek is er veel verbeterd."), en het aantal hoort er meteen
 * achter. Frits, 2026-10-24 bij BEV-01.
 *
 * Lukt dat niet (geen feedback, geen alinea, geen zinseinde te vinden), dan geeft dit de
 * zin terug als losse alinea in `los`, en zet de aanroeper hem boven de feedback.
 */
export function feedbackMetOpgelost(
  feedbackHtml: string | null | undefined,
  zin: string | null,
): { feedback: string | null; los: string | null } {
  const feedback = feedbackHtml?.trim() ? String(feedbackHtml) : null;
  if (!zin) return { feedback, los: null };
  if (!feedback) return { feedback: null, los: zin };
  // Noemt de onderzoeker het aantal al zelf in de feedback, dan voegen we niets toe: hij
  // wil de zin dan op zijn eigen manier ("…zijn er 16 opgelost, complimenten daarvoor!").
  // Frits, 2026-10-24 bij BEV-01.
  if (/bevindingen?\s+uit\s+(de\s+nulmeting|het\s+eerdere\s+onderzoek|het\s+vorige\s+onderzoek)/i.test(feedback)) {
    return { feedback, los: null };
  }
  const alinea = /<p(\s[^>]*)?>([\s\S]*?)<\/p>/i.exec(feedback);
  if (!alinea) return { feedback, los: zin };
  // Het eerste zinseinde gevolgd door witruimte en een hoofdletter of cijfer, of het einde
  // van de alinea. Een afkorting als "bijv. de" telt zo niet als zinseinde.
  const binnen = alinea[2];
  const einde = /[.!?](?=\s+[A-Z0-9À-Ý'‘"“]|\s*$)/.exec(binnen);
  if (!einde) return { feedback, los: zin };
  const knip = einde.index + 1;
  const veilig = escapeHtml(zin);
  const nieuwBinnen = `${binnen.slice(0, knip)} ${veilig}${binnen.slice(knip)}`;
  const start = alinea.index + alinea[0].indexOf(binnen);
  return {
    feedback: feedback.slice(0, start) + nieuwBinnen + feedback.slice(start + binnen.length),
    los: null,
  };
}

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

/**
 * De zin bovenaan "Opmerkingen" bij een aanvullend onderzoek: hoeveel van de opmerkingen
 * uit het vorige onderzoek zijn opgelost en hoeveel er nog openstaan.
 *
 * Opgelost betekent hier: nagelopen en opgelost bevonden (`isOpgelosteOpmerking`, status
 * resolved met interimReviewed). Een opmerking staat altijd op resolved, dus de status
 * alleen zegt niets. Nog open is wat het rapport nog toont (`hoortInRapport`), zonder
 * voorstellen en afgewezen punten. Frits, 2026-10-08 (MAAS-01): "Van de zes opmerkingen
 * die bij het heronderzoek van 27 november 2025 nog openstonden, zijn er vijf opgelost.
 * Eén opmerking staat nog open."
 *
 * Geeft null als het geen aanvullend onderzoek is of als er niets is opgelost; dan geldt
 * de gewone inleiding.
 */
export function opmerkingenStandTekst(
  project: OnderzoekSoortInvoer,
  findings: FindingLike[],
): string | null {
  if (!isAanvullendOnderzoek(project)) return null;
  const opmerkingen = findings.filter(
    (f) => isOpmerking(f) && f.status !== 'voorstel' && f.status !== 'afgewezen',
  );
  const opgelost = opmerkingen.filter((f) => isOpgelosteOpmerking(f)).length;
  const open = opmerkingen.filter((f) => hoortInRapport(f)).length;
  if (opgelost === 0) return null;
  const totaal = opgelost + open;
  const tel = (n: number) => TELWOORDEN[n] ?? String(n);
  const vorige = vorigOnderzoek(project);
  if (open === 0) {
    return totaal === 1
      ? `De opmerking die bij ${vorige} nog openstond, is opgelost.`
      : `Alle ${tel(totaal)} opmerkingen die bij ${vorige} nog openstonden, zijn opgelost.`;
  }
  const deel1 = `Van de ${tel(totaal)} opmerkingen die bij ${vorige} nog openstonden, ${
    opgelost === 1 ? 'is er één' : `zijn er ${tel(opgelost)}`
  } opgelost.`;
  const deel2 = open === 1 ? 'Eén opmerking staat nog open.' : `Er staan er nog ${tel(open)} open.`;
  return `${deel1} ${deel2}`;
}
