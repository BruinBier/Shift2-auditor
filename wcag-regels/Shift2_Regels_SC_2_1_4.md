# Shift2-beoordelingsregels SC 2.1.4

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_1_4.md` als ze elkaar tegenspreken.

## De methode is de videocontrole, niet het indrukken van toetsen

Een sneltoets van één teken zit op een gemeentesite vrijwel nooit in de eigen JavaScript. Hij
komt mee met een ingesloten videospeler: bij YouTube pauzeert `k`, dempt `m`, springen `j` en
`l` tien seconden, en maakt `f` het beeld schermvullend. Die toetsen werken zodra de focus
ergens ín de speler staat — ook wanneer de volumeknop focus heeft en niet de afspeelknop.
Daarmee gaat de uitweg "alleen actief bij focus" niet op, en uitzetten of herdefiniëren kan de
bezoeker niet.

Dat is te lezen, niet te meten: het staat in het insluitadres van het iframe. **Beoordeel 2.1.4
dus per pagina, op alle video's die erop staan.** Toetsen indrukken is de uitzondering; zie
verderop.

## De meting

```
npm run cli -- get-videos <url>                de hele pagina (homepage)
npm run cli -- get-videos <url> --scope=main   alleen de main-content (elk ander sample)
npm run cli -- get-videos <stap1-url> --doorloop=2   een latere formulierstap
```

### Latere formulierstappen bestaan niet als los adres

Vraag je stap 2 of stap 3 van een formulier rechtstreeks op, dan kom je terug op stap 1: het
logboek laat dat zien doordat `eindUrl` afwijkt van `url`. Wie dat niet ziet, beoordeelt drie
samples op dezelfde pagina.

`--doorloop=<n>` doorloopt n stappen: het vult de zichtbare velden met herkenbaar
testmateriaal — naar het label gekeken, want een zin in een veld voor voorletters wordt
afgekeurd en dan blijft het formulier stilletjes op dezelfde stap staan — en klikt op
"Volgende stap", "Verder", "Doorgaan" of "Controleren".

**Op een verzendknop wordt nooit geklikt.** Op het overzicht staat alleen "Verzenden", en die
naam staat niet in de doorlooplijst; komt hij toch ergens in een knop voor die er wél in staat,
dan weigert het commando expliciet. Zo bereik je het overzicht zonder dat er iets bij de
organisatie binnenkomt. Gecontroleerd op het contactformulier van heuvelrug.nl op 2026-08-19:
stap 1 → stap 2 "Uw gegevens" → `overzicht-2` "Controleren", en daar stopt het.

Het commando opent de pagina in een echte browser, inventariseert de ingesloten spelers, leest
per speler of de parameter in het adres staat, en haalt de titel op van de watchpagina. Het
herkent daarnaast **geblokkeerde videovakken**: staat er een video achter een toestemmingsscherm,
dan staat het adres nergens in de HTML en is de uitkomst niet "0 video's" maar onbeslist. Dat
staat in het antwoord als `beslist: false`.

De uitkomst wordt vastgelegd in het logboek onder 2.1.4, zodat in "Zo is het vastgesteld" de
handeling staat die er hoort: gekeken naar de insluitcode, niet toetsen ingedrukt.

**Draai na het meten `koppel-logboek`.** Het bewijs onder een oordeel staat niet live uit het
logboek maar opgeslagen op de cel, in het veld `verantwoording`. `save-checks` raakt dat veld
niet aan — die schrijft alleen de status en de reden. Meet je opnieuw en sla je deze stap over,
dan staat er een nieuwe reden met het oude bewijs eronder:

```
npm run cli -- koppel-logboek <projectId>
```

Vastgelegd op 2026-08-19: bij heuvelrug.nl stonden onder 2.1.4 nog drie `get-sneltoetsen`-
rondes en een schermafdruk van het logo, terwijl de reden allang over video's ging.

## Wat je per video controleert

| Speler | In orde als | Ontbreekt de parameter |
|---|---|---|
| YouTube — `youtube.com`, `youtu.be`, `youtube-nocookie.com` | `disablekb=1` staat in de querystring | afkeuring, sjabloon **"YouTube - disablekb"** |
| Vimeo — `vimeo.com` | `keyboard=0` staat in de querystring | afkeuring, sjabloon **"Vimeo keyboard=0 ontbreekt"** |
| Een andere speler | — | niet beoordelen: `niet_te_bepalen`, en melden dat hij er staat |

De parameter mag overal in de querystring staan, niet per se achteraan. Op valkenswaard.nl
luidde het adres
`https://www.youtube-nocookie.com/embed/HuvU7fw_BYE?disablekb=1&modestbranding=1&enablejsapi=1&playsinline=1`
— `disablekb=1` staat daar middenin. Zoek dus of de parameter voorkomt, niet waar hij staat.

De waarschuwing in het Vimeo-sjabloon (dat `keyboard=0` ook gewenste toetsenbordbediening
uitzet) is uitleg bij de afkeuring, geen reden om de oplossing af te wijzen. Staat `keyboard=0`
er, dan voldoet de video.

### Een speler die geen YouTube of Vimeo is

Die komt in het gebruikte sjabloon niet voor. Kom je er toch een tegen, ga dan niet gokken en
plak er geen bestaand sjabloon op: zet het criterium op `niet_te_bepalen` en meld dat er een
speler staat die deze werkwijze niet dekt en dat dit nog uitgewerkt moet worden.

## Wat niet meetelt

- **Een link naar YouTube zonder ingesloten speler.** De grens ligt bij het insluiten. Zie
  `Shift2_Scope_Per_Sample.md`.
- **De toegankelijkheidsbalk.** Die valt buiten de beoordeling (`Shift2_Scope_Per_Sample.md`,
  `Shift2_Regels_SC_4_1_2.md`): templatecode van de leverancier, daar kan de gemeente niets
  mee. Een attribuut als `data-rsshortcut="play"` in die balk is dus geen aanleiding om iets te
  meten — nog los van het feit dat zo'n attribuut op zichzelf geen sneltoets is.
- **Header en footer op een vervolgpagina.** Op de homepage tel je de video's in header, main
  én footer; op elk ander sample alleen in de main-content.
- **PDF-samples.** Daar is 2.1.4 niet van toepassing: `niet_aanwezig`, met die reden. Ga niet
  in het bestand tellen hoe vaak `/JavaScript` voorkomt — dat is een antwoord op een vraag die
  niet gesteld is.

## Het oordeel per pagina

| Situatie | Status |
|---|---|
| Geen video op de pagina, en geen aanleiding voor een toetsmeting | `niet_aanwezig` |
| Alle video's op de pagina in orde | `voldoet` |
| Eén video zonder de parameter, ook al zijn de andere goed | `voldoet niet` |
| Een speler die deze werkwijze niet dekt | `niet_te_bepalen` |
| Een videovak achter een toestemmingsscherm, adres niet leesbaar (`beslist: false`) | `niet_te_bepalen` |

Het criterium is een uitspraak over de pagina, niet over een video: één video zonder de
parameter maakt de pagina afgekeurd. De goede video's blijven wel in de opsomming staan, zodat
zichtbaar is dat ze zijn nagelopen.

`niet_aanwezig` en niet `voldoet` bij nul video's, omdat 2.1.4 een voorwaardelijke eis is — hij
begint met "if a keyboard shortcut is implemented". Zonder sneltoets is die eis leeg. Zie
`Shift2_Voldoet_Of_Niet_Aanwezig.md`. Staat er wél een speler en is `disablekb=1` toegevoegd,
dan is er iets getoetst en is de uitkomst `voldoet`.

## De reden is een opsomming

Noem het aantal video's op de pagina, en zet daaronder per video een regel: nummer, platform,
titel, wat er in het adres staat, en de uitkomst. Zo telt het altijd op — het genoemde aantal is
het aantal regels eronder, en ontbreekt er een regel dan zie je dat meteen.

**Geen video:**

> Op deze pagina staan 0 video's: geen iframe naar YouTube of Vimeo en geen plaatshouder die er
> een laadt. Geen aanleiding om op eigen sneltoetsen te toetsen.

**Eén video, in orde:**

> Op deze pagina staat 1 video, gecontroleerd op de insluitcode:
> - video 1 — YouTube, "Bomenkap Gemeente Valkenswaard": `disablekb=1` aanwezig → in orde

**Drie video's, gemengd:**

> Op deze pagina staan 3 video's, alle drie gecontroleerd op de insluitcode:
> - video 1 — YouTube, "Raadsvergadering 12 juni": `disablekb=1` aanwezig → in orde
> - video 2 — YouTube, "Afval scheiden": `disablekb=1` ontbreekt → sneltoetsen van één teken staan aan
> - video 3 — Vimeo, "Welkom in Heuvelrug": `keyboard=0` ontbreekt → sneltoetsen van één teken staan aan

De titel komt **uit de video zelf**, niet uit het `title`-attribuut van het iframe: veel CMS'en
zetten daar "YouTube video player" neer en dan heten alle video's op de site hetzelfde. Voor
YouTube haal je hem uit `ytInitialPlayerResponse` op de watchpagina, dezelfde bron als bij 1.2.2
(`Shift2_Werkwijze_Video.md`). Dan draagt dezelfde video in een 1.2.2-bevinding en in een
2.1.4-bevinding dezelfde naam.

Er zijn dus twee bronnen per video: het **insluitadres op de pagina** voor de parameter, en de
**watchpagina** achter het videonummer voor de titel.

## Altijd in de audit-sessie

Een video staat op veel gemeentesites achter een cookiescherm: zolang de bezoeker niets kiest,
is er een grijs vlak en helemaal geen iframe. In een verse headless browser is dat altijd zo. De
agent leest dan HTML zonder speler, vindt niets, en zet 2.1.4 op `niet_aanwezig` — een vals
negatief dat er correct uitziet.

De audit-sessie-Chrome heeft een vast profiel (`~/chrome-audit-profile`, zie
`scripts/start-chrome-debug.ts`), dus een cookiekeuze die daar eerder is gemaakt staat er nog.
Daarom geldt één manier, zonder uitzondering:

> Controleer aan het begin van de doorloop dat het eerste commando `browser: auditsessie`
> teruggeeft. Staat er `headless`, dan draait de audit-sessie niet. Stop en meld dat, in plaats
> van twaalf pagina's te beoordelen op HTML waar de video's uit weggelaten zijn.

Op valkenswaard.nl is dat geen theorie: het videovak draagt de klasse `blocked` met daarin
"Op deze plek staat een video van een externe website", en het iframe wordt pas ná toestemming
ingevoegd. In headless levert die pagina nul iframes op, terwijl er een video staat met
`disablekb=1` erin. `get-videos` meldt dat vak als `geblokkeerde_videoplaatsen` en zet
`beslist` op `false`; is dat zo, dan is het oordeel `niet_te_bepalen` tot de meting in de
audit-sessie is herhaald.

`getBrowser()` valt stil terug op headless als er geen Chrome op poort 9222 draait; het veld
`browser` in het antwoord is de enige plek waar je dat ziet. Elk commando geeft het mee, dus een
sessie die er halverwege uitvalt, valt alsnog op.

## Toetsen indrukken: alleen met aanleiding

De site kan in theorie zelf een sneltoets van één teken hebben, in de eigen JavaScript. Daar is
`get-sneltoetsen` voor. Het commando drukt elke toets in en vergelijkt de pagina ervoor en erna:
aantal elementen, lengte van de tekst, welk element focus heeft, of er geluid begint te spelen,
of er een dialoogvenster bij komt en of het adres wijzigt.

```
npm run cli -- get-sneltoetsen <url>              alle letters en cijfers
npm run cli -- get-sneltoetsen <url> --in=<css>   met de focus op een onderdeel
npm run cli -- get-sneltoetsen <url> --toetsen=<reeks>   bijvoorbeeld de leestekens
```

**Draai dit alleen met een concrete aanleiding.** Die zijn er twee:

- de pagina documenteert zelf sneltoetsen;
- er staat een echte webtoepassing in de main-content: een kaart, een kalender, een e-loket.

Geen aanleiding, geen toetsmeting. Een gemeentesite is tekst en links; daar systematisch
tientallen toetsen op indrukken kost minuten per pagina en levert vrijwel altijd niets op.

**Schrijf op wat de meting deed, niet de bredere conclusie.** Dus "geen van de 36 ingedrukte
toetsen deed iets", niet "er zijn geen sneltoetsen op deze pagina". De reeks bevat geen tekens
die je met Shift maakt, en die vallen volgens de norm er wel onder. De uitspraak mag niet breder
zijn dan de meting.

## De bevindingen

Eén voorstel per spelertype voor de hele steekproef, met een voorkomen op elk sample waar het
speelt. Dus vier pagina's met een YouTube-video zonder `disablekb=1` en één met daarnaast een
Vimeo zonder `keyboard=0` leveren **twee** voorstellen op, niet vijf: vier keer hetzelfde
verhaal is ruis in het rapport (`Shift2_Regels_SC_1_3_1.md`), maar YouTube en Vimeo vragen een
andere handeling van de redacteur en zijn dus niet één bevinding (`Shift2_Regels_SC_2_5_3.md`).

De CLI heeft geen commando om een pagina later aan een bestaand voorstel toe te voegen — er is
geen `update-finding` en geen `add-occurrence`. Verzamel de treffers dus tijdens de doorloop en
schrijf ze aan het eind in één keer weg, met alle betrokken samples in `--sample-items`.

Gebruik `create-finding` en niet `create-finding-from-quick`: die tweede neemt de status uit het
sjabloon over (`"open"`) en maakt er dus meteen een bevinding van in plaats van een voorstel, en
slaat de schrijfregel-controle over. Neem het **advies** woordelijk uit het sjabloon over — daar
staat de link naar de YouTube-documentatie in, en bij Vimeo de kanttekening bij `keyboard=0` —
en vul in de beschrijving de echte pagina en de echte videotitel in.

Impact `klein`, verantwoordelijkheid `redacteur`: de reparatie is een parameter in de
insluitcode die de redacteur plakt.

## Nog niet uitgewerkt

- **Waar de titel van een Vimeo-video vandaan komt.** Voor YouTube ligt dat vast; voor Vimeo
  staat er nergens iets. Noem de video zolang bij het nummer uit het adres en meld erbij dat de
  titelbron voor Vimeo nog niet is vastgelegd.
- **Spelers die geen YouTube of Vimeo zijn**, zoals hierboven beschreven.

## Aanleiding

**heuvelrug.nl, homepage (2026-08-19).** Het oordeel stond op `niet_aanwezig` op grond van 83
toetsaanslagen: 26 letters en 10 cijfers met de focus op de pagina, dezelfde 36 met de focus op
de webReader-knop, en 11 leestekens. Geen ervan deed iets. Bij het nakijken bleek dat werk aan de
verkeerde vraag: de ronde op de ReadSpeaker-balk ging over iets wat buiten de scope valt, en de
videocontrole — de vraag die er wél toe doet — was nooit gedaan. In de opgeslagen HTML staat geen
enkel iframe en geen `data-src`; de enige verwijzingen naar YouTube zijn kanaallinks in de
footer, en die tellen niet mee. `niet_aanwezig` klopt dus, maar om een reden die niet was
opgeschreven.

**valkenswaard.nl/gemeente-aan-de-slag-met-het-kappen-van-zieke-en-dode-bomen (2026-08-19).**
Claude leidde uit een schermafdruk met een YouTube-speler een afkeuring af. In de insluitcode
stond `disablekb=1`. De poster laat zien dát er een speler is; alleen het adres zegt of de
sneltoetsen aanstaan.

Vastgelegd door Frits op 2026-08-19.
