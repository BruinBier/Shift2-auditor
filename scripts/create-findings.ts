import { prisma } from '../lib/prisma';

async function createFindings() {
  const projectId = '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee';

  // First, get project info
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sampleItems: true,
      criterionAssessments: {
        include: {
          wcagCriterion: true
        },
        where: {
          wcagCriterion: {
            code: {
              in: ['1.4.3', '1.4.11']
            }
          }
        }
      },
      findings: true
    }
  });

  if (!project) {
    console.log('Project not found!');
    return;
  }

  console.log('Project:', project.subject);
  console.log('Sample Items:', project.sampleItems.length);
  project.sampleItems.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.title} - ${item.url || 'no URL'}`);
    console.log(`     ID: ${item.id}`);
  });

  // Get criterion IDs
  const criterion143 = project.criterionAssessments.find(a => a.wcagCriterion.code === '1.4.3');
  const criterion1411 = project.criterionAssessments.find(a => a.wcagCriterion.code === '1.4.11');

  if (!criterion143 || !criterion1411) {
    console.log('Criteria not found!');
    return;
  }

  console.log('\nCriterion 1.4.3 ID:', criterion143.wcagCriterion.id);
  console.log('Criterion 1.4.11 ID:', criterion1411.wcagCriterion.id);

  // Get next finding numbers
  const existingFindings = project.findings.filter(f => f.findingCode?.startsWith('B'));
  const nextNumber = existingFindings.length + 1;

  console.log('\nNext finding number:', nextNumber);
  console.log('\nCreating findings...');

  // Create finding for 1.4.3
  const finding143 = await prisma.finding.create({
    data: {
      projectId: projectId,
      wcagCriterionId: criterion143.wcagCriterion.id,
      findingCode: `B${String(nextNumber).padStart(3, '0')}`,
      status: 'published',
      description: '<p>Op de formulierenpagina\'s is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde "contrast switch". Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie. Hierdoor kunnen er contrastproblemen zijn in de standaard versie. Deze zijn verder niet beoordeeld.</p>',
      advice: '<p><strong>Advies</strong></p><p>We adviseren om ook de standaard versie te voorzien van voldoende kleurcontrast in alle teksten. Dit bevorderd de toegankelijkheid van de website voor bezoekers met een zichtbeperking. Teksten met voldoende kleurcontrast lezen ook makkelijker voor alle lezers. Het lezen is hierdoor minder intensief, kost minder energie en het lezen wordt (onbewust) als prettiger ervaren. Hierdoor is de lezer eerder geneigd om over te gaan tot activatie. De versie voor hoog contrast kan dan vervolgens ingezet worden voor een "verhoogd contrast", waarbij wordt voldaan aan succescriterium WCAG 1.4.6 Verhoogd contrast (niveau AAA).</p>',
      impact: 'klein',
      responsibility: 'ontwerper'
    }
  });

  console.log('Created finding for 1.4.3:', finding143.id);

  // Create finding for 1.4.11
  const finding1411 = await prisma.finding.create({
    data: {
      projectId: projectId,
      wcagCriterionId: criterion1411.wcagCriterion.id,
      findingCode: `B${String(nextNumber + 1).padStart(3, '0')}`,
      status: 'published',
      description: '<p>Op de formulierenpagina\'s is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde "contrast switch". Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie. Hierdoor kunnen er contrastproblemen zijn in de standaard versie. Deze zijn verder niet beoordeeld.</p>',
      advice: '<p><strong>Advies</strong></p><p>Voorzie ook de standaard versie van voldoende kleurcontrast voor alle grafische elementen. Dit bevorderd de toegankelijkheid van de website voor bezoekers met een zichtbeperking. De versie voor hoog contrast kan dan vervolgens ingezet worden voor een "verhoogd contrast".</p>',
      impact: 'klein',
      responsibility: 'ontwerper'
    }
  });

  console.log('Created finding for 1.4.11:', finding1411.id);
  console.log('\nDone!');

  await prisma.$disconnect();
}

createFindings().catch(console.error);