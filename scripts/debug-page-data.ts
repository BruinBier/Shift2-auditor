import { PrismaClient } from '@prisma/client';
import { marked } from 'marked';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  // Simulate what page.tsx does
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      clientProject: true,
      scopeUrls: true,
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
        include: {
          _count: {
            select: { occurrences: true },
          },
        },
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
    console.log('Project not found');
    return;
  }

  console.log('=== STEP 1: ORIGINAL PROJECT ===');
  console.log('Total assessments:', project.criterionAssessments.length);

  // Filter criterionAssessments based on research type
  let filteredAssessments = project.criterionAssessments;
  if (project.researchType) {
    const researchType = await prisma.researchType.findUnique({
      where: { name: project.researchType },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    if (researchType && researchType.criteria.length > 0) {
      const allowedCriteriaIds = new Set(researchType.criteria.map(c => c.wcagCriterionId));
      filteredAssessments = project.criterionAssessments.filter(
        assessment => allowedCriteriaIds.has(assessment.wcagCriterion.id)
      );
    }
  }

  console.log('\n=== STEP 2: FILTERED ASSESSMENTS ===');
  console.log('Filtered assessments:', filteredAssessments.length);

  // Update project with filtered assessments
  const projectWithFilteredAssessments = {
    ...project,
    criterionAssessments: filteredAssessments,
  };

  console.log('\n=== STEP 3: PROJECT WITH FILTERED ASSESSMENTS ===');
  console.log('projectWithFilteredAssessments.criterionAssessments.length:', projectWithFilteredAssessments.criterionAssessments.length);

  // Convert dates to strings for client component (like in page.tsx)
  const projectData = {
    ...projectWithFilteredAssessments,
    version: parseFloat(String(project.version)),
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    userAgents: project.userAgents || null,
    findings: project.findings.map((f: any) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      occurrences: f.occurrences,
    })),
  };

  console.log('\n=== STEP 4: PROJECT DATA (what gets sent to client) ===');
  console.log('projectData.criterionAssessments.length:', projectData.criterionAssessments.length);

  // Calculate stats
  const passed = projectData.criterionAssessments.filter((a: any) => a.status === 'passed').length;
  const failed = projectData.criterionAssessments.filter((a: any) => a.status === 'failed').length;
  const notPresent = projectData.criterionAssessments.filter((a: any) => a.status === 'not_present').length;
  const unknown = projectData.criterionAssessments.filter((a: any) => a.status === 'unknown').length;

  const totalAssessed = passed + failed + notPresent + unknown;
  const effectivePassed = passed + notPresent;
  const percentage = totalAssessed > 0 ? Math.round((effectivePassed / totalAssessed) * 100) : 0;

  console.log('\n=== CALCULATED STATS ===');
  console.log('totalAssessed:', totalAssessed);
  console.log('passed:', passed);
  console.log('failed:', failed);
  console.log('notPresent:', notPresent);
  console.log('effectivePassed:', effectivePassed);
  console.log('percentage:', percentage + '%');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());