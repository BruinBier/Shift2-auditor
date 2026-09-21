import { prisma } from '@/lib/prisma';

/**
 * Het criteriumoordeel volgt uit de bevindingen — het wordt niet los gezet.
 *
 * Zie docs/adr/0001-akkoord-als-poort.md. Aanleiding: dezelfde vraag werd op vier
 * plekken anders beantwoord.
 *
 *   - aanmaken (hoofdroute) — status 'open' zette het criterium op 'failed',
 *     zonder te kijken of het een bevinding of een opmerking was
 *   - aanmaken (drie crawler-routes) — deden helemaal niets
 *   - wijzigen — hing van de projectfase af: bij 'nulmeting' eenrichting, bij
 *     'tussencheck' en 'herinspectie' wel herberekend
 *   - verwijderen — deed niets, dus een criterium bleef 'failed' staan nadat de
 *     laatste bevinding weg was
 *
 * Deze functie is voortaan het enige antwoord, en wordt aangeroepen na elke
 * aanmaak-, wijzig- en verwijderactie.
 */

/** Statussen waarmee een bevinding meetelt voor de conclusie. */
const TELT_MEE = ['open', 'published'] as const;

/**
 * Bepaalt het oordeel over één criterium opnieuw uit de bevindingen die eronder
 * hangen, en schrijft het weg. Geeft de nieuwe status terug, of null als er niets
 * te bepalen viel.
 *
 * Regels:
 *   - opmerkingen tellen niet mee; alleen `type = 'bevinding'`
 *   - minstens één openstaande bevinding  -> failed
 *   - wel bevindingen, allemaal opgelost   -> passed
 *   - geen bevindingen, oordeel is failed  -> not_tested
 *   - geen bevindingen, ander oordeel      -> ongemoeid laten
 *   - project 'afgerond'                   -> ongemoeid laten (op slot)
 *
 * Die twee gevallen zonder bevindingen verdienen toelichting. Staat een criterium
 * op 'failed' terwijl er geen enkele bevinding meer onder hangt, dan kan die
 * afkeuring alleen van een inmiddels verwijderde bevinding komen: een afkeuring
 * zonder onderbouwing. Die wordt teruggezet naar 'not_tested' — niet naar
 * 'passed', want dat de pagina's zijn getoetst is er niet uit af te leiden.
 *
 * Staat er iets anders — 'passed', 'not_present', 'not_tested' — dan is dat een
 * oordeel dat de onderzoeker zelf heeft geveld. Daar blijven we vanaf.
 */
export async function herberekenCriteriumOordeel(
  projectId: string,
  wcagCriterionId: string
): Promise<'passed' | 'failed' | 'not_tested' | null> {
  if (!projectId || !wcagCriterionId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { checkPhase: true },
  });
  if (!project) return null;

  // Een afgerond project ligt vast; daar wordt niets meer automatisch bijgesteld.
  if (project.checkPhase === 'afgerond') return null;

  const bevindingen = await prisma.finding.findMany({
    where: {
      projectId,
      wcagCriterionId,
      // Alleen echte afkeuringen. Een opmerking maakt een criterium niet failed —
      // zie de toelichting in lib/finding-classification.ts.
      type: 'bevinding',
    },
    select: { status: true },
  });

  const bestaande = await prisma.criterionAssessment.findFirst({
    where: { projectId, wcagCriterionId },
    select: { id: true, status: true },
  });

  if (bevindingen.length === 0) {
    // Een afkeuring zonder onderbouwing: de bevinding die haar droeg is weg.
    if (bestaande?.status === 'failed') {
      await prisma.criterionAssessment.update({
        where: { id: bestaande.id },
        data: { status: 'not_tested' },
      });
      return 'not_tested';
    }
    return null;
  }

  // Voorstellen en afwijzingen vallen hier vanzelf buiten zodra die statussen
  // bestaan: alleen 'open' en 'published' tellen mee.
  const heeftOpenstaande = bevindingen.some((f) =>
    (TELT_MEE as readonly string[]).includes(f.status)
  );
  const nieuweStatus = heeftOpenstaande ? 'failed' : 'passed';

  if (bestaande) {
    if (bestaande.status !== nieuweStatus) {
      await prisma.criterionAssessment.update({
        where: { id: bestaande.id },
        data: { status: nieuweStatus },
      });
    }
  } else {
    await prisma.criterionAssessment.create({
      data: { projectId, wcagCriterionId, status: nieuweStatus },
    });
  }

  return nieuweStatus;
}

/**
 * Herberekent meerdere criteria. Handig als een wijziging het criterium van een
 * bevinding verplaatst: dan moeten het oude en het nieuwe opnieuw bepaald worden.
 */
export async function herberekenCriteriumOordelen(
  projectId: string,
  criterionIds: (string | null | undefined)[]
): Promise<void> {
  const uniek = Array.from(new Set(criterionIds.filter((id): id is string => !!id)));
  for (const id of uniek) {
    await herberekenCriteriumOordeel(projectId, id);
  }
}

/* ------------------------------------------------------------------------- *
 * Het oordeel dat uit de sampleoordelen volgt
 * ------------------------------------------------------------------------- */

/**
 * Leidt het criteriumoordeel af uit de oordelen per pagina, voor één criterium.
 *
 * Dit is een ANDERE vraag dan `herberekenCriteriumOordeel` hierboven, en daarom een
 * aparte functie. Die kijkt naar de bevindingen en laat een criterium zonder
 * bevindingen bewust met rust. Deze kijkt naar `SampleCriterionCheck`: het oordeel dat
 * de agent of het paginavinkje per pagina heeft vastgelegd.
 *
 * Dat verschil was precies het gat. De herberekening hing aan zeven bevindingroutes --
 * aanmaken, wijzigen, verwijderen, goedkeuren -- en aan niets anders. Een criterium waar
 * de audit uitsluitend `voldoet` of `niet_aanwezig` op uitkwam, kreeg dus nooit een
 * projectoordeel, want daar komt geen bevinding aan te pas. Op ZOET-01 gold dat voor 20
 * van de 33 criteria: 1.2.3 stond op "niet getoetst" terwijl alle zes de pagina's al
 * beoordeeld en goedgekeurd waren. De route `derive-assessments` rekende het goed uit,
 * maar werd door niets aangeroepen; hij moest met de hand gedraaid worden.
 *
 * De rekenregels staan in `oordeelUitChecks` en zijn dezelfde als daar, vastgesteld met
 * Frits op 2026-08-02 en aangescherpt op 2026-08-03.
 *
 * Vastgelegd op 2026-09-21 bij ZOET-01.
 */
export function oordeelUitChecks(
  statussen: string[]
): 'failed' | 'passed' | 'not_present' | null {
  // `niet_te_bepalen` levert geen tegenbewijs: daar is niets gevonden dat het criterium
  // schendt, alleen iets dat niet te toetsen viel. Staat ALLES erop, dan is er echt geen
  // oordeel af te leiden en blijft het criterium onbeslist.
  const beoordeeld = statussen.filter((s) => s !== 'niet_te_bepalen');
  if (!beoordeeld.length) return null;

  if (beoordeeld.some((s) => s === 'afgekeurd')) return 'failed';
  if (beoordeeld.every((s) => s === 'niet_aanwezig')) return 'not_present';
  // voldoet, eventueel met opmerkingen ertussen. Een opmerking is geen WCAG-schending.
  return 'passed';
}

/**
 * Leidt het oordeel af voor de opgegeven criteria en schrijft het weg.
 *
 * Alleen de criteria die zijn meegegeven, niet alle drieendertig. Een losse correctie op
 * een pagina hoort geen oordelen elders te overschrijven.
 *
 * Een afgerond project ligt vast, net als bij de herberekening uit bevindingen.
 */
export async function leidCriteriumOordelenAfUitChecks(
  projectId: string,
  wcagCriterionIds: (string | null | undefined)[]
): Promise<{ criterionId: string; status: string }[]> {
  const uniek = Array.from(new Set(wcagCriterionIds.filter((id): id is string => !!id)));
  if (!projectId || !uniek.length) return [];

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { checkPhase: true },
  });
  if (!project || project.checkPhase === 'afgerond') return [];

  const checks = await prisma.sampleCriterionCheck.findMany({
    where: { sampleItem: { projectId }, wcagCriterionId: { in: uniek } },
    select: { wcagCriterionId: true, status: true },
  });

  const perCriterium = new Map<string, string[]>();
  for (const c of checks) {
    const lijst = perCriterium.get(c.wcagCriterionId) ?? [];
    lijst.push(c.status);
    perCriterium.set(c.wcagCriterionId, lijst);
  }

  const geschreven: { criterionId: string; status: string }[] = [];
  for (const [criterionId, statussen] of Array.from(perCriterium.entries())) {
    const status = oordeelUitChecks(statussen);
    if (!status) continue;
    await prisma.criterionAssessment.upsert({
      where: { projectId_wcagCriterionId: { projectId, wcagCriterionId: criterionId } },
      update: { status },
      create: { projectId, wcagCriterionId: criterionId, status },
    });
    geschreven.push({ criterionId, status });
  }
  return geschreven;
}
