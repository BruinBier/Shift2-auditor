# Shift2-beoordelingsregels SC 1.3.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_3_3.md` als ze elkaar tegenspreken.

## Regels

- Verwijzing naar een UI-element via zijn NAAM of label ("via de knop melding zorg") is CORRECT en geen bevinding, ook als er "knop", "link" of "icoon" voor staat.
- Alleen afkeuren bij verwijzingen die uitsluitend op vorm, kleur, locatie of geluid leunen: "klik op de groene knop", "gebruik het icoon rechtsboven".

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Een aanwijzing leunt niet alleen op vorm, plek of geluid

### In het kort

Staat er op de pagina een instructie of verwijzing, dan moet die ook te volgen zijn voor
wie de vorm, de grootte, de plek op het scherm, de richting of een geluid niet kan
waarnemen. "Klik op de ronde knop" of "gebruik het icoon rechtsboven" is alleen te volgen
voor wie kijkt; "klik op de knop Verzenden" is voor iedereen te volgen.

Verwijzen via de naam of het label van een element is altijd goed, ook als er "knop",
"link" of "icoon" voor staat. Het gaat om aanvullen, niet om weglaten: een vorm of plek
noemen mag, zolang de naam er ook bij staat. Kleur valt hier niet onder; dat is 1.4.1.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de tekst

1. [agent] Zoek in de tekst van de pagina naar instructies en verwijzingen naar andere
   onderdelen: "klik op", "gebruik", "zie", "via de knop", "in het menu", "hieronder",
   "rechts", "links", "bovenaan". Neem ook de teksten bij formuliervelden en de foutmeldingen
   mee.
2. [agent] Kijk per verwijzing waarop ze leunt: vorm, grootte, plek op het scherm, richting
   of geluid. Staat er daarnaast de naam of het label van het element, dan is het in orde.
   "Hierboven" en "hieronder" zijn goed als de bedoelde inhoud ook direct ervoor of erna
   staat.

#### Stap 2 — Symbolen

3. [agent] Zoek symbolen die informatie overbrengen zonder tekst: een vinkje of kruisje bij
   een status, een pijl die een richting aangeeft, een woordenwolk waar de grootte van een
   woord het belang aangeeft. Kijk of dezelfde informatie ook ergens als tekst staat.

#### Stap 3 — Wegen

4. [jij] Weeg de twijfelgevallen. Een verwijzing naar de naam van een element is geen
   bevinding, ook niet met "knop" of "icoon" ervoor. Alleen een verwijzing die uitsluitend op
   vorm, plek, richting of geluid leunt is een afkeuring; een symbool zonder tekstuele
   tegenhanger ook.

#### Stap 4 — Wegschrijven

5. [agent] Noteer in `reden` welke instructies en verwijzingen je hebt gevonden en waarop
   ze leunen. Zijn er geen instructies of verwijzingen, zeg dan waar je hebt gezocht: dat
   is het verschil tussen "niet aanwezig" en "niet gekeken".

### Zo is het vastgesteld

Voor dit criterium bestaat geen meting; een commando kan niet lezen of een zin een
aanwijzing is. De agent werkt met de tekst van de pagina zoals die na de JavaScript in de
browser staat en met de schermafdruk, en loopt de instructies en verwijzingen daarin zelf
na. Op de homepage horen header en footer erbij, op andere pagina's alleen de hoofdinhoud.

Wat daarbuiten valt: tekst die pas na een klik verschijnt, zoals een uitklapblok of een
volgende formulierstap. Daarvoor moet de agent in de auditsessie zelf klikken en opnieuw
kijken.
