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
