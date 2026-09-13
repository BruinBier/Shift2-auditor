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

## De meet-browser moet Nederlandse woorden kunnen afbreken

Chrome breekt woorden met `hyphens: auto` alleen af als het afbreekwoordenboek van die taal
in het profiel staat (`hyphen-data/<versie>/hyph-nl.hyb`). Dat onderdeel haalt Chrome op de
achtergrond binnen, per profiel, en in het auditprofiel was dat nooit gebeurd. Zonder
woordenboek is een lang woord onbreekbaar, en in een grid of flexbox wordt de kolom dan zo
breed als dat woord: `overflow-wrap: break-word` telt daar niet mee, alleen `anywhere`.
Het gevolg ziet er precies uit als een reflow-fout: een titel die buiten beeld loopt.

Aanleiding: bo.zoetermeer.nl (2026-09-12). "Volkshuisvestingsprogramma" leek in twee
kaarten afgekapt op 320 pixels; de gridkolom was 361 pixels breed in een venster van 320.
Frits zag het in zijn eigen Chrome niet, want die heeft het woordenboek. Met de woordenboeken
in het auditprofiel breken de titels af en passen alle drie de kaarten. De afkeuring
bestond alleen in de meet-browser.

Sinds 2026-09-13 kopieert `npm run chrome:debug` de woordenboeken uit het gewone
Chrome-profiel als het auditprofiel ze mist; dat geldt ook voor de Chrome die de workflow
zelf start. Zie je toch een lang woord dat buiten een kaart loopt terwijl de titel
`hyphens: auto` heeft, controleer dan eerst of `hyph-nl.hyb` in het auditprofiel staat
voordat je afkeurt.

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

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

De pagina past op 320 pixels zonder schuiven en zonder verlies

### In het kort

Wie ver inzoomt krijgt de pagina op 320 pixels breed te zien. Dan moet alles nog passen
zonder horizontaal te schuiven, en er mag geen inhoud of functie wegvallen: een menu dat
niet meer opengaat is verlies van functionaliteit. Een brede tabel in een vak dat zelf
schuift is toegestaan.

Dit is een meting, geen inschatting. "Lijkt responsive" is geen onderbouwing, en de meting
moet echt op 320 staan, niet op 305 door een schuifbalk. Bij een PDF is dit criterium niet
van toepassing.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-reflow <url>`: het venster op 320 CSS-pixels, de pagina opnieuw geladen, en
   gemeld of er iets breder wordt dan het venster. Controleer `vensterbreedte`: 320, niet
   minder. Een eerdere hoogcontrastinstelling eerst uitzetten.
2. [meting] `get-screenshot <url> --breedte=320 --klik="tekst:MENU"`: klapt het hoofdmenu
   samen tot een knop, dan hoort dit erbij. Gaat het open en staan alle items erin?

#### Stap 2 — Beoordelen

3. [agent] Bekijk de opname, ook als de meting nul te brede elementen meldt. Het getal vindt
   overschrijding, het beeld vindt verlies: overlappende of afgeknipte tekst.
4. [agent] Vergelijk met de brede weergave: is er inhoud verdwenen door een mediaquery?
5. [agent] Wat in `in_een_schuivend_of_afgeknipt_vak` staat: een brede tabel in een schuivend
   vak is toegestaan, inhoud in een dichtgeklapt blok staat niet in beeld. Geen afkeuring.
6. [jij] Een formulierstap achter een sessie: `get-reflow` komt op stap 1 uit. Vul het
   formulier tot die stap in de auditsessie en zet dan het venster op 320.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vijf deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-reflow` zet het venster op 320 CSS-pixels, laadt de pagina opnieuw en meldt welke
elementen breder zijn dan het venster, met een schermafdruk. `get-screenshot --breedte=320
--klik` toont of het uitklapmenu op die breedte werkt.

Wat hier niet uit blijkt: inhoud die wegvalt zonder overloop, overlappende tekst en een
menu dat niet opengaat. Daarvoor kijkt de agent naar de opname en klikt hij. Een
formulierstap achter een sessie blijft werk voor de onderzoeker.

### Deelgebieden

1. Geen horizontaal schuiven op 320 pixels, gemeten met vensterbreedte 320
2. Geen inhoud weggevallen ten opzichte van de brede weergave
3. Functionaliteit werkt op 320 pixels: het uitklapmenu gaat open en bevat alle items
4. Geen overlappende of afgeknipte tekst op de opname
5. Tweedimensionale inhoud zoals tabellen in een schuivend vak: toegestaan, wel bekeken

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
