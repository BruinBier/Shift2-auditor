const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  ExternalHyperlink, InternalHyperlink, Bookmark, AlignmentType,
  HeadingLevel, BorderStyle, WidthType, ShadingType, LevelFormat, TableOfContents,
} = require('docx');

const PURPLE = "2A0A4A";
const ACCENT = "8A2BE2";
const BORDER_GRAY = "6D5A99";
const FAIL_RED = "B3261E";
const NOTE_ORANGE = "077D11";
const HEADER_BG = "F6F3FB";

const contentWidth = 9360; // US Letter minus 1" margins

const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 120 },
  });
}

function pRuns(runs, opts = {}) {
  return new Paragraph({ children: runs, spacing: { after: 120 }, ...opts });
}

function heading(level, text, bookmarkId = null) {
  const runChildren = [new TextRun({ text })];
  const children = bookmarkId
    ? [new Bookmark({ id: bookmarkId, children: runChildren })]
    : runChildren;
  return new Paragraph({
    heading: level,
    children,
    spacing: { before: 240, after: 160 },
  });
}

function link(textOrRuns, url) {
  const runs = Array.isArray(textOrRuns)
    ? textOrRuns
    : [new TextRun({ text: textOrRuns, style: "Hyperlink" })];
  return new ExternalHyperlink({ children: runs, link: url });
}

function linkParagraph(text, url) {
  return pRuns([link(text, url)]);
}

function tocLink(text, anchor) {
  return new Paragraph({
    style: "TOC1",
    children: [
      new InternalHyperlink({
        children: [new TextRun({ text, style: "Hyperlink" })],
        anchor,
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 200 },
    children: [new TextRun({ text })],
  });
}

function bulletRuns(runs) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 200 },
    children: runs,
  });
}

function headerCell(text, width) {
  const thickTop = { style: BorderStyle.SINGLE, size: 12, color: BORDER_GRAY };
  return new TableCell({
    borders: { top: thickTop, bottom: border, left: border, right: border },
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: PURPLE })],
    })],
  });
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, ...opts })],
    })],
  });
}

function rowHeaderCell(text, width, opts = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: PURPLE, ...opts })],
    })],
  });
}

// ---------- Tables ----------

function techSCTable() {
  const widths = [1200, 3160, 1000, 4000];
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: [
          headerCell("SC", widths[0]),
          headerCell("Naam", widths[1]),
          headerCell("Niveau", widths[2]),
          headerCell("Reden van uitsluiting", widths[3]),
        ],
      }),
      new TableRow({
        children: [
          dataCell("3.3.1", widths[0], { bold: true }),
          dataCell("Foutidentificatie", widths[1]),
          dataCell("A", widths[2]),
          dataCell("Formuliervalidatie wordt volledig door het systeem afgehandeld", widths[3]),
        ],
      }),
      new TableRow({
        children: [
          dataCell("3.3.3", widths[0], { bold: true }),
          dataCell("Foutsuggestie", widths[1]),
          dataCell("AA", widths[2]),
          dataCell("Foutsuggesties worden door het systeem gegenereerd", widths[3]),
        ],
      }),
      new TableRow({
        children: [
          dataCell("3.3.7", widths[0], { bold: true }),
          dataCell("Overbodige invoer", widths[1]),
          dataCell("A", widths[2]),
          dataCell("Het hergebruik van eerder ingevoerde gegevens binnen processen is binnen het platform technisch ingericht en wordt centraal beheerd.", widths[3]),
        ],
      }),
    ],
  });
}

const scResults = [
  ["1.1.1 Niet-tekstuele content", "A", "Voldoet niet", true],
  ["1.2.1 Louter-geluid en louter-videobeeld (vooraf opgenomen)", "A", "niet aanwezig", false],
  ["1.2.2 Ondertitels voor doven en slechthorenden (vooraf opgenomen)", "A", "niet aanwezig", false],
  ["1.2.3 Audiodescriptie of media-alternatief (vooraf opgenomen)", "A", "niet aanwezig", false],
  ["1.2.4 Ondertitels voor doven en slechthorenden (live)", "AA", "niet aanwezig", false],
  ["1.2.5 Audiodescriptie (vooraf opgenomen)", "AA", "niet aanwezig", false],
  ["1.3.1 Info en relaties", "A", "Voldoet niet", true],
  ["1.3.2 Betekenisvolle volgorde", "A", "Voldoet", false],
  ["1.3.3 Zintuiglijke eigenschappen", "A", "Voldoet", false],
  ["1.3.5 Identificeer het doel van de invoer", "AA", "niet aanwezig", false],
  ["1.4.1 Gebruik van kleur", "A", "Voldoet", false],
  ["1.4.2 Geluidsbediening", "AA", "niet aanwezig", false],
  ["1.4.3 Contrast (minimum)", "AA", "Voldoet niet", true],
  ["1.4.5 Afbeeldingen van tekst", "AA", "Voldoet", false],
  ["1.4.10 Reflow", "AA", "Voldoet", false],
  ["1.4.11 Contrast van niet-tekstuele content", "AA", "Voldoet", false],
  ["2.1.2 Geen toetsenbordval", "A", "Voldoet", false],
  ["2.1.4 Enkel teken sneltoetsen", "A", "Voldoet", false],
  ["2.2.2 Pauzeren, stoppen of verbergen", "A", "niet aanwezig", false],
  ["2.3.1 Drie flitsen of beneden drempelwaarde", "A", "Voldoet", false],
  ["2.4.2 Paginatitel", "A", "Voldoet niet", true],
  ["2.4.4 Linkdoel (in context)", "A", "Voldoet", false],
  ["2.4.6 Koppen en labels", "AA", "Voldoet niet", true],
  ["2.5.3 Label in naam", "A", "Voldoet", false],
  ["2.5.8 Grootte van het aanwijsgebied (minimum)", "AA", "Voldoet", false],
  ["3.1.1 Taal van de pagina", "A", "Voldoet niet", true],
  ["3.1.2 Taal van onderdelen", "AA", "Voldoet", false],
  ["3.2.4 Consistente identificatie", "AA", "Voldoet", false],
  ["3.3.2 Labels of instructies", "A", "Voldoet", false],
  ["4.1.2 Naam, rol en waarde", "A", "Voldoet", false],
];

function scResultsTable() {
  const widths = [5760, 1600, 2000];
  const rows = [
    new TableRow({
      children: [
        headerCell("Succescriterium", widths[0]),
        headerCell("Niveau", widths[1]),
        headerCell("Resultaat", widths[2]),
      ],
    }),
  ];
  for (const [sc, level, result, fail] of scResults) {
    rows.push(new TableRow({
      children: [
        dataCell(sc, widths[0], fail ? { bold: true } : {}),
        dataCell(level, widths[1], fail ? { bold: true } : {}),
        dataCell(result, widths[2], fail ? { bold: true, color: FAIL_RED } : {}),
      ],
    }));
  }
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

function scoresTable() {
  const widths = [3360, 2000, 2000, 2000];
  const rows = [
    new TableRow({
      children: [
        headerCell("WCAG Principe", widths[0]),
        headerCell("Niveau A", widths[1]),
        headerCell("Niveau AA", widths[2]),
        headerCell("Totaal", widths[3]),
      ],
    }),
  ];
  const data = [
    ["Waarneembaar", "7 / 9", "6 / 7", "13 / 16"],
    ["Bedienbaar", "6 / 7", "1 / 2", "7 / 9"],
    ["Begrijpelijk", "1 / 2", "2 / 2", "3 / 4"],
    ["Robuust", "1 / 1", "0 / 0", "1 / 1"],
  ];
  for (const row of data) {
    rows.push(new TableRow({
      children: row.map((t, i) => dataCell(t, widths[i])),
    }));
  }
  rows.push(new TableRow({
    children: [
      dataCell("Totaal", widths[0], { bold: true }),
      dataCell("15 / 19", widths[1], { bold: true }),
      dataCell("9 / 11", widths[2], { bold: true }),
      dataCell("24 / 30", widths[3], { bold: true }),
    ],
  }));
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

// ---------- Findings helpers ----------

function urlPara(text, url) {
  return pRuns([link(text, url)]);
}

function resultBadge(text, fail) {
  return pRuns([
    new TextRun({ text: "Resultaat: ", bold: true }),
    new TextRun({ text, bold: true, color: fail ? FAIL_RED : NOTE_ORANGE }),
  ]);
}

function adviceHeading(text = "Advies") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_5,
    children: [new TextRun({ text, italics: true })],
    spacing: { before: 120, after: 80 },
  });
}

// ---------- Build document ----------

const logoPath = path.join(__dirname, '..', 'public', 'shift2-logo.png');
const logoPng = fs.readFileSync(logoPath);

const children = [];

// Logo
children.push(new Paragraph({
  children: [new ImageRun({
    type: "png",
    data: logoPng,
    transformation: { width: 180, height: 60 },
    altText: { title: "", description: "Logo Shift2", name: "shift2-logo" },
  })],
  spacing: { before: 1200, after: 1200 },
}));

// H1
children.push(heading(HeadingLevel.HEADING_1, "WCAG 2.2 AA Deelonderzoek content website gemeente Blaricum"));

// Intro
children.push(p("Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content op de website blaricum.nl, uitgevoerd in opdracht van Bel Combinatie."));


// Projectinfo onderaan pagina 1 (boven de footer, vlak voor de page break)
function infoListItem(label, value) {
  return new Paragraph({
    numbering: { reference: "plain-list", level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}
// Grote verticale ruimte vóór het info-blok (geen lege paragrafen)
children.push(new Paragraph({
  spacing: { before: 6000 },
  children: [new TextRun({ text: "" })],
}));
children.push(infoListItem("Opdrachtgever", "Bel Combinatie"));
children.push(infoListItem("Website", "blaricum.nl"));
children.push(infoListItem("Rapportversie", "1.0"));
children.push(infoListItem("Datum", "20 april 2026"));

// Samenvatting (nieuwe pagina)
children.push(new Paragraph({
  heading: HeadingLevel.HEADING_2,
  pageBreakBefore: true,
  children: [new Bookmark({ id: "samenvatting", children: [new TextRun({ text: "Samenvatting" })] })],
  spacing: { before: 240, after: 160 },
}));
children.push(p("Dit onderzoek is door Shift2 uitgevoerd tussen 6 april 2026 en 20 april 2026. Voor dit deelonderzoek is een representatieve steekproef samengesteld van 20 gepubliceerde webpagina's met verschillende contenttypen."));
children.push(p("De onderzochte content voldoet niet volledig aan WCAG 2.2 niveau A en AA. In dit deelonderzoek zijn 30 succescriteria beoordeeld. Er wordt voldaan aan 24 van deze 30 succescriteria (80%). Bij 6 succescriteria zijn afwijkingen vastgesteld."));
children.push(p("De website van Gemeente Blaricum scoort op veel punten al goed. De aandachtspunten liggen op het vlak van paginastructuur en koppen. Op meerdere plekken ontbreekt een correcte lijstopmaak en sommige koppen beschrijven de inhoud van een sectie onvoldoende. De grootste uitdaging ligt bij de PDF-documenten: het jaarverslag klachtencoördinator is niet getagd, heeft onvoldoende contrast en is ingesteld op de verkeerde documenttaal. De handreiking participatie is over het algemeen goed gestructureerd, maar kent op enkele plekken structuurproblemen zoals ontbrekende koptagging en niet-getagde tekstkaders."));
children.push(p("Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces."));

// Over dit onderzoek
children.push(heading(HeadingLevel.HEADING_2, "Over dit onderzoek", "over-dit-onderzoek"));
children.push(p("Voor de website is een deelonderzoek uitgevoerd naar de toegankelijkheid van de content, om vast te stellen in hoeverre deze voldoet aan WCAG 2.2 niveau A en AA (EN 301 549)."));
children.push(p("De geldigheid van dit onderzoeksrapport bedraagt drie jaar. Bij substantiële wijzigingen in de content adviseren wij een aanvullend of nieuw onderzoek uit te laten voeren."));

children.push(heading(HeadingLevel.HEADING_3, "Afbakening van het deelonderzoek"));
children.push(p("Dit deelonderzoek heeft uitsluitend betrekking op de content van de website die door de organisatie via het beheersysteem kan worden ingevoerd of aangepast."));
children.push(p("Bij dit onderzoek zijn 30 van de 55 succescriteria van WCAG 2.2 niveau A en AA beoordeeld."));
children.push(p("De overige 25 succescriteria hebben betrekking op de technische basis van de website en worden beoordeeld in het afzonderlijk deelonderzoek techniek."));
children.push(p("Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website."));
children.push(heading(HeadingLevel.HEADING_4, "Succescriteria beoordeeld in het technisch deelonderzoek"));
children.push(p("Onderstaande succescriteria zijn in dit contentonderzoek niet beoordeeld en vallen onder het afzonderlijke deelonderzoek techniek:"));
children.push(techSCTable());

children.push(heading(HeadingLevel.HEADING_3, "Reikwijdte en werkwijze"));
children.push(p("Het onderzoek is uitgevoerd op basis van een representatieve steekproef. Binnen deze steekproef zijn de aangetroffen toegankelijkheidsproblemen zo concreet mogelijk beschreven. Waar mogelijk is een aanbeveling opgenomen om de afwijking te verhelpen."));
children.push(p("Dit onderzoek biedt geen uitputtend overzicht van alle mogelijke toegankelijkheidsproblemen. De bevindingen vormen een momentopname van de situatie ten tijde van het onderzoek."));

children.push(heading(HeadingLevel.HEADING_3, "Wat is WCAG?"));
children.push(pRuns([
  new TextRun({ text: "WCAG (" }),
  new TextRun({ text: "Web Content Accessibility Guidelines", language: { value: "en" } }),
  new TextRun({ text: ") zijn internationaal erkende richtlijnen voor digitale toegankelijkheid, opgebouwd rond vier principes: Waarneembaar, Bedienbaar, Begrijpelijk en Robuust. Binnen deze principes zijn meetbare succescriteria vastgesteld." }),
]));
children.push(pRuns([link("Meer informatie: WCAG 2.2 (Nederlandse vertaling)", "https://www.w3.org/Translations/WCAG22-nl")]));

// Overzicht resultaten
children.push(heading(HeadingLevel.HEADING_2, "Overzicht resultaten", "overzicht-resultaten"));
children.push(p("De resultaten zijn weergegeven in twee overzichten: per succescriterium en per WCAG-principe."));
children.push(heading(HeadingLevel.HEADING_3, "Resultaten per succescriterium"));
children.push(scResultsTable());
children.push(heading(HeadingLevel.HEADING_3, "Onderzoeksscores"));
children.push(p("De tabel hieronder laat per WCAG-principe en per WCAG-niveau zien hoeveel succescriteria zijn getoetst en hoeveel daarvan goedgekeurd zijn."));
children.push(scoresTable());

// Bevindingen
children.push(heading(HeadingLevel.HEADING_2, "Bevindingen", "bevindingen"));
children.push(p("Hieronder worden de vastgestelde afwijkingen beschreven. Per bevinding is de locatie en een beschrijving van het probleem opgenomen gevolgd door de impact op de gebruiker en een advies om de afwijking te verhelpen."));

// 1.1.1
children.push(heading(HeadingLevel.HEADING_3, "1.1.1 Niet-tekstuele content  A"));
children.push(p("Geef informatieve afbeeldingen en andere niet-tekstuele content een goed tekstalternatief."));
children.push(pRuns([new TextRun({ text: "Informatie over succescriterium " }), link("1.1.1 Niet-tekstuele content", "https://www.w3.org/Translations/WCAG22-nl#non-text-content")]));
children.push(resultBadge("Voldoet niet", true));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 1 (SC 1.1.1)"));
children.push(urlPara("https://www.blaricum.nl/overhangend-groen", "https://www.blaricum.nl/overhangend-groen"));
children.push(p("Op de pagina staat een afbeelding met voorbeelden van goed en verkeerd gesnoeide heggen. De tekst die bij de afbeelding hoort (de alt-tekst) is precies hetzelfde als het bijschrift onder de afbeelding. Hierdoor wordt dezelfde informatie twee keer voorgelezen aan gebruikers van hulpsoftware zoals een schermlezer. Omdat het bijschrift de afbeelding al goed uitlegt, is een alt-tekst niet nodig."));
children.push(adviceHeading("Advies:"));
children.push(p("Gebruik een lege alt-tekst (alt=\"\"), zodat de informatie niet dubbel wordt voorgelezen."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 2 (SC 1.1.1)"));
children.push(urlPara("https://www.blaricum.nl/strooien-bij-gladheid", "https://www.blaricum.nl/strooien-bij-gladheid"));
children.push(p("Op de pagina is een interactieve kaart opgenomen die de strooiroutes van de gemeente Blaricum toont. Deze kaart is ingebonden via een iframe. Online kaarten en karteringsdiensten vallen onder een uitzondering voor de toegankelijkheidseisen, maar deze uitzondering geldt alleen voor de kaarttechniek, niet voor de informatie die via de kaart wordt aangeboden."));
children.push(p("De informatie over de strooiroutes is momenteel alleen via de kaart beschikbaar. Op de pagina ontbreekt een tekstueel alternatief waarin deze informatie toegankelijk wordt aangeboden. De kaart bevat een zoekfunctie, maar die is zelf ook niet toegankelijk voor gebruikers van hulpsoftware."));
children.push(adviceHeading("Advies:"));
children.push(p("Zorg dat de essentiële informatie uit de kaart (zoals welke straten onder welke strooiroute vallen) ook op een toegankelijke manier wordt aangeboden, bijvoorbeeld via een tekstueel overzicht, tabel of een aantoonbaar toegankelijke zoekfunctie."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 3 (SC 1.1.1)"));
children.push(urlPara("https://www.blaricum.nl/wethouder-anne-marie-kennis", "https://www.blaricum.nl/wethouder-anne-marie-kennis"));
children.push(p("Op de pagina \"Wethouder Anne-Marie Kennis\" staat een portretfoto van de wethouder. De alt-tekst is \"Persoon met lichte outfit tegen een lichte en grijze achtergrond\". Deze tekst beschrijft het uiterlijk en de achtergrond, maar maakt niet duidelijk dat het om een portretfoto van de wethouder zelf gaat. Gebruikers van hulpsoftware, zoals een schermlezer, krijgen daardoor uiterlijke details te horen zonder de context dat dit een portret van de wethouder is."));
children.push(adviceHeading());
children.push(p("Geef de portretfoto een tekstalternatief dat duidelijk maakt dat het om een portret gaat en de persoon identificeert, bijvoorbeeld alt=\"Portretfoto Wethouder Anne-Marie Kennis\"."));

// 1.3.1
children.push(heading(HeadingLevel.HEADING_3, "1.3.1 Info en relaties  A"));
children.push(pRuns([new TextRun({ text: "Info, structuur en relaties in de content die je kan zien, moet ook in de code voor hulpsoftware beschikbaar zijn. " }), link("1.3.1 Info en relaties", "https://www.w3.org/Translations/WCAG22-nl#info-and-relationships")]));
children.push(resultBadge("Voldoet niet", true));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 1 (SC 1.3.1)"));
children.push(urlPara("https://www.blaricum.nl", "https://www.blaricum.nl"));
children.push(p("Op de homepage staat onder de kop \"Of bent u op zoek naar...\" een overzicht met twaalf links, zoals Nieuws, Gemeentelijke belastingen en Verhuizen. Visueel is dit een opsomming. Deze links staan echter in code niet als lijst opgemaakt. Daardoor kan hulpsoftware niet herkennen dat het om een lijst gaat. In de footer staan onder de kop \"Volg de gemeente\" twee links naar sociale media (Facebook en Instagram). Deze links zijn geplaatst in een p-element, terwijl ze visueel een opsomming vormen. Hierdoor is de lijststructuur niet programmatisch vastgelegd en kan hulpsoftware niet bepalen dat het om een lijst met meerdere items gaat."));
children.push(adviceHeading("Advies:"));
children.push(p("Plaats de links in een ongeordende lijst."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 2 (SC 1.3.1)"));
children.push(bulletRuns([link("https://www.blaricum.nl/bekendmakingen-en-verordeningen", "https://www.blaricum.nl/bekendmakingen-en-verordeningen")]));
children.push(bulletRuns([link("https://www.blaricum.nl/duurzaam", "https://www.blaricum.nl/duurzaam")]));
children.push(p("Op meerdere pagina's klopt de koppenstructuur niet, waardoor de hiërarchie van de content niet goed wordt overgebracht aan hulpsoftware."));
children.push(p("Op de pagina bekendmakingen en verordeningen volgt na de paginatitel (h1) direct een aantal koppen van niveau h3 zoals \"Bekendmakingen\", \"Verordeningen\" en \"Bekendmakingen in uw buurt of wijk\". Het niveau h2 ontbreekt, waardoor de structuur een stap overslaat."));
children.push(p("Op de pagina duurzaam is de kop \"Blaricum Duurzaam\" opgemaakt als h2. De onderliggende berichten, zoals \"Isolatieactie\" en \"Energieklus\" zijn ook als h2 opgemaakt. Hierdoor is niet duidelijk dat deze onderdelen onder \"Blaricum Duurzaam\" vallen. Dit zorgt ervoor dat gebruikers van schermlezers de structuur van de pagina minder goed kunnen begrijpen en moeilijker kunnen navigeren."));
children.push(adviceHeading("Advies:"));
children.push(p("Zorg voor een logische en opeenvolgende koppenstructuur zonder niveaus over te slaan. Gebruik op de pagina \"Bekendmakingen en verordeningen\" koppen van niveau h2 in plaats van h3. Laat op de pagina \"Duurzaam\" de kop \"Blaricum Duurzaam\" staan als h2 en geef de onderliggende berichten een lager kopniveau."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 3 (SC 1.3.1)"));
children.push(urlPara("https://www.blaricum.nl/evenementenkalender", "https://www.blaricum.nl/evenementenkalender"));
children.push(p("Op de pagina staat een tabel waarin de maanden (zoals april en mei) als koppen zijn gemaakt met een kop-element. Dat is niet de juiste manier. In een tabel gebruik je speciale kopcellen (th) om koppen aan te geven. Doordat hier h2 wordt gebruikt, begrijpen schermlezers de tabel minder goed."));
children.push(adviceHeading());
children.push(p("Haal de H2-koppen uit de tabel. Dit probleem kun je op twee manieren oplossen:"));
children.push(bullet("Maak per maand een aparte tabel met de maandnaam als titel, of"));
children.push(bullet("Zet de maand bij de datum (bijvoorbeeld \"5 en 6 april 2026\"). Verwijder daarnaast ook de lege rijen."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 4 (SC 1.3.1)"));
children.push(urlPara("https://www.blaricum.nl/evenementenkalender", "https://www.blaricum.nl/evenementenkalender"));
children.push(p("Op de pagina staat een tabel waarvan de bovenste rij visueel als kolomkoppen is opgemaakt maar in de code uit gewone datacellen (td) bestaat. Ook de eerste cel van elke data-rij (de datum-kolom) is een datacel, terwijl deze als rij-kop fungeert. Hierdoor kunnen hulptechnologieën niet bepalen welke kolom en welke rij bij welke informatie horen."));
children.push(adviceHeading());
children.push(p("Markeer de bovenste rij als kolomkoppen door de cellen als th te taggen. Markeer ook de eerste cel van elke data-rij als rij-kop door die als th te taggen. Haal daarnaast de strong-elementen weg, omdat koppen via CSS al vet worden weergegeven."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 5 (SC 1.3.1)"));
children.push(urlPara("Handreiking participatie BEL gemeenten.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Handreiking%20participatie%20BEL%20gemeenten.pdf?cb=L9e4BfDV"));
children.push(p("In het pdf document staan meerdere uitgelichte tekstkaders met een gele achtergrond die niet zijn getagd en daardoor niet worden voorgelezen door hulpsoftware. Een voorbeeld is de tekst op pagina 4: \"Bereken welke vorm van participatie past.\" Dit probleem komt op meerdere pagina's voor."));
children.push(adviceHeading());
children.push(p("Tag de uitgelichte tekstkaders als alinea-elementen in het bronbestand en exporteer het document daarna opnieuw als PDF."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 6 (SC 1.3.1)"));
children.push(urlPara("Handreiking participatie BEL gemeenten.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Handreiking%20participatie%20BEL%20gemeenten.pdf?cb=L9e4BfDV"));
children.push(p("Op pagina 4 van het pdf document staat het overzicht \"Bereken vorm van participatie\" met drie rijen die elk een puntenbereik koppelen aan een omschrijving en een participatieniveau. Visueel is dit een overzichtstabel. In de tagstructuur zijn de drie rijen getagd als losse alinea's. De relatie tussen puntenbereik, omschrijving en participatieniveau is niet programmatisch vastgelegd."));
children.push(adviceHeading());
children.push(p("Tag dit overzicht als een tabel in het bronbestand met een rij per puntenbereik en kolomkoppen voor puntenbereik, omschrijving en participatievorm. Exporteer het document daarna opnieuw als PDF."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 7 (SC 1.3.1)"));
children.push(urlPara("Handreiking participatie BEL gemeenten.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Handreiking%20participatie%20BEL%20gemeenten.pdf?cb=L9e4BfDV"));
children.push(p("Op pagina 10 van het pdf document staat een klikbare link naar het Omgevingsloket. De link is niet als link getagd in de tagstructuur. Een screenreadergebruiker hoort de URL voorgelezen als gewone tekst en kan de link niet activeren."));
children.push(adviceHeading());
children.push(p("Tag de URL als een klikbare link in het bronbestand en exporteer het document daarna opnieuw als PDF."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 8 (SC 1.3.1)"));
children.push(urlPara("Jaarverslag klachtencoördinator 2025.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Jaarverslag%20klachtenco%C3%B6rdinator%202025.pdf?cb=TIGttiXs"));
children.push(p("Het volgende PDF-document is niet getagd. Dit wil zeggen dat er geen structuur is aangegeven in het bestand door middel van tags. Hulpsoftware (zoals een screenreader) kan hierdoor niet bepalen wat koppen, lijsten en dergelijke zijn en zal afbeeldingen negeren."));
children.push(adviceHeading());
children.push(p("Als het bestand correct getagd wordt, kan hulpsoftware beter de structuur en relaties bepalen. Bij koppen kan dan bijvoorbeeld worden voorgelezen dat dit koppen zijn. In veel gevallen kan dit probleem worden opgelost door het document vanuit het bronbestand (meestal in Word of InDesign) opnieuw te exporteren naar PDF, maar dan inclusief tags of labels. Omdat nu de tags ontbreken, kunnen andere succescriteria zoals 1.1.1 en 1.3.2 niet onderzocht worden. Let daarom op dat bij het oplossen van dit probleem nieuwe toegankelijkheidsproblemen kunnen ontstaan."));

// 1.4.3
children.push(heading(HeadingLevel.HEADING_3, "1.4.3 Contrast (minimum)  AA"));
children.push(p("Alle teksten moeten voldoende kleurcontrast hebben. Tip: gebruik de Colour Contrast Analyzer om het kleurcontrast te bepalen."));
children.push(pRuns([link("1.4.3 Contrast (minimum)", "https://www.w3.org/Translations/WCAG22-nl#contrast-minimum")]));
children.push(resultBadge("Voldoet niet", true));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 1 (SC 1.4.3)"));
children.push(urlPara("Jaarverslag klachtencoördinator 2025.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Jaarverslag%20klachtenco%C3%B6rdinator%202025.pdf?cb=TIGttiXs"));
children.push(p("In het PDF-document staat op elke pagina een blauwe kolom met witte tekst. De tekstkleur #FFFFFF heeft onvoldoende contrast met de achtergrondkleur #629DD1. Het kleurcontrast is 2,9:1. Hierdoor is de tekst slecht leesbaar voor mensen met een verminderd gezichtsvermogen."));
children.push(adviceHeading());
children.push(p("Het contrast van normale tekst moet minimaal 4,5:1 zijn en voor grote tekst minimaal 3,0:1. Maak de blauwe achtergrondkleur donkerder zodat het contrast met de witte tekst voldoet aan de eis."));

// 2.4.2
children.push(heading(HeadingLevel.HEADING_3, "2.4.2 Paginatitel  A"));
children.push(p("Alle pagina's hebben een goede titel die het onderwerp beschrijft."));
children.push(pRuns([link("2.4.2 Paginatitel", "https://www.w3.org/Translations/WCAG22-nl#page-titled")]));
children.push(resultBadge("Voldoet niet", true));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 1 (SC 2.4.2)"));
children.push(urlPara("Jaarverslag klachtencoördinator 2025.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Jaarverslag%20klachtenco%C3%B6rdinator%202025.pdf?cb=TIGttiXs"));
children.push(p("De PDF heeft wel een titel (\"Geanonimiseerd document\"), maar deze beschrijft de inhoud van het document onvoldoende. Gebruikers van hulpsoftware, zoals een schermlezer, horen daardoor geen beschrijvende documenttitel."));
children.push(adviceHeading());
children.push(p("Stel een beschrijvende titel in die de inhoud van het document weergeeft. Doe dit bij voorkeur al in het bronbestand (bijvoorbeeld in Word of InDesign) voordat je exporteert naar PDF."));

// 2.4.6
children.push(heading(HeadingLevel.HEADING_3, "2.4.6 Koppen en labels  AA"));
children.push(p("Gebruik duidelijke koppen en tekstlabels die het onderwerp of doel beschrijven."));
children.push(pRuns([link("2.4.6 Koppen en labels", "https://www.w3.org/Translations/WCAG22-nl#headings-and-labels")]));
children.push(resultBadge("Voldoet niet", true));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 1 (SC 2.4.6)"));
children.push(urlPara("https://www.blaricum.nl/openingstijden", "https://www.blaricum.nl/openingstijden"));
children.push(p("Op de pagina staat een lege kop direct onder de paginatitel. Gebruikers die via koppen navigeren, stuiten op een lege kopregel."));
children.push(adviceHeading());
children.push(p("Vul het titelveld van het openingstijden-component in het CMS in met een beschrijvende tekst, bijvoorbeeld \"Loket Burgerzaken\"."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 2 (SC 2.4.6)"));
children.push(urlPara("https://www.blaricum.nl/form/contactformulier-blaricum/contactformulier-blaricum-0", "https://www.blaricum.nl/form/contactformulier-blaricum/contactformulier-blaricum-0"));
children.push(p("De h1 en h2 van stap 1 van het formulier zijn nagenoeg identiek: de h1 luidt \"Contactformulier - Blaricum\" en de h2 luidt \"Contactformulier Blaricum\". De h2 beschrijft de inhoud van de stap niet, zij herhaalt alleen de formuliernaam."));
children.push(adviceHeading());
children.push(p("Vervang de h2 door een beschrijvende staptitel die aangeeft wat er in deze stap wordt gevraagd. Bijvoorbeeld \"Over dit formulier\"."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 3 (SC 2.4.6)"));
children.push(urlPara("https://www.blaricum.nl", "https://www.blaricum.nl"));
children.push(p("Op de homepage staat een kop H2 met de tekst \"Of bent u op zoek naar...\". Deze kop beschrijft de inhoud van de sectie niet, maar stelt een vraag. Hierdoor is het voor gebruikers die via koppen navigeren niet duidelijk wat er in deze sectie staat."));
children.push(adviceHeading());
children.push(p("Vervang de kop door een beschrijvende titel die aangeeft wat de sectie bevat, bijvoorbeeld \"Veelgevraagde onderwerpen\" of \"Populaire onderwerpen\"."));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 4 (SC 2.4.6)"));
children.push(urlPara("https://www.blaricum.nl/overhangend-groen", "https://www.blaricum.nl/overhangend-groen"));
children.push(p("De Kop \"Wees dit voor\" op deze pagina beschrijft het onderwerp van de sectie niet duidelijk. Ook binnen de paginacontext blijft de betekenis onduidelijk. Hierdoor is voor gebruikers die via koppen navigeren niet duidelijk wat zij in deze sectie kunnen verwachten."));
children.push(adviceHeading());
children.push(p("Gebruik een beschrijvende koptekst die het onderwerp van de alinea weergeeft, zoals \"Regelmatig onderhoud voorkomt overlast\"."));

// 3.1.1
children.push(heading(HeadingLevel.HEADING_3, "3.1.1 Taal van de pagina  A"));
children.push(p("Hulpsoftware moet de taal van de pagina kunnen bepalen, zodat bijvoorbeeld de juiste stem en intonatie gebruikt kan worden."));
children.push(pRuns([link("3.1.1 Taal van de pagina", "https://www.w3.org/Translations/WCAG22-nl#language-of-page")]));
children.push(resultBadge("Voldoet niet", true));

children.push(heading(HeadingLevel.HEADING_4, "Bevinding 1 (SC 3.1.1)"));
children.push(urlPara("Jaarverslag klachtencoördinator 2025.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Jaarverslag%20klachtenco%C3%B6rdinator%202025.pdf?cb=TIGttiXs"));
children.push(p("Het PDF-document is Nederlandstalig, maar in de documenteigenschappen is Engels ingesteld als taal. Hierdoor leest een schermlezer de Nederlandse tekst voor met Engelse uitspraakregels. Gebruikers die blind of slechtziend zijn en afhankelijk zijn van een schermlezer kunnen de tekst hierdoor moeilijk of niet volgen."));
children.push(adviceHeading());
children.push(p("Stel in het bronbestand de documenttaal in op Nederlands en exporteer het document daarna opnieuw als PDF."));

// Opmerkingen
children.push(heading(HeadingLevel.HEADING_2, "Opmerkingen", "opmerkingen"));
children.push(p("De onderstaande opmerkingen leiden niet tot een afkeuring, maar bevatten suggesties die de toegankelijkheid of gebruiksvriendelijkheid verder kunnen verbeteren."));

children.push(heading(HeadingLevel.HEADING_3, "1.1.1 Niet-tekstuele content  A"));
children.push(p("Geef informatieve afbeeldingen en andere niet-tekstuele content een goed tekstalternatief."));
children.push(pRuns([new TextRun({ text: "Informatie over succescriterium " }), link("1.1.1 Niet-tekstuele content", "https://www.w3.org/Translations/WCAG22-nl#non-text-content")]));
children.push(resultBadge("Voldoet maar met opmerking", false));

children.push(heading(HeadingLevel.HEADING_4, "Opmerking 1 (SC 1.1.1)"));
children.push(urlPara("Jaarverslag klachtencoördinator 2025.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Jaarverslag%20klachtenco%C3%B6rdinator%202025.pdf?cb=TIGttiXs"));
children.push(p("Het volgende PDF-document is niet getagd. Hierdoor zijn informatieve afbeeldingen niet gemarkeerd als figure en hebben zij geen tekstalternatief. Mensen die blind zijn en een schermlezer gebruiken krijgen deze informatie daardoor niet aangeboden. Omdat het document niet is getagd, is niet vast te stellen of afbeeldingen correct zijn verwerkt. Hierdoor wordt dit nu niet afgekeurd. Zodra het document wel wordt getagd, kan blijken dat informatieve afbeeldingen ontbreken of onjuist zijn getagd."));
children.push(adviceHeading());
children.push(p("Zorg dat de PDF wordt voorzien van een volledige tags-structuur en maak daarbij onderscheid tussen informatieve en decoratieve afbeeldingen. Tag informatieve afbeeldingen als figure en geef deze een kort en beschrijvend tekstalternatief dat de functie of inhoud van de afbeelding samenvat. Markeer decoratieve afbeeldingen als artefact zodat deze worden genegeerd door schermlezers."));

children.push(heading(HeadingLevel.HEADING_4, "Opmerking 2 (SC 1.1.1)"));
children.push(urlPara("https://www.blaricum.nl/college-van-burgemeester-en-wethouders", "https://www.blaricum.nl/college-van-burgemeester-en-wethouders"));
children.push(p("Op de pagina \"College van burgemeester en wethouders\" staan portretfoto's van de burgemeester en wethouders. De alt-tekst van deze foto's beschrijft het uiterlijk van de persoon (bijvoorbeeld alt=\"Burgemeester met ambtsketting gekleed in donker jasje met lichtblauwe sjaal\"), maar maakt niet duidelijk dat het om een portretfoto gaat. Gebruikers van hulpsoftware, zoals een schermlezer, krijgen daardoor uiterlijke details te horen zonder de context dat dit een portret van de betreffende persoon is."));
children.push(adviceHeading());
children.push(p("Geef portretfoto's een tekstalternatief dat duidelijk maakt dat het om een portret gaat en de persoon identificeert, bijvoorbeeld alt=\"Portretfoto Burgemeester Barbara de Reijke\" of alt=\"Portretfoto Wethouder Anne-Marie Kennis\"."));

children.push(heading(HeadingLevel.HEADING_3, "1.3.1 Info en relaties  A"));
children.push(pRuns([new TextRun({ text: "Info, structuur en relaties in de content die je kan zien, moet ook in de code voor hulpsoftware beschikbaar zijn. " }), link("1.3.1 Info en relaties", "https://www.w3.org/Translations/WCAG22-nl#info-and-relationships")]));
children.push(resultBadge("Voldoet maar met opmerking", false));

children.push(heading(HeadingLevel.HEADING_4, "Opmerking 1 (SC 1.3.1)"));
children.push(urlPara("https://www.blaricum.nl/personen-met-verward-gedrag", "https://www.blaricum.nl/personen-met-verward-gedrag"));
children.push(p("De knop \"Zorgmelding doorgeven\" is opgemaakt als een link waarbij de volledige knoptekst in een strong-element staat. Het strong-element is bedoeld om nadruk aan te geven en is hier niet nodig. De opmaak van een knop hoort via CSS te worden geregeld."));
children.push(adviceHeading());
children.push(p("Verwijder het strong-element en regel de opmaak via CSS."));

children.push(heading(HeadingLevel.HEADING_3, "1.4.1 Gebruik van kleur  A"));
children.push(p("Gebruik niet alleen maar kleur om informatie over te brengen, bijvoorbeeld in grafieken, diagrammen en tabellen."));
children.push(pRuns([link("1.4.1 Gebruik van kleur", "https://www.w3.org/Translations/WCAG22-nl#use-of-color")]));
children.push(resultBadge("Voldoet maar met opmerking", false));

children.push(heading(HeadingLevel.HEADING_4, "Opmerking 1 (SC 1.4.1)"));
children.push(urlPara("Handreiking participatie BEL gemeenten.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Handreiking%20participatie%20BEL%20gemeenten.pdf?cb=L9e4BfDV"));
children.push(p("Op pagina 10 staat een klikbare link naar het Omgevingsloket. De link heeft geen onderstreping en wijkt niet af in kleur van de omringende tekst. De link is daardoor voor alle gebruikers visueel niet herkenbaar als klikbaar element."));
children.push(adviceHeading());
children.push(p("Onderstreep de link of geef deze een afwijkende kleur zodat deze herkenbaar is als klikbaar element."));

children.push(heading(HeadingLevel.HEADING_3, "1.4.3 Contrast (minimum)  AA"));
children.push(p("Alle teksten moeten voldoende kleurcontrast hebben. Tip: gebruik de Colour Contrast Analyzer om het kleurcontrast te bepalen."));
children.push(pRuns([link("1.4.3 Contrast (minimum)", "https://www.w3.org/Translations/WCAG22-nl#contrast-minimum")]));
children.push(resultBadge("Voldoet maar met opmerking", false));

children.push(heading(HeadingLevel.HEADING_4, "Opmerking 1 (SC 1.4.3)"));
children.push(p("Op de website is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde \"contrast switch\". Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie."));
children.push(p("Hierdoor kunnen er contrastproblemen zijn in de standaard versie. Deze zijn verder niet beoordeeld."));
children.push(adviceHeading());
children.push(p("We adviseren om ook de standaard versie te voorzien van voldoende kleurcontrast in alle teksten. Dit bevordert de toegankelijkheid van de website voor bezoekers met een zichtbeperking."));
children.push(p("Teksten met voldoende kleurcontrast lezen ook makkelijker voor alle lezers. Het lezen is hierdoor minder intensief, kost minder energie en het lezen wordt (onbewust) als prettiger ervaren. Hierdoor is de lezer eerder geneigd om over te gaan tot activatie."));
children.push(pRuns([new TextRun({ text: "De versie voor hoog contrast kan dan vervolgens ingezet worden voor een \"verhoogd contrast\", waarbij wordt voldaan aan succescriterium " }), link("WCAG 1.4.6 Verhoogd contrast (niveau AAA)", "https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html"), new TextRun({ text: "." })]));

children.push(heading(HeadingLevel.HEADING_3, "1.4.11 Contrast van niet-tekstuele content  AA"));
children.push(p("Niet-tekstuele content op je website heeft voldoende kleurcontrast (3,0:1). Denk bijvoorbeeld aan belangrijke afbeeldingen en formuliervelden."));
children.push(pRuns([link("1.4.11 Contrast van niet-tekstuele content", "https://www.w3.org/Translations/WCAG22-nl#non-text-contrast")]));
children.push(resultBadge("Voldoet maar met opmerking", false));

children.push(heading(HeadingLevel.HEADING_4, "Opmerking 1 (SC 1.4.11)"));
children.push(p("Op de website is een versie voor hoog contrast aanwezig. Deze is aan te zetten door middel van een zogenaamde \"contrast switch\". Dit succescriterium is volledig getest in de modus voor hoog contrast. De versie voor hoog contrast wordt gezien als een alternatief voor de standaard versie. Hierdoor kunnen er contrastproblemen zijn met grafische elementen in de standaard versie. Deze zijn verder niet beoordeeld."));
children.push(adviceHeading());
children.push(p("We adviseren om ook de standaard versie te voorzien van voldoende contrast voor grafische elementen, zoals iconen, knoppen en formuliervelden. Dit bevordert de toegankelijkheid van de website voor bezoekers met een zichtbeperking. De versie voor hoog contrast kan dan vervolgens ingezet worden voor een \"verhoogd contrast\"."));

// Borging en vervolg
children.push(heading(HeadingLevel.HEADING_2, "Borging en vervolg", "borging-en-vervolg"));
children.push(p("Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen in pagina's die niet zijn onderzocht. Het is daarom raadzaam om de volledige website te controleren op vergelijkbare patronen en deze structureel te monitoren."));
children.push(p("Daarnaast kunnen wijzigingen in de content of het publicatieproces nieuwe toegankelijkheidsrisico's met zich meebrengen. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling blijven daarom noodzakelijk."));

// Onderzoeksdetails
children.push(heading(HeadingLevel.HEADING_2, "Onderzoeksdetails", "onderzoeksdetails"));
children.push(p("Dit hoofdstuk bevat de onderzoeksverantwoording: de scope en steekproef van het onderzoek, de gehanteerde methode en de hulpmiddelen waarmee is getest."));

children.push(heading(HeadingLevel.HEADING_3, "Scope"));
children.push(p("Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM."));
children.push(pRuns([link("https://www.blaricum.nl/", "https://www.blaricum.nl"), new TextRun({ text: " (URI-basis)" })]));
children.push(heading(HeadingLevel.HEADING_4, "Buiten scope"));
const buitenScope = [
  ["https://belcombinatie.mijnafspraakmaken.nl/", "https://belcombinatie.mijnafspraakmaken.nl"],
  ["https://blaricum.bestuurlijkeinformatie.nl/", "https://blaricum.bestuurlijkeinformatie.nl"],
  ["https://blaricum.notubiz.nl/", "https://blaricum.notubiz.nl"],
  ["https://iburgerzaken.blaricum.nl/gaas-web/server/continue/StartGeboorte", "https://iburgerzaken.blaricum.nl/gaas-web/server/continue/StartGeboorte#burgerzaken"],
  ["https://meldingen.belcombinatie.nl/incident/beschrijf", "https://meldingen.belcombinatie.nl/incident/beschrijf"],
];
for (const [text, url] of buitenScope) {
  children.push(bulletRuns([link(text, url), new TextRun({ text: " (Andere URI-basis en/of stijlkenmerken)" })]));
}
children.push(heading(HeadingLevel.HEADING_4, "Overige scope informatie"));
children.push(p("De volgende content valt op grond van de Toegankelijkheidswet buiten de scope van dit onderzoek:"));
const wettelijkeUitz = [
  "Niet de online kaarten en karteringsdiensten, tenzij ze bedoeld zijn voor navigatie (wettelijke uitzondering voor de overheid)",
  "Niet de kantoorbestanden van vóór 23 september 2018, tenzij ze deel uitmaken van een administratief proces (wettelijke uitzondering voor de overheid).",
  "Niet de live video's (wettelijke uitzondering voor de overheid)",
  "Niet de audio- en videobestanden die vóór 23 september 2020 op het digitale kanaal zijn geplaatst (wettelijke uitzondering voor de overheid)",
  "Niet de van derden afkomstige inhoud (wettelijke uitzondering voor de overheid)",
  "Niet de inhoud van archieven (wettelijke uitzondering voor de overheid)",
  "Niet de inhoud achter een inlog",
];
for (const t of wettelijkeUitz) children.push(bullet(t));

children.push(heading(HeadingLevel.HEADING_3, "Steekproef"));
children.push(pRuns([new TextRun({ text: "Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM. Als een proces is meegenomen in het onderzoek staan ook alle procespagina's in de steekproef vermeld. Zie: " }), link("https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek", "https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek")]));
children.push(heading(HeadingLevel.HEADING_4, "Volledige steekproef"));
const steekproef = [
  ["https://www.blaricum.nl", "https://www.blaricum.nl"],
  ["https://www.blaricum.nl/bekendmakingen-en-verordeningen", "https://www.blaricum.nl/bekendmakingen-en-verordeningen"],
  ["https://www.blaricum.nl/college-van-burgemeester-en-wethouders", "https://www.blaricum.nl/college-van-burgemeester-en-wethouders"],
  ["https://www.blaricum.nl/wethouder-anne-marie-kennis", "https://www.blaricum.nl/wethouder-anne-marie-kennis"],
  ["https://www.blaricum.nl/bezwaarschriftencommissie", "https://www.blaricum.nl/bezwaarschriftencommissie"],
  ["https://www.blaricum.nl/overhangend-groen", "https://www.blaricum.nl/overhangend-groen"],
  ["https://www.blaricum.nl/personen-met-verward-gedrag", "https://www.blaricum.nl/personen-met-verward-gedrag"],
  ["https://www.blaricum.nl/klacht-over-medewerker-of-bestuurder", "https://www.blaricum.nl/klacht-over-medewerker-of-bestuurder"],
  ["Jaarverslag klachtencoördinator 2025.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Jaarverslag%20klachtenco%C3%B6rdinator%202025.pdf?cb=TIGttiXs"],
  ["https://www.blaricum.nl/strooien-bij-gladheid", "https://www.blaricum.nl/strooien-bij-gladheid"],
  ["https://www.blaricum.nl/gehandicaptenparkeerkaart", "https://www.blaricum.nl/gehandicaptenparkeerkaart"],
  ["Contactformulier Blaricum — stap 1", "https://www.blaricum.nl/form/contactformulier-blaricum/contactformulier-blaricum-0"],
  ["Contactformulier Blaricum — uw gegevens", "https://www.blaricum.nl/form/contactformulier-blaricum/uw-gegevens-1"],
  ["Contactformulier Blaricum — overzicht", "https://www.blaricum.nl/form/contactformulier-blaricum/overzicht-2"],
  ["https://www.blaricum.nl/openingstijden", "https://www.blaricum.nl/openingstijden"],
  ["https://www.blaricum.nl/herinrichting-de-bijvanck", "https://www.blaricum.nl/herinrichting-de-bijvanck"],
  ["https://www.blaricum.nl/duurzaam", "https://www.blaricum.nl/duurzaam"],
  ["Handreiking participatie BEL gemeenten.pdf", "https://cuatro.sim-cdn.nl/blaricum8fbaa4/uploads/Handreiking%20participatie%20BEL%20gemeenten.pdf?cb=L9e4BfDV"],
  ["https://www.blaricum.nl/run-op-paspoorten-wacht-niet-maak-nu-een-afspraak", "https://www.blaricum.nl/run-op-paspoorten-wacht-niet-maak-nu-een-afspraak"],
  ["https://www.blaricum.nl/evenementenkalender", "https://www.blaricum.nl/evenementenkalender"],
];
for (const [text, url] of steekproef) {
  children.push(bulletRuns([link(text, url)]));
}

children.push(heading(HeadingLevel.HEADING_3, "Onderzoeksmethode en technieken"));
children.push(pRuns([new TextRun({ text: "Dit onderzoek is uitgevoerd conform de evaluatiemethode " }), link("WCAG-EM", "https://www.w3.org/WAI/test-evaluate/conformance/wcag-em"), new TextRun({ text: ". Deze methode is aanbevolen door " }), link("DigiToegankelijk (Logius)", "https://www.digitoegankelijk.nl"), new TextRun({ text: ". Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden." })]));

children.push(heading(HeadingLevel.HEADING_3, "Testomgeving"));
children.push(p("Het basisniveau van ondersteuning bestaat uit gangbare webbrowsers en hulptechnologieën. Het onderzoek is uitgevoerd met:"));
for (const t of [
  "Google Chrome, versie 143 (primair)",
  "Mozilla Firefox, versie 146",
  "Microsoft Edge, versie 143",
  "Adobe Acrobat Pro",
  "PDF Accessibility Checker (PAC)",
  "Color Contrast Analyzer",
  "NVDA (Windows) in combinatie met Google Chrome",
]) children.push(bullet(t));

children.push(heading(HeadingLevel.HEADING_3, "Technologieën"));
for (const t of ["DOM", "HTML", "CSS", "SVG", "PDF"]) children.push(bullet(t));

// ---------- Document ----------

const doc = new Document({
  creator: "Shift2",
  title: "WCAG 2.2 AA Deelonderzoek content website gemeente Blaricum",
  description: "Toegankelijkheidsonderzoek WCAG 2.2 AA - Deelonderzoek content - blaricum.nl",
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, language: { value: "nl-NL" } } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, font: "Arial", color: PURPLE },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: PURPLE },
        paragraph: { spacing: { before: 260, after: 160 }, outlineLevel: 1,
          border: { bottom: { color: ACCENT, space: 4, style: BorderStyle.SINGLE, size: 12 } } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: PURPLE },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 2 } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: PURPLE },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 3 } },
      { id: "Heading5", name: "Heading 5", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, italics: true, font: "Arial" },
        paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 4 } },
    ],
    characterStyles: [
      { id: "Hyperlink", name: "Hyperlink", basedOn: "DefaultParagraphFont",
        run: { color: ACCENT, underline: { type: "single" } } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "plain-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 0, hanging: 0 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

// Post-process: add cnfStyle firstRow/firstColumn to table cells, so Word/PDF-UA
// recognise header cells as <th> (column headers in row 1, row headers in col 1).
function patchTablesForAccessibility(xml) {
  // For every <w:tbl> ... </w:tbl>, walk rows and cells and inject cnfStyle.
  return xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (tblXml) => {
    // Split into rows
    const rows = [];
    let idx = 0;
    const rowRe = /<w:tr\b[\s\S]*?<\/w:tr>/g;
    let m;
    let nonRowStart = 0;
    const segments = [];
    while ((m = rowRe.exec(tblXml)) !== null) {
      if (m.index > nonRowStart) segments.push({ type: 'other', xml: tblXml.slice(nonRowStart, m.index) });
      segments.push({ type: 'row', xml: m[0] });
      nonRowStart = m.index + m[0].length;
    }
    if (nonRowStart < tblXml.length) segments.push({ type: 'other', xml: tblXml.slice(nonRowStart) });

    let rowIndex = 0;
    const newSegments = segments.map(seg => {
      if (seg.type !== 'row') return seg;
      const isFirstRow = rowIndex === 0;
      rowIndex++;
      // Patch each cell
      let cellIndex = 0;
      const newRowXml = seg.xml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (tcXml) => {
        const isFirstCol = cellIndex === 0;
        cellIndex++;
        // cnfStyle: firstRow=1 if isFirstRow; firstColumn=1 if isFirstCol AND !isFirstRow (to avoid double-highlight)
        const attrs = [];
        if (isFirstRow) attrs.push('w:firstRow="1"');
        if (isFirstCol) attrs.push('w:firstColumn="1"');
        if (!attrs.length) return tcXml;
        const cnf = `<w:cnfStyle ${attrs.join(' ')}/>`;
        // Insert inside <w:tcPr>...</w:tcPr> as the first child
        if (/<w:tcPr>/.test(tcXml)) {
          return tcXml.replace(/<w:tcPr>/, `<w:tcPr>${cnf}`);
        }
        // No tcPr: insert one after <w:tc...>
        return tcXml.replace(/<w:tc(\b[^>]*)>/, `<w:tc$1><w:tcPr>${cnf}</w:tcPr>`);
      });
      return { type: 'row', xml: newRowXml };
    });

    let newTbl = newSegments.map(s => s.xml).join('');

    // Ensure tblPr has a tblLook with firstRow/firstColumn enabled
    newTbl = newTbl.replace(/<w:tblPr>([\s\S]*?)<\/w:tblPr>/, (full, inner) => {
      // Remove any existing tblLook
      const cleaned = inner.replace(/<w:tblLook\b[^/]*\/>/g, '');
      const tblLook = '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>';
      return `<w:tblPr>${cleaned}${tblLook}</w:tblPr>`;
    });

    return newTbl;
  });
}

Packer.toBuffer(doc).then(buffer => {
  const outPath = path.join(__dirname, '..', 'public', 'rapport-blaricum.docx');
  // Patch document.xml inside the .docx (zip) for accessibility
  const JSZip = require('jszip');
  return JSZip.loadAsync(buffer).then(zip => {
    return zip.file('word/document.xml').async('string').then(xml => {
      const patched = patchTablesForAccessibility(xml);
      zip.file('word/document.xml', patched);
      return zip.generateAsync({ type: 'nodebuffer' });
    });
  }).then(out => {
    fs.writeFileSync(outPath, out);
    console.log('✔ Written (a11y-patched):', outPath);
  });
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
