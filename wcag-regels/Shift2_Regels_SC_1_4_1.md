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
