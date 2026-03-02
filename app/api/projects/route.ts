import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            scopeUrls: true,
            sampleItems: true,
            findings: true,
          },
        },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate kenmerk based on opdrachtgever
    let kenmerk = null;
    let opdrachtgeverKenmerk = null;
    let opdrachtgeverNaam = null;

    // First, try to get opdrachtgever from clientProject
    if (body.clientProjectId) {
      const clientProject = await prisma.clientProject.findUnique({
        where: { id: body.clientProjectId },
        include: { opdrachtgever: true },
      });

      if (clientProject) {
        opdrachtgeverKenmerk = clientProject.opdrachtgever.kenmerk;
        opdrachtgeverNaam = clientProject.opdrachtgever.naam;
      }
    }

    // If no clientProject or no kenmerk found, try to find opdrachtgever by commissionedBy/auditedByOrg name
    if (!opdrachtgeverKenmerk && body.auditedByOrg) {
      const opdrachtgever = await prisma.opdrachtgever.findFirst({
        where: { naam: body.auditedByOrg },
      });

      if (opdrachtgever) {
        opdrachtgeverKenmerk = opdrachtgever.kenmerk;
        opdrachtgeverNaam = opdrachtgever.naam;
      }
    }

    // Generate kenmerk if we have an opdrachtgever kenmerk
    if (opdrachtgeverKenmerk && opdrachtgeverNaam) {
      // Get all clientProjects for this opdrachtgever
      const opdrachtgeverClientProjects = await prisma.clientProject.findMany({
        where: { opdrachtgever: { naam: opdrachtgeverNaam } },
        select: { id: true },
      });

      const clientProjectIds = opdrachtgeverClientProjects.map(cp => cp.id);

      // Count ALL projects (with or without kenmerk) for this opdrachtgever
      const totalProjectCount = await prisma.project.count({
        where: {
          OR: [
            { clientProjectId: { in: clientProjectIds } },
            { commissionedBy: opdrachtgeverNaam },
          ],
        },
      });

      // Also find highest existing kenmerk number
      const existingProjectsWithKenmerk = await prisma.project.findMany({
        where: {
          kenmerk: {
            startsWith: `${opdrachtgeverKenmerk}-`,
          },
        },
        select: { kenmerk: true },
      });

      let highestNumber = 0;
      existingProjectsWithKenmerk.forEach((project) => {
        if (project.kenmerk) {
          const match = project.kenmerk.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNumber) {
              highestNumber = num;
            }
          }
        }
      });

      // Use the MAXIMUM of total count or highest kenmerk number, then add 1
      const nextNumber = Math.max(totalProjectCount, highestNumber) + 1;
      kenmerk = `${opdrachtgeverKenmerk}-${String(nextNumber).padStart(2, '0')}`;

      console.log(`Generated kenmerk: ${kenmerk} (total count: ${totalProjectCount}, highest: ${highestNumber})`);
    }

    // Get criteria from research type if specified
    let criteriaToCreate: string[] = [];
    let criteriaCodesMap: Map<string, string> = new Map(); // Map criterionId to code
    if (body.researchType) {
      const researchType = await prisma.researchType.findFirst({
        where: { name: body.researchType },
        include: {
          criteria: {
            select: {
              wcagCriterionId: true,
              wcagCriterion: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      });

      if (researchType && researchType.criteria.length > 0) {
        criteriaToCreate = researchType.criteria.map(c => c.wcagCriterionId);
        // Build a map of criterionId to code
        researchType.criteria.forEach(c => {
          criteriaCodesMap.set(c.wcagCriterionId, c.wcagCriterion.code);
        });
        console.log(`Found ${criteriaToCreate.length} criteria for research type: ${body.researchType}`);
      }
    }

    // Determine the default status for each criterion based on research type
    const getStatusForCriterion = (criterionId: string): string => {
      // Only apply special rules for "WCAG 2.2 AA deelonderzoek content"
      if (body.researchType !== 'WCAG 2.2 AA deelonderzoek content') {
        return 'not_tested';
      }

      const code = criteriaCodesMap.get(criterionId);
      if (!code) {
        return 'not_tested';
      }

      // Set specific criteria to "not_present"
      if (['1.2.4', '1.4.2', '2.2.2'].includes(code)) {
        return 'not_present';
      }

      // Set specific criteria to "passed"
      if (['2.1.4', '2.3.1'].includes(code)) {
        return 'passed';
      }

      return 'not_tested';
    };

    const project = await prisma.project.create({
      data: {
        kenmerk,
        title: body.title,
        subject: body.subject || '',
        standard: body.standard || 'WCAG 2.2',
        level: body.level || 'AA',
        researchType: body.researchType,
        version: body.version || 1,
        language: body.language || 'Nederlands',
        status: body.status || 'In uitvoering',
        clientName: body.clientName,
        commissionedBy: body.commissionedBy,
        clientProjectId: body.clientProjectId || null,
        auditedByOrg: body.auditedByOrg || 'Shift2',
        researcherName: body.researcherName,
        controllerName: body.controllerName,
        plannedTime: body.plannedTime,
        dateStart: body.dateStart ? new Date(body.dateStart) : null,
        dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
        researchStartedOn: body.researchStartedOn ? new Date(body.researchStartedOn) : null,
        reportDate: body.reportDate ? new Date(body.reportDate) : new Date(),
        description: body.description,
        isAnonymous: body.isAnonymous || false,
        isPrivate: body.isPrivate || false,
        hasReinspection: body.hasReinspection || false,
        reinspectionWeeks: body.reinspectionWeeks || null,
        summaryText: body.summaryText,
        researcherFeedbackText: body.researcherFeedbackText,
        aboutResearchText: body.aboutResearchText,
        whatWasTestedText: body.whatWasTestedText,
        aboutOrgText: body.aboutOrgText,
        methodName: body.methodName,
        techniquesNote: body.techniquesNote,
        supportBaseline: body.supportBaseline,
        userAgents: body.userAgents ? JSON.stringify(body.userAgents) : null,
        technologies: body.technologies || [],
        criterionAssessments: {
          create: criteriaToCreate.map(criterionId => ({
            wcagCriterionId: criterionId,
            status: getStatusForCriterion(criterionId),
          })),
        },
      },
    });

    console.log(`Created project ${project.id} with ${criteriaToCreate.length} criterion assessments`);

    // If reinspection is enabled, create v1.1 project
    let reinspectionProject = null;
    if (body.hasReinspection && body.reinspectionWeeks && body.dateEnd) {
      const deadlineDate = new Date(body.dateEnd);
      const reinspectionStart = new Date(deadlineDate);
      reinspectionStart.setDate(reinspectionStart.getDate() + (body.reinspectionWeeks * 7));

      // Calculate reinspection deadline (1 week for reinspection)
      const reinspectionDuration = 7; // 1 week for reinspection

      const reinspectionEnd = new Date(reinspectionStart);
      reinspectionEnd.setDate(reinspectionEnd.getDate() + reinspectionDuration);

      reinspectionProject = await prisma.project.create({
        data: {
          kenmerk: kenmerk, // Same kenmerk as v1.0, version differentiates them
          title: `${body.title} (herinspectie)`,
          subject: body.subject || '',
          standard: body.standard || 'WCAG 2.2',
          level: body.level || 'AA',
          researchType: body.researchType,
          version: 1.1,
          language: body.language || 'Nederlands',
          status: 'Gepland',
          clientName: body.clientName,
          commissionedBy: body.commissionedBy,
          clientProjectId: body.clientProjectId || null,
          auditedByOrg: body.auditedByOrg || 'Shift2',
          researcherName: body.researcherName,
          controllerName: body.controllerName,
          plannedTime: body.plannedTime,
          dateStart: reinspectionStart,
          dateEnd: reinspectionEnd,
          researchStartedOn: null,
          reportDate: reinspectionEnd,
          description: body.description,
          isAnonymous: body.isAnonymous || false,
          isPrivate: body.isPrivate || false,
          hasReinspection: false,
          reinspectionWeeks: null,
          parentProjectId: project.id,
          summaryText: body.summaryText,
          researcherFeedbackText: body.researcherFeedbackText,
          aboutResearchText: body.aboutResearchText,
          whatWasTestedText: body.whatWasTestedText,
          aboutOrgText: body.aboutOrgText,
          methodName: body.methodName,
          techniquesNote: body.techniquesNote,
          supportBaseline: body.supportBaseline,
          userAgents: body.userAgents ? JSON.stringify(body.userAgents) : null,
          technologies: body.technologies || [],
          criterionAssessments: {
            create: criteriaToCreate.map(criterionId => ({
              wcagCriterionId: criterionId,
              status: getStatusForCriterion(criterionId),
            })),
          },
        },
      });

      console.log(`Created reinspection project ${reinspectionProject.id} (v1.1) linked to ${project.id} (v1.0)`);
    }

    return NextResponse.json({
      project,
      reinspectionProject,
      message: reinspectionProject ? 'Project en herinspectie aangemaakt' : 'Project aangemaakt'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
