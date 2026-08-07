import { prisma } from '@/lib/prisma';
import OnderzoekenTable from './OnderzoekenTable';

/**
 * Een onderzoek waarvan de startdatum is bereikt loopt; de status hoort dat
 * te volgen. Anders blijft er "Gepland" staan bij werk dat al begonnen is,
 * en klopt het overzicht niet meer.
 *
 * Alleen vanaf Gepland: staat een onderzoek In de wacht of Geannuleerd, dan
 * is dat een bewuste keuze die we niet overschrijven.
 */
async function statusVolgtDePlanning() {
  const vandaag = new Date();
  vandaag.setHours(23, 59, 59, 999);

  await prisma.project.updateMany({
    where: {
      status: 'Gepland',
      dateStart: { not: null, lte: vandaag },
    },
    data: { status: 'In uitvoering' },
  });
}

export default async function OnderzoekekenPage() {
  await statusVolgtDePlanning();

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








