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
- NIET-GETAGDE PDF: zet 1.4.5 op niet_te_bepalen. Zonder tags is er voor hulptechnologie geen onderscheid tussen tekst en afbeelding: de hele opbouw van het document is onzichtbaar. Je kunt dan niet over één afbeelding zeggen dat díe het probleem is, want geen enkele tekst in het document is als tekst beschikbaar. De wortel-oorzaak wordt al onder 1.3.1 afgekeurd.
  Zie `Shift2_Regels_SC_1_3_1.md` voor de volledige lijst criteria die bij een ongetagde PDF vervallen (1.1.1, 1.3.2, 1.4.5, 2.4.4). Vastgelegd door Frits op 2026-08-02 bij UTHEU-01; Claude stelde eerst voor 1.4.5 wél per geval te beoordelen, Frits corrigeerde dat.

## Ongetagde PDF: twee valkuilen, en GEEN vraag aan de onderzoeker

Twee dingen die lijken te bewijzen dat je 1.4.5 wél kunt beoordelen, maar dat niet doen:

1. **Je kunt de tekst uitsnijden en lezen.** Dat je als auditor met een uitsnede kunt vaststellen
   dat er tekst in een afbeelding staat, betekent niet dat er een zelfstandig oordeel te vellen
   is. Wat jij kunt meten is iets anders dan wat er te beoordelen valt.
2. **De tekst is selecteerbaar.** In een ongetagde PDF is tekst vaak gewoon te selecteren, omdat
   de lettertypen zijn ingebed. Dat levert alleen visuele karaktercoördinaten op; het zegt niets
   over de vraag of die tekst voor een schermlezer als lopende tekst beschikbaar is. Selecteerbaar
   is dus geen bewijs dat iets géén afbeelding van tekst is.

Zonder structuur valt niet vast te stellen of een element door de maker bedoeld is als afbeelding
van tekst of als mislukte platte tekst. Dat onderscheid ontstaat pas bij het taggen.

**Formuleer dit niet als openstaande vraag.** De uitkomst staat vast: niet te beoordelen, met de
wortel-oorzaak al afgekeurd onder 1.3.1. Er is niets dat de onderzoeker nog kan uitzoeken, en
"is er een getagde versie beschikbaar?" is geen vraag maar de bevinding zelf. Zet in `reden` de
vaststelling, zonder vraagzin:

> Het document is niet getagd (geen /StructTreeRoot, geen /MarkInfo). Zonder tags bestaat er voor
> hulptechnologie geen onderscheid tussen tekst en afbeelding, dus valt over geen enkel onderdeel
> zelfstandig vast te stellen dat juist dát een afbeelding van tekst is. Dat de tekst
> selecteerbaar of uit te snijden is, maakt dat niet anders. De wortel-oorzaak is afgekeurd
> onder 1.3.1; dit criterium is opnieuw te beoordelen zodra het document getagd is.

Hetzelfde geldt voor de andere criteria die bij een ongetagde PDF vervallen (1.1.1, 1.3.2,
2.4.4): vaststelling, geen vraag.

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

Kaarten met labels erin zijn hier geen bevinding: dat loopt via 1.1.1. Een PDF zonder tags is
niet te beoordelen, en dat is een vaststelling, geen vraag.

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
5. [agent] Bij een PDF zonder tags: `niet_te_bepalen` met de vaste vaststelling uit dit
   bestand, zonder vraagzin. Bij een getagde PDF: beoordelen als een pagina.

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
