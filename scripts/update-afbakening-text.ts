import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAfbakeningText() {
  try {
    // Find the specific research type by exact name
    const researchType = await prisma.researchType.findFirst({
      where: {
        name: 'WCAG 2.2 AA deelonderzoek content',
      },
    });

    if (!researchType) {
      console.log('Research type "WCAG 2.2 AA deelonderzoek content" not found');
      return;
    }

    console.log(`Found research type: ${researchType.name}`);
    console.log(`Current reportIntro length: ${researchType.reportIntro?.length || 0} characters`);

    // Get the current reportIntro
    const currentReportIntro = researchType.reportIntro || '';

    // New text for Afbakening section
    const newAfbakeningText = `Dit deelonderzoek heeft uitsluitend betrekking op de content van de website: teksten, koppen, afbeeldingen, alternatieve teksten, linkteksten, video's, PDF-documenten, tabellen en overige door de organisatie beheerde inhoud.

Bij dit onderzoek zijn 27 van de 55 succescriteria van WCAG 2.2 niveau A en AA beoordeeld.
De overige 28 succescriteria hebben betrekking op de technische basis van de website (zoals templates, onderliggende code en systeemfunctionaliteit) en worden beoordeeld in een afzonderlijk deelonderzoek techniek.
Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website.

Ter toelichting: onderstaande 6 succescriteria vallen onder het technische deelonderzoek. Ze zijn in dit contentonderzoek niet beoordeeld, omdat zij betrekking hebben op functionaliteit die binnen de Shift2-omgeving technisch is ingericht:`;

    // Search for the Afbakening section and replace it
    // Pattern: find the section starting with "###" (H3) instead of "##" (H2)
    const afbakeningRegex = /###\s*Afbakening van het deelonderzoek\s+([\s\S]*?)(?=\n---|\n###|\n##|$)/;

    let updatedReportIntro = currentReportIntro;

    if (afbakeningRegex.test(currentReportIntro)) {
      // Replace the Afbakening section content
      updatedReportIntro = currentReportIntro.replace(
        afbakeningRegex,
        `### Afbakening van het deelonderzoek\n\n${newAfbakeningText}`
      );
      console.log('✅ Afbakening section found and updated');
    } else {
      console.log('❌ Afbakening section not found in current reportIntro');
      console.log('Looking for pattern: "### Afbakening van het deelonderzoek"');
      console.log('Current reportIntro (first 1000 chars):', currentReportIntro.substring(0, 1000));
      return;
    }

    // Update the research type
    await prisma.researchType.update({
      where: { id: researchType.id },
      data: {
        reportIntro: updatedReportIntro,
      },
    });

    console.log('✅ Afbakening text successfully updated');
  } catch (error) {
    console.error('Error updating afbakening text:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAfbakeningText();