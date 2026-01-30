import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to fix markdown by wrapping HTML code examples in code blocks
function fixMarkdown(text: string): string {
  if (!text) return text;

  let fixed = text;

  // Pattern to find HTML tags that are NOT already in code blocks
  // This looks for lines containing HTML tags like <img, <div, etc.
  const lines = fixed.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let htmlBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if we're entering or exiting a code block
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;

      // Flush HTML buffer if we were collecting HTML
      if (htmlBuffer.length > 0) {
        result.push('```html');
        result.push(...htmlBuffer);
        result.push('```');
        htmlBuffer = [];
      }

      result.push(line);
      continue;
    }

    // If we're in a code block, just add the line
    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Check if line contains HTML tags (but not entities like &lt;)
    const hasHtmlTag = /<[a-zA-Z][^>]*>/.test(line) && !line.includes('&lt;') && !line.includes('&gt;');

    if (hasHtmlTag) {
      // Start or continue collecting HTML
      htmlBuffer.push(line);
    } else {
      // If we have buffered HTML, flush it
      if (htmlBuffer.length > 0) {
        result.push('```html');
        result.push(...htmlBuffer);
        result.push('```');
        htmlBuffer = [];
      }
      result.push(line);
    }
  }

  // Flush any remaining HTML buffer
  if (htmlBuffer.length > 0) {
    result.push('```html');
    result.push(...htmlBuffer);
    result.push('```');
  }

  return result.join('\n');
}

async function fixQuickFindingsMarkdown() {
  console.log('Starting to fix quick findings markdown...\n');

  try {
    // Get all quick findings
    const quickFindings = await prisma.quickFinding.findMany();

    console.log(`Found ${quickFindings.length} quick findings to process\n`);

    let updatedCount = 0;

    for (const finding of quickFindings) {
      const originalDescription = finding.description;
      const originalAdvice = finding.advice;

      const fixedDescription = fixMarkdown(originalDescription);
      const fixedAdvice = fixMarkdown(originalAdvice);

      const descriptionChanged = originalDescription !== fixedDescription;
      const adviceChanged = originalAdvice !== fixedAdvice;

      if (descriptionChanged || adviceChanged) {
        console.log(`\n📝 Updating: ${finding.title} (${finding.criterionCode})`);

        if (descriptionChanged) {
          console.log('   Description updated');
        }
        if (adviceChanged) {
          console.log('   Advice updated');
        }

        await prisma.quickFinding.update({
          where: { id: finding.id },
          data: {
            description: fixedDescription,
            advice: fixedAdvice,
          },
        });

        updatedCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} quick finding(s)`);
    console.log(`⏭️  Skipped ${quickFindings.length - updatedCount} quick finding(s) (no changes needed)`);
  } catch (error) {
    console.error('❌ Error fixing quick findings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixQuickFindingsMarkdown()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });