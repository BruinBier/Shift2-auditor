import { prisma } from '../lib/prisma';

async function fixReportIntroText() {
  // Get current reportIntro
  const researchType = await prisma.researchType.findUnique({
    where: { name: 'WCAG 2.2 AA deelonderzoek content formulieren' },
    select: { reportIntro: true }
  });

  console.log('Current reportIntro:');
  console.log(researchType?.reportIntro);
  console.log('\n---\n');

  if (researchType?.reportIntro) {
    // Replace "Bij substantiële wijzigingen in de formulieren" with "Bij substantiële wijzigingen in de content"
    const updatedReportIntro = researchType.reportIntro.replace(
      /Bij substantiële wijzigingen in de formulieren/g,
      'Bij substantiële wijzigingen in de content'
    );

    // Update in database
    await prisma.researchType.update({
      where: { name: 'WCAG 2.2 AA deelonderzoek content formulieren' },
      data: {
        reportIntro: updatedReportIntro
      }
    });

    console.log('Updated reportIntro - changed "formulieren" to "content"');
  } else {
    console.log('No reportIntro found');
  }

  await prisma.$disconnect();
}

fixReportIntroText();