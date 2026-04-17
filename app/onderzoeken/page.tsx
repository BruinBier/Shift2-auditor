import { prisma } from '@/lib/prisma';
import OnderzoekenTable from './OnderzoekenTable';

export default async function OnderzoekekenPage() {
  const projects = await prisma.project.findMany({
    include: {
      clientProject: true,
    },
    orderBy: { dateStart: 'desc' },
  });

  // Convert dates to strings for client component
  const projectsData = projects.map((project) => ({
    ...project,
    dateStart: project.dateStart?.toISOString(),
    dateEnd: project.dateEnd?.toISOString(),
    researchStartedOn: project.researchStartedOn?.toISOString(),
    reportDate: project.reportDate.toISOString(),
    planningSent: project.planningSent?.toISOString(),
    planningApproved: project.planningApproved?.toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    clientProject: project.clientProject,
    parentProjectId: project.parentProjectId,
    hasReinspection: project.hasReinspection,
  } as any));

  return <OnderzoekenTable projects={projectsData} />;
}








