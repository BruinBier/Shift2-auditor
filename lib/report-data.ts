import { prisma } from '@/lib/prisma';

/**
 * Alle gegevens die een rapport nodig heeft, in één keer opgehaald.
 *
 * Het scherm, de HTML-export, de Word-export en de Excel-export lieten dit
 * allemaal zelf op: zes losse queries met vier verschillende include-vormen.
 * Daardoor kon een relatie in de ene uitvoer wél en in de andere niet
 * meekomen, en liep de sortering uiteen.
 *
 * De sortering van findings is [sortOrder, createdAt]: de volgorde die de
 * onderzoeker zelf instelt door te slepen, met de aanmaakvolgorde als
 * terugval voor findings met dezelfde sortOrder.
 */
export async function getReportData(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      clientProject: true,
      // Zonder expliciete sortering bepaalt de database de volgorde, en die
      // wisselt per aanroep. Dat gaf dezelfde export twee keer een andere
      // volgorde van scope-URL's.
      scopeUrls: { orderBy: { url: 'asc' } },
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
        // Het scherm toont per sample hoeveel bevindingen eraan hangen.
        include: { _count: { select: { occurrences: true } } },
      },
      criterionAssessments: { include: { wcagCriterion: true } },
      findings: {
        include: {
          wcagCriterion: true,
          occurrences: { include: { sampleItem: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!project) return null;

  // Bij een heronderzoek: periode van de nulmeting uit het bovenliggende project.
  const isHeronderzoek = project.checkPhase === 'herinspectie';
  const nulmeting =
    isHeronderzoek && project.parentProjectId
      ? await prisma.project.findUnique({
          where: { id: project.parentProjectId },
          select: { dateStart: true, dateEnd: true },
        })
      : null;

  // Onderzoekstype bepaalt welke succescriteria in het rapport horen.
  let researchTypeData: any = null;
  let filteredAssessments = project.criterionAssessments;
  if (project.researchType) {
    const rt = await prisma.researchType.findUnique({
      where: { name: project.researchType },
      include: { criteria: { select: { wcagCriterionId: true } } },
    });
    if (rt) {
      researchTypeData = rt;
      if (rt.criteria.length > 0) {
        const allowed = new Set(rt.criteria.map((c) => c.wcagCriterionId));
        filteredAssessments = project.criterionAssessments.filter((a) =>
          allowed.has(a.wcagCriterion.id)
        );
      }
    }
  }

  return {
    project,
    /** Het project met alleen de criteria die bij het onderzoekstype horen. */
    projectForCalc: { ...project, criterionAssessments: filteredAssessments },
    filteredAssessments,
    researchTypeData,
    isHeronderzoek,
    nulmeting,
  };
}

export type ReportData = NonNullable<Awaited<ReturnType<typeof getReportData>>>;
