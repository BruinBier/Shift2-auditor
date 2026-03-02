import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreAfbakeningWithTable() {
  try {
    const researchType = await prisma.researchType.findFirst({
      where: {
        name: 'WCAG 2.2 AA deelonderzoek content',
      },
    });

    if (!researchType) {
      console.log('Research type not found');
      return;
    }

    console.log(`Found research type: ${researchType.name}`);

    const currentReportIntro = researchType.reportIntro || '';

    // New text for Afbakening section WITH the table
    const newAfbakeningText = `Dit deelonderzoek heeft uitsluitend betrekking op de content van de website: teksten, koppen, afbeeldingen, alternatieve teksten, linkteksten, video's, PDF-documenten, tabellen en overige door de organisatie beheerde inhoud.

Bij dit onderzoek zijn 27 van de 55 succescriteria van WCAG 2.2 niveau A en AA beoordeeld.
De overige 28 succescriteria hebben betrekking op de technische basis van de website (zoals templates, onderliggende code en systeemfunctionaliteit) en worden beoordeeld in een afzonderlijk deelonderzoek techniek.
Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website.

Ter toelichting: onderstaande 6 succescriteria vallen onder het technische deelonderzoek. Ze zijn in dit contentonderzoek niet beoordeeld, omdat zij betrekking hebben op functionaliteit die binnen de Shift2-omgeving technisch is ingericht:

| SC | Naam | Niveau | Reden van uitsluiting |
|---|---|---|---|
| 1.4.2 | Geluidsbediening | A | Template stript autoplay bij video-embeds en verwijdert audio-elementen met autoplay uit de broncode |
| 2.1.4 | Sneltoetsen tekentoets | A | Template voegt automatisch disablekb=1 toe aan embedded video's |
| 2.2.2 | Pauzeren, stoppen, verbergen | A | Geen autoplay in de praktijk; mediaplayer wordt door template geregeld |
| 3.3.1 | Foutidentificatie | A | Formuliervalidatie wordt volledig door het systeem afgehandeld |
| 3.3.3 | Foutsuggestie | AA | Foutsuggesties worden door het systeem gegenereerd |
| 3.3.7 | Overbodige invoer | A | Formuliergeheugen en autocomplete zijn technisch bepaald |`;

    // Replace the Afbakening section
    const afbakeningRegex = /###\s*Afbakening van het deelonderzoek\s+([\s\S]*?)(?=\n---|\n###|\n##|$)/;

    let updatedReportIntro = currentReportIntro;

    if (afbakeningRegex.test(currentReportIntro)) {
      updatedReportIntro = currentReportIntro.replace(
        afbakeningRegex,
        `### Afbakening van het deelonderzoek\n\n${newAfbakeningText}\n`
      );
      console.log('✅ Afbakening section found and updated with table');
    } else {
      console.log('❌ Afbakening section not found');
      return;
    }

    // Update the database
    await prisma.researchType.update({
      where: { id: researchType.id },
      data: {
        reportIntro: updatedReportIntro,
      },
    });

    console.log('✅ Afbakening text successfully updated with table!');
    console.log(`New length: ${updatedReportIntro.length} characters`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAfbakeningWithTable();