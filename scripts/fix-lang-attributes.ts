import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix markdown extended syntax {lang=xx} to proper HTML
 * Converts patterns like: _text_{lang=en} to <span lang="en"><em>text</em></span>
 */
function fixLangAttributes(text: string | null): string | null {
  if (!text) return text;

  let result = text;

  // Pattern 1: _italic text_{lang=xx}
  result = result.replace(
    /_([^_]+)_\{lang=([a-z]{2})\}/g,
    '<span lang="$2"><em>$1</em></span>'
  );

  // Pattern 2: *italic text*{lang=xx}
  result = result.replace(
    /\*([^*]+)\*\{lang=([a-z]{2})\}/g,
    '<span lang="$2"><em>$1</em></span>'
  );

  // Pattern 3: **bold text**{lang=xx}
  result = result.replace(
    /\*\*([^*]+)\*\*\{lang=([a-z]{2})\}/g,
    '<span lang="$2"><strong>$1</strong></span>'
  );

  // Pattern 4: plain text{lang=xx}
  result = result.replace(
    /([a-zA-Z\s]+)\{lang=([a-z]{2})\}/g,
    '<span lang="$2">$1</span>'
  );

  return result;
}

async function main() {
  console.log('Starting lang attribute fix...\n');

  // Get all research types
  const researchTypes = await prisma.researchType.findMany();

  console.log(`Found ${researchTypes.length} research types\n`);

  let updatedCount = 0;

  for (const researchType of researchTypes) {
    let needsUpdate = false;
    let updates: any = {};

    // Check reportIntro
    if (researchType.reportIntro && researchType.reportIntro.includes('{lang=')) {
      const fixed = fixLangAttributes(researchType.reportIntro);
      if (fixed !== researchType.reportIntro) {
        updates.reportIntro = fixed;
        needsUpdate = true;
        console.log(`✓ Fixed reportIntro for: ${researchType.name}`);
        console.log(`  Before: ${researchType.reportIntro.substring(0, 100)}...`);
        console.log(`  After:  ${fixed?.substring(0, 100)}...`);
      }
    }

    // Check reportIntroPdf
    if (researchType.reportIntroPdf && researchType.reportIntroPdf.includes('{lang=')) {
      const fixed = fixLangAttributes(researchType.reportIntroPdf);
      if (fixed !== researchType.reportIntroPdf) {
        updates.reportIntroPdf = fixed;
        needsUpdate = true;
        console.log(`✓ Fixed reportIntroPdf for: ${researchType.name}`);
        console.log(`  Before: ${researchType.reportIntroPdf.substring(0, 100)}...`);
        console.log(`  After:  ${fixed?.substring(0, 100)}...`);
      }
    }

    // Update if needed
    if (needsUpdate) {
      await prisma.researchType.update({
        where: { id: researchType.id },
        data: updates,
      });
      updatedCount++;
      console.log('');
    }
  }

  console.log(`\nComplete! Updated ${updatedCount} research type(s)`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });