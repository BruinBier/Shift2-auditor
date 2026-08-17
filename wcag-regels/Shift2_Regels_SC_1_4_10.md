# Shift2-beoordelingsregels SC 1.4.10

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_10.md` als ze elkaar tegenspreken.

## Niet uit HTML of een schermafdruk te bepalen — maar wel te meten

Reflow is meetbaar: zet het venster op 320 CSS-pixels — 400% zoom op een scherm van 1280 —
en kijk of de pagina horizontaal moet schuiven. Doe dat zelf. Vul geen "voldoet" of "lijkt
responsive" in zonder gemeten te hebben, en zet het criterium niet standaard op
`niet_te_bepalen`.

```
npm run cli -- get-reflow <url>
```

Dat zet de breedte, laadt de pagina daarna opnieuw zodat mediaqueries en scripts die op de
beginbreedte reageren die smalle breedte ook zien, en meldt of de pagina breder wordt dan het
venster. Er komt altijd een schermafdruk uit.

### Controleer dat je op 320 meet en niet op 305

Een verticale schuifbalk pikt ongeveer 15 pixels af. Kijk daarom in het antwoord naar
`vensterbreedte`: staat daar 320, dan is het goed. Staat er minder, dan test je te smal en kan
een pagina ten onrechte lijken te breken.

### Zet een eerdere hoogcontrastinstelling eerst uit

Die blijft in localStorage staan. Meet je in een auditsessie na een contrasttest, dan meet je
de hoogcontrastweergave in plaats van de gewone. Headless heeft dat probleem niet: dat begint
elke keer schoon. Het antwoord meldt in welke van de twee je zat.

### Bekijk de schermafdruk, ook als de meting schoon is

"Nul elementen te breed" bewijst niet dat er niets is weggevallen. Het getal vindt
overschrijding, het beeld vindt verlies.

Drie dingen die deze meting NIET dekt. Kun je die niet vaststellen, zet het criterium dan op
`niet_te_bepalen` met een concrete vraag; laat het nooit stilzwijgend op "voldoet" staan.

- **Inhoud die verdwijnt** door `display: none` in een mediaquery. Dat geeft geen overloop,
  maar de gebruiker mist wel informatie. Vergelijk daarvoor met de brede weergave.
- **Functionaliteit die stukgaat** op smal scherm: een uitklapmenu dat niet meer opengaat, een
  schuifbalk die vastloopt. Dat vergt interactie, niet alleen meten — maar wél te doen:

  ```
  npm run cli -- get-screenshot <url> --breedte=320 --klik="tekst:MENU"
  ```

  Dit hoort BIJ 1.4.10 en niet bij 2.1.1. De eis is dat de inhoud past zonder verlies van
  informatie én functionaliteit; gaat het menu op 320 pixels niet open, dan is dat verlies
  van functionaliteit op die breedte. Of datzelfde menu ook met het toetsenbord te bedienen
  is, is de aparte vraag van 2.1.1 — die geldt op elke breedte.

  Klapt het hoofdmenu samen tot een knop, controleer dan of het uitklapmenu alle navigatie
  van het brede scherm bevat. Aanleiding: 1.4.10 op heuvelrug.nl. Ik schreef eerst dat de
  bedienbaarheid van dat menu "onder toetsenbordtoegankelijkheid valt, niet onder reflow" en
  liet het daarbij; Frits haalde die zin eruit. Getoetst blijkt het menu te openen met alle
  zeven items erin.
- **Overlappende of afgeknipte tekst.** Daarvoor moet je de schermafdruk werkelijk bekijken.

### Wat geen bevinding is

Twee dingen worden apart geteld in `in_een_schuivend_of_afgeknipt_vak`, zodat zichtbaar blijft
dat er iets is en niet dat er niets was.

Een brede tabel in een vak met `overflow-x: auto` is de toegestane oplossing voor inhoud die
een tweedimensionale opmaak nodig heeft; 1.4.10 zondert die uitdrukkelijk uit. En inhoud in
een dichtgeklapt uitklapblok heeft nog wel afmetingen maar staat niet in beeld.

Steekt een element uit zonder dat de pagina schuift, dan loopt het onzichtbaar over — vaak een
negatieve marge. Dat is op zichzelf geen afkeuring, maar controleer op de schermafdruk of er
inhoud wegvalt.

Aanleiding: buitenspelen op heuvelrug.nl meldde 304 te brede elementen terwijl er op het
scherm niets uitsteekt; die tabellen zitten in twee dichtgeklapte uitklapblokken.

## Een pagina achter een formulier meet je niet met get-reflow

Bij een formulier met stappen heeft elke stap een eigen adres, maar kom je er alleen als de
vorige stap is ingevuld. Vraag je zo'n adres los op, dan sta je weer bij stap 1 — en dan meet
je die pagina, onder de naam van de stap die je dacht te meten. De CLI meldt dat in het veld
`omgeleid`; zie `Shift2_Scope_Per_Sample.md`.

Voor zulke samples geldt dus nog steeds `niet_te_bepalen`, met een vraag die zegt wat er
gedaan moet worden:

> Kun je het formulier tot [stap] invullen en dan het venster op 320px zetten? Werkt alles
> zonder horizontaal schuiven, en valt er geen inhoud weg? Let bij een formulier extra op de
> invoervelden, de knoppen onderaan en een eventuele voortgangsbalk.

Dat is niet dezelfde vraag als de gewone reflow-vraag. Een formulierstap heeft eigen risico's:
velden met een vaste breedte, knoppen naast elkaar, en een voortgangsbalk met stapnamen.

## Regels

- Meet zelf op 320 CSS-pixels. Lukt de test niet (site achter login, pagina laadt niet, of het
  adres leidt door), zet 1.4.10 dan op `niet_te_bepalen` met de vraag voor de onderzoeker:
  "Kun je [pagina] checken op 320px breedte? Werkt alles zonder horizontaal schuiven, en valt
  er geen inhoud weg?"
- NOOIT concluderen uit CSS alleen of uit een schermafdruk op volle breedte. Een CMS kan
  responsive ogen en toch op 320px breken.
- "Waarschijnlijk OK" of "lijkt responsive" is geen geldige onderbouwing.
- Bij PDF-samples is 1.4.10 niet van toepassing.
- Bij PDF-samples is 1.4.10 niet van toepassing.
