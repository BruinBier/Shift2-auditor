# Shift2-beoordelingsregels SC 1.4.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_1.md` als ze elkaar tegenspreken.

## De vraag

Is kleur de **enige** manier waarop informatie wordt overgedragen? Zo ja, dan is dat een
afkeuring. Staat de informatie er ook op een andere manier (tekst, vorm, positie, onderstreping,
arcering), dan voldoet het.

Dit gaat puur over de visuele presentatie. Het staat los van wat een schermlezer met de pagina
kan; dat loopt via 1.1.1 en 1.3.1.

## Ook toetsbaar bij een ONGETAGDE PDF

Anders dan 1.1.1, 1.3.2, 1.4.5 en 2.4.4 vervalt 1.4.1 **niet** bij een PDF zonder tags. De reden
staat in `Shift2_Regels_SC_1_3_1.md`:

- **1.4.5** heeft tags nodig, want de vraag is wat er als afbeelding is *aangemerkt* — een
  eigenschap van de code.
- **1.4.1** heeft ze niet nodig, want de vraag is of kleur de enige drager is. Wie kleurenblind
  is loopt daar visueel tegenaan, ongeacht de tagstructuur.

Geef dus een echt oordeel: `voldoet` of `afgekeurd`. Zet 1.4.1 niet op `niet_te_bepalen` met
"geen tags" als reden.

Vastgelegd door Frits op 2026-08-04 bij BEV-03.

## Wat wél een afkeuring is

- **Grafiek of diagram waarvan de segmenten alleen via de legendakleur te herleiden zijn**, dus
  zonder labels of percentages bij de segmenten zelf. Extra reden tot afkeuring als twee tinten
  van dezelfde kleur naast elkaar staan die nauwelijks verschillen.
- **Link die alleen aan de kleur te herkennen is**, zonder onderstreping of ander verschil met
  de omringende tekst.
- **Statusaanduiding uitsluitend met kleur** (rood = fout, groen = goed) zonder tekst of icoon.
- **Verplichte velden alleen met een kleur gemarkeerd**, zonder sterretje of woord.

Er is een QuickFinding voor de PDF-variant: "PDF - grafieken en diagrammen enkel afhankelijk van
kleur" (1576c63f), impact **klein**, responsibility **ontwerper**. Gebruik die tekst en vul de
paginanummers en grafieknamen in; ga niet zelf herformuleren.

## Wat GEEN bevinding is

- **Kleur als extra ondersteuning** naast tekst of vorm. Een rode knop met het woord
  "Verwijderen" erin voldoet gewoon.
- **Decoratief kleurgebruik** dat geen informatie draagt.

## LET OP: de kaarten-uitzondering geldt NIET voor 1.4.1

Kaarten hebben een uitzondering bij **1.1.1** en **1.4.5**, en die is er niet voor niets: de
visuele complexiteit van een geografische kaart is niet in een kort tekstalternatief te vangen.
Voor 1.1.1 volstaat een beschrijving van het doel ("Hittekaart van Beverwijk met
temperatuurzones"), mits de belangrijkste gegevens elders als tekst staan.

Bij **1.4.1 bestaat die uitzondering niet**. De regel is universeel: gebruik je kleur om
informatie over te dragen, dan moet er een alternatief zijn voor wie die kleur niet kan zien.

Het verschil zit in wat je afkeurt:

- **Niet** afkeuren: dat de kaart als geheel niet in tekst is uitgeschreven. Dat valt onder de
  uitzondering.
- **Wel** afkeuren: dat de legenda en de bijbehorende zones alleen aan hun kleur te herkennen
  zijn. Een rood en een oranje bolletje zijn voor iemand met protanopie nagenoeg gelijk.

Oplossing die je adviseert: zet letters of cijfers in de legendabolletjes én op de kaartvlakken
zelf, of plaats de waarde als tekstlabel in het vlak.

Vastgelegd door Frits op 2026-08-04 bij BEV-03. Claude trok eerst de 1.1.1-uitzondering door
naar 1.4.1 en liet de hittekaart op pagina 19 van de Groenvisie vallen; Frits corrigeerde dat.

## Advies

Bij een grafiek: noem beide oplossingen als losse mogelijkheden, niet als één opdracht.

> Dit is op te lossen door naast kleur ook bijvoorbeeld arcering te gebruiken. Ook kun je de
> percentages bij de segmenten zelf zetten, zodat de verdeling af te lezen is zonder de legenda
> erbij te halen.

De twee werken verschillend: arcering maakt de segmenten onderling te onderscheiden maar je moet
nog steeds naar de legenda; percentages bij de segmenten maken die koppeling overbodig. Elk van
beide lost het probleem op.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Kleur is nergens de enige drager van informatie

### In het kort

Overal waar kleur iets zegt — dit is een link, dit veld is verplicht, dit segment hoort bij
die legenda — moet dat ook zonder kleur te zien zijn: onderstreping, een woord, een icoon,
een vorm, een plek. Kleur als extra is prima; kleur alleen niet.

De vraag die het vaakst misgaat: een link in lopende tekst die alleen blauw is. Een link in
een menubalk, een kaart of een footerlijst hoeft niet onderstreept: daar is de plek het
kenmerk, en dan schrijf je dát op.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Links

1. [agent] Zoek elke link die in lopende tekst staat: in een alinea of lijstitem met gewone
   tekst eromheen. Lees uit de opgemaakte pagina of hij onderstreept is of een ander verschil
   heeft dan alleen de kleur. Alleen kleur is een afkeuring (F73), tenzij hij 3:1 tegen de
   omringende tekst haalt én bij hover en focus iets anders krijgt dan een kleur (G183).
2. [agent] Benoem apart de links buiten lopende tekst — menu, kaarten, footer, knoppen — en
   schrijf op waaraan ze daar herkenbaar zijn: de menubalk, de kaart, de lijst, de knopvorm.
3. [agent] Lees van de niet-onderstreepte links de hover- en focustoestand uit. Een focus die
   alleen van kleur verandert is niet genoeg; een rand of onderstreping wel.

#### Stap 2 — De rest van de pagina

4. [agent] Formulieren: staan verplichte velden en foutmeldingen er ook in woorden of met een
   teken, of alleen in rood?
5. [agent] Statusaanduidingen en pictogrammen: groen/rood, aan/uit, open/gesloten — is er
   tekst of een vorm naast de kleur?
6. [agent] Geselecteerde toestand: het actieve menu-item, het open tabblad, de huidige
   pagina in een paginering, de gekozen filterknop, de huidige stap in een formulier, de
   gekozen datum in een kalender. Vergelijk de opmaak van het gekozen item met die van de
   andere items in dezelfde groep. Verschilt alleen de kleur, en niet het lettergewicht, een
   onderstreping, een rand, een pictogram of de tekst, dan is kleur de enige drager. Maak
   een opname zonder kleur met `get-screenshot --zicht=grijs --voor=1.4.1`: is daarop nog
   te zien welk item actief is, dan is het in orde. Staat er op de pagina niets met een
   gekozen toestand, dan is dit gebied `nvt`; op een homepage is dat meestal zo.
7. [jij] Grafieken, diagrammen en kaarten met een legenda: zijn de vlakken ook zonder de
   legendakleur te herleiden (labels, arcering, letters)? De kaarten-uitzondering van 1.1.1
   geldt hier niet. Dit geldt ook voor de PDF's uit de steekproef, tags of geen tags.

#### Stap 3 — Vastleggen

8. [agent] Stuur de zeven deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
9. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

Er is nog geen eigen meetcommando voor 1.4.1. Wat er wel is: `get-html` voor de links en de
tekst eromheen, de full-page opname van `get-screenshot` om te zien wat onderstreept is en
wat in een kaart of menu staat, en een uitsnede per element met `--selector` en `--voor=1.4.1`.
De hover- en focustoestand leest de agent uit in de auditsessie.

Met `get-screenshot <url> --zicht=grijs --voor=1.4.1` komt er een opname zonder kleur: de
browser tekent de pagina zoals iemand met achromatopsie hem ziet. Dat is de proef die het
criterium stelt. Alles wat op die opname nog te onderscheiden is, hangt niet van kleur af;
wat erop wegvalt, wel. `rood`, `groen` en `blauw` geven de opname met protanopie,
deuteranopie en tritanopie. Zet de hoogcontrastknop hier niet aan: die haalt de kleur weg
en verbergt daarmee precies wat je zoekt.

Wat hier niet uit blijkt: of een grafiek in een PDF zonder de legenda te lezen is. Dat kijkt
de onderzoeker na.

### Deelgebieden

1. Links in lopende tekst: onderstreept of anders dan alleen door kleur te herkennen
2. Links buiten lopende tekst: menu, kaarten, footer en knoppen
3. Hover en focus: de verandering is niet alleen een andere kleur
4. Formulieren: verplichte velden en foutmeldingen
5. Statusaanduidingen en pictogrammen met kleurcodering
6. Grafieken, diagrammen, kaarten en legenda's, ook in de PDF's uit de steekproef
7. Geselecteerde toestand: actief menu-item, open tabblad, huidige pagina, gekozen filter of stap is niet alleen aan kleur te herkennen

> Vastgelegd op 2026-09-12 bij ZOET-01: 1.4.1 had geen deelgebieden, en Frits miste ze op de
> kaart. Zijn eerste voorbeeld was gebied 1. Zet uitleg bij deze lijst altijd als blokcitaat:
> een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
>
> Gebied 7 is van 2026-09-13. De checks uit de RAMP-video over 1.4.1 lagen naast deze lijst;
> "selected states" ontbrak. Een actief menu-item dat alleen een andere kleur heeft, is het
> geval dat het vaakst misgaat, en geen van de zes gebieden vroeg ernaar.
