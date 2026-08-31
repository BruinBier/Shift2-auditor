# Shift2-beoordelingsregels SC 1.4.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_3.md` als ze elkaar tegenspreken.

## De contrastknop meet je ZELF, en maar één keer

**1. Vraag het niet, meet het.** Zet 1.4.3 niet standaard op `niet_te_bepalen` met een vraag
erbij. Het is te meten:

```
npm run cli -- get-contrast <url>                                    (hele pagina)
npm run cli -- get-contrast <url> --klik="tekst:Contrast verhogen"   (hele pagina, hoogcontrast)
npm run cli -- get-contrast <url> --selector='button.contrast'       (één element)
```

Dat geeft tekstkleur, achtergrondkleur, lettergrootte, de verhouding en of die haalt wat
nodig is. Lukt de meting niet (knop niet gevonden, pagina laadt niet), dan pas
`niet_te_bepalen`, met de concrete vraag én de reden waarom het niet lukte.

**2. Eén knop, één beoordeling.** De hoogcontrastknop staat in de header en is op elke pagina
dezelfde. Meet hem één keer, op het **homepage-sample**. Op vervolgpagina's beoordeel je
alleen de main-content; de knop hoort daar niet bij. Zie `Shift2_Scope_Per_Sample.md`. Twaalf
samples leveren dus één knop-oordeel op, niet twaalf.

Wat op een vervolgpagina wél onder 1.4.3 valt: tekst in een afbeelding in de main-content,
want die schakelt niet mee met de knop. Zie de uitzondering onderaan.

**Uitzondering voor PDF's:** die volgen een eigen route (`niet_te_bepalen`, Frits meet het
handmatig). Zie de regels onderaan.

## Testvolgorde met een hoogcontrast-knop

Twee stappen, in deze volgorde. Sla stap 1 nooit over: is de knop zelf niet zichtbaar genoeg,
dan is de hele hoogcontrast-route geen geldig alternatief.

**Stap 1 — de knop in de NORMALE weergave.** Welke eis geldt, hangt af van wat de knop is:

| Knop | Criterium | Eis |
|---|---|---|
| Bevat zichtbare tekst ("Contrast verhogen") | 1.4.3 | 4,5:1 (of 3:1 bij grote tekst) |
| Alleen een icoon (mannetje, contrastsymbool) zonder tekst | 1.4.11 | 3:1 |

**Stap 2 — de pagina IN de hoogcontrastweergave.** Zet de knop aan met `--klik` en meet die
weergave apart. Dat de knop zelf deugt zegt niets over de teksten die erna in beeld komen.

**Meet de hele pagina, niet alleen de knop.** Zonder `--selector` wordt elke tekst gemeten en
worden gelijke combinaties van kleur, achtergrond en lettergrootte samengevoegd — een pagina
met tweehonderd links levert anders tweehonderd regels op die hetzelfde zeggen. Eén element
meten toetst een vermoeden; een oordeel over de pagina is een uitspraak over alles wat erop
staat.

**Meet op het element dat de tekst zelf bevat**, niet op een omhulsel: een `<a>` met een
`<span>` erin heeft vaak een andere kleur dan de span die je ziet.

### Let op: een knop op een foto of een verloop meet je niet met de CSS-waarden

Staat de knop op een foto, een verloop of een half-transparante laag, dan is er geen bruikbare
achtergrondkleur uit te lezen — die is dan vaak `rgba(0,0,0,0)`. Rekenen met de CSS-waarden
levert dan ten onrechte "voldoet" op.

`get-contrast` meldt dit: ligt er een achtergrondafbeelding achter het element, dan komt er een
waarschuwing bij dat de gemeten achtergrondkleur niet is wat je ziet. Maak in dat geval een
uitsnede van de knop, tel de pixels, en toets het **slechtste** punt, niet het gemiddelde.

Bij een knop met een vaste achtergrondkleur is het gemiddelde wel de juiste maat; de lichtste
randpixels zijn daar antialiasing van het icoon, geen achtergrond.

Voorbeelden (2026-08-02):

| Site | Knop | Achtergrond | Gemeten | Eis | Oordeel |
|---|---|---|---|---|---|
| heuvelrug.nl | tekst "Contrast verhogen" | vast `#007373` | 5,68:1 | 4,5:1 | voldoet |
| ijsselstein.nl | alleen icoon | vast `#003C49` | 9,65:1 | 3:1 | voldoet |
| shift2.nl | alleen icoon | verloop over foto | 2,05:1 (slechtst 1,26:1) | 3:1 | VOLDOET NIET |

Bij shift2.nl staat in de CSS `background: transparent`. Alleen een pixelmeting laat zien dat
het witte icoon tegen een lichte foto wegvalt.

### Blijven logo's en afbeeldingen met tekst leesbaar in die weergave?

Maak twee uitsneden van hetzelfde element, met en zonder de knop aan:

```
npm run cli -- get-screenshot <url> --selector='<logo-selector>'
npm run cli -- get-screenshot <url> --selector='<logo-selector>' --klik="tekst:Contrast verhogen"
```

Ontkleurt de weergave, dan houdt de tekst zijn helderheid en blijft hij leesbaar. Keert hij om
naar zwart-wit, dan kan een afbeelding met tekst juist onleesbaar wórden. Let vooral op het
footer-logo en op knop- of banner-afbeeldingen.

### Noteer hóé je hebt gemeten

Welk element, welke kleuren als #RRGGBB, welke lettergrootte, welke verhouding, in welke
weergave, en **in welke browser**. Zonder dat is het opnieuw een bewering.

Dat laatste is geen formaliteit. De CLI meldt in elk antwoord of hij in de auditsessie draaide
of headless is teruggevallen. Een auditsessie houdt cookies, inloggegevens en localStorage
vast, headless begint elke keer schoon. Voor een openbare pagina zonder login maakt dat voor
de kleuren niets uit, en heeft headless zelfs een voordeel — de hoogcontrastweergave blijft in
localStorage staan, dus in een auditsessie vervuilt de ene meting de volgende. Achter een
login of een cookiemuur heb je de auditsessie juist nodig.

Blijft er iets over dat je niet kunt meten — of de weergave inhoudelijk deugt op de hele site,
of een afbeelding met tekst nog leesbaar is naar het oordeel van een mens — zet dat dan als
vraag in `reden` en het criterium op `niet_te_bepalen`.

Aanleiding: heuvelrug.nl. De vraag stond als `niet_te_bepalen` klaar voor de onderzoeker
terwijl hij te meten was. De knop is wit op #007373, 5,68:1 bij 4,5:1 vereist; in de
hoogcontrastweergave wit op zwart, 21:1. Die weergave ontkleurt en keert niet om, dus de
logotekst houdt zijn helderheid en blijft leesbaar. Er is op die site geen footer-logo. De
hele pagina gemeten: 46 elementen in 9 combinaties normaal, 7 in hoogcontrast, geen enkele
onvoldoende.

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

- Heeft de site een hoogcontrast-knop of toegankelijkheidsmenu met hoog-contrast-optie? Dan wordt de standaardversie niet meer inhoudelijk op contrast getoetst, mits die knop zelf voldoende contrast heeft. Dat meet je zelf; zie de meetmethode hierboven.
- Meet de knop op het homepage-sample. Haalt hij de eis, dan een opmerking op dat sample (status resolved, impact en responsibility leeg), QuickFinding 0dd88736-4c57-421b-b45c-af8fd46cfc38. Op de vervolgpagina's zet je 1.4.3 op `voldoet` met als reden dat de knop op de homepage is gemeten en de main-content geen afbeeldingen met tekst bevat; herhaal die meting niet.
- Haalt de knop de eis NIET, dan is de hoogcontrast-route geen geldig alternatief en toets je de standaardversie alsnog inhoudelijk op contrast.
- UITZONDERING: tekst IN een afbeelding (poster, infographic, banner) schakelt NIET mee met de hoogcontrast-knop. Die toets je WEL op 1.4.3, ook op paginas waar je de reguliere contrastcheck overslaat. Toets aan 4,5:1 (niet 3:1), want bij een afbeelding is de font-size niet uitleesbaar en kun je niet vaststellen of het als grote tekst telt.
- Staat de informatie van de afbeelding VOLLEDIG als echte tekst op de pagina, dan is de afbeelding niet meer de enige drager en valt de tekst-in-afbeelding onder een 1.4.3-uitzondering. Is het alternatief incompleet, dan blijft de contrasteis gelden.
- PDF-documenten: 1.4.3 wel per stuk inhoudelijk checken. De hoogcontrast-knop op de website geldt niet voor PDFs.
- CONTRAST IN PDF'S DOET FRITS HANDMATIG. Meet het niet zelf uit en schrijf er geen bevinding voor. Zet 1.4.3 bij een PDF-sample op `niet_te_bepalen` met als reden dat de onderzoeker het contrast handmatig controleert. Reden: een pixelmeting rond de tekst is niet betrouwbaar genoeg bij tekst over een foto, een verloop of een gedeeltelijk gekleurd vlak, en bij een bevinding die naar de opdrachtgever gaat weegt een eigen meting zwaarder. Vastgelegd door Frits op 2026-08-02 bij UTHEU-01.
- Noteer gemeten kleuren als #RRGGBB met de contrastverhouding erbij.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Tekst die genoeg afsteekt tegen zijn achtergrond

### In het kort

Tekst haalt 4,5:1 tegen zijn achtergrond, of 3:1 als hij groot genoeg is. Dat is te meten,
dus het hoort niet als vraag aan de onderzoeker op deze kaart te staan.

Heeft de site een hoogcontrastknop, dan verandert de vraag. Die knop geldt als alternatief
voor de standaardversie — maar alleen als de knop zelf genoeg contrast heeft, én de weergave
erachter deugt. Meet die knop één keer, op het homepage-sample. Twaalf samples leveren één
knop-oordeel op, niet twaalf.

Twee dingen schakelen niet mee met die knop en blijven dus altijd apart te beoordelen: tekst
ín een afbeelding, en de PDF's in de steekproef.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — De knop, één keer, op het homepage-sample

1. [meting] Meet de knop in de normale weergave met `get-contrast --selector=<knop>`. Bevat
   hij zichtbare tekst, dan geldt 4,5:1 onder dit criterium; is het alleen een icoon, dan
   3:1 onder 1.4.11.
2. [agent] Staat de knop op een foto, een verloop of een half-transparante laag, dan zijn de
   CSS-waarden onbruikbaar — de achtergrond leest dan uit als `rgba(0,0,0,0)` en rekenen
   levert ten onrechte "voldoet" op. `get-contrast` waarschuwt daarvoor. Toets dan het
   slechtste punt van een uitsnede, niet het gemiddelde.
3. [agent] Haalt de knop de eis niet, dan is de hoogcontrastroute geen geldig alternatief en
   toets je de standaardversie alsnog volledig op contrast. Sla deze stap nooit over.

#### Stap 2 — De weergave achter de knop

4. [meting] Meet de hele pagina met de knop aan: `get-contrast --klik="tekst:Contrast
   verhogen"`. Zonder `--selector`, want een oordeel over de pagina is een uitspraak over
   alles wat erop staat, niet over één element.
5. [agent] Maak twee uitsneden van hetzelfde element, met en zonder de knop aan. Ontkleurt de
   weergave, dan houdt tekst zijn helderheid. Keert hij om naar zwart-wit, dan kan tekst in
   een afbeelding juist wegvallen.
6. [agent] Let vooral op het footer-logo. Dat is vaak een PNG die een redacteur in de
   footertekst heeft gezet, terwijl het header-logo een SVG is die wél netjes meeschakelt.

#### Stap 3 — Wat niet meeschakelt

7. [agent] Tekst ín een afbeelding — poster, infographic, banner — schakelt niet mee met de
   knop en wordt apart getoetst, ook op pagina's waar je de reguliere contrastcheck overslaat.
   Toets aan 4,5:1 en niet aan 3:1: in een afbeelding is de lettergrootte niet uitleesbaar,
   dus je kunt niet vaststellen dat het als grote tekst telt.
8. [agent] Staat de informatie van die afbeelding volledig als echte tekst op de pagina, dan
   is het beeld niet meer de enige drager en vervalt de contrasteis. Is dat alternatief
   incompleet, dan geldt hij gewoon.
9. [jij] PDF's meet je hier niet. Zet 1.4.3 bij een PDF-sample op `niet te bepalen`, met als
   reden dat de onderzoeker het contrast handmatig controleert.

#### Stap 4 — Vastleggen

10. [jij] Noteer welk element je gemeten hebt, de kleuren als #RRGGBB, de lettergrootte, de
    verhouding, in welke weergave en in welke browser. Zonder dat is het opnieuw een bewering.
11. [agent] Stuur de vijf deelgebieden hieronder mee met het oordeel, in hetzelfde
    `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
    "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
    gebied niet beoordelen, gebruik dan `nvt` met een toelichting — dát je het niet kon is de
    informatie die een lopende onderbouwing weglaat.
12. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
    kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
    verder niets. Al het inhoudelijke gaat naar de deelgebieden: waaróp je hebt gezocht schrijf
    je bij het gebied waar je zocht, en een afweging bij het gebied waar hij over gaat. Wat de
    meting al telde hoort er evenmin in. Er is bijna nooit iets dat bij geen enkel gebied
    thuishoort; denk je van wel, kijk dan nog eens of het niet toch ergens past.

### Zo is het vastgesteld

`get-contrast` opent de pagina in een echte browser en leest per tekst de kleur, de
achtergrondkleur en de lettergrootte uit, rekent de verhouding uit en zegt of die haalt wat
nodig is. Zonder `--selector` gaat elke tekst mee en worden gelijke combinaties samengevoegd —
een pagina met tweehonderd links levert anders tweehonderd regels op die hetzelfde zeggen.

Er wordt gemeten op het element dat de tekst zelf bevat, niet op een omhulsel. Een `<a>` met
een `<span>` erin heeft vaak een andere kleur dan de span die je ziet; die verwarring leverde
eerder een niet-bestaande afkeuring van 1,25:1 op.

Waar de meting stopt: ligt er een achtergrondafbeelding achter het element, dan meldt het
commando dat de gemeten achtergrondkleur niet is wat je ziet. Rekenen met die waarden geeft
een uitkomst die niets waard is — daar is een pixelmeting op een uitsnede voor nodig.

Let op waar de meting draaide. Het antwoord meldt of het in de auditsessie was of headless.
Voor een openbare pagina heeft headless zelfs een voordeel: de hoogcontrastweergave blijft in
`localStorage` staan, dus in een auditsessie vervuilt de ene meting de volgende. Achter een
login of een cookiemuur heb je de auditsessie juist nodig.

Wat hier niet uit blijkt: of de hoogcontrastweergave inhoudelijk deugt op de hele site, en of
een afbeelding met tekst er naar het oordeel van een mens nog leesbaar in is. En het contrast
in PDF's — dat doet de onderzoeker met de hand.

Aanleiding: op heuvelrug.nl stond 1.4.3 klaar als vraag aan de onderzoeker terwijl het te meten
was. Gemeten: de knop wit op #007373 is 5,68:1 waar 4,5:1 nodig is, in hoogcontrast wit op
zwart 21:1, en over de hele pagina 46 elementen in 9 combinaties zonder één onvoldoende.

### Deelgebieden

1. De hoogcontrastknop zelf, in de normale weergave
2. De hele pagina in de hoogcontrastweergave
3. Logo's en afbeeldingen met tekst in die weergave
4. Tekst in afbeeldingen in de main-content
5. De PDF's uit de steekproef
