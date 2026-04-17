import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAllCriteria() {
  console.log('Verifying all criteria in template match database...\n');

  // Get project data from database
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { title: { contains: 'Wierden', mode: 'insensitive' } },
        { subject: { contains: 'Wierden', mode: 'insensitive' } },
      ],
    },
    include: {
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
      findings: {
        where: {
          OR: [{ status: 'published' }, { status: 'open' }],
        },
      },
    },
  });

  if (!project) {
    console.error('Project not found!');
    process.exit(1);
  }

  // Read template
  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  const xmlContent = doc.asText();

  // Get all failed criteria from database
  const failedCriteria = project.criterionAssessments
    .filter((a) => a.status === 'failed')
    .map((a) => ({
      code: a.wcagCriterion.code,
      title: a.wcagCriterion.titleNl,
      findingsCount: project.findings.filter(
        (f) => f.wcagCriterionId === a.wcagCriterion.id
      ).length,
    }));

  console.log(`Database has ${failedCriteria.length} failed criteria:\n`);

  const issues: string[] = [];

  for (const criterion of failedCriteria) {
    console.log(`Checking ${criterion.code} - ${criterion.title}`);

    // Find in template
    let index = xmlContent.indexOf(criterion.code);

    // Skip TOC
    if (index < 50000 && xmlContent.indexOf(criterion.code, index + 1) > 0) {
      index = xmlContent.indexOf(criterion.code, index + 1);
    }

    if (index === -1) {
      console.log(`  ❌ Not found in template`);
      issues.push(`${criterion.code}: Not found in template`);
      continue;
    }

    const context = xmlContent.substring(index, index + 2000);

    // Check status
    const hasVoldoetNiet = context.indexOf('Voldoet niet') !== -1;
    const hasVoldoet = context.indexOf('>Voldoet<') !== -1 &&
                       context.indexOf('>Voldoet<') < context.indexOf('Voldoet niet');

    if (!hasVoldoetNiet || hasVoldoet) {
      console.log(`  ❌ Status is "Voldoet" but should be "Voldoet niet"`);
      issues.push(`${criterion.code}: Wrong status (should be Voldoet niet)`);
    } else {
      console.log(`  ✓ Status: "Voldoet niet"`);
    }

    // Check bold
    const hasBold = context.substring(0, 1500).includes('<w:b/>');
    if (!hasBold) {
      console.log(`  ❌ Not bold (should be bold)`);
      issues.push(`${criterion.code}: Not bold`);
    } else {
      console.log(`  ✓ Bold formatting present`);
    }

    console.log();
  }

  console.log('\n=== Summary ===\n');

  if (issues.length === 0) {
    console.log('✓ All failed criteria are correctly represented in the template!');
    console.log(`  - ${failedCriteria.length} failed criteria`);
    console.log(`  - All have "Voldoet niet" status`);
    console.log(`  - All have bold formatting`);
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue) => console.log(`  - ${issue}`));
  }

  await prisma.$disconnect();
}

verifyAllCriteria().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});