# Shift2-beoordelingsregels SC 1.4.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_3.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen

Dit criterium vereist een test in de browser. Zet het altijd op `niet_te_bepalen`
(of `niet_aanwezig` als het aantoonbaar niet van toepassing is) en noteer de vraag in `reden`.

**Vraag voor de onderzoeker:**

> Heeft de hoogcontrast-/toegankelijkheidsknop op [pagina] zelf voldoende contrast? En zo ja, voldoet de hoog-contrast-versie inhoudelijk? Blijven daarbij ook de logo's en afbeeldingen met tekst leesbaar in die weergave (let op het footer-logo)?

## Testvolgorde met een hoogcontrast-knop

De test bestaat uit twee stappen, in deze volgorde. Sla stap 1 nooit over: is de knop zelf
niet zichtbaar genoeg, dan is de hele hoogcontrast-route geen geldig alternatief.

**Stap 1 — de knop in de NORMALE weergave.** Welke eis geldt, hangt af van wat de knop is:

| Knop | Criterium | Eis |
|---|---|---|
| Bevat zichtbare tekst ("Contrast verhogen") | 1.4.3 | 4,5:1 (of 3:1 bij grote tekst) |
| Alleen een icoon (mannetje, contrastsymbool) zonder tekst | 1.4.11 | 3:1 |

**Stap 2 — de pagina IN de hoogcontrastweergave.** Zet de knop aan en beoordeel die weergave
apart: tekstcontrast, en of logo's en afbeeldingen met tekst leesbaar blijven (zie de sectie
hieronder over het footer-logo).

### Meet op de werkelijke pixels, niet op de CSS-waarden

Staat de knop op een foto, een verloop of een half-transparante laag, dan geeft
`getComputedStyle` geen bruikbare achtergrondkleur (vaak `rgba(0,0,0,0)`). Rekenen met de
CSS-waarden levert dan ten onrechte "voldoet" op. Maak in dat geval een uitsnede van de knop,
tel de pixels, en toets het **slechtste** punt, niet het gemiddelde.

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

### Test dit in de audit-sessie-Chrome

De hoogcontrast-knop werkt via javascript. In een browser waarin de scripts niet draaien lijkt
hij niets te doen en trek je de verkeerde conclusie. Gebruik de Chrome achter "Audit-sessie
starten" (debugpoort 9222). Controleer bij twijfel
`document.querySelectorAll('script[src]').length`; is dat 0, dan meet je in een dode pagina.

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

- Heeft de site een hoogcontrast-knop of toegankelijkheidsmenu met hoog-contrast-optie? Dan wordt de standaardversie niet meer inhoudelijk op contrast getoetst, mits die knop zelf voldoende contrast heeft. Dat laatste kan alleen de onderzoeker vaststellen.
- Bij bevestiging "knop heeft voldoende contrast": een opmerking op het homepage-sample (status resolved, impact en responsibility leeg), QuickFinding 0dd88736-4c57-421b-b45c-af8fd46cfc38. Daarna HTML-paginas niet meer inhoudelijk op 1.4.3 checken.
- UITZONDERING: tekst IN een afbeelding (poster, infographic, banner) schakelt NIET mee met de hoogcontrast-knop. Die toets je WEL op 1.4.3, ook op paginas waar je de reguliere contrastcheck overslaat. Toets aan 4,5:1 (niet 3:1), want bij een afbeelding is de font-size niet uitleesbaar en kun je niet vaststellen of het als grote tekst telt.
- Staat de informatie van de afbeelding VOLLEDIG als echte tekst op de pagina, dan is de afbeelding niet meer de enige drager en valt de tekst-in-afbeelding onder een 1.4.3-uitzondering. Is het alternatief incompleet, dan blijft de contrasteis gelden.
- PDF-documenten: 1.4.3 wel per stuk inhoudelijk checken. De hoogcontrast-knop op de website geldt niet voor PDFs.
- CONTRAST IN PDF'S DOET FRITS HANDMATIG. Meet het niet zelf uit en schrijf er geen bevinding voor. Zet 1.4.3 bij een PDF-sample op `niet_te_bepalen` met als reden dat de onderzoeker het contrast handmatig controleert. Reden: een pixelmeting rond de tekst is niet betrouwbaar genoeg bij tekst over een foto, een verloop of een gedeeltelijk gekleurd vlak, en bij een bevinding die naar de opdrachtgever gaat weegt een eigen meting zwaarder. Vastgelegd door Frits op 2026-08-02 bij UTHEU-01.
- Noteer gemeten kleuren als #RRGGBB met de contrastverhouding erbij.
