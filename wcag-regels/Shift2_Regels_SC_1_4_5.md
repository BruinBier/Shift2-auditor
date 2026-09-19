# Shift2-beoordelingsregels SC 1.4.5

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_5.md` als ze elkaar tegenspreken.

## Regels

- KAARTEN (plattegrond, locatiekaart, routekaart) met tekstlabels erin: GEEN 1.4.5-bevinding en GEEN opmerking. Kaarten vallen onder de wettelijke uitzondering voor de overheid. Het probleem loopt volledig via 1.1.1: daar staat al dat de informatie uit de kaart ook als gewone tekst op de pagina beschikbaar moet zijn, inclusief de labels. Rapporteer het niet dubbel. Voorbeeld: BEV-03 B018 (duurzaam.beverwijk.nl, zonnepanelen langs de A9).
- Gestileerde evenementen-/promotieposter (drukwerk waarin tekst grafisch vormgegeven onderdeel is): valt onder de 1.4.5-uitzondering "essentieel voor de gewenste presentatie". GEEN bevinding en GEEN opmerking. Zet op niet_aanwezig of voldoet.
- Het toegankelijkheidsprobleem van zon poster loopt via 1.1.1 (tekstalternatief) en het aanvullen van ontbrekende info als echte tekst.
- Let op het verschil: een uitgetypt tekstblok dat zonder reden als screenshot is geplaatst valt NIET onder de uitzondering en kan wel een 1.4.5-bevinding zijn.
- 1.4.5 en 1.4.3 zijn aparte toetsingen. Dat een poster onder de 1.4.5-uitzondering valt, maakt hem niet immuun voor 1.4.3.
- PDF: DE VRAAG IS OF DE TEKST ER ALS TEKST STAAT, NIET OF HIJ GETAGD IS.

  **Afkeuren**: het document bestaat uit gescande pagina's -- paginabeelden waarin tekst te
  zien is -- zonder dat die is omgezet naar echte tekst. Dat zijn letterlijk afbeeldingen van
  tekst.

  **Voldoet**: de tekst is selecteerbaar en doorzoekbaar. Dan is het echte digitale tekst, ook
  als de pagina zelf een scan is met OCR eroverheen. Het ontbreken van tags verandert daar
  niets aan.

  Te meten zonder afweging: lees de tekstlaag uit en zoek er een woord in dat zichtbaar op de
  pagina staat. Komt er niets terug, dan is er geen tekstlaag.

  Vervangt de regel van 2026-08-02 bij UTHEU-01, die 1.4.5 bij een ongetagde PDF op
  `niet_te_bepalen` zette omdat er zonder tags geen onderscheid tussen tekst en afbeelding zou
  zijn. Dat onderscheid gaat over wat hulptechnologie kan bereiken, en dat is 1.3.1; 1.4.5
  vraagt of tekst als beeld wordt gepresenteerd. Aanleiding: het Collegebesluit van ZOET-01,
  acht gescande pagina's met een doorzoekbare OCR-laag van 18.755 tekens. Dat stond op
  `niet_te_bepalen` terwijl het gewoon voldoet. Vastgelegd door Frits op 2026-09-19.

## PDF: scan met of zonder tekstlaag

De toets is er een die je uitvoert, niet weegt:

1. **Lees de tekstlaag uit.** Staat er tekst, en is die doorzoekbaar? Zoek er een woord in dat
   je zichtbaar op de pagina ziet staan. Komt dat woord terug, dan is de tekst er als tekst en
   voldoet 1.4.5.
2. **Komt er niets terug**, dan bestaat de pagina alleen uit beeld. Dat is een afkeuring: alle
   tekst in het document is een afbeelding van tekst.

Een pagina die als één groot paginabeeld is opgebouwd is dus niet vanzelf een afkeuring. Ligt
er een OCR-laag overheen, dan is de tekst selecteerbaar en doorzoekbaar en voldoet het. Dat de
OCR fouten kan bevatten is een kwestie voor 1.3.1 en voor de kwaliteit van het document, niet
voor dit criterium.

**Formuleer dit niet als openstaande vraag.** De uitkomst is te meten, dus er is niets dat de
onderzoeker nog moet uitzoeken. Zet in `reden` wat je hebt gemeten:

> De pagina's 1 tot en met 8 zijn elk één paginabeeld met een tekstlaag eroverheen. Die tekst
> is selecteerbaar en doorzoekbaar: 18.755 tekens, en zoeken op een zichtbaar woord geeft
> treffers. De tekst staat er dus als echte tekst en niet als afbeelding van tekst.


## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Tekst staat als tekst, niet als afbeelding

### In het kort

Staat er leesbare tekst in een afbeelding, dan kan wie inzoomt, een eigen lettertype
instelt of hoog contrast aanzet daar niets mee. Tekst hoort als tekst op de pagina te staan.
Uitzonderingen: een logo of woordmerk, en een poster of banner waarin de vormgeving van de
tekst het punt is. Een uitgetypt tekstblok dat als schermafdruk is geplaatst valt daar niet
onder.

Kaarten met labels erin zijn hier geen bevinding: dat loopt via 1.1.1. Bij een PDF telt of de
tekst selecteerbaar en doorzoekbaar is; een scan met OCR voldoet, een scan zonder tekstlaag
niet. Of het document getagd is, doet hier niet ter zake.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-html`: alle afbeeldingen in de main-content, op de homepage ook header en
   footer, met hun tekstalternatief en bestandsnaam. Een afbeelding met een alt die een hele
   zin bevat, is een eerste aanwijzing.
2. [meting] `get-screenshot --full-page`: waar op de pagina leesbare tekst in een afbeelding
   staat. Dat zie je alleen op het beeld, niet in de code.

#### Stap 2 — Beoordelen

3. [agent] Per afbeelding met tekst erin: is het een logo of woordmerk, een poster of banner
   waarin de vormgeving essentieel is, of een kaart? Dan geen bevinding hier.
4. [agent] Blijft er een afbeelding over met gewone tekst die net zo goed als tekst had kunnen
   staan, dan is dat een afkeuring. Noem wat erin staat en of die tekst elders op de pagina
   als tekst staat.
5. [agent] Bij een PDF: lees de tekstlaag uit en zoek er een woord in dat zichtbaar op de
   pagina staat. Komt dat terug, dan staat de tekst er als tekst en voldoet 1.4.5 -- ook bij
   een scan met OCR, en ongeacht of het document getagd is. Komt er niets terug, dan is de
   hele pagina beeld en is dat een afkeuring.

#### Stap 3 — Vastleggen

6. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
7. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` geeft de afbeeldingen met hun tekstalternatief; de opname van de hele pagina
laat zien waar leesbare tekst in een afbeelding staat. Of die tekst ook als echte tekst op
de pagina staat, blijkt uit dezelfde HTML.

Wat hier niet uit blijkt: of de vormgeving van een poster werkelijk essentieel is. Dat weegt
de agent aan de hand van de regels hierboven, en bij twijfel de onderzoeker.

### Deelgebieden

1. Afbeeldingen met leesbare tekst: gevonden op de opname en in de code, met wat erin staat
2. Logo's en woordmerken: uitzondering, geen bevinding
3. Posters, banners en kaarten: uitzondering of via 1.1.1, geen bevinding hier
4. Tekstblokken die als schermafdruk zijn geplaatst: afkeuring

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
