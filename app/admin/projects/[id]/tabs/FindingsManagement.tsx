'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { marked } from 'marked';
import FindingDialog, { FindingFormData } from './FindingDialog';
import QuickFindingDialog from './QuickFindingDialog';
import ExplanationDialog from './ExplanationDialog';

// Mock data for quick findings - in production this would come from an API or database
const QUICK_FINDINGS = [
  {
    id: '60f79d7a-49a6-45ed-92ee-96ff9697f0b4', // Database UUID voor testen
    title: 'Tekstalternatief met "Afbeelding van..."',
    description: 'Op pagina (URL) staan afbeeldingen met een tekstalternatief dat begint met woorden als "Afbeelding van" of "Foto van". Voor mensen die een schermlezer of brailleleesregel gebruiken is dit niet nodig. Hulpsoftware geeft namelijk al aan dat het om een afbeelding gaat. Door deze extra woorden wordt de informatie langer en minder prettig om te beluisteren of te lezen.',
    advice: 'Laat in het tekstalternatief woorden als "afbeelding", "foto" of "plaatje" weg en beschrijf direct de inhoud of functie van de afbeelding.\n\nVoorbeeld:\n\n```html\n<img src="team.jpg" alt="Projectteam in overleg aan een tafel">\n```\n\nIn specifieke situaties is het wel zinvol om het type afbeelding te noemen. Doe dit alleen als het verschil belangrijk is voor het begrip.\n\nVoorbeelden:\n\n• Een schets van een straatbeeld in plaats van een foto van die straat.\n• Een karikatuur van een persoon in plaats van een foto van die persoon.\n\nVoorbeeld:\n\n```html\n<img src="straat-schets.png" alt="Schets van een druk stadsplein met mensen">\n```',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '2',
    title: 'PDF - Afbeeldingen niet-getagde PDF',
    description: 'Het volgende PDF-document is niet getagd. Hierdoor zijn informatieve afbeeldingen niet gemarkeerd als `<Figure>` en hebben zij geen tekstalternatief. Mensen die blind zijn en een schermlezer gebruiken krijgen deze informatie daardoor niet aangeboden. Omdat het document niet is getagd, is niet vast te stellen of afbeeldingen correct zijn verwerkt. Hierdoor wordt dit nu niet afgekeurd. Zodra het document wel wordt getagd, kan blijken dat informatieve afbeeldingen ontbreken of onjuist zijn getagd.',
    advice: 'Zorg dat de PDF wordt voorzien van een volledige tags-structuur en maak daarbij onderscheid tussen informatieve en decoratieve afbeeldingen.\n\n- Tag informatieve afbeeldingen als `<Figure>` en geef deze van een kort en beschrijvend tekstalternatief dat de functie of inhoud van de afbeelding samenvat.\n- Markeer decoratieve afbeeldingen als artefact zodat deze worden genegeerd door schermlezers.',
    criterionCode: '1.1.1',
    impact: 'Serieus',
    responsibility: 'Redacteur'
  },
  {
    id: '3-alt',
    title: 'Alt met bestandsnaam (min-tekens, underscore)',
    description: 'Op pagina URL staat een afbeelding waarvan het tekstalternatief bestaat uit een bestandsnaam of technische waarde, zoals img_398.jpg of landschap-met-bomen. Dit tekstalternatief bevat underscores of mintekens in plaats van gewone spaties. Voor mensen die een schermlezer gebruiken wordt dit letterlijk voorgelezen, waardoor de tekst moeilijk te begrijpen is en de inhoud van de afbeelding niet duidelijk wordt.',
    advice: 'Vervang het technische tekstalternatief door een korte en duidelijke beschrijving van de afbeelding. Gebruik gewone woorden zonder underscores of mintekens, zodat schermlezers het goed kunnen uitspreken.\n\n```html\n<img src="landschap-met-bomen.jpg" alt="Landschap met bomen">\n```\n\nZorg altijd dat het tekstalternatief de inhoud kort samenvat en goed leesbaar is voor iedereen.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '3',
    title: 'Te lang alt-attribuut',
    description: 'Op pagina URL staat een afbeelding met een erg lang tekstalternatief. Het tekstalternatief bestaat uit één lange waarde in het alt-attribuut. Dit is lastig voor mensen die een schermlezer gebruiken, omdat de informatie zonder structuur wordt voorgelezen. Hierdoor is het moeilijk om de inhoud te begrijpen, vooral als de afbeelding veel details bevat.',
    advice: 'Gebruik voor (complexe) afbeeldingen geen lang tekstalternatief in het alt-attribuut. Beperk het alt-attribuut tot een korte beschrijving van de afbeelding. Het advies is een tekstalternatief van maximaal 75 tekens. Plaats de uitgebreide uitleg ergens anders op de pagina, bijvoorbeeld in een aparte alinea of via een toegankelijke link naar een langere beschrijving.\n\nVoorbeeld:\n\n```html\n<img src="diagram.png" alt="Overzicht van de organisatiestructuur. Zie beschrijving onder afbeelding.">\n<p id="diagram-beschrijving">\n  Beschrijving van het diagram: de organisatie bestaat uit drie afdelingen: Communicatie, Ontwikkeling en Onderzoek. \n  Onder elke afdeling vallen twee teams, die samen rapporteren aan het managementteam.\n</p>\n```\n\nOf, als de uitgebreide beschrijving elders staat:\n\n```html\n<img src="diagram.png" alt="Overzicht van de organisatiestructuur. Zie pagina met toelichting.">\n```\n\nZorg ervoor dat de beknopte tekst in het alt-attribuut het doel van de afbeelding samenvat. Zo blijft de afbeelding begrijpelijk voor gebruikers van schermlezers en voldoet de pagina aan WCAG 1.1.1.\n\nDit probleem komt ook voor op pagina URL.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '4',
    title: 'Decoratieve afbeelding zonder lege alt-tekst',
    description: 'Op pagina URL is één of meerdere decoratieve afbeeldingen voorzien van een tekstalternatief via het alt-attribuut. Hierdoor worden deze afbeeldingen ook gepresenteerd aan bezoekers die gebruik maken van een schermlezer, terwijl de afbeeldingen in dit geval geen inhoudelijke informatie toevoegen aan de pagina. Dit kan leiden tot onnodige onderbrekingen tijdens het navigeren en bemoeilijkt het snel scannen van de relevante inhoud.',
    advice: 'Zorg dat decoratieve afbeeldingen worden genegeerd door hulpsoftware. Dit kan door een leeg tekstalternatief te gebruiken (alt="") of de afbeelding op te maken als achtergrondafbeelding via CSS. Zo blijft de pagina overzichtelijk voor gebruikers van een schermlezer, terwijl het visuele ontwerp behouden blijft.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '5',
    title: 'PDF - Decoratieve afbeelding is geen artefact',
    description: 'In het PDF-document DOCUMENT bevinden zich decoratieve afbeeldingen die getagd zijn als <Figure>. Hierdoor wordt de afbeelding gepresenteerd door hulpsoftware terwijl dit niet de bedoeling is.',
    advice: 'Afbeeldingen in PDF\'s kunnen als artefact worden gemarkeerd, hierdoor worden ze niet meer gepresenteerd door hulpsoftware. Dit kan in nieuwere versies van Microsoft Word worden gedaan door de afbeelding te markeren als decoratief. In Adobe InDesign kan een afbeelding ook als decoratief worden gemarkeerd. Als dit niet is gebeurd, kan de auteur via Adobe Acrobat Pro de afbeelding als achtergrond of <Artefact> markeren. Dan verdwijnt de afbeelding uit de tags.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Redacteur'
  },
  {
    id: '6',
    title: 'Decoratieve SVG',
    description: 'Op pagina URL staan decoratieve svg\'s. Deze zijn niet verborgen voor hulpsoftware. Dit keuren we niet af, maar het is wel beter om de elementen te verbergen. Zo voorkom je dat er overbodige of onduidelijke informatie wordt gepresenteerd aan gebruikers van hulpsoftware.',
    advice: 'Verberg decoratieve SVG\'s voor hulpsoftware zodat ze niet onnodig worden voorgelezen. Dit kan door aria-hidden="true" toe te voegen aan het <svg>-element.\n\n```html\n<svg aria-hidden="true" ...>\n  <!-- decoratieve inhoud -->\n</svg>\n```\n\nZorg er ook voor dat de SVG geen onnodige title- of desc-elementen bevat. Zo blijft de ervaring helder voor gebruikers van schermlezers.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '7',
    title: 'Op tijd gebaseerde media mist tekstalternatief',
    description: 'Op pagina URL bevindt zicht een video waarvoor een onvoldoende tekstalternatief beschikbaar is. Voor de ziende persoon is het snel duidelijk dat er een video staat en waar deze video over gaat. Deze informatie moet ook beschikbaar zijn voor bezoekers die afhankelijk zijn van hulpsoftware zoals een schermlezer of braille.',
    advice: 'Zorg dat het tekstalternatief van de video duidelijk maakt dat het om een video gaat en wat de inhoud ervan is. Beschrijf kort het onderwerp of doel van de video, zodat ook gebruikers van schermlezers of braille een goed beeld krijgen van de context.\n\nPlaats bij voorkeur een korte inleidende tekst direct boven de video, bijvoorbeeld:\n\nVideo: uitleg over het maken van toegankelijke documenten.\n\nVul dit eventueel aan met een aria-label of title-attribuut bij de videospeler of het iframe waarin de video staat.\n\nVoorbeeld:\n\n```html\n<p>In onderstaande video leer je meer over het maken van toegankelijke documenten.</p>\n<iframe src="video.mp4" title="Video: Toegankelijke documenten maken"></iframe>\n```\n\nOf met een eigen videospeler:\n\n```html\n<video controls aria-label="Video: Toegankelijke documenten maken">\n  <source src="video.mp4" type="video/mp4">\n</video>\n```\n\nCombineer waar mogelijk beide vormen: een tekstuele omschrijving boven de video en een toegankelijke naam van de videospeler. Zo wordt de informatie begrijpelijk voor alle gebruikers.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Redacteur'
  },
  {
    id: '8',
    title: 'Afbeelding als link met dubbel tekstalternatief door title en alt',
    description: 'Op pagina URL staat een klikbare afbeelding. De afbeelding staat in een link. Zowel de link als de afbeelding hebben informatie die ervoor zorgen dat ze waarneembaar zijn voor gebruikers van hulpsoftware. Op de link staat een title-attribuut. Op de afbeelding een alt-attribuut. Beiden geven nu dezelfde (of vergelijkbare) informatie. Hierdoor wordt deze informatie dubbel gepresenteerd door hulpsoftware.',
    advice: 'Het advies is om het alt-attribuut te gebruiken voor het tekstalternatief van de afbeelding en alleen het title-attribuut te gebruiken om meer informatie te geven over het linkdoel. Bijvoorbeeld "Opent in een nieuw venster".',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '9',
    title: 'Tekstalternatief height/width 0',
    description: 'Op de pagina URL bevinden zich afbeeldingen waarvan het tekstalternatief verborgen wordt door het gebruik van height:0;, width:0; of font-size:0;. De presentatie van hulpsoftware verschilt bij het gebruik hiervan, waardoor het tekstalternatief bij sommigen wel en bij anderen niet wordt gepresenteerd.',
    advice: 'Verwijder height:0;, width:0; of font-size:0; van de tekstalternatieven om deze gelijkwaardig beschikbaar te maken voor hulpsoftware. Tekst die visueel verborgen is, maar voor hulpsoftware wel beschikbaar moet zijn, moet op een andere manier verborgen worden. Dit kan bijvoorbeeld met een .sr-only class in CSS of met de clip-methode.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '10',
    title: 'Functioneel icoon zonder toegankelijke naam',
    description: 'Een icoon dat een functie heeft (zoals VOORBEELD) bevat geen toegankelijke naam of label. Zonder toegankelijke naam blijft de actie onduidelijk voor screenreadergebruikers.',
    advice: 'Voeg een toegankelijke naam toe met aria-label, aria-labelledby of een bijschrift dat de functie beschrijft (bijv. "VOORBEELD").',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '11',
    title: 'Rijksoverheid lint',
    description: 'Op alle pagina\'s staat het beeldmerk (lint) van de Rijksoverheid, te herkennen aan een donkerblauw balkje met daarin een "wapen". Het gebruik van dit lint toont aan dat deze website en de organisatie onderdeel is van de Rijksoverheid. Het lint is daarom informatief. Er is nu geen tekstalternatief voor deze informatie beschikbaar.',
    advice: 'Voeg het woord "Rijksoverheid" toe aan het tekstalternatief.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '12',
    title: 'Icoon extern venster zonder tekstalternatief',
    description: 'Op de pagina URL bevindt zich een icoon wat communiceert dat een link wordt geopend in een nieuw venster. Dit icoon mist een tekstalternatief. Hierdoor wordt niet gepresenteerd door hulpsoftware dat de link in een nieuw venster zal openen.',
    advice: 'Over het algemeen wordt afgeraden links in een nieuw venster te openen. Mocht dit toch nodig/wenselijk zijn in de context, voeg dan een tekstalternatief toe aan het icoon, bijvoorbeeld "Opent in nieuw venster".',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Redacteur'
  },
  {
    id: '13',
    title: 'Afbeelding en tekst als aparte links',
    description: 'Op de pagina URL bevindt zich een afbeelding met link en zichtbare tekst met dezelfde link. Hierdoor moet iemand die een toetsenbord gebruikt om door de pagina te navigeren langs beide links.',
    advice: 'Dit kan worden opgelost door de afbeelding en de tekst in één linkelement te plaatsen. Zo wordt de afbeelding decoratief binnen de link en hoeft de gebruiker maar één keer te navigeren.\n\nVoorbeeld:\n\n```html\n<a href="">\n  <img src="" alt=""> Bekijk de details\n</a>\n```\n\nGebruik een lege alt-tekst bij decoratieve afbeeldingen binnen links om dubbele informatie voor schermlezers te voorkomen.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '14',
    title: 'Tekstalternatieven complexe afbeelding',
    description: 'Op pagina URL bevindt zicht een complexe afbeelding. Dit soort complexe afbeeldingen moeten voorzien worden van zowel een kort- als lang tekstalternatief. Deze is/zijn in dit geval onvoldoende aanwezig.',
    advice: 'Zorg voor een kort tekstalternatief die een beknopte beschrijving geeft van de afbeelding. Dit kan bijvoorbeeld met het alt-atribuut. Zorg ook voor een lang tekstalternatief. Deze geeft een uitgebreide beschrijving van dezelfde informatie die in de afbeelding wordt overgebracht. Dit kan bijvoorbeeld door middel van een tabel of een uitgeschreven tekst. Deze tekst kan dan bijvoorbeeld onder de afbeelding staan of in een uitklapbaar onderdeel bij de afbeelding. De beschrijving kan ook op een andere pagina staan waar dan met een link naar toe wordt verwezen.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Redacteur'
  },
  {
    id: '15',
    title: 'Tekstalternatief verborgen',
    description: 'Op pagina URL bevinden zich afbeeldingen waarbij het tekstalternatief verborgen is met display:none, visibility:hidden of aria-hidden="true". Hierdoor is het tekstalternatief niet beschikbaar voor hulpsoftware.',
    advice: 'Verwijder display:none, visibility:hidden of aria-hidden="true" van het tekstalternatief zodat deze weer beschikbaar wordt voor hulpsoftware. Tekst die visueel verborgen is, maar voor hulpsoftware wel beschikbaar moet zijn, moet op een andere manier verborgen worden. Dit kan bijvoorbeeld met een .sr-only class in CSS of met de clip-methode.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '16',
    title: 'Kaart',
    description: 'Op pagina X staat een kaart. De informatie in deze kaart is niet toegankelijk voor een blinde gebruiker.',
    advice: 'De kaart kan toegankelijk gemaakt worden door een tekstalternatief te bieden die voorgelezen kan worden door hulpsoftware. Een van de mogelijke oplossingen is het aanbieden van een toegankelijke datatabel waarin dezelfde informatie wordt gepresenteerd.\n\nVoor elk item in een legenda moet informatie worden gegeven. Een item dat niet voorkomt, moet ook beschreven worden. Het feit dat een item niet op de kaart staat, is ook informatie die moet worden overgedragen, want anders zou deze niet in de legenda staan.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Redacteur'
  },
  {
    id: '17',
    title: 'CAPTCHA geen uitzondering',
    description: 'Op pagina URL wordt een CAPTCHA gebruikt. Deze is niet volledig inhoudelijk getest, omdat de inhoud elke keer anders is. Er is geen gebruik gemaakt van de uitzondering voor CAPTCHA\'s. De afbeeldingen moeten een tekst(alternatief) krijgen dat het doel van deze afbeeldingen aangeeft en dat is op dit moment niet het geval. Hiernaast moet de CAPTCHA ook op een toegankelijke manier gebruikt kunnen worden. De CAPTCHA moet dus voldoen aan alle overige succescriteria.',
    advice: 'Het advies is om geen gebruik te maken van CAPTCHA\'s, omdat deze altijd een drempel voor toegankelijkheid zijn. Zie de Engelstalige pagina https://www.w3.org/TR/turingtest/ voor meer informatie en eventuele alternatieven. Het aanbieden van een toegankelijk alternatief voor de hele CAPTCHA is hier eventueel ook een geldige oplossing.',
    criterionCode: '1.1.1',
    impact: undefined,
    responsibility: undefined
  },
  {
    id: '18',
    title: 'CAPTCHA uitzondering',
    description: 'Op pagina X wordt een CAPTCHA gebruikt. Deze is niet volledig inhoudelijk getest, omdat de inhoud elke keer anders is. Er is gebruik gemaakt van de uitzondering voor CAPTCHA\'s, die uitzondering zorgt ervoor dat er voldaan wordt aan dit succescriterium. Hiernaast moet de CAPTCHA ook op een toegankelijke manier gebruikt kunnen worden. De CAPTCHA moet dus voldoen aan alle overige succescriteria.',
    advice: 'Het advies is om geen gebruik te maken van CAPTCHA\'s, omdat deze altijd een drempel voor toegankelijkheid zijn. Zie de Engelstalige pagina https://www.w3.org/TR/turingtest/ voor meer informatie en eventuele alternatieven. Het aanbieden van een toegankelijk alternatief voor de hele CAPTCHA is ook een optie.',
    criterionCode: '1.1.1',
    impact: undefined,
    responsibility: undefined
  },
  {
    id: '19',
    title: 'CSS Pseudo-element: Decoratief',
    description: 'Op pagina URL wordt met CSS een icoontje geplaatst bij X. Dit icoontje is decoratief, maar hulpsoftware leest deze nu wel voor. Het icoontje is geplaatst met behulp van een CSS pseudo-element (:before) of :after). De schermlezer leest nu voor: X. Zorg ervoor dat hulpsoftware het icoontje kan negeren.',
    advice: 'Ook met CSS kan worden aangegeven worden of dit icoontje genegeerd moet worden door bijvoorbeeld een schermlezer. Hieronder volgt een voorbeeld:\n\n```css\n.decorative-icon:before {\n  content: "🐱" / "";\n}\n```\n\nDe schermlezer zal het icoontje niet meer voorlezen door in de CSS content gebruik te maken van een extra forward-slash / met daarachter een leeg tekstalternatief.\n\nUitgebreide voorbeelden van hoe tekstalternatieven werken in CSS via pseudo-elementen zijn te vinden in het code-voorbeeld op CodePen.io.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '20',
    title: 'CSS Pseudo-element: Tekstalternatief ontbreekt',
    description: 'Op pagina URL wordt met CSS een icoontje geplaatst bij X. Dit icoontje is informatief, maar er is geen tekstalternatief beschikbaar. Hierdoor is de informatie van dit icoontje niet waarneembaar voor iedereen die afhankelijk is van een schermlezer of braille. Een tekstalternatief is altijd verplicht voor informatieve icoontjes, ook als icoontjes worden geplaatst met pseudo-elementen via CSS.',
    advice: 'Via CSS kan het tekstalternatief worden geplaatst. Pas hiervoor de CSS aan van het pseudo-element (:before of :after).\n\nEen voorbeeld:\n\n```css\n.informative-icon:before {\n  content: "\\25BA / "Tekst alternatief";\n}\n```\n\nUitgebreide voorbeelden van hoe tekstalternatieven werken in CSS via pseudo-elementen zijn te vinden in het code-voorbeeld op CodePen.io.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Ontwikkelaar'
  },
  {
    id: '21',
    title: 'Video of animatie zonder tekstalternatief',
    description: 'Op pagina URL staat een video. Bij deze video ontbreekt een tekstalternatief. Een ziende gebruiker kan zien dat er een video staat en waar de video over gaat. Als je afhankelijk bent van een schermlezer moet het tekstalternatief vertellen wat er staat (een video) en waar deze over gaat, bijvoorbeeld "Video: X".',
    advice: 'Voor een video of animatie geldt dat er direct vóór (bij voorkeur) of direct na de video een korte omschrijving staat van wat in de video of animatie te zien is. Dit kan bijvoorbeeld met een titel (bijvoorbeeld in een kop) die direct boven de video staat, of in een zin of alinea direct boven de video.\n\nDe uitleg mag ook verder weg staan van de video, maar alleen als er een directe verwijzing staat naar de video.\n\nLet op: In YouTube-video\'s staat ook vaak een titel in de video zelf. Dit volstaat niet als titel of omschrijving van de video.',
    criterionCode: '1.1.1',
    impact: undefined,
    responsibility: 'Redacteur'
  },
  {
    id: '22',
    title: 'PDF - Complexe afbeelding',
    description: 'In het volgende PDF-document staat een complexe afbeeldig op pagina X. Een blinde gebruiker is nu uitgesloten van de informatie die in deze complexe afbeelding staat.',
    advice: 'De inhoud van deze afbeelding moet in tekst uitgeschreven worden. Deze tekst kan meteen onder de afbeelding staat of als een link of bestand worden toegevoegd. Het tekstalternatief van de afbeelding kan dan verwijzen naar de plek waar deze uitgeschreven tekst staat.',
    criterionCode: '1.1.1',
    impact: 'Matig',
    responsibility: 'Redacteur'
  },
  {
    id: '23',
    title: 'Kaart voor navigatie',
    description: 'Op pagina URL staat een kaart die bedoeld is voor navigatie. De essentiële informatie uit deze kaart moet daarom op een toegankelijke manier worden aangeboden. De kaart zelf is verder niet onderzocht.',
    advice: 'Zorg dat de adressen ook op de website worden aangeboden als standaard tekst.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '24',
    title: 'PDF - Niet-getagd logo',
    description: 'In het volgende PDF-document staat bovenin het logo van ORGANISATIE. Dit logo is niet als afbeelding getagd en wordt daarom genegeerd.',
    advice: 'Op pagina 1 moet dit logo wel een afbeelding worden en een goed tekstalternatief krijgen. Op de vervolgpagina\'s is dat niet nodig en zelfs niet gewenst, omdat dit daar de leesvolgorde kan onderbreken.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '25',
    title: 'Complexe afbeelding',
    description: 'Op pagina URL staat een complexe afbeelding. Niet alle gebruikers kunnen de informatie in deze afbeelding goed waarnemen, bijvoorbeeld omdat ze afhankelijk zijn van voorleessoftware of braille.',
    advice: 'De inhoud van deze afbeelding moet in tekst uitgeschreven worden. Deze tekst kan meteen onder de afbeelding staan of als een link of bestand worden toegevoegd. Het tekstalternatief van de afbeelding kan dan verwijzen naar de plek waar deze uitgeschreven tekst staat. Zie ook https://www.w3.org/WAI/tutorials/images/complex/ voor meer tips over hoe een tekstalternatief toe te voegen aan een complexe afbeelding.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  },
  {
    id: '26',
    title: 'alt-attribuut ontbreekt',
    description: 'Op pagina URL staat een afbeelding zonder tekstalternatief. Ook het verplichte alt-attribuut ontbreekt. Op een img-element moet altijd een alt-attribuut aanwezig zijn.',
    advice: 'Als de afbeelding informatief is, dan moet het alt-attribuut een correcte omschrijving van de afbeelding geven. Als de afbeelding decoratief is dan moet het alt-attribuut leeg worden gelaten: alt="". Andere oplossingen zijn ook mogelijk.',
    criterionCode: '1.1.1',
    impact: 'Klein',
    responsibility: 'Redacteur'
  }
];

export default function FindingsManagement({ project, allCriteria, researchTypeExplanations = [] }: { project: any; allCriteria: any[]; researchTypeExplanations?: any[] }) {
  const router = useRouter();
  const [expandedFinding, setExpandedFinding] = useState<string | null>('all'); // 'all' means all findings are expanded by default
  const [expandedAdvice, setExpandedAdvice] = useState<string | null>('all'); // 'all' means all advice sections are expanded by default
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [explanationValues, setExplanationValues] = useState<Record<string, string>>({});
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [quickFindings, setQuickFindings] = useState<any[]>(QUICK_FINDINGS); // Use hardcoded as fallback
  const [highlightedCriterion, setHighlightedCriterion] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogCriterion, setDialogCriterion] = useState<{ id: string; code: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingFinding, setEditingFinding] = useState<any | null>(null);
  const [isQuickFindingDialogOpen, setIsQuickFindingDialogOpen] = useState(false);
  const [quickFindingCriterion, setQuickFindingCriterion] = useState<{ id: string; code: string } | null>(null);
  const [prefilledFindingData, setPrefilledFindingData] = useState<any | null>(null);
  const [selectedQuickFindingId, setSelectedQuickFindingId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [collapsedFindings, setCollapsedFindings] = useState<Set<string>>(new Set()); // Track collapsed findings
  const [draggedFinding, setDraggedFinding] = useState<string | null>(null);
  const [dragOverFinding, setDragOverFinding] = useState<string | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [explanationDialogCriterion, setExplanationDialogCriterion] = useState<{ id: string; code: string; title: string } | null>(null);

  // Ref for debounce timeouts
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Create a map of default explanations from research type
  const defaultExplanations = useMemo(() => {
    const map: Record<string, string> = {};
    researchTypeExplanations.forEach((explanation: any) => {
      map[explanation.wcagCriterionId] = explanation.explanation;
    });
    return map;
  }, [researchTypeExplanations]);

  // Initialize explanation values from assessments
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    project.criterionAssessments.forEach((assessment: any) => {
      if (assessment.explanation) {
        initialValues[assessment.wcagCriterionId] = assessment.explanation;
      }
    });
    setExplanationValues(initialValues);
  }, [project.criterionAssessments]);

  // Debug: log lightbox state changes
  useEffect(() => {
    console.log('Lightbox state changed:', lightboxImage);
    console.log('Portal will render:', lightboxImage !== null && typeof document !== 'undefined');
  }, [lightboxImage]);

  // Handle hash navigation on mount and hash changes
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Extract criterion ID from hash
            const criterionId = hash.replace('#criterion-', '');
            setHighlightedCriterion(criterionId);
            setSelectedCriterion(criterionId);

            // Remove highlight after 2 seconds
            setTimeout(() => {
              setHighlightedCriterion(null);
            }, 2000);
          }
        }, 300);
      }
    };

    // Handle on mount
    handleHashNavigation();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);

  // Load quick findings from database
  const loadQuickFindings = useCallback(async () => {
    try {
      const response = await fetch('/api/quick-findings');
      if (response.ok) {
        const data = await response.json();
        setQuickFindings(data);
      }
    } catch (error) {
      console.error('Error loading quick findings:', error);
      // Fallback to hardcoded data is already set in useState
    }
  }, []);

  useEffect(() => {
    loadQuickFindings();
  }, [loadQuickFindings]);

  // Close context menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId &&
          !target.closest('.finding-context-menu') &&
          !target.closest('.finding-menu-button')) {
        setOpenMenuId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else if (openMenuId) {
          setOpenMenuId(null);
        }
      }
    };

    // Only add mousedown listener for context menu, not for lightbox
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Add escape key listener for both menu and lightbox
    if (openMenuId || lightboxImage) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [openMenuId, lightboxImage]);

  // Memoize expensive computations to prevent unnecessary re-renders
  const groupedFindings = useMemo(() => {
    return allCriteria.map(criterion => {
      const criterionFindings = project.findings
        .filter((f: any) => f.wcagCriterionId === criterion.id)
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)); // Sort by sortOrder
      const assessment = project.criterionAssessments.find(
        (a: any) => a.wcagCriterionId === criterion.id
      );

      return {
        criterion,
        findings: criterionFindings,
        assessment,
        hasFindings: criterionFindings.length > 0
      };
    });
  }, [allCriteria, project.findings, project.criterionAssessments]);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'passed': return 'Goedgekeurd';
      case 'failed': return 'Afgekeurd';
      case 'not_present': return 'Niet aanwezig';
      case 'unknown': return 'Niet beoordeeld';
      case 'not_tested': return 'Niet getoetst';
      default: return '';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-50 text-green-700 border-green-400';
      case 'failed': return 'bg-red-50 text-red-700 border-red-400';
      case 'not_present': return 'bg-gray-50 text-gray-700 border-gray-400';
      case 'unknown': return 'bg-yellow-50 text-yellow-700 border-yellow-400';
      case 'not_tested': return 'bg-blue-50 text-blue-700 border-blue-400';
      default: return 'bg-white text-gray-700 border-gray-300';
    }
  }, []);

  const stats = useMemo(() => {
    const total = allCriteria.length;

    // Create a Set of criterion IDs from allCriteria for fast lookup
    const criteriaIds = new Set(allCriteria.map(c => c.id));

    // Filter assessments to only include those for criteria in the research type
    const relevantAssessments = project.criterionAssessments.filter((a: any) =>
      criteriaIds.has(a.wcagCriterionId)
    );

    const assessed = relevantAssessments.length;
    const passed = relevantAssessments.filter((a: any) => a.status === 'passed').length;
    const failed = relevantAssessments.filter((a: any) => a.status === 'failed').length;
    const notPresent = relevantAssessments.filter((a: any) => a.status === 'not_present').length;
    const unknown = relevantAssessments.filter((a: any) => a.status === 'unknown').length;
    const notTested = relevantAssessments.filter((a: any) => a.status === 'not_tested').length;
    const notAssessed = total - assessed;

    return { total, assessed, passed, failed, notPresent, unknown, notTested, notAssessed };
  }, [allCriteria, project.criterionAssessments]);

  // Configure marked to add target="_blank" to all links and escape HTML
  const configureMarked = useCallback(() => {
    const renderer = new marked.Renderer();
    const originalLink = renderer.link.bind(renderer);

    renderer.link = (token: any) => {
      const html = originalLink(token);
      return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" title="opent in nieuw venster" ');
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
      sanitize: false, // We handle HTML manually
      mangle: false,
      headerIds: false
    });
  }, []);

  // Configure marked on component mount
  useEffect(() => {
    configureMarked();
  }, [configureMarked]);

  // Function to render advice with proper markdown formatting
  const renderAdvice = useCallback((advice: string) => {
    try {
      // Escape HTML tags but preserve markdown syntax
      // This allows markdown like **bold** or `code` to work
      // while preventing HTML tags like <strong> from being rendered
      const escapedAdvice = advice
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Parse markdown to HTML
      const html = marked.parse(escapedAdvice);
      return <div className="krafters-markdown-preview finding-description space-y-3" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return <div className="text-sm text-gray-700">{advice}</div>;
    }
  }, []);

  // Check if there are any assessments or findings
  const hasAnyAssessments = project.criterionAssessments.length > 0;
  const hasAnyFindings = project.findings.length > 0;
  const showEmptyState = !hasAnyAssessments && !hasAnyFindings;

  const handleOpenDialog = (criterionId: string, criterionCode: string) => {
    setDialogCriterion({ id: criterionId, code: criterionCode });
    setIsDialogOpen(true);
  };

  const handleOpenQuickFinding = async (criterionId: string, criterionCode: string) => {
    // Reload quick findings to ensure we have the latest data
    await loadQuickFindings();
    setQuickFindingCriterion({ id: criterionId, code: criterionCode });
    setIsQuickFindingDialogOpen(true);
  };

  const handleSelectQuickFinding = (quickFinding: any) => {
    // Prefill the finding dialog with the selected quick finding data
    // Note: title is omitted so the dialog shows "nieuwe bevinding" as default
    setPrefilledFindingData({
      description: quickFinding.description,
      advice: quickFinding.advice,
      impact: quickFinding.impact,
      responsibility: quickFinding.responsibility,
      status: quickFinding.status || 'open' // Use quick finding status or default to open (afgekeurd)
    });

    // Store the quick finding ID for syncing purposes
    setSelectedQuickFindingId(quickFinding.id);

    // Open the finding dialog
    setDialogCriterion(quickFindingCriterion);
    setIsDialogOpen(true);
    setIsQuickFindingDialogOpen(false);
  };

  const handleSaveFinding = async (formData: FindingFormData, findingId?: string, sampleItemIds?: string[]) => {
    try {
      const url = findingId
        ? `/api/projects/${project.id}/findings/${findingId}`
        : `/api/projects/${project.id}/findings`;

      const method = findingId ? 'PUT' : 'POST';

      console.log('Saving finding...', { url, method, sampleItemIds });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sampleItemIds, // Include sample item IDs for creating FindingOccurrence records
        }),
      });

      console.log('Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save finding');
      }

      const result = await response.json();
      console.log('Save successful:', result);

      // Navigate to the specific finding
      window.location.href = `/admin/projects/${project.id}?tab=bevindingen&_=${Date.now()}#finding-${result.id}`;
    } catch (error) {
      console.error('Error in handleSaveFinding:', error);
      throw error; // Re-throw to let FindingDialog handle it
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, findingId: string) => {
    setDraggedFinding(findingId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, findingId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedFinding && draggedFinding !== findingId) {
      setDragOverFinding(findingId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFindingId: string, criterionId: string) => {
    e.preventDefault();

    if (!draggedFinding || draggedFinding === targetFindingId) {
      setDraggedFinding(null);
      setDragOverFinding(null);
      return;
    }

    // Get findings for this criterion
    const group = groupedFindings.find(g => g.criterion.id === criterionId);
    if (!group) return;

    const findings = [...group.findings];
    const draggedIndex = findings.findIndex(f => f.id === draggedFinding);
    const targetIndex = findings.findIndex(f => f.id === targetFindingId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const [removed] = findings.splice(draggedIndex, 1);
    findings.splice(targetIndex, 0, removed);

    // Create array of finding IDs in new order
    const findingIds = findings.map(f => f.id);

    try {
      // Send new order to API
      const response = await fetch(`/api/projects/${project.id}/findings/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Er is een fout opgetreden bij het verplaatsen van de bevinding.');
      }
    } catch (error) {
      console.error('Error reordering findings:', error);
      alert('Er is een fout opgetreden bij het verplaatsen van de bevinding.');
    }

    setDraggedFinding(null);
    setDragOverFinding(null);
  };

  const handleDragEnd = () => {
    setDraggedFinding(null);
    setDragOverFinding(null);
  };

  // Debounced save for explanation
  const saveExplanation = useCallback(async (criterionId: string, explanation: string, status: string) => {
    try {
      await fetch(`/api/projects/${project.id}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wcagCriterionId: criterionId,
          status: status,
          explanation: explanation
        })
      });
    } catch (error) {
      console.error('Error saving explanation:', error);
    }
  }, [project.id]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main content - Left side */}
      <div className="col-span-8 space-y-6">
        {/* Info banner when no assessments yet */}
        {showEmptyState && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Begin met beoordelen</h3>
                <p className="text-sm text-blue-800">Selecteer een status voor elk WCAG criterium en voeg bevindingen toe waar nodig.</p>
              </div>
            </div>
          </div>
        )}

        {/* WCAG Criteria with findings */}
        <div className="space-y-4">
          {groupedFindings.map((group: any) => (
            <div
              key={group.criterion.id}
              id={`criterion-${group.criterion.id}`}
              className={`bg-gray-50 rounded-lg scroll-mt-4 transition-all duration-300 ${
                highlightedCriterion === group.criterion.id
                  ? 'border-2 border-black shadow-lg'
                  : 'border border-gray-200'
              }`}
            >
              {/* Criterion header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h2 className="text-base font-medium text-gray-900">
                      {group.criterion.code} {group.criterion.titleNl}
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded flex-shrink-0">
                      {group.criterion.level}
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-1 ml-4 min-w-[180px]">
                    <span className="text-xs text-gray-600">Status</span>
                    <select
                      value={group.assessment?.status || 'not_tested'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        // Update assessment via API
                        const response = await fetch(`/api/projects/${project.id}/assessments`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            wcagCriterionId: group.criterion.id,
                            status: newStatus
                          })
                        });
                        if (response.ok) {
                          router.refresh();
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusColor(group.assessment?.status || 'not_tested')}`}
                    >
                      <option value="not_tested">Niet getoetst</option>
                      <option value="passed">Goedgekeurd</option>
                      <option value="failed">Afgekeurd</option>
                      <option value="not_present">Niet aanwezig</option>
                      <option value="unknown">Niet beoordeeld</option>
                    </select>
                  </div>
                </div>

                {/* Description - always visible */}
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    {group.criterion.descriptionNl || group.criterion.titleNl}
                  </p>
                  <p className="text-sm text-gray-600">
                    <a
                      href={group.criterion.understandingUrl || `https://www.w3.org/WAI/WCAG22/Understanding/non-text-content`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Understanding SC: {group.criterion.code} ↗
                    </a>
                  </p>

                  {/* Toelichting sectie */}
                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {group.assessment?.explanation || defaultExplanations[group.criterion.id] ? (
                          <div>
                            <button
                              onClick={() => {
                                setExpandedExplanations(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(group.criterion.code)) {
                                    newSet.delete(group.criterion.code);
                                  } else {
                                    newSet.add(group.criterion.code);
                                  }
                                  return newSet;
                                });
                              }}
                              className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${expandedExplanations.has(group.criterion.code) ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              Toelichting
                              {!group.assessment?.explanation && defaultExplanations[group.criterion.id] && (
                                <span className="text-xs text-gray-500 font-normal">(standaard)</span>
                              )}
                            </button>
                            {expandedExplanations.has(group.criterion.code) && (
                              <div
                                className="mt-2 pl-6 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: group.assessment?.explanation || defaultExplanations[group.criterion.id] }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Toelichting</span>
                            <p className="text-sm text-gray-500 italic ml-1">Nog geen toelichting toegevoegd</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setExplanationDialogCriterion({
                            id: group.criterion.id,
                            code: group.criterion.code,
                            title: group.criterion.titleNl
                          });
                          setIsExplanationDialogOpen(true);
                        }}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        {group.assessment?.explanation ? 'Bewerken' : 'Toevoegen'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Findings section - always show */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Bevindingen
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenQuickFinding(group.criterion.id, group.criterion.code)}
                      className="findings-button px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Snelle bevinding
                    </button>
                    <button
                      onClick={() => handleOpenDialog(group.criterion.id, group.criterion.code)}
                      className="new-project-button findings-button flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-green-500 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      Nieuwe bevinding
                    </button>
                  </div>
                </div>

                {group.findings.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Geen bevindingen.</p>
                ) : (
                  <div className="space-y-3">
                    {group.findings.map((finding: any, findingIndex: number) => {
                      const isCollapsed = collapsedFindings.has(finding.id);
                      const isDragging = draggedFinding === finding.id;
                      const isDragOver = dragOverFinding === finding.id;

                      return (
                        <div
                          key={finding.id}
                          id={`finding-${finding.id}`}
                          onDragOver={(e) => handleDragOver(e, finding.id)}
                          onDrop={(e) => handleDrop(e, finding.id, group.criterion.id)}
                          className={`bg-white border border-gray-200 rounded-lg transition-all scroll-mt-4 ${
                            isDragging ? 'opacity-50' : ''
                          } ${
                            isDragOver ? 'border-blue-500 border-2' : ''
                          }`}
                        >
                          {/* Finding header */}
                          <div className="px-4 py-3 flex items-center justify-between bg-white relative">
                            {/* Drag handle */}
                            <div
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, finding.id)}
                              onDragEnd={handleDragEnd}
                              className="cursor-move text-gray-400 hover:text-gray-600 mr-2"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zM13 3h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                              </svg>
                            </div>

                            <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => {
                              const newCollapsed = new Set(collapsedFindings);
                              if (isCollapsed) {
                                newCollapsed.delete(finding.id);
                              } else {
                                newCollapsed.add(finding.id);
                              }
                              setCollapsedFindings(newCollapsed);
                            }}>
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg
                                  className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <span className="font-medium text-sm text-gray-900">
                                Bevinding {findingIndex + 1} (SC {group.criterion.code})
                                {finding.findingCode && (
                                  <span className="ml-2 text-xs font-mono text-gray-500">
                                    [{finding.findingCode}]
                                  </span>
                                )}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === finding.id ? null : finding.id);
                              }}
                              className="finding-menu-button text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>

                            {openMenuId === finding.id && (
                              <div className="finding-context-menu absolute right-0 top-10 z-50 w-56 rounded-lg shadow-lg border border-gray-200 py-1 bg-white">
                                <button
                                  onClick={() => {
                                    setEditingFinding(finding);
                                    setDialogCriterion({ id: finding.wcagCriterionId, code: group.criterion.code });
                                    setIsDialogOpen(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="project-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 hover:bg-gray-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Bewerken
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Weet je zeker dat je deze bevinding wilt verwijderen?')) {
                                      const response = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
                                        method: 'DELETE',
                                      });
                                      if (response.ok) {
                                        setOpenMenuId(null);
                                        router.refresh();
                                      } else {
                                        alert('Er is een fout opgetreden bij het verwijderen van de bevinding.');
                                      }
                                    }
                                  }}
                                  className="project-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3 hover:bg-gray-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Verwijderen
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Finding badges and content - only show when not collapsed */}
                          {!isCollapsed && (
                            <div className="px-4 py-3 space-y-3">
                          {/* Badges row */}
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {group.criterion.code}
                            </span>
                            {finding.status && (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                finding.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {finding.status === 'open' ? 'Afgekeurd' : 'Opmerking'}
                              </span>
                            )}
                            {finding.impact && finding.impact !== 'onbekend' && (
                              <span
                                className="px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 border"
                                style={{
                                  borderColor: finding.impact === 'klein' ? '#d1d5db' :
                                              finding.impact === 'matig' ? '#d4a574' :
                                              finding.impact === 'serieus' ? '#ffa64d' :
                                              '#ffb3b3',
                                  color: finding.impact === 'klein' ? '#000000' :
                                         finding.impact === 'matig' ? '#8b4513' :
                                         finding.impact === 'serieus' ? '#994d00' :
                                         '#bb2525'
                                }}
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                  style={{
                                    color: finding.impact === 'klein' ? '#000000' :
                                           finding.impact === 'matig' ? '#8b4513' :
                                           finding.impact === 'serieus' ? '#994d00' :
                                           '#bb2525'
                                  }}
                                >
                                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                </svg>
                                {finding.impact}
                              </span>
                            )}
                            {finding.responsibility && finding.responsibility !== 'onbekend' && (
                              <span
                                className="px-2 py-0.5 text-xs font-medium rounded border bg-white"
                                style={{
                                  borderColor: '#d1d5db',
                                  color: '#000000'
                                }}
                              >
                                {finding.responsibility}
                              </span>
                            )}
                            {finding.isConcept && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Concept
                              </span>
                            )}
                          </div>

                          {/* Affected URLs (from crawler) */}
                          {finding.affectedUrls && finding.affectedUrls.length > 0 && (
                            <div className="text-sm text-gray-700 space-y-1">
                              {finding.affectedUrls.map((affectedUrl: any) => (
                                <div key={affectedUrl.id}>
                                  {affectedUrl.scopeUrl?.url && (
                                    <a
                                      href={affectedUrl.scopeUrl.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                    >
                                      <span className="underline break-all">{affectedUrl.scopeUrl.url}</span>
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sample Items als tekst */}
                          {finding.occurrences && finding.occurrences.length > 0 && (
                            <div className="text-sm text-gray-700">
                              {finding.occurrences.length >= 2 ? (
                                <ul className="list-disc list-inside space-y-1">
                                  {finding.occurrences.map((occurrence: any) => (
                                    <li key={occurrence.id}>
                                      {occurrence.sampleItem?.name && (
                                        <span className="font-medium">{occurrence.sampleItem.name}</span>
                                      )}
                                      {occurrence.sampleItem?.url && (
                                        <>
                                          {occurrence.sampleItem?.name && ' - '}
                                          <a
                                            href={occurrence.sampleItem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline break-all"
                                          >
                                            {occurrence.sampleItem.url}
                                          </a>
                                        </>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="space-y-1">
                                  {finding.occurrences.map((occurrence: any) => (
                                    <div key={occurrence.id}>
                                      {occurrence.sampleItem?.name && (
                                        <div className="font-medium">{occurrence.sampleItem.name}</div>
                                      )}
                                      {occurrence.sampleItem?.url && (
                                        <a
                                          href={occurrence.sampleItem.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                        >
                                          <span className="underline break-all">{occurrence.sampleItem.url}</span>
                                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Description */}
                          <div className="text-sm text-gray-700 leading-relaxed finding-description">
                            {renderAdvice(finding.description)}
                          </div>

                          {/* Advice section */}
                              <div>
                                <button
                                  onClick={() => setExpandedAdvice(
                                    expandedAdvice === finding.id ? null : finding.id
                                  )}
                                  className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2"
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${(expandedAdvice === finding.id || expandedAdvice === 'all') ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  Advies
                                </button>
                                {(expandedAdvice === finding.id || expandedAdvice === 'all') && (
                                  <div className="pl-6">
                                    {renderAdvice(finding.advice)}
                                  </div>
                                )}
                              </div>

                              {/* Attachments count */}
                              {finding.evidence && (() => {
                                try {
                                  const evidenceData = JSON.parse(finding.evidence);
                                  const attachmentCount = Array.isArray(evidenceData) ? evidenceData.length : 0;
                                  if (attachmentCount > 0) {
                                    return (
                                      <div className="flex items-center gap-2 pt-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                          </svg>
                                          <span>bijlage ({attachmentCount})</span>
                                        </span>
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  return null;
                                }
                                return null;
                              })()}

                              {/* Afbeeldingen section */}
                              {finding.evidence && (() => {
                                try {
                                  const evidenceData = JSON.parse(finding.evidence);
                                  if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                                    return (
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Afbeeldingen</h4>
                                        <div className="space-y-3">
                                          {evidenceData.map((item: any, index: number) => (
                                            <div key={index} className="relative">
                                              <div className="border border-gray-200 rounded-lg overflow-hidden mb-2 inline-block">
                                                {item.type?.startsWith('image/') ? (
                                                  <div
                                                    className="relative cursor-pointer inline-block"
                                                    onMouseEnter={() => setHoveredImage(item.url)}
                                                    onMouseLeave={() => setHoveredImage(null)}
                                                    onMouseDown={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      console.log('Image mousedown!', item.url);
                                                      console.log('Current lightbox state before set:', lightboxImage);
                                                      setLightboxImage({ url: item.url, caption: item.caption || item.filename });
                                                      console.log('setLightboxImage called');
                                                    }}
                                                  >
                                                    <img
                                                      src={item.url}
                                                      alt={item.caption || item.filename}
                                                      className="max-w-xs max-h-48 object-contain block"
                                                    />
                                                    <div className={`absolute inset-0 bg-black transition-all duration-200 flex items-center justify-center pointer-events-none ${hoveredImage === item.url ? 'bg-opacity-40' : 'bg-opacity-0'}`}>
                                                      <div className={`transition-opacity duration-200 flex flex-col items-center gap-2 text-white ${hoveredImage === item.url ? 'opacity-100' : 'opacity-0'}`}>
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                        </svg>
                                                        <span className="text-sm font-medium">Open grotere weergave</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="bg-gray-50 p-4 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                      {item.filename}
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-600 flex-1">{item.caption || 'Screenshot'}</p>
                                                <button
                                                  onClick={async () => {
                                                    if (confirm('Weet je zeker dat je deze afbeelding wilt verwijderen?')) {
                                                      try {
                                                        // Remove the item from the evidence array
                                                        const updatedEvidence = evidenceData.filter((_: any, i: number) => i !== index);

                                                        // Update the finding
                                                        const response = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
                                                          method: 'PUT',
                                                          headers: { 'Content-Type': 'application/json' },
                                                          body: JSON.stringify({
                                                            evidence: JSON.stringify(updatedEvidence)
                                                          })
                                                        });

                                                        if (response.ok) {
                                                          router.refresh();
                                                        } else {
                                                          alert('Er is een fout opgetreden bij het verwijderen van de afbeelding.');
                                                        }
                                                      } catch (error) {
                                                        console.error('Error deleting image:', error);
                                                        alert('Er is een fout opgetreden bij het verwijderen van de afbeelding.');
                                                      }
                                                    }
                                                  }}
                                                  className="text-red-600 hover:text-red-700 p-1"
                                                  title="Verwijder afbeelding"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  // Fallback for old format
                                  return null;
                                }
                                return null;
                              })()}
                        </div>
                          )}

                          {/* Footer with action buttons - only show when not collapsed */}
                          {!isCollapsed && (
                            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/projects/${project.id}/findings/${finding.id}`}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                Bekijk bevinding
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar - Success criteria */}
      <div className="col-span-4 bg-white border border-gray-200 rounded-lg p-4 h-fit sticky top-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-4">
            Stap 3. Bevindingen
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <span className="iconify w-4 h-4" data-icon="material-symbols:conditions-rounded" aria-hidden="true"></span>
            <span>{stats.total} Successcriteria</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 rounded bg-red-100"></span>
              <span className="text-xs font-medium text-gray-700">{stats.failed}</span>
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 rounded bg-green-100"></span>
              <span className="text-xs font-medium text-gray-700">{stats.passed}</span>
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 rounded bg-yellow-100"></span>
              <span className="text-xs font-medium text-gray-700">{stats.unknown}</span>
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 rounded bg-orange-100"></span>
              <span className="text-xs font-medium text-gray-700">{stats.notPresent}</span>
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 rounded bg-blue-100"></span>
              <span className="text-xs font-medium text-gray-700">{stats.notTested}</span>
            </div>
          </div>
        </div>

        {/* Criteria list */}
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {allCriteria.map((criterion: any) => {
            const assessment = project.criterionAssessments.find(
              (a: any) => a.wcagCriterionId === criterion.id
            );
            const criterionFindings = project.findings.filter(
              (f: any) => f.wcagCriterionId === criterion.id
            );
            // Count all findings for this criterion
            const findingsCount = criterionFindings.length;

            // Determine badge color based on assessment status, then findings
            let badgeColor;

            // Check if there are open findings (afgekeurd)
            const hasOpenFindings = criterionFindings.some((f: any) => f.status === 'open');

            // Priority: assessment status first, then findings
            if (assessment?.status === 'passed') {
              // If passed, always show green even if there are opmerkingen
              badgeColor = 'bg-green-100 text-green-800';
            } else if (assessment?.status === 'failed' || hasOpenFindings) {
              // If failed or has open findings, show red
              badgeColor = 'bg-red-100 text-red-800';
            } else if (assessment?.status === 'not_present') {
              badgeColor = 'bg-gray-100 text-gray-800';
            } else if (assessment?.status === 'unknown') {
              badgeColor = 'bg-orange-100 text-orange-800';
            } else if (assessment?.status === 'not_tested') {
              badgeColor = 'bg-blue-100 text-blue-800';
            } else if (findingsCount > 0) {
              // No assessment but has findings (opmerkingen) - show gray
              badgeColor = 'bg-gray-100 text-gray-800';
            } else {
              // No assessment yet, default to "not_tested" color (blue)
              badgeColor = 'bg-blue-100 text-blue-800';
            }

            return (
              <a
                key={criterion.id}
                href={`#criterion-${criterion.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCriterion(criterion.id);
                  setHighlightedCriterion(criterion.id);

                  const element = document.getElementById(`criterion-${criterion.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Remove highlight after 2 seconds
                    setTimeout(() => {
                      setHighlightedCriterion(null);
                    }, 2000);
                  }
                }}
                className={`criteria-list-button block w-full text-left px-2 py-1.5 rounded transition-colors ${
                  selectedCriterion === criterion.id ? 'text-gray-900' : 'text-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <span className={`criterion-code-badge px-1.5 py-0.5 text-[10px] font-medium rounded flex-shrink-0 ${badgeColor}`}>
                      {criterion.code}
                    </span>
                    <span className={`criterion-title text-[11px] leading-tight line-clamp-2 ${
                      badgeColor === 'bg-red-100 text-red-800' ? 'font-semibold' : ''
                    }`}>{criterion.titleNl}</span>
                  </div>
                  {findingsCount > 0 && (
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-[10px] font-medium"
                      aria-label={`${findingsCount} ${findingsCount === 1 ? 'bevinding' : 'bevindingen'}`}
                    >
                      {findingsCount}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Quick Finding Dialog */}
      {quickFindingCriterion && (
        <QuickFindingDialog
          isOpen={isQuickFindingDialogOpen}
          onClose={() => {
            setIsQuickFindingDialogOpen(false);
            setQuickFindingCriterion(null);
          }}
          onSelect={handleSelectQuickFinding}
          criterionCode={quickFindingCriterion.code}
          quickFindings={quickFindings}
          allCriteria={allCriteria}
        />
      )}

      {/* Finding Dialog */}
      {dialogCriterion && (
        <FindingDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingFinding(null);
            setPrefilledFindingData(null);
            setSelectedQuickFindingId(null); // Reset quick finding ID
          }}
          onSave={handleSaveFinding}
          criterionId={dialogCriterion.id}
          criterionCode={dialogCriterion.code}
          allCriteria={allCriteria}
          sampleItems={project.sampleItems || []}
          editingFinding={editingFinding || prefilledFindingData}
          quickFindingId={selectedQuickFindingId || editingFinding?.quickFindingId}
          onQuickFindingSync={loadQuickFindings}
        />
      )}

      {/* Explanation Dialog */}
      {explanationDialogCriterion && (
        <ExplanationDialog
          isOpen={isExplanationDialogOpen}
          onClose={() => {
            setIsExplanationDialogOpen(false);
            setExplanationDialogCriterion(null);
          }}
          onSave={async (explanation: string) => {
            if (explanationDialogCriterion) {
              const assessment = project.criterionAssessments.find(
                (a: any) => a.wcagCriterionId === explanationDialogCriterion.id
              );
              await saveExplanation(
                explanationDialogCriterion.id,
                explanation,
                assessment?.status || 'not_tested'
              );
              router.refresh();
            }
          }}
          criterionCode={explanationDialogCriterion.code}
          criterionTitle={explanationDialogCriterion.title}
          initialExplanation={
            project.criterionAssessments.find(
              (a: any) => a.wcagCriterionId === explanationDialogCriterion.id
            )?.explanation || defaultExplanations[explanationDialogCriterion.id] || ''
          }
        />
      )}

      {/* Lightbox Modal via Portal */}
      {lightboxImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={(e) => {
            console.log('Lightbox background clicked');
            setLightboxImage(null);
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Sluiten"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              style={{ width: '80vw', height: '80vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Caption */}
            {lightboxImage.caption && (
              <p className="mt-4 text-white text-center text-sm absolute bottom-8">{lightboxImage.caption}</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}