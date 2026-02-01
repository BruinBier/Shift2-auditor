import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const quickFindingTemplates = [
  {
    title: 'Afbeelding zonder tekstalternatief',
    description: `Op de pagina staat een afbeelding in een img-element. Deze afbeelding heeft geen tekstalternatief. Omdat deze afbeelding informatief is, is dat wel verplicht.`,
    advice: `Voorzie deze afbeelding van een beschrijvend tekstalternatief, bijvoorbeeld via het title-element.`,
    criterionCode: '1.1.1',
    crawler: true,
    crawlerTestId: 'testImgMissingAlt',
    impact: 'serieus' as const,
    responsibility: 'redacteur' as const,
  },
  {
    title: 'Informatieve SVG zonder tekstalternatief',
    description: `Op pagina URL staat een afbeelding in een SVG-element. Deze afbeelding heeft geen tekstalternatief. Omdat deze afbeelding informatief is, is dat wel verplicht.`,
    advice: `Voorzie deze SVG van een beschrijvend tekstalternatief, bijvoorbeeld via het title-element.`,
    criterionCode: '1.1.1',
    crawler: true,
    crawlerTestId: 'testInformativeSvgWithoutText',
    impact: 'klein' as const,
    responsibility: 'redacteur' as const,
  },
  {
    title: 'Te lang alt-attribuut',
    description: `Op de pagina heeft een afbeelding een zeer lang alt-attribuut (meer dan 125 tekens). Voor screenreader gebruikers is dit vervelend omdat ze een lange beschrijving moeten aanhoren voordat ze verder kunnen.`,
    advice: `Kort het alt-attribuut in tot maximaal 125 tekens. Plaats eventuele langere beschrijvingen in de omliggende tekst of gebruik aria-describedby voor aanvullende context.`,
    criterionCode: '1.1.1',
    crawler: true,
    crawlerTestId: 'testImgAltTooLong',
    impact: 'klein' as const,
    responsibility: 'redacteur' as const,
  },
  {
    title: 'Decoratieve afbeelding zonder lege alt-tekst',
    description: `Op de pagina staat een decoratieve afbeelding die geen informatie toevoegt. Deze afbeelding heeft een tekstalternatief, terwijl dat niet nodig is. Screenreader gebruikers horen onnodige informatie.`,
    advice: `Voorzie decoratieve afbeeldingen van een leeg alt-attribuut (alt="") zodat screenreaders deze overslaan.`,
    criterionCode: '1.1.1',
    crawler: true,
    crawlerTestId: 'testDecorativeImgWithoutEmptyAlt',
    impact: 'klein' as const,
    responsibility: 'redacteur' as const,
  },
  {
    title: 'Tabel zonder headers',
    description: `Op de pagina staat een tabel zonder table headers (th-elementen). Hierdoor kunnen screenreader gebruikers niet begrijpen wat de relatie is tussen de cellen.`,
    advice: `Voorzie de tabel van table header cellen (th) en gebruik eventueel scope-attributen om de relatie aan te geven.`,
    criterionCode: '1.3.1',
    crawler: true,
    crawlerTestId: 'testTableWithoutHeaders',
    impact: 'serieus' as const,
    responsibility: 'ontwikkelaar' as const,
  },
  {
    title: 'Iframe zonder accessible name',
    description: `Op de pagina staat een iframe-element zonder accessible name. Screenreader gebruikers kunnen hierdoor niet begrijpen wat de inhoud van het iframe is.`,
    advice: `Voorzie het iframe van een title-attribuut of aria-label met een beschrijvende naam.`,
    criterionCode: '4.1.2',
    crawler: true,
    crawlerTestId: 'testIframeMissingAccessibleName',
    impact: 'matig' as const,
    responsibility: 'ontwikkelaar' as const,
  },
  {
    title: 'Pagina mist lang-attribuut',
    description: `De pagina heeft geen lang-attribuut op het html-element. Hierdoor weten screenreaders en andere hulpmiddelen niet in welke taal de pagina is geschreven.`,
    advice: `Voeg een lang-attribuut toe aan het html-element met de juiste taalcode, bijvoorbeeld lang="nl" voor Nederlands.`,
    criterionCode: '3.1.1',
    crawler: true,
    crawlerTestId: 'testLangAttributeMissing',
    impact: 'serieus' as const,
    responsibility: 'ontwikkelaar' as const,
  },
  {
    title: 'PDF - Afbeeldingen niet-getagde PDF',
    description: `Op de pagina staat een link naar een PDF-bestand. Deze PDF is niet getagd, waardoor screenreader gebruikers de inhoud niet kunnen lezen.`,
    advice: `Zorg ervoor dat de PDF getagd is met de juiste structuur-elementen. Gebruik Adobe Acrobat of een vergelijkbaar programma om de PDF toegankelijk te maken.`,
    criterionCode: '1.1.1',
    crawler: true,
    crawlerTestId: 'testLinkIsPDFTest',
    impact: 'kritiek' as const,
    responsibility: 'redacteur' as const,
  },
  {
    title: 'Video zonder keyboard toegankelijkheid',
    description: `Op de pagina staat een video player die niet volledig bedienbaar is met het toetsenbord. Gebruikers die geen muis kunnen gebruiken, kunnen de video niet afspelen, pauzeren of de instellingen aanpassen.`,
    advice: `Zorg ervoor dat alle video controls (play, pause, volume, ondertiteling) toegankelijk zijn via het toetsenbord. Test met Tab, Enter, en Spatiebalk.`,
    criterionCode: '2.1.1',
    crawler: true,
    crawlerTestId: 'testIframeIsVimeoVideoWithKeysDisabledTest',
    impact: 'serieus' as const,
    responsibility: 'ontwikkelaar' as const,
  },
  {
    title: 'Onduidelijke linktekst',
    description: `Op de pagina staan links met onduidelijke teksten zoals "klik hier", "lees meer" of "hier". Voor screenreader gebruikers die door links navigeren, is het onduidelijk waar deze links naartoe leiden.`,
    advice: `Gebruik beschrijvende linkteksten die ook buiten context duidelijk zijn. Bijvoorbeeld: "Lees meer over toegankelijkheid" in plaats van "Lees meer".`,
    criterionCode: '2.4.4',
    crawler: false, // Kan niet geautomatiseerd getest worden
    impact: 'matig' as const,
    responsibility: 'redacteur' as const,
  },
];

async function populateQuickFindings() {
  console.log('Starting to populate QuickFinding templates...\n');

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const template of quickFindingTemplates) {
    console.log(`\nProcessing: "${template.title}"`);
    console.log(`  Criterion: ${template.criterionCode}`);
    console.log(`  Crawler test: ${template.crawlerTestId || 'none'}`);

    // Check if template already exists (by crawler test ID or title)
    const existing = await prisma.quickFinding.findFirst({
      where: {
        OR: [
          { crawlerTestId: template.crawlerTestId || undefined },
          { title: template.title },
        ],
      },
    });

    if (existing) {
      console.log(`  ⚠️  Template already exists, updating...`);
      await prisma.quickFinding.update({
        where: { id: existing.id },
        data: template,
      });
      updated++;
      console.log(`  ✅ Updated`);
    } else {
      await prisma.quickFinding.create({
        data: template,
      });
      created++;
      console.log(`  ✅ Created`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${quickFindingTemplates.length}`);
  console.log('\n✅ Done!');
}

populateQuickFindings()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });