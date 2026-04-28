import { prisma } from '@/lib/prisma';

type DefaultOpmerking = {
  criterionCode: string;
  description: string;
  advice: string;
};

const CONTRAST_SWITCH_1_4_3: DefaultOpmerking = {
  criterionCode: '1.4.3',
  description:
    'Op de website is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde "contrast switch".\n\n' +
    'Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie.\n\n' +
    'Hierdoor kunnen er contrastproblemen zijn in de standaard versie. Deze zijn verder niet beoordeeld.',
  advice:
    'We adviseren om ook de standaard versie te voorzien van voldoende kleurcontrast in alle teksten. Dit bevordert de toegankelijkheid van de website voor bezoekers met een zichtbeperking.\n\n' +
    'Teksten met voldoende kleurcontrast lezen ook makkelijker voor alle lezers. Het lezen is hierdoor minder intensief, kost minder energie en het lezen wordt (onbewust) als prettiger ervaren. Hierdoor is de lezer eerder geneigd om over te gaan tot activatie.\n\n' +
    'De versie voor hoog contrast kan dan vervolgens ingezet worden voor een "verhoogd contrast", waarbij wordt voldaan aan succescriterium WCAG 1.4.6 Verhoogd contrast (niveau AAA).',
};

const CONTRAST_SWITCH_1_4_11: DefaultOpmerking = {
  criterionCode: '1.4.11',
  description:
    'Op de website is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde "contrast switch".\n\n' +
    'Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie.\n\n' +
    'Hierdoor kunnen er contrastproblemen zijn met grafische elementen in de standaard versie. Deze zijn verder niet beoordeeld.',
  advice:
    'We adviseren om ook de standaard versie te voorzien van voldoende contrast voor grafische elementen, zoals iconen, knoppen en formuliervelden. Dit bevordert de toegankelijkheid van de website voor bezoekers met een zichtbeperking.\n\n' +
    'De versie voor hoog contrast kan dan vervolgens ingezet worden voor een "verhoogd contrast".',
};

function getDefaultsForResearchType(researchType: string | null | undefined): DefaultOpmerking[] {
  if (!researchType) return [];
  const name = researchType.toLowerCase();

  const isContentOnderzoek = name.includes('content');
  const isPdfOnderzoek = name.includes('pdf');

  if (isContentOnderzoek && !isPdfOnderzoek) {
    return [CONTRAST_SWITCH_1_4_3, CONTRAST_SWITCH_1_4_11];
  }

  return [];
}

export async function createDefaultOpmerkingen(
  projectId: string,
  researchType: string | null | undefined,
): Promise<void> {
  const defaults = getDefaultsForResearchType(researchType);
  if (defaults.length === 0) return;

  const codes = defaults.map((d) => d.criterionCode);
  const criteria = await prisma.wCAGCriterion.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });
  const codeToId = new Map(criteria.map((c) => [c.code, c.id]));

  const existingFindings = await prisma.finding.findMany({
    where: { projectId },
    select: { findingCode: true },
  });
  const existingCodes = existingFindings
    .map((f) => f.findingCode)
    .filter((c): c is string => !!c && /^B\d+$/.test(c))
    .map((c) => parseInt(c.slice(1), 10));
  let nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;

  for (const def of defaults) {
    const criterionId = codeToId.get(def.criterionCode);
    if (!criterionId) continue;

    await prisma.finding.create({
      data: {
        projectId,
        wcagCriterionId: criterionId,
        findingCode: `B${String(nextNumber).padStart(3, '0')}`,
        status: 'resolved',
        description: def.description,
        advice: def.advice,
      },
    });
    nextNumber++;
  }
}
