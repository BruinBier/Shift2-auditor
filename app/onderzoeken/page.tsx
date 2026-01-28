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
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    researchStartedOn: project.researchStartedOn?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    clientProject: project.clientProject,
  }));

  return <OnderzoekenTable projects={projectsData} />;
}
