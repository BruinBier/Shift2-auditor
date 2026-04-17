import { prisma } from '../lib/prisma';

async function updateAboutResearch() {
  await prisma.project.update({
    where: { id: '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee' },
    data: {
      aboutResearchText: 'Voor dit project is een onderzoek uitgevoerd naar de toegankelijkheid van de content van de formulieren, om vast te stellen in hoeverre deze voldoet aan WCAG 2.2 niveau AA (EN 301 549).'
    }
  });

  console.log('Updated aboutResearchText for project');

  await prisma.$disconnect();
}

updateAboutResearch();