import { prisma } from '../lib/prisma';

async function fixFindings() {
  const projectId = '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee';

  // Get the findings we just created
  const findings = await prisma.finding.findMany({
    where: {
      projectId: projectId,
      wcagCriterion: {
        code: {
          in: ['1.4.3', '1.4.11']
        }
      }
    },
    include: {
      wcagCriterion: true
    }
  });

  console.log(`Found ${findings.length} findings to update`);

  for (const finding of findings) {
    if (finding.wcagCriterion.code === '1.4.3') {
      await prisma.finding.update({
        where: { id: finding.id },
        data: {
          description: '<p>Op de formulierenpagina\'s is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde "contrast switch". Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie. Hierdoor kunnen er contrastproblemen zijn in de standaard versie. Deze zijn verder niet beoordeeld.</p>',
          advice: '<p>We adviseren om ook de standaard versie te voorzien van voldoende kleurcontrast in alle teksten. Dit bevorderd de toegankelijkheid van de website voor bezoekers met een zichtbeperking. Teksten met voldoende kleurcontrast lezen ook makkelijker voor alle lezers. Het lezen is hierdoor minder intensief, kost minder energie en het lezen wordt (onbewust) als prettiger ervaren. Hierdoor is de lezer eerder geneigd om over te gaan tot activatie. De versie voor hoog contrast kan dan vervolgens ingezet worden voor een "verhoogd contrast", waarbij wordt voldaan aan succescriterium WCAG 1.4.6 Verhoogd contrast (niveau AAA).</p>'
        }
      });
      console.log(`Updated finding for 1.4.3`);
    } else if (finding.wcagCriterion.code === '1.4.11') {
      await prisma.finding.update({
        where: { id: finding.id },
        data: {
          description: '<p>Op de formulierenpagina\'s is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde "contrast switch". Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie. Hierdoor kunnen er contrastproblemen zijn in de standaard versie. Deze zijn verder niet beoordeeld.</p>',
          advice: '<p>Voorzie ook de standaard versie van voldoende kleurcontrast voor alle grafische elementen. Dit bevorderd de toegankelijkheid van de website voor bezoekers met een zichtbeperking. De versie voor hoog contrast kan dan vervolgens ingezet worden voor een "verhoogd contrast".</p>'
        }
      });
      console.log(`Updated finding for 1.4.11`);
    }
  }

  console.log('Done!');
  await prisma.$disconnect();
}

fixFindings().catch(console.error);