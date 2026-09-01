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
      // Doorlopend werk heeft geen planning die af kan lopen.
      isOngoing: false,
      // Een proeftuin volgt geen planning: er is geen klant die op iets wacht. Dit is
      // bovendien een schrijfactie, dus wegfilteren in de weergave repareert het niet — de
      // status zou blijven staan als "In uitvoering" en het project daarmee in elk overzicht
      // opduiken dat op status filtert.
      isProeftuin: false,
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
    isOngoing: project.isOngoing,
    // Een proeftuin hoort niet in deze lijst, maar hij gaat wél mee naar de client: de
    // schakelaar daar haalt hem erbij zonder de pagina opnieuw te laden.
    //
    // `as any`: het veld bestaat pas in de gegenereerde Prisma-client nadat de migratie
    // 20260831_proeftuin_vlag is gedraaid. Zo compileert dit ervoor en erna.
    isProeftuin: (project as any).isProeftuin ?? false,
  } as any));

  return <OnderzoekenTable projects={projectsData} />;
}








