# Shift2-beoordelingsregels SC 2.4.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_4_2.md` als ze elkaar tegenspreken.

## De vraag

Heeft de pagina een titel die zegt waar hij over gaat? Wie een schermlezer gebruikt hoort de
titel als eerste bij het openen van een pagina, en ziet hem in de lijst met tabbladen. Een
titel die alleen de sitenaam bevat zegt dan niets.

Dit criterium geldt op elke pagina en op elk document, dus het oordeel is altijd `voldoet` of
`afgekeurd`. `niet_aanwezig` bestaat hier niet: een pagina zonder titel is een afkeuring.

## Wat wél een afkeuring is

- **Geen `title`-element of een leeg element.** QuickFinding "Paginatitel is leeg"
  (c43b7635), impact **matig**, verantwoordelijkheid **redacteur**.
- **Alleen de sitenaam op een subpagina**: "Gemeente Zoetermeer" op de pagina over paspoorten.
  Dat is F25: de titel beschrijft de pagina niet.
- **Een titel die over iets anders gaat dan de pagina**, of een technische restant: "Pagina",
  "Content", "Untitled", de bestandsnaam.
- **PDF zonder bruikbare documenttitel**: de eigenschappen bevatten een sjabloonwoord of niets,
  of de instelling ontbreekt die de titel in plaats van de bestandsnaam toont. QuickFinding
  "PDF - Geen bruikbare documenttitel" (00e5dd04), impact **matig**, **redacteur**. Zie ook
  `Shift2_Werkwijze_PDF.md`: dit is een van de criteria die je ook bij een ongetagd document
  beoordeelt.

## Wat GEEN bevinding is

- **De homepage met alleen de sitenaam.** De homepage ís de site; "Home - Gemeente
  Zoetermeer" is beter, maar de sitenaam alleen voldoet.
- **Dezelfde titel op elke stap van een formulier.** De titel van de eerste pagina van een
  proces mag gelden voor alle stappen. Een stapaanduiding erbij is beter, geen eis.
- **"Zoeken" op de zoekresultatenpagina** zonder de zoekterm erin. De pagina gaat over zoeken.
- **De sitenaam vooraan** ("Gemeente Zoetermeer - Paspoort"). Dat is een advies, geen
  afkeuring: QuickFinding "Advies organisatienaam" (fc293c1c), impact **klein**,
  **ontwikkelaar**. Gebruik die alleen als het patroon op de hele site zo is; noteer het één
  keer, bij de homepage.

## Wie lost het op

De opbouw van de titel komt uit het sjabloon (ontwikkelaar); het onderwerp erin komt uit de
paginanaam die de redacteur invoert. Een leeg of nietszeggend onderwerp is dus redacteur;
een sjabloon dat het onderwerp weglaat is ontwikkelaar.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

De paginatitel zegt waar de pagina over gaat

### In het kort

Wie een schermlezer gebruikt hoort de titel als eerste, en wie tien tabbladen open heeft
ziet alleen de titel. Daarom moet hij het onderwerp van déze pagina noemen, niet alleen
de naam van de site. Onderwerp vooraan, organisatie achteraan.

Alleen de sitenaam is goed op de homepage en nergens anders. Op een PDF is de titel wat in
de documenteigenschappen staat, en die moet ook getoond worden in plaats van de
bestandsnaam.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-html`: het veld `title` in het antwoord is de titel zoals de browser hem
   toont, na JavaScript. Bij een pagina die de titel met een script zet, is dat de enige
   betrouwbare bron.
2. [agent] Bij een PDF: lees de titel uit de documenteigenschappen en of de instelling aanstaat
   die de titel toont in plaats van de bestandsnaam.

#### Stap 2 — Beoordelen

3. [agent] Is er een titel en is hij gevuld? Leeg of afwezig is een afkeuring.
4. [agent] Noemt de titel het onderwerp van deze pagina? Vergelijk met de eerste kop en de
   inhoud. Alleen de sitenaam is op een subpagina een afkeuring; op de homepage niet.
5. [agent] Haal met `get-html` de titel op van minstens twee andere pagina's uit de
   steekproef. Zijn ze allemaal gelijk, dan zet het sjabloon het onderwerp er niet in.
6. [agent] Staat het onderwerp vooraan en de organisatie achteraan? Zo niet, dan is dat een
   advies (QuickFinding fc293c1c), één keer per site.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` geeft de titel terug zoals de browser hem na JavaScript toont, samen met de
inhoud van de pagina om hem tegen af te zetten. Of de titel onderscheidend is, blijkt uit
dezelfde meting op de andere pagina's van de steekproef.

Wat hier niet uit blijkt: of een titel het onderwerp góed beschrijft. "Informatie" is
gevuld en uniek, en zegt toch niets; dat weegt de agent, en bij twijfel de onderzoeker.

### Deelgebieden

1. Aanwezig en gevuld: een title-element met tekst, bij een PDF de documenttitel in de eigenschappen plus de weergave-instelling
2. Beschrijvend: de titel noemt het onderwerp van deze pagina en niet alleen de sitenaam, behalve op de homepage
3. Onderscheidend: de titel verschilt van die van de andere pagina's in de steekproef
4. Opbouw: onderwerp vooraan, organisatie achteraan; andersom is een advies, geen afkeuring

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 3.1.1,
> 3.1.2, 3.3.1, 3.3.3 en 3.3.7. De regels komen uit de checklist en uit de drie
> QuickFindings voor dit criterium; er zitten nog geen correcties uit audits in. Zet uitleg
> bij deze lijst altijd als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan
> het laatste gebied vast.
