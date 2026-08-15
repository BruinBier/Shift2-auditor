# Shift2-beoordelingsregels SC 1.4.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_3.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen — maar wel te meten

Dit criterium is niet uit de opgehaalde code te halen: kleuren staan in externe
opmaakbestanden, vaak achter variabelen, en een knop erft zijn achtergrond meestal van een
ouder. Het is wél te meten op de opgemaakte pagina, en dat hoor je te doen voordat je er
een vraag van maakt:

```
npm run cli -- get-contrast <url> --selector='button.contrast'
npm run cli -- get-contrast <url> --selector='button.contrast' --klik="tekst:Contrast verhogen"
```

Dat geeft tekstkleur, achtergrondkleur, lettergrootte, de verhouding en of die haalt wat
nodig is. **Meet op het element dat de tekst zelf bevat**, niet op een omhulsel: een `<a>`
met een `<span>` erin heeft vaak een andere kleur dan de span die je ziet.

Voor "blijven de logo's leesbaar in de hoogcontrastweergave" maak je twee uitsneden van
hetzelfde element, met en zonder de knop aan:

```
npm run cli -- get-screenshot <url> --selector='<logo-selector>'
npm run cli -- get-screenshot <url> --selector='<logo-selector>' --klik="tekst:Contrast verhogen"
```

**Noteer in de onderbouwing hóé je hebt gemeten**: welk element, welke kleuren als
#RRGGBB, welke lettergrootte, welke verhouding, en in welke weergave. Zonder dat is het
opnieuw een bewering.

Blijft er iets over dat je niet kunt meten — of de weergave inhoudelijk deugt op de hele
site, of een afbeelding met tekst nog leesbaar is naar het oordeel van een mens — zet dat
dan als vraag in `reden` en het criterium op `niet_te_bepalen`.

Aanleiding: heuvelrug.nl (2026-08-15). De vraag stond als `niet_te_bepalen` klaar voor de
onderzoeker terwijl hij te meten was. De knop is wit op #007373, 5,68:1 bij 4,5:1 vereist;
in de hoogcontrastweergave wit op zwart, 21:1. Die weergave ontkleurt en keert niet om, dus
de logotekst houdt zijn helderheid en blijft leesbaar. Er is op die site geen footer-logo.

## Vraag ook: blijven logo's en afbeeldingen leesbaar IN de hoogcontrastweergave?

De hoogcontrastweergave geldt als alternatief voor de standaardversie, maar dan moet die
weergave zelf wel deugen. Een afbeelding met tekst erin (logo, banner, knopafbeelding) kan
in die modus juist onleesbaar wórden, doordat de omkering naar zwart-wit de tekst laat
wegvallen tegen de achtergrond.

Vraag de onderzoeker daarom niet alleen naar de knop, maar ook: **blijven de logo's en
afbeeldingen met tekst leesbaar als de hoogcontrastweergave aan staat?** Let vooral op het
logo in de footer en op knop- of banner-afbeeldingen.

Is zo'n afbeelding in de hoogcontrastweergave onleesbaar: **AFKEURING** onder 1.4.3
(impact matig, responsibility redacteur). De gebruiker die deze weergave nodig heeft omdat
de standaardversie te weinig contrast biedt, kan de tekst dan helemaal niet lezen.

Advies: zorg dat de afbeelding meeschakelt met de hoogcontrastweergave. Staat elders op de
pagina een logo dat het wél goed doet (vaak het header-logo, dat meestal een SVG is), verwijs
daar dan naar als referentie.

Let op het verschil met de uitzondering hieronder. Daar gaat het om tekst in een afbeelding
die NIET meeschakelt en daarom in de standaardversie op contrast getoetst moet worden. Hier
schakelt de afbeelding juist wél mee, maar met een onleesbaar resultaat.

Aanleiding: duurzaam.beverwijk.nl (2026-07-28). Het footer-logo is een PNG die door een
redacteur in de footertekst is geplaatst en in de hoogcontrastweergave volledig zwart wordt;
de tekst "gemeente beverwijk" valt weg. Het header-logo (SVG) schakelt wel correct mee.
Bevinding B006 in BEV-03.

## Regels

- Heeft de site een hoogcontrast-knop of toegankelijkheidsmenu met hoog-contrast-optie? Dan wordt de standaardversie niet meer inhoudelijk op contrast getoetst, mits die knop zelf voldoende contrast heeft. Meet dat met get-contrast; het hoeft niet meer aan de onderzoeker gevraagd te worden.
- Bij bevestiging "knop heeft voldoende contrast": een opmerking op het homepage-sample (status resolved, impact en responsibility leeg), QuickFinding 0dd88736-4c57-421b-b45c-af8fd46cfc38. Daarna HTML-paginas niet meer inhoudelijk op 1.4.3 checken.
- UITZONDERING: tekst IN een afbeelding (poster, infographic, banner) schakelt NIET mee met de hoogcontrast-knop. Die toets je WEL op 1.4.3, ook op paginas waar je de reguliere contrastcheck overslaat. Toets aan 4,5:1 (niet 3:1), want bij een afbeelding is de font-size niet uitleesbaar en kun je niet vaststellen of het als grote tekst telt.
- Staat de informatie van de afbeelding VOLLEDIG als echte tekst op de pagina, dan is de afbeelding niet meer de enige drager en valt de tekst-in-afbeelding onder een 1.4.3-uitzondering. Is het alternatief incompleet, dan blijft de contrasteis gelden.
- PDF-documenten: 1.4.3 wel per stuk inhoudelijk checken. De hoogcontrast-knop op de website geldt niet voor PDFs.
- Noteer gemeten kleuren als #RRGGBB met de contrastverhouding erbij.
