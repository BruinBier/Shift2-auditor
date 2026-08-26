# Shift2-beoordelingsregels SC 2.4.4

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_4_4.md` als ze elkaar tegenspreken.

## Eerst meten

```
npm run cli -- get-links <url>
```

Dat rekent per link de toegankelijke naam uit in de volgorde hieronder, en meldt de gevallen
die deze regels beschrijven: geen naam, een naam die alleen uit `title` komt, een generieke
tekst zonder context in hetzelfde element, alleen de platformnaam bij een sociale-media-link,
een naam die een ander platform noemt dan de bestemming, en een telefoonnummer of e-mailadres
dat naar iets anders wijst. De volledige lijst staat in het overzichtsbestand.

Het commando oordeelt niet. "Meer over paspoorten" is een naam die jij moet wegen; de
mechanische gevallen hoeven niet meer met de hand uit de HTML gehaald te worden.

De uitkomst `naamAlleenUitTitle` is géén afkeuring op zichzelf; het commando zet de logolink
naar de eigen homepage apart als bekende uitzondering. Zie de tabel bij stap 3.

Aanleiding: op heuvelrug.nl (2026-08-20) stonden twintig oordelen over 2.4.4 zonder een enkele
meting eronder. Bij het nalezen keurde Claude de logolink ten onrechte af met een beroep op de
oude formulering in stap 3 hieronder — die op 18 augustus al was vervangen, maar alleen in het
bestand van 4.1.2. Dat is meteen de reden dat de regel nu op één plek staat en dat het
commando de uitzondering zelf kent.

## Altijd actief checken: sociale-media-links in de footer

Loop bij 2.4.4 op de homepage de sociale-media-links in de footer na. Je beoordeelt de
**toegankelijke naam**: de tekst die een schermlezer voorleest. Ga daarvoor niet af op het
icoon dat je op de screenshot ziet; dat zegt niets over wat er wordt voorgelezen.

### Stap 1 — bepaal de toegankelijke naam

Pak de volledige `<a>` uit de HTML en loop deze volgorde af:

1. Staat er een `aria-label` op de `<a>`? Dan is dát de naam. De rest wordt genegeerd.
2. Zo niet: alle tekst binnen de `<a>`, waarbij alles met `aria-hidden="true"` WEGVALT.
   Het icoon staat vrijwel altijd op `aria-hidden`, dus meestal blijft één tekstspan over.
3. `title` telt alleen mee als er verder geen enkele naam is.

Let op bij stap 3: een naam die **uitsluitend** uit `title` komt is niet automatisch goed én
niet automatisch fout. De vraag is of die naam zijn werk doet — zegt hij waar de link heen
gaat?

| Situatie | Oordeel |
|---|---|
| Logolink naar de eigen homepage, `title="Ga naar de homepage"` | **voldoet** — de naam zegt waar de link heen gaat |
| Dezelfde logolink op een SUBSITE (duurzaam., open., mijn.) | **afkeuring** — de bezoeker denkt naar de hoofdsite te gaan |
| Een title die de bestemming niet dekt, of leeg of nietszeggend is | **afkeuring** |
| Een naam die alleen het linktype noemt, zoals "(externe link)" of "PDF" | **afkeuring** — dat is geen naam voor de link |

Hier stond tot 20 augustus 2026 de categorische regel dat een naam uit alleen `title`
onvoldoende is en een afkeuring blijft. Die is op 18 augustus vervangen door de beoordeling
hierboven; `Shift2_Regels_SC_4_1_2.md` had de nieuwe versie al, dit bestand niet. Twee
bestanden die uit elkaar lopen leveren precies één ding op: wie hier stopt met lezen, keurt
het logo van elke gemeentesite af. Zie `Shift2_Regels_SC_4_1_2.md` voor de volledige regel,
de geschiedenis en de formulering.

Let op een visueel verborgen span (`position:absolute;left:-9999px`, `sr-only`, `visually-hidden`).
Die telt WEL mee als naam, ook al zie je op de screenshot alleen een icoon. Dat kun je alleen
in de HTML zien.

Voorbeeld van het typische patroon:

```
<a href="https://www.facebook.com/gemeentebeverwijk">
  <span class="fa-facebook" role="img" aria-hidden="true"></span>   ← telt NIET mee
  <span class="socialLinkText">Facebook</span>                      ← de naam
</a>
```

Toegankelijke naam = "Facebook". Een schermlezer leest voor: "link, Facebook".

### Stap 2 — weeg de naam tegen de href

| Situatie | Oordeel |
|---|---|
| Naam is alleen de platformnaam ("Facebook", "Instagram", "LinkedIn", "YouTube") terwijl de href naar een specifieke organisatiepagina gaat | **AFKEURING** (klein, redacteur) |
| Naam noemt de organisatie ("Facebook-pagina gemeente X", "Gemeente X op LinkedIn") | in orde, geen bevinding |
| Naam klopt niet meer met het doel (naam zegt "Twitter", href gaat naar x.com) | **opmerking**, zie de X/Twitter-regel hieronder |
| Helemaal geen naam (alleen een `aria-hidden` icoon, geen tekstspan, geen aria-label) | **AFKEURING onder 2.4.4 én 4.1.2**, twee aparte bevindingen |

De kop erboven ("Blijf op de hoogte", "Volg ons") levert GEEN context: de link staat in een
eigen `<p>` en de kop zit niet in hetzelfde element. Bovendien zegt zo'n kop niet van wie de
pagina is. Niet wegredeneren met "de kop staat er wel bij".

Bij een afkeuring: gebruik QuickFinding `5b18790a-b634-4c99-8fee-d1c5d8952aea`
("Sociale-media-link zonder organisatie in linktekst"). Pas de kop en de platformnamen aan op
de werkelijke situatie.

Advies: vul de toegankelijke naam aan met de organisatie, bijvoorbeeld "Facebook-pagina
gemeente X" en "Instagram-pagina gemeente X".

Gebruik QuickFinding `5b18790a-b634-4c99-8fee-d1c5d8952aea` ("Sociale-media-link zonder
organisatie in linktekst"). Pas de kop en de platformnamen aan op de werkelijke situatie.

Advies: vul de toegankelijke naam aan met de organisatie, bijvoorbeeld "Facebook-pagina
gemeente X" en "Instagram-pagina gemeente X".

Let op: dit is een ANDERE bevinding dan 1.3.1 over dezelfde links. Die gaat erover dat ze
niet in een lijst staan; deze gaat over de linktekst. Beide kunnen tegelijk gelden op
dezelfde footerkolom. Zie ook de X/Twitter-regel hieronder, waar de naam niet meer klopt
met het doel; hier is de naam te summier voor het doel.

Aanleiding: duurzaam.beverwijk.nl (2026-07-27), footerkolom "Blijf op de hoogte" met
`<span>Facebook</span>` en `<span>Instagram</span>` als enige toegankelijke naam, links naar
facebook.com/gemeentebeverwijk en instagram.com/gemeentebeverwijk. De auditor gaf 2.4.4
"voldoet" en miste dit; Frits wees erop.

## Niet-getagde PDF: 2.4.4 WEL beoordelen

Beoordeel 2.4.4 ook bij een niet-getagd document. Dit criterium gaat over de **tekst** van de
link, en die staat er ook zonder tags. Kijk naar de pagina: zie je een link of een webadres in
de lopende tekst, lees dan of die tekst duidelijk maakt waar hij heen leidt. Een "klik hier"
of "lees meer" zonder context is ook in een PDF een afkeuring.

Wat je hier NIET beoordeelt: dat de link niet klikbaar is. Dat webadressen als platte tekst in
het document staan zonder werkende link, is een gevolg van de ontbrekende tagstructuur en
wordt al onder 1.3.1 afgekeurd. Maak daar geen aparte 2.4.4-bevinding van.

Geef dus een echt oordeel (voldoet of afkeuring op de linktekst); zet 2.4.4 niet op
`niet_te_bepalen` met "geen tags" als reden.

Vastgelegd door Frits op 2026-08-02 bij UTHEU-01. Eerst stond 2.4.4 in de vervallijst voor
ongetagde PDF's; Frits corrigeerde dat: de linktekst is visueel te toetsen, alleen de
klikbaarheid niet.

## Regels

- **Waar de context vandaan mag komen.** WCAG noemt: dezelfde zin, dezelfde alinea, hetzelfde lijstitem, dezelfde tabelcel, én de tabelkop(pen) van de cel waarin de link staat. Die laatste hoort erbij en stond hier tot 2026-08-26 niet: een `<th>` is programmatisch aan zijn cel gekoppeld, anders dan een kop bóven een kaartje. In een tarieventabel is het juist de RIJkop die de link betekenis geeft — "Paspoort | € 83,85 | Aanvragen". `get-links` zoekt die koppen op via `headers=`, anders via de eerste `<th>` in de rij plus de `<th>` op dezelfde kolompositie.
  Neem hier NIET de formulering van RAMP over ("the same paragraph, list or table cell"): die schrijft *lijst* waar WCAG *lijstitem* zegt, en zou context uit een naastliggend `<li>` toestaan.
- Link in een eigen <p> of <li> krijgt GEEN programmatische context van een kop of alinea die erboven staat maar niet in hetzelfde element zit. "Lees meer..." in een eigen <p> is dus een AFKEURING, ook al oogt de kaart visueel als een geheel. Niet wegredeneren met "de kop staat er wel bij". QuickFinding d7494b0a-a187-4930-bef7-05083ff5705d.
- Advies bij generieke linktekst: 1) maak de linktekst specifiek ("Lees meer over Fysieke overlegtafel"), OF 2) plaats de link in dezelfde alinea als de beschrijvende tekst. NOOIT adviseren om de hele kaart of container klikbaar te maken.
- **Telefoonnummer of e-mailadres als linktekst.** Een geformatteerd telefoonnummer als linktekst is geen bevinding onder 2.4.4 als de link **bedoeld is om te bellen**, ook niet bij een technisch ontbrekende of defecte `tel:`-koppeling. Echter, als de link verwijst naar een **volledig andere bestemming** (zoals een webpagina of een document), is er wél sprake van een bevinding onder 2.4.4, omdat de linktekst het daadwerkelijke doel onjuist voorspelt.
  Hetzelfde geldt voor een e-mailadres als linktekst. Het voorwoord doet niet ter zake ("Telefoon:", "Bel:", "Mail:").
  Let op waar het scharnier zit: bij de **bedoeling**, niet bij de techniek. Een `tel:`-link met een verkeerd nummer erin is nog steeds bedoeld om te bellen en dus geen 2.4.4-bevinding; dat is een functioneel issue. Een linktekst met een telefoonnummer die een webpagina opent, is dat wel: wie erop klikt verwacht te bellen en belandt ergens anders. Wie de linklijst van een schermlezer doorloopt of op een telefoon snel wil bellen, krijgt een compleet onverwachte uitkomst.
  Bij zo'n afkeuring: impact matig, responsibility redacteur.
  Voorbeeld: BEV-04 B004, open.beverwijk.nl, waar de linktekst "0251 256 256" een href naar `https://www.beverwijk.nl` heeft. Formulering vastgelegd door Frits op 2026-08-04, nadat de audit deze bevinding ten onrechte liet vallen met een beroep op de oude, te ruime regel ("ongeacht waar de href heen wijst").
- X/Twitter-mismatch in de footer (X-logo zichtbaar, toegankelijke naam zegt nog "Twitter"): OPMERKING onder 2.4.4, status resolved, impact en responsibility leeg. Niet onder 2.5.3 (vereist zichtbare tekst) en niet onder 1.1.1. Een keer plaatsen, op het homepage-sample.
  WAAROM NIET ONDER 1.1.1: het glyph staat op `aria-hidden` en is dus geen niet-tekstuele content die beoordeeld wordt; de naam van de link komt uit de tekstspan ernaast. Er is onder 1.1.1 niets te beoordelen. Wat wringt is dat die naam een ander platform noemt dan het logo op het scherm — een kwestie van linkbenoeming, en dat is 2.4.4. Zou het logo een `<img>` met een eigen tekstalternatief zijn geweest, dan lag 1.1.1 wél voor de hand; controleer dus eerst hoe het icoon is opgebouwd.
  FORMULEER HET ALS UIT ELKAAR LOPEN, NIET ALS ACHTERSTALLIG ONDERHOUD. De href gaat meestal nog gewoon naar twitter.com, dus de naam klopt met de bestemming; het is het logo dat vooruit is gelopen op de naamgeving. Schrijf dat logo en naam niet meer samenvallen, niet dat "het platform inmiddels X heet" — dat laatste is geen toegankelijkheidsargument.
- Link zonder enige toegankelijke naam (afbeelding-link met leeg alt): zowel 2.4.4 als 4.1.2 afkeuren, twee aparte bevindingen. Framing 2.4.4: "weten niet waar de link heen gaat". Framing 4.1.2: "hulpsoftware kan de link niet goed aankondigen". Noem in elk dat het issue ook onder het andere criterium valt.
- **Een anker dat als iets anders is gecodeerd, valt buiten 2.4.4.** Een `<a role="button">` of `<a role="menuitem">` wordt aangekondigd als knop of menu-item en staat niet in de linklijst van een schermlezer; "waar gaat deze link heen" is dan de verkeerde vraag. `get-links` zet ze apart onder `ankers_met_een_andere_rol` en telt ze niet mee in het oordeel. Of die rol klopt hoort onder 4.1.2. Op heuvelrug.nl (2026-08-26) waren dat er vijf: de vier items van de hoofdnavigatie en de ReadSpeaker-knop.
- Formuleer vanuit voorlezen en horen: hulpsoftware LEEST VOOR, het "laat niets zien".

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Het linkdoel, uit de naam die wordt voorgelezen

### In het kort

Wie een link tegenkomt moet kunnen weten waar hij heen gaat. Niet na het klikken, en niet
door de pagina eromheen te lezen — uit de link zelf, of uit tekst die er programmatisch aan
vastzit. Hoever dat reikt staat in de derde alinea.

Het gaat om de toegankelijke naam: wat er wordt vóórgelezen, niet wat je ziet staan. Dat
verschil is waar dit criterium op stukloopt. Een icoon in een sociale-media-link telt niet
mee, een `sr-only`-span die je nergens ziet telt wél mee, en een naam die alleen uit `title`
komt kan zijn werk doen of juist niet.

Een kop bóven de link geeft geen context. Wat wél telt is hetzelfde element, en bij een link
in een tabelcel ook de tabelkoppen van die cel — die zitten er programmatisch aan vast. Een
link in een eigen `<p>` of `<li>` staat er verder alleen voor, ook al oogt de kaart eromheen
als één geheel.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — De meting

1. [meting] `get-links` rekent per link de toegankelijke naam uit in de volgorde
   `aria-labelledby`, `aria-label`, de tekst binnen de link zonder wat op `aria-hidden` staat,
   en pas dan `title`. Dat is de naam waar het om gaat.
2. [meting] Het commando meldt de mechanische gevallen: geen naam, alleen een `title`, een
   generieke tekst zonder context in hetzelfde element of in de tabelkoppen van de cel,
   alleen de platformnaam bij een sociale-media-link, en een naam die een ander doel belooft
   dan de bestemming.
3. [agent] Geen links gevonden? Dan is dit criterium `niet aanwezig` — de eis geldt pas als er
   links zijn, net als 3.3.1 zonder formulier. Noteer waarop je hebt gezocht: `a[href]`,
   elementen met `role="link"`, en bij een PDF de linkannotaties. Een leeg resultaat en een
   mislukte zoekactie zien er in een onderbouwing hetzelfde uit.

#### Stap 2 — Wat de meting niet voor je beslist

4. [agent] Loop de footer na op sociale-media-links. Is de naam alleen "Facebook" of
   "LinkedIn" terwijl de link naar een organisatiepagina gaat, dan is dat een afkeuring — de
   kop "Volg ons" erboven telt niet mee.
5. [agent] Kijk bij een naam die alleen uit `title` komt of die naam zijn werk doet. De
   logolink naar de eigen homepage met `title="Ga naar de homepage"` voldoet; dezelfde link op
   een subsite niet, want de bezoeker denkt naar de hoofdsite te gaan.
6. [agent] Kijk bij een telefoonnummer of e-mailadres als linktekst waar de link héén gaat.
   Bedoeld om te bellen is geen bevinding, ook niet bij een kapotte `tel:`-koppeling. Naar een
   webpagina wél: wie klikt verwacht te bellen en belandt ergens anders.
7. [agent] Staat er een X-logo terwijl de naam nog "Twitter" zegt, dan is dat een opmerking,
   geen afkeuring. Schrijf dat logo en naam niet meer samenvallen, niet dat het platform
   inmiddels anders heet.
8. [agent] Beoordeel ook de PDF's in de steekproef. De tekst van een link staat er ook zonder
   tags; "klik hier" is in een document net zo goed een afkeuring. Dat de link niet klikbaar
   is, hoort onder 1.3.1 en niet hier.

#### Stap 3 — Wegen

9. [agent] Ankers met een andere rol dan link — `role="button"`, `role="menuitem"` — staan
   apart in het overzicht en vallen buiten dit oordeel. Neem ze mee naar 4.1.2, want daar is
   de vraag of die rol klopt.
10. [jij] Loop de volledige lijst uit de meting door op namen die een mens moet wegen. "Meer
   over paspoorten" is niet mechanisch te beoordelen: dat hangt ervan af of die tekst dekt
   waar je uitkomt.
11. [jij] Ga bij een link zonder énige naam na of je ook 4.1.2 afkeurt. Dat zijn twee aparte
    bevindingen met twee verschillende verhalen: hier weet de bezoeker niet waar de link heen
    gaat, daar kan hulpsoftware de link niet aankondigen.

### Zo is het vastgesteld

`get-links` opent de pagina in een echte browser en rekent per link de toegankelijke naam uit,
in de volgorde die hulpsoftware zelf aanhoudt. Dat is het hele punt van dit commando: uit
opgehaalde HTML lees je wat er stáát, niet wat er wordt voorgelezen. Een icoon op
`aria-hidden` valt weg, een visueel verborgen span telt mee, en het verschil tussen die twee
zie je op een schermafdruk niet.

Het commando oordeelt niet. Het meldt de gevallen die mechanisch vast te stellen zijn en zet
de volledige lijst in het overzicht, want een naam als "Meer over paspoorten" moet iemand
wegen die weet waar die link uitkomt.

Bij een generieke naam kijkt het commando of er context is: de tekst in hetzelfde element, en
bij een link in een tabelcel ook de koppen van die cel — opgezocht via `headers=`, anders via
de eerste `<th>` in de rij en de `<th>` op dezelfde kolompositie. In een tarieventabel is het
juist de rijkop die "Aanvragen" betekenis geeft. Bij een `colspan` klopt die kolompositie niet
altijd; de rijkop heeft daar geen last van.

Drie dingen staan er bewust apart in. `naamAlleenUitTitle` is geen afkeuring op zichzelf — de
logolink naar de eigen homepage is een bekende uitzondering die het commando zelf kent. En
belknoppen met een kapotte koppeling staan onder `belknoppen_zonder_werkende_koppeling`, want
dat is een functioneel probleem en geen 2.4.4-bevinding. En ankers die een andere rol dragen
dan link staan onder `ankers_met_een_andere_rol` en tellen niet mee in het aantal beoordeelde
links: een `<a role="button">` wordt aangekondigd als knop en staat niet in de linklijst van
een schermlezer.

Wat hier niet uit blijkt: de linkteksten in een PDF — die moet je op de pagina zelf lezen. En
of een rol die op een anker staat ook klopt; daarvoor moet je het element bedienen. Zie
`Shift2_Regels_SC_4_1_2.md`.

Aanleiding voor deze meting: op heuvelrug.nl (2026-08-20) stonden twintig oordelen over 2.4.4
zonder een enkele meting eronder. De logolink had alleen `title="Ga naar de homepage"` en een
leeg `alt`; de ronde noteerde "in orde" en gaf het criterium `voldoet`.

### Deelgebieden

1. Sociale-media-links in de footer — de organisatie in de naam
2. Generieke linkteksten: "lees meer", "klik hier", "meer informatie"
3. Namen die alleen uit `title` komen, en de logolink
4. Links zonder enige naam — beeldlinks met een leeg `alt`
5. Telefoonnummers en e-mailadressen als linktekst
6. Linkteksten in de PDF's uit de steekproef
