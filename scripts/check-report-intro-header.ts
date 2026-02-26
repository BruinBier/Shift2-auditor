import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReportIntroHeader() {
  console.log('Checking reportIntroHeader field in research_types...\n');

  const researchTypes = await prisma.researchType.findMany({
    select: {
      name: true,
      reportIntroHeader: true,
    },
  });

  researchTypes.forEach((rt) => {
    console.log(`Name: ${rt.name}`);
    console.log(`reportIntroHeader: ${rt.reportIntroHeader || '(null/empty)'}`);
    console.log('---\n');
  });

  await prisma.$disconnect();
}

checkReportIntroHeader();