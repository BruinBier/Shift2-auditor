import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectAdminTabs from './ProjectAdminTabs';

export default async function ProjectAdminPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      clientProject: {
        include: {
          opdrachtgever: true,
        },
      },
      scopeUrls: true,
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
      },
      criterionAssessments: {
        include: {
          wcagCriterion: true,
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
        },
        orderBy: { createdAt: 'desc' },
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

  const relatedProjectsData = relatedProjects.map((p) => ({
    ...p,
    dateStart: p.dateStart?.toISOString() || null,
    dateEnd: p.dateEnd?.toISOString() || null,
    researchStartedOn: p.researchStartedOn?.toISOString() || null,
    reportDate: p.reportDate.toISOString(),
  }));

  return <ProjectAdminTabs project={projectData} allCriteria={allCriteria} relatedProjects={relatedProjectsData} researchTypeExplanations={researchTypeExplanations} />;
}
