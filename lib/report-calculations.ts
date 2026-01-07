import { AssessmentStatus, WCAGLevel, WCAGPrinciple } from '@prisma/client';

export interface ProjectWithRelations {
  id: string;
  title: string;
  subject: string;
  standard: string;
  level: string;
  researchType: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  reportDate: Date;
  clientName: string | null;
  commissionedBy: string | null;
  auditedByOrg: string;
  researcherName: string | null;
  scopeUrls: { url: string; note: string | null }[];
  sampleItems: any[];
  criterionAssessments: {
    status: AssessmentStatus;
    wcagCriterion: {
      code: string;
      titleNl: string;
      level: WCAGLevel;
      principle: WCAGPrinciple;
      guidelineCode: string;
      guidelineTitleNl: string;
    };
  }[];
  findings: any[];
  [key: string]: any;
}

export interface ReportStats {
  passed: number;
  failed: number;
  notPresent: number;
  unknown: number;
  notTested: number;
  totalAssessed: number;
  totalProblems: number;
  pagesInvestigated: number;
}

export interface PrincipleStats {
  principle: WCAGPrinciple;
  levelA: { passed: number; failed: number; total: number };
  levelAA: { passed: number; failed: number; total: number };
  total: { passed: number; failed: number; total: number };
}

export function calculateReportStats(project: ProjectWithRelations): ReportStats {
  const stats: ReportStats = {
    passed: 0,
    failed: 0,
    notPresent: 0,
    unknown: 0,
    notTested: 0,
    totalAssessed: 0,
    totalProblems: 0,
    pagesInvestigated: 0,
  };

  // Count assessments by status
  project.criterionAssessments.forEach((assessment) => {
    switch (assessment.status) {
      case 'passed':
        stats.passed++;
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'not_present':
        stats.notPresent++;
        break;
      case 'unknown':
        stats.unknown++;
        break;
      case 'not_tested':
        stats.notTested++;
        break;
    }
  });

  // Total assessed excludes not_tested
  stats.totalAssessed = stats.passed + stats.failed + stats.notPresent + stats.unknown;

  // Count problems (findings that are published or open)
  stats.totalProblems = project.findings.filter(
    (f: any) => f.status === 'published' || f.status === 'open'
  ).length;

  // Count pages investigated (exclude PDF items for page count)
  stats.pagesInvestigated = project.sampleItems.filter(
    (item: any) => item.sampleType !== 'pdf'
  ).length;

  return stats;
}

export function calculatePrincipleStats(project: ProjectWithRelations): PrincipleStats[] {
  const principles = [
    WCAGPrinciple.Perceivable,
    WCAGPrinciple.Operable,
    WCAGPrinciple.Understandable,
    WCAGPrinciple.Robust,
  ];

  return principles.map((principle) => {
    const criteriaForPrinciple = project.criterionAssessments.filter(
      (a) => a.wcagCriterion.principle === principle
    );

    const levelA = criteriaForPrinciple.filter((a) => a.wcagCriterion.level === 'A');
    const levelAA = criteriaForPrinciple.filter((a) => a.wcagCriterion.level === 'AA');

    return {
      principle,
      levelA: {
        passed: levelA.filter((a) => a.status === 'passed').length,
        failed: levelA.filter((a) => a.status === 'failed').length,
        total: levelA.length,
      },
      levelAA: {
        passed: levelAA.filter((a) => a.status === 'passed').length,
        failed: levelAA.filter((a) => a.status === 'failed').length,
        total: levelAA.length,
      },
      total: {
        passed: criteriaForPrinciple.filter((a) => a.status === 'passed').length,
        failed: criteriaForPrinciple.filter((a) => a.status === 'failed').length,
        total: criteriaForPrinciple.length,
      },
    };
  });
}

export function getStatusLabel(status: AssessmentStatus): string {
  const labels: Record<AssessmentStatus, string> = {
    passed: 'Goedgekeurd',
    failed: 'Afgekeurd',
    not_present: 'Niet aanwezig',
    unknown: 'Onbekend',
    not_tested: 'Niet getest',
  };
  return labels[status];
}

export function getStatusColor(status: AssessmentStatus): string {
  const colors: Record<AssessmentStatus, string> = {
    passed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    not_present: 'bg-gray-100 text-gray-800',
    unknown: 'bg-yellow-100 text-yellow-800',
    not_tested: 'bg-blue-100 text-blue-800',
  };
  return colors[status];
}

export function getPrincipleLabel(principle: WCAGPrinciple): string {
  const labels: Record<WCAGPrinciple, string> = {
    Perceivable: 'Waarneembaar',
    Operable: 'Bedienbaar',
    Understandable: 'Begrijpbaar',
    Robust: 'Robuust',
  };
  return labels[principle];
}

export interface GroupedFindings {
  principle: WCAGPrinciple;
  principleName: string;
  guidelines: {
    code: string;
    title: string;
    criteria: {
      code: string;
      title: string;
      level: WCAGLevel;
      understandingUrl: string | null;
      assessment: {
        status: AssessmentStatus;
        notes: string | null;
      } | null;
      findings: any[];
    }[];
  }[];
}

export function groupFindingsByHierarchy(project: ProjectWithRelations): GroupedFindings[] {
  const principles = [
    WCAGPrinciple.Perceivable,
    WCAGPrinciple.Operable,
    WCAGPrinciple.Understandable,
    WCAGPrinciple.Robust,
  ];

  return principles.map((principle) => {
    // Get all criteria for this principle
    const criteriaForPrinciple = project.criterionAssessments.filter(
      (a) => a.wcagCriterion.principle === principle
    );

    // Group by guideline
    const guidelinesMap = new Map<string, typeof criteriaForPrinciple>();
    criteriaForPrinciple.forEach((assessment) => {
      const guidelineCode = assessment.wcagCriterion.guidelineCode;
      if (!guidelinesMap.has(guidelineCode)) {
        guidelinesMap.set(guidelineCode, []);
      }
      guidelinesMap.get(guidelineCode)!.push(assessment);
    });

    // Convert to array format
    const guidelines = Array.from(guidelinesMap.entries()).map(([code, assessments]) => {
      const guidelineTitle = assessments[0].wcagCriterion.guidelineTitleNl;

      const criteria = assessments.map((assessment) => {
        const criterion = assessment.wcagCriterion;
        const findingsForCriterion = project.findings.filter(
          (f: any) => f.wcagCriterionId === criterion.id
        );

        return {
          id: criterion.id,
          code: criterion.code,
          title: criterion.titleNl,
          level: criterion.level,
          understandingUrl: criterion.understandingUrl,
          assessment: {
            status: assessment.status,
            notes: assessment.notes,
          },
          findings: findingsForCriterion,
        };
      });

      // Sort criteria by code
      criteria.sort((a, b) => a.code.localeCompare(b.code));

      return {
        code,
        title: guidelineTitle,
        criteria,
      };
    });

    // Sort guidelines by code
    guidelines.sort((a, b) => a.code.localeCompare(b.code));

    return {
      principle,
      principleName: getPrincipleLabel(principle),
      guidelines,
    };
  });
}
