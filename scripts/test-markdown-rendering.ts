import { marked } from 'marked';

const advice = `Zorg dat de PDF wordt voorzien van een volledige tags-structuur en maak daarbij onderscheid tussen informatieve en decoratieve afbeeldingen.

- Tag informatieve afbeeldingen als <Figure> en geef deze van een kort en beschrijvend tekstalternatief dat de functie of inhoud van de afbeelding samenvat.
- Markeer decoratieve afbeeldingen als artefact zodat deze worden genegeerd door schermlezers.`;

console.log('=== Input Markdown ===');
console.log(advice);
console.log('\n=== Rendered HTML ===');
const html = marked.parse(advice);
console.log(html);
console.log('\n=== HTML (escaped for display) ===');
console.log(html.replace(/</g, '&lt;').replace(/>/g, '&gt;'));