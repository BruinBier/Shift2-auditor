# Shift2-beoordelingsregels SC 3.2.4

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_2_4.md` als ze elkaar tegenspreken.

## Waar de norm zelf nog onduidelijk is

Bij het W3C loopt issue **#5225** ("3.2.4 Consistent Identification: ambiguities in the
Understanding document require clarification"). Het benoemt vijf onduidelijkheden die ook bij
onze beoordelingen spelen:

1. **Consistent versus identiek.** De Understanding-tekst zegt bij het ene voorbeeld dat labels
   "consistent, niet identiek" hoeven te zijn, en rekent bij het andere voorbeeld synoniemen
   als "zoeken" en "vinden" juist af. Waar de grens ligt, staat er niet.
2. **Geldt het binnen één pagina?** Het criterium spreekt van een "set webpagina's". Of
   herhaalde onderdelen bínnen één pagina eronder vallen, is niet uitgesproken.
3. **Zelfde functie of zelfde betekenis?** De definitie gaat over "hetzelfde resultaat bij
   gebruik", maar een voorbeeld behandelt een niet-interactief vinkje. Onduidelijk of statische
   beelden meetellen.
4. **Programmatisch of visueel?** De nadruk ligt op de toegankelijke naam, terwijl juist
   gebruikers met een cognitieve beperking op herkenbare iconen en patronen varen.
5. **Wat is een "component"?** De term is niet gedefinieerd.

Praktische lijn zolang dat zo is: beoordeel 3.2.4 **over de samples heen**, op onderdelen die
op meerdere pagina's terugkomen en dezelfde functie hebben. Twijfel je of iets binnen dit
criterium valt, meld het dan als open vraag in plaats van het stil te laten vallen.

## Zo meet je het

De stappen die je in deze volgorde afloopt staan onderaan dit bestand, onder "Werkwijze".

```
npm run cli -- get-consistentie <projectId>
```

Dat legt de pagina's van de steekproef naast elkaar en vergelijkt per onderdeel de
toegankelijke naam. Links worden gekoppeld op hun bestemming — de sterkste sleutel die er is —
knoppen op hun id of sjabloonklasse, en beide alleen binnen hetzelfde deel van de pagina
(header, navigatie, main, footer). Dat laatste is nodig omdat het logo en "Home" in het
kruimelpad allebei naar de startpagina gaan zonder hetzelfde onderdeel te zijn.

Naast de naam wordt ook het **icoon** vergeleken. Een icoon staat vrijwel altijd op
`aria-hidden` en valt dus buiten de toegankelijke naam, terwijl juist wie op herkenbare
beelden vaart in de war raakt als het per pagina verschilt; dat is punt 4 hierboven.
Vergeleken wordt waaraan het icoon te herkennen is: de bestandsnaam, de vorm van de svg of de
klasse van een icoonlettertype. Twee verschillende bestanden kunnen hetzelfde vergrootglas
tonen, dus dit is een signaal en geen bewijs.

Het overzichtsbestand bevat een **matrix**: onderdelen in de rijen, pagina's in de kolommen,
per vakje het nummer van de naamvariant en een punt waar het onderdeel ontbreekt. Daarin zie
je in één blik of een afwijking op één pagina zit of op de helft, en waar iets helemaal niet
staat.

Het commando scheidt twee dingen die er in de uitkomst hetzelfde uitzien:

- **anders benoemd tussen pagina's** — dat is 3.2.4
- **anders benoemd binnen één pagina** — dat valt er volgens de regel hierboven buiten, en
  staat apart in de uitvoer

Wat er niet in kan: of "Zoeken" en "Zoek" werkelijk van elkaar verschillen in de zin van dit
criterium. Dat is punt 1 hierboven en blijft een oordeel. Het commando zet ze naast elkaar met
de pagina's erbij.

Aanleiding: UTHEU-02 (2026-08-20). Alle twintig kaarten stonden op een oordeel zonder één
vergelijking eronder, negen ervan met een redenering bínnen één pagina. De eerste meting over
achttien pagina's leverde vier onderdelen op die niet overal hetzelfde heten, waaronder het
logo in de header.

## Waar het oordeel thuishoort

Op het homepage-sample, net als de andere sitebrede onderdelen (zie `Shift2_Scope_Per_Sample.md`).
Op de overige samples komt 3.2.4 op `niet_aanwezig` met als reden dat het sitebreed is
beoordeeld. Een oordeel per pagina is bij dit criterium geen onnauwkeurigheid maar een
categoriefout: aan één pagina is consistentie niet te zien.

## Regels

- REDACTIONELE LINKS IN DE LOPENDE TEKST VALLEN NIET ONDER 3.2.4. Het criterium gaat over
  onderdelen die op meerdere pagina’s worden herhaald: navigatie, zoekvelden, knoppen uit het
  sjabloon, terugkerende iconen. Een link die een redacteur midden in een zin zet is geen
  herhaald onderdeel, ook niet als hij toevallig naar dezelfde pagina wijst als een link in
  een zin op een andere pagina. Zolang de linktekst in zijn context duidelijk is, is variatie
  in formulering toegestaan en zelfs wenselijk; dat is 2.4.4-terrein, niet 3.2.4.

  Dit is de zwakke plek in `get-consistentie`: dat koppelt links op hun bestemming
  binnen hetzelfde paginadeel, en `main` is geen sjabloon maar redactionele ruimte. Drie zinnen op
  drie pagina’s die naar /melden verwijzen komen daar als één onderdeel met drie namen uit.
  Weeg dus altijd of het werkelijk om een herhaald onderdeel gaat voordat je afkeurt.

  Vastgelegd na overleg op 2026-08-22, naar aanleiding van UTHEU-02: de meting meldde
  /melden, meldingen.heuvelrug.nl en /zeven-pluspunten als afwijkend benoemd; alle drie zijn
  redactionele links en alle drie afgewezen. Het logo in de header blijft wel een onderdeel:
  dat komt uit het sjabloon en staat op elke pagina.

- EEN VERSCHIL DAT ALLEEN UIT EEN APART SJABLOON KOMT IS GEEN 3.2.4-AFKEURING. Een pagina die
  bij een eigen applicatie hoort — een formulier, een portaal, een boekingsmodule — draagt
  zijn eigen header en footer. Dat het logo daar anders heet volgt uit twee systemen naast
  elkaar, niet uit inconsistente naamgeving binnen één sjabloon. Meld dat niet als 3.2.4.

  Let op de reikwijdte van deze regel: hij geldt voor een verschil dat uítsluitend uit het
  andere sjabloon voortkomt. Heet hetzelfde onderdeel bínnen één sjabloon op de ene pagina
  anders dan op de andere, dan is dat wél 3.2.4 — ook bij een logo.

  Te herkennen aan: zo’n pagina deelt vrijwel geen onderdelen met de rest van de steekproef.
  Bij UTHEU-02 had het contactformulier 6 onderdelen tegen 29 tot 42 op de andere pagina’s.

  Wat er wél toe doet is of de naam op zichzelf deugt. Bij heuvelrug.nl komt de naam van het
  logo op vijftien pagina’s alleen uit `title` bij een leeg `alt`; dat is een 2.4.4-afkeuring
  en een 1.1.1-bevinding, en die blijven staan ongeacht wat 3.2.4 hiervan vindt.

  Vastgelegd door Frits op 2026-08-22 bij UTHEU-02.

- NIET-GETAGDE PDF: zet 3.2.4 op niet_te_bepalen. Zonder tags zijn er geen programmatisch
  herkenbare onderdelen waarvan de identificatie te vergelijken valt. Dat de opmaak er
  visueel consistent uitziet (genummerde koppen volgens een vast schema, tabellen met
  doorlopende nummering, kaders met steeds dezelfde vorm) verandert dat niet. Vul hier dus
  nooit "voldoet" in. De wortel-oorzaak wordt al onder 1.3.1 afgekeurd. Zie
  `Shift2_Regels_SC_1_3_1.md` voor de volledige vervallijst. Vastgelegd door Frits op
  2026-08-02 bij UTHEU-01.
- Bij webpagina's gaat 3.2.4 over dezelfde functie die op verschillende pagina's anders wordt
  aangeduid (een zoekknop die op de ene pagina "Zoeken" heet en op de andere "Vind"). Beoordeel
  dat over de samples heen, niet binnen één pagina.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Consistente toegankelijke namen

### In het kort

Alle onderdelen met dezelfde functie moeten consistent worden geïdentificeerd — dus overal
op dezelfde manier worden benoemd.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de auditsessie

1. [meting] Loop de site door en zoek onderdelen die op meerdere pagina's voorkomen: knoppen,
   iconen, links, terugkerende formuliervelden.
2. [meting] Komen er geen onderdelen op meerdere pagina's voor, dan is deze toets niet van
   toepassing.
3. [agent] Klik erop en stel vast of ze werkelijk dezelfde functie hebben. Doen ze iets anders,
   dan mogen de namen juist verschillen.
4. [agent] Kijk ook naar wat pas na een klik verschijnt: uitklapmenu's, zoeksuggesties, stappen
   in een formulier.

#### Stap 2 — In de code

5. [meting] Lees per onderdeel de zichtbare tekst en de toegankelijke naam, en noteer waar
   die naam vandaan komt: `aria-labelledby`, `aria-label`, de tekst in het element, het `alt`
   van een afbeelding erin, of de `title`.
6. [meting] Leg ze naast elkaar: heet het onderdeel op elke pagina hetzelfde, en beweegt de
   zichtbare tekst daarmee mee?
7. [jij] Weeg of een verschil aanvaardbaar is, en voeg een afkeuring toe waar het dat niet is
   (F31).

### Zo is het vastgesteld

`get-consistentie` opent elke pagina van de steekproef in een echte browser, zodat de
JavaScript van de site heeft gedraaid. Op elke pagina verzamelt het commando alle links,
knoppen en uitklapkoppen, en koppelt die over de pagina's heen: links op hun bestemming,
knoppen op hun id of sjabloonklasse, en beide alleen binnen hetzelfde deel van de pagina.

Per onderdeel worden drie dingen uitgelezen uit de DOM: de zichtbare tekst zoals een ziende
die leest, de toegankelijke naam in de volgorde `aria-labelledby` → `aria-label` → de tekst in
het element plus het `alt` van een afbeelding erin → `title`, en waaraan het beeld te herkennen
is. Een onderdeel dat op meer dan de helft van de pagina's staat geldt als sjabloononderdeel;
daar gaat dit criterium over.

Bewaard wordt: een overzichtsbestand met de matrix van onderdelen tegen pagina's, een uitsnede
van elk onderdeel dat afwijkt, en een kopie van de afbeeldingen zoals ze op het meetmoment
waren.

Wat het commando niet ziet: onderdelen die pas na een klik verschijnen, zoals een uitklapmenu
of een stap in een formulier, en afbeeldingen met een functie die niet in een link of knop
zitten. Die loop ik zelf na in de auditsessie; dat zijn stap 3 en 4 hierboven.

## Werkwijze — het lijstje dat afgelopen wordt

> Dit staat hier en niet in een apart bestand. Twee bestanden die dezelfde procedure
> beschrijven lopen uit elkaar: toen `get-consistentie` zijn standaardgrens van twaalf
> pagina's verloor, werd dat op één van de twee bijgewerkt. Eén plek per criterium is genoeg.
>
> De korte versie hierboven onder `## Op de kaart` staat in het scherm; deze uitgebreide
> versie is voor wie de audit uitvoert.

> Het lijstje dat afgelopen wordt, in deze volgorde. Niet de regels (die staan in
> `Shift2_Regels_SC_3_2_4.md`) en niet de vakinhoud (die staat in
> `wcag-checklists/Checklist_SC_3_2_4.md`). Dit is de uitvoering.

**Altijd twee stappen, in deze volgorde: eerst kijken in de auditsessie, dan lezen in de
code.** Andersom gaat het mis — dan vergelijk je namen van onderdelen waarvan je niet weet of
ze hetzelfde doen.

---

### Stap 1 — In de auditsessie

De site draait, de JavaScript heeft gedraaid, en je kunt klikken. Dit is de enige stap waarin
je dingen ziet die er bij het laden nog niet stonden.

#### 1.1 Start de sessie

```bash
npm run chrome:debug
```

Doe dit **voordat** je meet. Zonder deze Chrome valt elk commando terug op headless, en dan
staat er in het logboek een andere omstandigheid dan in de rest van het bewijsstuk.

De CLI meldt bij elke start welke het werd:

```
[browser] Verbonden met Chrome op http://localhost:9222 (sessies/cookies behouden)
[browser] Geen Chrome op http://localhost:9222 — val terug op headless.
```

Staat er de tweede regel, **meld dat dan** en meet niet door alsof er niets aan de hand is.

Controleren of hij er is:

```bash
curl -s http://localhost:9222/json/version
```

#### 1.2 Zoek de herhalende onderdelen

```bash
npm run cli -- get-consistentie <projectId>
```

Geef het **onderzoeksnummer**, niet een los adres — het commando haalt de steekproef zelf op
en vergelijkt standaard **alle** pagina’s.

Gebruik `--max` alleen als je bewust wilt beperken. Tot 22 augustus 2026 kapte dit commando
standaard af op twaalf pagina’s; bij een steekproef van achttien viel het contactformulier
daardoor buiten de vergelijking, en precies daar zat het afwijkende sjabloon. Wat er niet
bekeken is staat in `paginas_niet_bekeken` — lees dat, ook als je zelf geen grens gaf.
Dit is de machinale variant van "loop de pagina's langs en zoek wat terugkomt": het verzamelt
alle links, knoppen en `summary`-elementen en koppelt ze over de pagina's heen.

#### 1.3 Kijk eerst wat er misging

Vóór je naar de uitkomst kijkt:

- `niet_gelukt` — pagina's die niet openden. Niet leeg betekent: de vergelijking is
  onvolledig, en dat hoort in het oordeel te staan.
- `omgeleid_niet_meegenomen` — de server stuurde door. Die tellen niet mee.
- `paginas_niet_bekeken` — afgekapt door `--max`.

Reken na: vergeleken + omgeleid + niet gelukt moet optellen tot de steekproef.

#### 1.4 Kijk zelf naar wat de meting niet kan zien

De meting vindt alleen wat er bij het laden staat. In de sessie, met de muis:

- onderdelen die pas verschijnen na een klik — uitklapmenu's, zoeksuggesties
- stappen in een formulier die de server afschermt
- losse afbeeldingen met een functie die niet in een link of knop zitten; die vallen buiten de
  selectie van het commando

Wat je zo vindt hoort in dezelfde lijst als het gemeten werk. Op de kaart in "Waar sta ik"
staat daarvoor **+ Onderdeel toevoegen**.

**Maar let op het verschil tussen wat het commando niet kán zien en wat het bewust láát**
**liggen.** Dat eerste is een gat in de meting en hoort erbij. Dat tweede is al een
beslissing, en die nog eens met de hand opschrijven levert een niet-bevinding op die de
onderzoeker moet wegwegen.

Wat het bewust laat liggen:

- sleutels die op één pagina meer dan één element aanwijzen. Twintig uitklapkoppen met
  dezelfde sjabloonklasse zijn niet één onderdeel met twintig namen. Daaronder valt ook het
  logo naast “Home” in het kruimelpad: twee onderdelen, dezelfde bestemming, en op vrijwel
  elke site aanwezig.
- onderdelen die op een handvol pagina’s staan; die gelden als redactioneel en staan apart
  onder "ter kennisgeving".
- pagina’s die zijn omgeleid, en pagina’s van een eigen applicatie met een eigen sjabloon.

Kom je zoiets tegen, dan is dat geen vondst maar een bevestiging dat het gereedschap doet wat
het hoort te doen. Aanleiding: op 23 augustus 2026 noteerde de agent het kruimelpad naast het
logo als vondst, terwijl de regel daarvoor al in dit bestand stond.

#### 1.5 Stel de functie vast

Dit kan de meting niet. Links worden gekoppeld op hun bestemming — de sterkste sleutel die er
is, maar het blijft een aanname. Klik erop en kijk waar je uitkomt:

- **Zelfde functie?** Zo nee, dan mogen de namen verschillen en is er geen bevinding.
- **Zo ja**, dan gaat het onderdeel door naar stap 2.

---

### Stap 2 — In de code

Nu je weet welke onderdelen hetzelfde doen, lees je hoe ze heten.

#### 2.1 Zet de meting bij het oordeel

```bash
npm run cli -- koppel-logboek <projectId>
```

Zonder dit staat de meting wel in het logboek maar niet op de kaart. Controleer dat
`akkoordVervallen` nul is; is dat niet zo, dan heeft een meting een eerder akkoord
ingetrokken en moet je dat melden.

#### 2.2 Lees het overzichtsbestand

Het pad staat in `overzicht`. Daarin staat de **matrix**: onderdelen in de rijen, pagina's in
de kolommen. Alleen daar zie je of een afwijking op één pagina zit of op de helft. De uitvoer
geeft de lijst; de matrix geeft de verdeling.

#### 2.3 Leg per onderdeel drie dingen naast elkaar

| Wat | Waar het vandaan komt |
|---|---|
| de zichtbare tekst | wat een ziende leest, met `sr-only` eruit |
| de toegankelijke naam | `aria-labelledby` → `aria-label` → tekst in het element plus het `alt` van een afbeelding erin → `title` |
| het icoon | bestandsnaam, svg-vorm of icoonklasse — een signaal, geen bewijs |

Voorbeelden van wat een afkeuring is:

```html
<!-- zelfde naam, andere zichtbare tekst -->
<button aria-label="Zoeken">Zoek</button>      <!-- pagina A -->
<button aria-label="Zoeken">Vind</button>      <!-- pagina B -->

<!-- zelfde icoon, ander tekstalternatief -->
<img src="search.png" alt="Zoeken">            <!-- pagina A -->
<img src="search.png" alt="Doorzoek de site">  <!-- pagina B -->
```

#### 2.4 Weeg

Verschillen ze, dan is de vraag: **aanvaardbare variatie of een afkeuring volgens F31?**
Consistent hoeft niet identiek te zijn; waar die grens ligt staat niet in de norm. Dat is punt
1 van W3C-issue #5225 en blijft een oordeel van de onderzoeker.

Weeg ze los van elkaar. Vier verschillen kunnen vier verschillende antwoorden verdienen: een
sjabloon van een andere applicatie weegt anders dan dezelfde link die op drie pagina's drie
namen draagt.

---

### Afronden

Per afkeuring, in de vorm uit `wcag-checklists/Checklist_SC_3_2_4.md`: welk onderdeel, welke
functie, welke pagina's, wat er op elke pagina staat — zichtbaar label én toegankelijke naam —
en welke naam het overal moet worden. Techniek: **F31**.

Zet nooit een oordeel op "afgekeurd" zonder bevinding. Het criteriumoordeel volgt uit de
bevindingen; een status zonder bevinding leest onderaan als geslaagd.

Dan:

- geen afkeuringen, instructies afgelopen → klaar, en het criterium voldoet
- wel afkeuringen → klaar, en het criterium voldoet niet
- geen enkel onderdeel dat op meerdere pagina's voorkomt → niet van toepassing
- PDF zonder tags → `niet_te_bepalen`, nooit "voldoet"
