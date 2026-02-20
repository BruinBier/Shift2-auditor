// Script to update all WCAG descriptions
import * as fs from 'fs';
import * as path from 'path';

const descriptions: Record<string, string> = {
  '1.1.1': 'Geef informatieve afbeeldingen en andere niet-tekstuele content een goed tekstalternatief.',
  '1.2.1': 'Zorg voor een alternatief voor video-zonder-geluid (bijv. een animatie) of geluid-zonder-video (bijv. een podcast).',
  '1.2.2': 'Zorg dat video\'s ondertitels hebben voor alle belangrijke geluiden.',
  '1.2.3': 'Zorg dat alle belangrijke visuele informatie in video\'s ook te horen is óf zorg voor een tekstalternatief (bijv. een transcript).',
  '1.2.4': 'Live video\'s worden voorzien van ondertiteling voor doven en slechthorenden. Let op: Er is een wettelijke uitzondering voor live-video\'s.',
  '1.2.5': 'Zorg dat alle belangrijke visuele informatie in video\'s ook te horen is.',
  '1.3.1': 'Info, structuur en relaties in de content die je kan zien, moet ook in de code voor hulpsoftware beschikbaar zijn.',
  '1.3.2': 'Zorg ervoor dat alle content in een \'logische\' volgorde staat en dat hulpsoftware deze ook kan bepalen.',
  '1.3.3': 'Verwijs niet naar vorm, locatie, kleur, omvang, orientatie of geluid.',
  '1.3.4': 'Content kan in zowel staand als liggend formaat worden bekeken.',
  '1.3.5': 'Het doel van formuliervelden voor persoonlijke gegevens (bijv. je naam) moeten door hulpsoftware herkend worden.',
  '1.4.1': 'Gebruik niet alleen maar kleur om informatie over te brengen, bijvoorbeeld in grafieken, diagrammen en tabellen.',
  '1.4.2': 'Als geluid automatisch start en langer dan 3 seconden duurt dan moet er een manier zijn om het te pauzeren. Advies: start geluid niet automatisch.',
  '1.4.3': 'Alle teksten moeten voldoende kleurcontrast hebben. Tip: gebruik de Colour Contrast Analyzer om het kleurcontrast te bepalen.',
  '1.4.4': 'Tekst kan tot 200% worden vergroot zonder verlies van content of functionaliteit.',
  '1.4.5': 'Gebruik geen afbeeldingen van tekst, maar maak je tekst op met CSS.',
  '1.4.10': 'Je website moet responsive zijn en er mag geen content missen. Voorkom scrollen in twee richtingen.',
  '1.4.11': 'Niet-tekstuele content op je website heeft voldoende kleurcontrast (3,0:1). Denk bijvoorbeeld aan belangrijke afbeeldingen en formuliervelden.',
  '1.4.12': 'Tekstafstand kan door gebruiker worden aangepast zonder verlies van content.',
  '1.4.13': 'Content die verschijnt bij hover of focus is afsluitbaar, blijvend en hoverbaar.',
  '2.1.1': 'Alle functionaliteit is beschikbaar via een toetsenbord.',
  '2.1.2': 'Zorg dat gebruikers van het toetsenbord niet vastlopen.',
  '2.1.4': 'Voorkom het gebruik van sneltoetsen die bestaan uit één teken, zoals hoofdletters, kleine letters, leestekens, cijfers of symbolen.',
  '2.2.1': 'Tijdslimieten kunnen worden uitgezet, aangepast of verlengd.',
  '2.2.2': 'Voor alle bewegende of scrollende content moet de mogelijkheid zijn om dit te pauzeren, stoppen of verbergen.',
  '2.3.1': 'Het snel flitsen van drie keer of meer per seconde kan foto-epileptische aanvallen veroorzaken en is niet toegestaan.',
  '2.4.1': 'Een mechanisme is beschikbaar om herhalende content over te slaan.',
  '2.4.2': 'Alle pagina\'s hebben een goede titel die het onderwerp beschrijft.',
  '2.4.3': 'Focusvolgorde behoudt betekenis en bedienbaarheid.',
  '2.4.4': 'Geef links een duidelijke tekst zodat je weet wat er gebeurt als je er op klikt.',
  '2.4.5': 'Er is meer dan één manier om een webpagina binnen een set te vinden.',
  '2.4.6': 'Gebruik duidelijke koppen en tekstlabels die het onderwerp of doel beschrijven.',
  '2.4.7': 'De toetsenbordfocus indicator is zichtbaar.',
  '2.5.1': 'Alle functionaliteit die met complexe gebaren werkt, werkt ook met een enkele aanraking.',
  '2.5.2': 'Voor functionaliteit die via aanraking werkt, geldt dat de actie pas wordt uitgevoerd bij loslaten.',
  '2.5.3': 'Van alle interactieve elementen met zichtbare tekst is deze tekst ook beschikbaar in de toegankelijkheidsnaam.',
  '2.5.4': 'Functionaliteit die wordt geactiveerd door beweging kan ook met interface componenten worden geactiveerd.',
  '2.5.8': 'Voorkom problemen door klikbare gebieden, zoals links en knoppen, groot genoeg te maken.',
  '3.1.1': 'Hulpsoftware moet de taal van de pagina kunnen bepalen, zodat bijvoorbeeld de juiste stem en intonatie gebruikt kan worden.',
  '3.1.2': 'Als de taal van de content wisselt dan moet hulpsoftware deze kunnen bepalen.',
  '3.2.1': 'Focus ontvangen veroorzaakt geen onverwachte contextwijziging.',
  '3.2.2': 'Invoer wijzigen veroorzaakt geen onverwachte contextwijziging.',
  '3.2.3': 'Navigatiemechanismen die op meerdere pagina\'s voorkomen, staan in dezelfde volgorde.',
  '3.2.4': 'Alle elementen met dezelfde functie zijn op dezelfde manier herkenbaar.',
  '3.3.1': 'Als fouten gemaakt worden dan moet de fout duidelijk herkenbaar zijn in tekst.',
  '3.3.2': 'Invoervelden hebben duidelijke tekstlabels of instructies.',
  '3.3.3': 'Geef oplossingen als gebruikers fouten maken.',
  '3.3.4': 'Acties die juridische verplichtingen, financiële transacties of wijzigingen in gebruikersdata veroorzaken, zijn omkeerbaar.',
  '3.3.7': 'Zorg dat informatie niet meerdere keren moet worden ingevoerd in hetzelfde proces.',
  '4.1.1': 'Content heeft geen fouten in de opmaakcode.',
  '4.1.2': 'Software begrijpt de naam en rol van elementen. Ook de waarde, status of eigenschappen van elementen kunnen worden bepaald.',
  '4.1.3': 'Statusberichten zijn programmatisch bepaalbaar zonder focus te ontvangen.',
};

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
let content = fs.readFileSync(seedPath, 'utf-8');

// Update each description
for (const [code, description] of Object.entries(descriptions)) {
  const escapedDescription = description.replace(/'/g, "\\'");

  // Find pattern: descriptionNl: '...',
  // We need to match the line with this specific code and replace its descriptionNl
  const codePattern = `code: '${code}'`;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(codePattern)) {
      // Found the code, now find the descriptionNl line (should be within next few lines)
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('descriptionNl:')) {
          // Replace this line
          lines[j] = lines[j].replace(/descriptionNl:\s*'[^']*'/,  `descriptionNl: '${escapedDescription}'`);
          break;
        }
      }
      break;
    }
  }

  content = lines.join('\n');
}

fs.writeFileSync(seedPath, content, 'utf-8');
console.log('✅ Updated all WCAG description fields');