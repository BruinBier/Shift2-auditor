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

- **Kaarten met een kleurverloop en getallen in de legenda**, zoals een hittekaart met
  temperatuurklassen. Kaarten vallen onder de wettelijke uitzondering voor de overheid, en een
  verloop van koel naar warm is een betekenisvolle weergave, geen willekeurige codering. Zie de
  kaarten-uitzondering bij 1.1.1.
- **Kleur als extra ondersteuning** naast tekst of vorm. Een rode knop met het woord
  "Verwijderen" erin voldoet gewoon.
- **Decoratief kleurgebruik** dat geen informatie draagt.

## Advies

Bij een grafiek: noem beide oplossingen als losse mogelijkheden, niet als één opdracht.

> Dit is op te lossen door naast kleur ook bijvoorbeeld arcering te gebruiken. Ook kun je de
> percentages bij de segmenten zelf zetten, zodat de verdeling af te lezen is zonder de legenda
> erbij te halen.

De twee werken verschillend: arcering maakt de segmenten onderling te onderscheiden maar je moet
nog steeds naar de legenda; percentages bij de segmenten maken die koppeling overbodig. Elk van
beide lost het probleem op.
