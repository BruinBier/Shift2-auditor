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
