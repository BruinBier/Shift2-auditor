// Script to add descriptionNl field to seed.ts
import * as fs from 'fs';
import * as path from 'path';

const descriptions: Record<string, string> = {
  '1.1.1': 'Geef informatieve afbeeldingen en andere niet-tekstuele content een goed tekstalternatief.',
  '1.2.1': 'Zorg voor een alternatief voor video-zonder-geluid (bijv. een animatie) of geluid-zonder-video (bijv. een podcast).',
  '1.2.2': 'Ondertitels voor doven en slechthorenden voor vooraf opgenomen video.',
  '1.2.3': 'Gebarentaal of audiodescriptie voor vooraf opgenomen video.',
  '1.2.4': 'Ondertitels voor doven en slechthorenden voor live video.',
  '1.2.5': 'Audiodescriptie voor vooraf opgenomen video.',
  '1.3.1': 'Structuur en relaties zijn programmatisch bepaalbaar.',
  '1.3.2': 'De juiste volgorde van content is programmatisch bepaalbaar.',
  '1.3.3': 'Instructies zijn niet uitsluitend afhankelijk van zintuiglijke kenmerken.',
  '1.3.4': 'Content kan in zowel staand als liggend formaat worden bekeken.',
  '1.3.5': 'Het doel van invoervelden is programmatisch bepaalbaar.',
  '1.4.1': 'Kleur wordt niet als enige visuele middel gebruikt om informatie over te brengen.',
  '1.4.2': 'Geluidsbediening.',
  '1.4.3': 'Het contrast tussen tekst en achtergrond is minimaal 4,5:1.',
  '1.4.4': 'Tekst kan tot 200% worden vergroot zonder verlies van content of functionaliteit.',
  '1.4.5': 'Afbeeldingen van tekst worden niet gebruikt, tenzij noodzakelijk.',
  '1.4.10': 'Content kan zonder horizontaal scrollen worden bekeken op 320 CSS pixels breedte.',
  '1.4.11': 'Het contrast van interactieve componenten en grafische objecten is minimaal 3:1.',
  '1.4.12': 'Tekstafstand kan door gebruiker worden aangepast zonder verlies van content.',
  '1.4.13': 'Content die verschijnt bij hover of focus is afsluitbaar, blijvend en hoverbaar.',
  '2.1.1': 'Alle functionaliteit is beschikbaar via een toetsenbord.',
  '2.1.2': 'Toetsenbord focus kan niet vast komen te zitten in een component.',
  '2.1.4': 'Sneltoetsen kunnen worden uitgeschakeld of aangepast.',
  '2.2.1': 'Tijdslimieten kunnen worden uitgezet, aangepast of verlengd.',
  '2.2.2': 'Bewegende, knipperende of scrollende content kan worden gepauzeerd.',
  '2.3.1': 'Content knippert niet meer dan 3 keer per seconde.',
  '2.4.1': 'Een mechanisme is beschikbaar om herhalende content over te slaan.',
  '2.4.2': 'Webpagina\'s hebben beschrijvende en onderscheidende titels.',
  '2.4.3': 'Focusvolgorde behoudt betekenis en bedienbaarheid.',
  '2.4.4': 'Het doel van een link kan uit de linktekst of context worden bepaald.',
  '2.4.5': 'Er is meer dan één manier om een webpagina binnen een set te vinden.',
  '2.4.6': 'Koppen en labels beschrijven onderwerp of doel.',
  '2.4.7': 'De toetsenbordfocus indicator is zichtbaar.',
  '2.5.1': 'Alle functionaliteit die met complexe gebaren werkt, werkt ook met een enkele aanraking.',
  '2.5.2': 'Voor functionaliteit die via aanraking werkt, geldt dat de actie pas wordt uitgevoerd bij loslaten.',
  '2.5.3': 'Labels in code komen overeen met zichtbare labels.',
  '2.5.4': 'Functionaliteit die wordt geactiveerd door beweging kan ook met interface componenten worden geactiveerd.',
  '3.1.1': 'De primaire taal van de webpagina is programmatisch bepaalbaar.',
  '3.1.2': 'De taal van passages of zinnen is programmatisch bepaalbaar.',
  '3.2.1': 'Focus ontvangen veroorzaakt geen onverwachte contextwijziging.',
  '3.2.2': 'Invoer wijzigen veroorzaakt geen onverwachte contextwijziging.',
  '3.2.3': 'Navigatiemechanismen die op meerdere pagina\'s voorkomen, staan in dezelfde volgorde.',
  '3.2.4': 'Componenten met dezelfde functionaliteit zijn consistent gelabeld.',
  '3.3.1': 'Als fouten gemaakt worden dan moet de fout duidelijk herkenbaar zijn in tekst.',
  '3.3.2': 'Labels of instructies zijn aanwezig bij invoervelden.',
  '3.3.3': 'Suggesties voor het herstellen van invoerfouten worden gegeven.',
  '3.3.4': 'Acties die juridische verplichtingen, financiële transacties of wijzigingen in gebruikersdata veroorzaken, zijn omkeerbaar.',
  '4.1.1': 'Content heeft geen fouten in de opmaakcode.',
  '4.1.2': 'Naam, rol en waarde van componenten zijn programmatisch bepaalbaar.',
  '4.1.3': 'Statusberichten zijn programmatisch bepaalbaar zonder focus te ontvangen.',
};

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
let content = fs.readFileSync(seedPath, 'utf-8');

// Add descriptionNl to each criterion
for (const [code, description] of Object.entries(descriptions)) {
  const escapedDescription = description.replace(/'/g, "\\'");

  // Find pattern: code: 'X.X.X',\n    titleNl: '...'
  // Insert after titleNl
  const pattern = new RegExp(
    `(code: '${code.replace(/\./g, '\\.')}',\\s+titleNl: '[^']+',)`,
    'g'
  );

  content = content.replace(pattern, `$1\n    descriptionNl: '${escapedDescription}',`);
}

fs.writeFileSync(seedPath, content, 'utf-8');
console.log('✅ Added descriptionNl to all WCAG criteria');