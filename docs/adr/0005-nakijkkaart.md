---
status: proposed
---

# De kaart in "Waar sta ik" is een nakijkkaart, geen auditkaart

Op 31 augustus 2026 was de kaart van 2.4.4 op de homepage drie schermen lang, terwijl er
maar één ding te doen viel: kijken of het oordeel klopte en op "Akkoord" drukken. Alles wat
de agent had gezien stond erop, in de volgorde waarin hij het had gezien.

Dat is de verkeerde vorm. Eén agent onderzoekt één succescriterium op één pagina; de
onderzoeker komt daarna controleren of dat werk klopt én of het af is. De kaart hoort die
twee vragen te beantwoorden, en verder niets zonder klik.

## Wat standaard zichtbaar is

Het oordeel, wat er niet is nagelopen, de bevindingen, en de knoppen. Al het andere zit
onder een klep.

## Twee kleppen, met een scherpe scheiding

Onder de knoppen staan twee inklapbare blokken (`vastgesteldDetails` in
`app/admin/projects/[id]/tabs/WaarStaIk/Stapel.tsx`):

- **"Waar dit criterium over gaat"** bevat alles wat per criterium hetzelfde is: de uitleg,
  het succescriterium, de instructies, én hoe het gemeten wordt. Dit lees je bij de eerste
  kaarten en daarna niet meer. Ligt er nog geen oordeel, dan staat deze klep open: dan zijn
  de instructies geen verslag maar een opdracht.
- **"Hoe dit is vastgesteld"** bevat wat over déze pagina gaat: wat de agent noteerde (de
  `reden`), en daaronder de metingen met commando's, tijdstippen en artefacten, plus de knop
  "Meet dit nu".

De grens ligt bij "geldt dit voor elke pagina of alleen voor deze". Stond de uitleg van het
gereedschap bij de metingen, dan waren er twee kleppen met criteriumuitleg naast elkaar,
en die lopen uit elkaar.

## Alleen melden wat mankeert

De deelgebiedenlijst toont niet elf vinkjes maar één regel. Is alles nagelopen en in orde:
"✓ Alle 11 deelgebieden zijn nagelopen, en er is niets aan de hand." Vraagt een gebied
aandacht: "Alle 11 deelgebieden zijn nagelopen; 2 daarvan vragen aandacht", uitklapbaar
naar het gebied met zijn toelichting en de bevinding eronder. Is er niet naar een gebied
gekeken, dan staan de namen van wat ontbreekt zichtbaar op de kaart, want dat is precies
waar de onderzoeker zelf moet gaan kijken. De volledige lijst met alles wat in orde is zit
achter een klik.

Reden: bij dertig criteria maal twintig pagina's betaal je alles wat er standaard staat
honderden keren. Elf vinkjes leest niemand; één gebied op fout wel.

## "Ik zie hier nog iets" gaat via het overleg, niet via een tekstvak

De knop opent de browser naast de kaart (zie ADR 0002) en het overlegpaneel. De onderzoeker
beschrijft in gewone taal waar het staat en wat eraan mankeert; de agent schrijft de
bevinding, met de huisregels van het criterium ernaast (opgehaald uit
`/api/wcag-regels?code=...`). Een bevinding die in een haastig tekstvak wordt getypt gaat
langs alle schrijfregels heen en belandt zo in het rapport. Zie ook de rol van de
onderzoeker als spotter in ADR 0001.

Alleen op oude kaarten zonder kaarttekst staat nog de link "Ik zie iets — noteren" naar het
waarnemingenscherm.

## Deelgebieden zijn verplicht, en dat wordt in de API afgedwongen

Een criterium met deelgebieden komt er niet in zonder die gebieden. `save-checks`
(`app/api/projects/[id]/criterion-checks`) weigert een oordeel zolang er gebieden ontbreken,
en noemt ze bij naam. Dat geldt voor elk criterium met `### Deelgebieden` in zijn
regelbestand; op dit moment 1.1.1, 1.2.1 tot en met 1.2.5, 1.3.1, 1.4.3 en 2.4.4. Zet een
gebied bij een regelbestand en de weigering geldt meteen.

De controle staat in de API en niet op de kaart, want op de kaart is het te laat: dan moet
de onderzoeker het bij elke kaart zelf opmerken en de agent terugsturen. Een agent die drie
van de zes gebieden overslaat en over de andere drie netjes schrijft, levert iets op dat er
hetzelfde uitziet als volledig werk.

De gebieden gaan mee in hetzelfde `save-checks`-bericht. `save-gebieden` eist een bestaand
oordeel, dus los zou de agent nooit kunnen beginnen. Kon een gebied niet beoordeeld worden,
dan is dat `nvt` met een toelichting: dát het niet kon is precies de informatie die een
lopende onderbouwing weglaat.

Een bevinding hangt aan een gebied via het **id** van de finding, nooit via de code: `V001`
wordt `B00x` bij akkoord (`lib/deelgebieden.ts`, `lib/finding-code.ts`).

## De onderbouwing hoort kort te zijn

In `reden` staat of de meting geldig was en wat de agent zag dat het commando niet ziet:
de afwegingen bij grensgevallen. Niet wat de meting al telde, niet de opsomming van wat in
orde was (dat zijn de deelgebieden), niet de afkeuring (die staat in de bevinding). Dit
staat als stap "Wegschrijven" in de regelbestanden en in `CLAUDE.md`.

## Gevolgen

- Een kaart voor een criterium dat gewoon voldoet is een paar regels lang.
- De onderzoeker kan zelf een deelgebied aan de regels toevoegen, met het veld "Aan de regels
  toevoegen" onder de gebiedenlijst. Dat schrijft naar het regelbestand; vanaf dat moment
  moet elke agent dat gebied aflopen, in elk project. Bestaande oordelen krijgen er een
  open ring bij; hun akkoord blijft staan, want dat gold voor de tekst die er lag.
- Oordelen van vóór 23 augustus 2026 hebben geen gebieden vastgelegd. De kaart zegt dan
  "niet apart vastgelegd" en niet "nog niet nagelopen": dat laatste is een bewering die we
  niet kunnen waarmaken.
