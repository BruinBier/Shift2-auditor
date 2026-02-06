import { prisma } from '../lib/prisma';

async function createQuickFinding() {
  console.log('Creating QuickFinding for PageContainsMultipleSameLinksTest (testId: 6)...\n');

  // Check if WCAG criterion 3.2.4 exists
  const criterion = await prisma.wCAGCriterion.findUnique({
    where: { code: '3.2.4' },
  });

  if (!criterion) {
    console.log('❌ WCAG Criterion 3.2.4 not found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`✓ Found WCAG Criterion: ${criterion.code} - ${criterion.titleNl}`);

  // Create QuickFinding
  const qf = await prisma.quickFinding.create({
    data: {
      crawlerTestId: '6',
      title: 'Inconsistente linkteksten naar dezelfde bestemming',
      description: 'Op de pagina zijn meerdere links gevonden die naar dezelfde URL verwijzen, maar verschillende linkteksten gebruiken. Dit kan verwarrend zijn voor gebruikers, met name voor mensen die schermlezers gebruiken. Links naar dezelfde bestemming zouden idealiter dezelfde tekst moeten hebben, zodat gebruikers direct begrijpen dat ze naar dezelfde plek leiden.',
      advice: 'Zorg ervoor dat links naar dezelfde bestemming consequent dezelfde linktekst gebruiken. Als er een goede reden is om verschillende teksten te gebruiken (bijvoorbeeld verschillende contexten), overweeg dan om de context duidelijker te maken of de links te onderscheiden door aanvullende visuele of tekstuele indicatoren.',
      criterionCode: '3.2.4',
      impact: 'klein',
      responsibility: 'redacteur',
      status: 'open',
      crawler: true,
      keywords: 'links, consistentie, linktekst, navigatie',
    },
  });

  console.log('\n✅ QuickFinding created successfully!');
  console.log(`   ID: ${qf.id}`);
  console.log(`   Title: ${qf.title}`);
  console.log(`   Criterion: ${qf.criterionCode}`);
  console.log(`   Impact: ${qf.impact}`);
  console.log(`   Responsibility: ${qf.responsibility}`);

  await prisma.$disconnect();
}

createQuickFinding();
