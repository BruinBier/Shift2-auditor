import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDefaultOpmerkingen } from '@/lib/default-opmerkingen';
import { getCurrentUserAgentsHtml } from '@/lib/browser-versions';

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

      // Find all existing kenmerk numbers for this opdrachtgever
      const existingProjects = await prisma.project.findMany({
        where: {
          kenmerk: {
            startsWith: `${opdrachtgeverKenmerk}-`,
          },
        },
        select: { kenmerk: true },
      });

      // Extract all existing numbers
      const existingNumbers = new Set<number>();
      existingProjects.forEach((project) => {
        if (project.kenmerk) {
          const match = project.kenmerk.match(/-(\d+)$/);
          if (match) {
            existingNumbers.add(parseInt(match[1], 10));
          }
        }
      });

      // Find the first available number (starting from 1)
      let nextNumber = 1;
      while (existingNumbers.has(nextNumber)) {
        nextNumber++;
      }

      kenmerk = `${opdrachtgeverKenmerk}-${String(nextNumber).padStart(2, '0')}`;

      console.log(`Generated kenmerk: ${kenmerk} (first available number, existing: ${Array.from(existingNumbers).sort((a, b) => a - b).join(', ')})`);
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
    const getStatusForCriterion = (criterionId: string): 'not_tested' | 'not_present' | 'passed' | 'failed' => {
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

    // Get default user agents if not provided.
    // De geïnstalleerde browserversies gaan voor op de opgeslagen standaard:
    // die standaard veroudert stilletjes en beschrijft dan niet meer waarmee
    // daadwerkelijk is getest. Valt terug op de settings-waarde als detectie
    // niets oplevert (andere machine, browser niet gevonden).
    let userAgents = body.userAgents;
    if (!userAgents) {
      userAgents = await getCurrentUserAgentsHtml();
    }
    if (!userAgents && body.researchType) {
      // Check if research type contains "formulieren" (case insensitive)
      const isFormulieren = body.researchType.toLowerCase().includes('formulieren');
      const settingsKey = isFormulieren
        ? 'default_user_agents_formulieren'
        : 'default_user_agents';

      const defaultUserAgentsSetting = await prisma.settings.findUnique({
        where: { key: settingsKey },
      });
      if (defaultUserAgentsSetting) {
        userAgents = defaultUserAgentsSetting.value;
      }
    }

    // Get default technologies if not provided
    let technologies = body.technologies;
    if (!technologies && body.researchType) {
      // Check if research type contains "formulieren" (case insensitive)
      const isFormulieren = body.researchType.toLowerCase().includes('formulieren');
      const settingsKey = isFormulieren
        ? 'default_technologies_formulieren'
        : 'default_technologies';

      const defaultTechnologiesSetting = await prisma.settings.findUnique({
        where: { key: settingsKey },
      });
      if (defaultTechnologiesSetting) {
        try {
          technologies = JSON.parse(defaultTechnologiesSetting.value);
        } catch (e) {
          console.error('Failed to parse default technologies:', e);
        }
      }
    }

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
        reportDate: body.reportDate ? new Date(body.reportDate) : (body.dateEnd ? new Date(body.dateEnd) : new Date()),
        description: body.description,
        isAnonymous: body.isAnonymous || false,
        isPrivate: body.isPrivate || false,
        hasReinspection: body.hasReinspection || false,
        reinspectionWeeks: body.reinspectionWeeks || null,
        reinspectionDate: body.reinspectionDate ? new Date(body.reinspectionDate) : null,
        isExternalProject: body.isExternalProject || false,
        externalBureau: body.externalBureau || null,
        summaryText: body.summaryText,
        researcherFeedbackText: body.researcherFeedbackText,
        aboutResearchText: body.aboutResearchText,
        whatWasTestedText: body.whatWasTestedText,
        aboutOrgText: body.aboutOrgText,
        methodName: body.methodName,
        techniquesNote: body.techniquesNote,
        supportBaseline: body.supportBaseline,
        userAgents: userAgents || null,
        technologies: technologies || [],
        criterionAssessments: {
          create: criteriaToCreate.map(criterionId => ({
            wcagCriterion: {
              connect: {
                id: criterionId,
              },
            },
            status: getStatusForCriterion(criterionId),
          })),
        },
      },
    });

    console.log(`Created project ${project.id} with ${criteriaToCreate.length} criterion assessments`);

    await createDefaultOpmerkingen(project.id, body.researchType);

    // If reinspection is enabled, create v1.1 project
    let reinspectionProject = null;
    if (body.hasReinspection) {
      let reinspectionStart: Date | null = null;
      let reinspectionEnd: Date | null = null;

      if (body.reinspectionDate) {
        // External projects: use specified date
        reinspectionStart = new Date(body.reinspectionDate);
        // Calculate reinspection deadline (1 week for reinspection)
        reinspectionEnd = new Date(reinspectionStart);
        reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);
      } else if (body.reinspectionWeeks && body.dateEnd) {
        // Regular projects: calculate from deadline + weeks
        const deadlineDate = new Date(body.dateEnd);
        reinspectionStart = new Date(deadlineDate);
        reinspectionStart.setDate(reinspectionStart.getDate() + (body.reinspectionWeeks * 7));
        // Calculate reinspection deadline (1 week for reinspection)
        reinspectionEnd = new Date(reinspectionStart);
        reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);
      }
      // If neither dates nor weeks+deadline are available (e.g. parent is "In de wacht"),
      // create the reinspection without dates so it shows up under the parent and can be planned later.

      {
      reinspectionProject = await prisma.project.create({
        data: {
          kenmerk: kenmerk, // Same kenmerk as v1.0, version differentiates them
          title: body.title, // Use same title as v1.0, version differentiates them
          subject: body.subject || '',
          standard: body.standard || 'WCAG 2.2',
          level: body.level || 'AA',
          researchType: body.researchType,
          version: 1.1,
          language: body.language || 'Nederlands',
          status: body.status === 'In de wacht' ? 'In de wacht' : 'Gepland',
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
          reportDate: reinspectionEnd ?? new Date(),
          description: body.description,
          isAnonymous: body.isAnonymous || false,
          isPrivate: body.isPrivate || false,
          hasReinspection: false,
          reinspectionWeeks: null,
          parentProjectId: project.id,
          checkPhase: 'tussencheck',
          summaryText: body.summaryText,
          researcherFeedbackText: body.researcherFeedbackText,
          aboutResearchText: body.aboutResearchText,
          whatWasTestedText: body.whatWasTestedText,
          aboutOrgText: body.aboutOrgText,
          methodName: body.methodName,
          techniquesNote: body.techniquesNote,
          supportBaseline: body.supportBaseline,
          userAgents: userAgents || null,
          technologies: technologies || [],
          criterionAssessments: {
            create: criteriaToCreate.map(criterionId => ({
              wcagCriterion: {
                connect: {
                  id: criterionId,
                },
              },
              status: getStatusForCriterion(criterionId),
            })),
          },
        },
      });

      console.log(`Created reinspection project ${reinspectionProject.id} (v1.1) linked to ${project.id} (v1.0)`);
      }
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
