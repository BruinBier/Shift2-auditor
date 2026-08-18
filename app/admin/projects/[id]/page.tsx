import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectAdminTabs from './ProjectAdminTabs';

export default async function ProjectAdminPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      childProjects: {
        select: { id: true, version: true, status: true, checkPhase: true },
      },
      // Voor het Planning-blok: bij een vervolgonderzoek tonen we de datums
      // van de nulmeting, want daar begint de hersteltermijn.
      parentProject: {
        select: {
          id: true,
          version: true,
          status: true,
          dateStart: true,
          dateEnd: true,
          reportDate: true,
          planningSent: true,
          planningApproved: true,
          scopeInScope: true,
          scopeOutOfScope: true,
          sampleClientPages: true,
        },
      },
      clientProject: {
        include: {
          opdrachtgever: true,
        },
      },
      scopeUrls: {
        where: {
          parentUrlId: null, // Only fetch parent URLs (not discovered children)
        },
      },
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
        include: {
          crawlerResults: true,
          // Het oordeel per criterium op dit sample. Voedt het "Waar sta ik"-scherm.
          criterionChecks: {
            select: {
              wcagCriterionId: true,
              status: true,
              reden: true,
              bron: true,
              akkoord: true,
              // Waarop het oordeel rust en of dat standhoudt. Zonder deze twee toont
              // de kaart alleen de tekst van de auditor, en is niet te zien of er
              // iets gemeten is of dat iemand het heeft nagekeken.
              verantwoording: true,
              controle: true,
            },
          },
        },
      },
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
      // De ruwe observaties van de onderzoeker, voor het "Waar sta ik"-scherm.
      waarnemingen: {
        orderBy: { createdAt: 'desc' },
        include: {
          sampleItem: { select: { id: true, title: true } },
          finding: { select: { id: true, findingCode: true, status: true } },
        },
      },
      findings: {
        include: {
          wcagCriterion: true,
          occurrences: {
            include: {
              sampleItem: true,
            },
          },
          affectedUrls: {
            include: {
              scopeUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      advices: {
        include: {
          wcagCriterion: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch criteria based on project's research type
  let allCriteria;

  // First, try to find the research type by name
  const researchType = await prisma.researchType.findUnique({
    where: { name: project.researchType },
    include: {
      criteria: {
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (researchType && researchType.criteria.length > 0) {
    // Use criteria from the research type
    allCriteria = researchType.criteria.map(rtc => rtc.wcagCriterion);
    console.log(`Using ${allCriteria.length} criteria from research type "${project.researchType}"`);
  } else {
    // Fallback: fetch all criteria if research type not found or has no criteria
    allCriteria = await prisma.wCAGCriterion.findMany({
      orderBy: { code: 'asc' },
    });
    console.log(`No research type criteria found, using all ${allCriteria.length} criteria`);
  }

  // Sort criteria numerically by code
  allCriteria = allCriteria.sort((a, b) => {
    const aParts = a.code.split('.').map(Number);
    const bParts = b.code.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aNum = aParts[i] || 0;
      const bNum = bParts[i] || 0;
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    }
    return 0;
  });

  // Fetch default explanations for this research type
  const researchTypeExplanations = await prisma.researchTypeExplanation.findMany({
    where: {
      researchTypeName: project.researchType,
    },
    include: {
      wcagCriterion: true,
    },
  });

  // Fetch related projects (same commissioned by / opdrachtgever)
  const relatedProjects = project.commissionedBy
    ? await prisma.project.findMany({
        where: {
          AND: [
            { id: { not: project.id } }, // Exclude current project
            { commissionedBy: project.commissionedBy }, // Only same opdrachtgever
          ],
        },
        orderBy: { reportDate: 'desc' },
        take: 10, // Limit to 10 related projects
      })
    : [];

  // Convert dates to strings
  const projectData = {
    ...project,
    // Het sjabloon van het onderzoekstype meegeven, zodat het beheerscherm dezelfde
    // samenvatting toont als het rapport. Zonder dit bouwde de conclusietab zijn eigen
    // tekst op en liepen de twee uiteen.
    researchTypeData: researchType
      ? {
          summaryTemplate: researchType.summaryTemplate,
          version: researchType.version,
          level: researchType.level,
        }
      : null,
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    researchStartedOn: project.researchStartedOn?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    findings: project.findings.map((f: any) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  };

  // Debug: Check if sampleInfo is present
  console.log('🔍 DEBUG: project.sampleInfo =', project.sampleInfo);
  console.log('🔍 DEBUG: projectData.sampleInfo =', projectData.sampleInfo);

  const relatedProjectsData = relatedProjects.map((p) => ({
    ...p,
    dateStart: p.dateStart?.toISOString() || null,
    dateEnd: p.dateEnd?.toISOString() || null,
    researchStartedOn: p.researchStartedOn?.toISOString() || null,
    reportDate: p.reportDate.toISOString(),
  }));

  return <ProjectAdminTabs project={projectData} allCriteria={allCriteria} relatedProjects={relatedProjectsData} researchTypeExplanations={researchTypeExplanations} />;
}
