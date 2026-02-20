// Script to add guidelineDescriptionNl to seed.ts
import * as fs from 'fs';
import * as path from 'path';

const guidelineDescriptions: Record<string, string> = {
  '1.1': 'Lever tekstalternatieven voor alle niet-tekstuele content, zodat die veranderd kan worden in andere vormen die mensen nodig hebben, zoals grote letters, braille, spraak, symbolen of eenvoudigere taal.',
  '1.2': 'Lever alternatieven voor op tijd gebaseerde media.',
  '1.3': 'Creëer content die op verschillende manieren gepresenteerd kan worden (bijvoorbeeld eenvoudiger lay-out) zonder verlies van informatie of structuur.',
  '1.4': 'Maak het voor gebruikers gemakkelijker om content te horen en te zien, waaronder scheiding van voorgrond en achtergrond.',
  '2.1': 'Maak alle functionaliteit beschikbaar vanaf een toetsenbord.',
  '2.2': 'Geef gebruikers voldoende tijd om de content te lezen en te gebruiken.',
  '2.3': 'Ontwerp content niet op een manier waarvan bekend is dat die toevallen of fysieke reacties veroorzaakt.',
  '2.4': 'Lever manieren om gebruikers te helpen navigeren, content te vinden en te bepalen waar ze zijn.',
  '2.5': 'Maak het eenvoudiger voor gebruikers om de functionaliteit te bedienen met andere vormen van invoer dan alleen het toetsenbord.',
  '3.1': 'Maak tekstcontent leesbaar en begrijpelijk.',
  '3.2': 'Maak het uiterlijk en de bediening van webpagina\'s voorspelbaar.',
  '3.3': 'Help gebruikers om fouten te vermijden en ze te verbeteren.',
  '4.1': 'Maximaliseer compatibiliteit met huidige en toekomstige user agents, met inbegrip van hulptechnologieën.',
};

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
let content = fs.readFileSync(seedPath, 'utf-8');
const lines = content.split('\n');

// Process each line
for (let i = 0; i < lines.length; i++) {
  // Look for guidelineCode lines
  const guidelineCodeMatch = lines[i].match(/guidelineCode:\s*'([^']+)'/);

  if (guidelineCodeMatch) {
    const guidelineCode = guidelineCodeMatch[1];
    const description = guidelineDescriptions[guidelineCode];

    if (description) {
      const escapedDescription = description.replace(/'/g, "\\'");

      // Find the guidelineTitleNl line (should be next or within a few lines)
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('guidelineTitleNl:')) {
          // Insert guidelineDescriptionNl after guidelineTitleNl
          const indent = lines[j].match(/^(\s*)/)?.[1] || '    ';
          lines.splice(j + 1, 0, `${indent}guidelineDescriptionNl: '${escapedDescription}',`);
          break;
        }
      }
    }
  }
}

content = lines.join('\n');
fs.writeFileSync(seedPath, content, 'utf-8');
console.log('✅ Added guidelineDescriptionNl to all WCAG criteria');