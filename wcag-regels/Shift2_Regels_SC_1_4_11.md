# Shift2-beoordelingsregels SC 1.4.11

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_11.md` als ze elkaar tegenspreken.

## De contrastknop meet je ZELF, en maar één keer

Net als bij 1.4.3: het contrast van de hoogcontrastknop is een pixelmeting die je zelf uitvoert
in de audit-sessie-Chrome, niet een vraag aan de onderzoeker. Zie de meetmethode hieronder en
in `Shift2_Regels_SC_1_4_3.md`.

De knop staat in de header en is op elke pagina dezelfde. Meet hem één keer, op het
**homepage-sample**. Op vervolgpagina's beoordeel je alleen de main-content; de knop hoort daar
niet bij (zie `Shift2_Scope_Per_Sample.md`). Twaalf samples leveren dus één knop-oordeel op.

Lukt de meting niet, dan pas `niet_te_bepalen` met de concrete vraag én de reden waarom het
niet lukte.

## Contrastknop zonder tekst valt onder 1.4.11, niet onder 1.4.3

Is de hoogcontrast-/toegankelijkheidsknop **alleen een icoon** (het bekende mannetje, een
contrastsymbool) zonder zichtbare tekst, dan toets je hem als grafisch object: **eis 3:1**,
onder 1.4.11. Heeft de knop wél zichtbare tekst, dan geldt 1.4.3 met 4,5:1.

Meet op de werkelijke pixels wanneer de knop op een foto of verloop staat; `getComputedStyle`
geeft dan `rgba(0,0,0,0)` en een berekening op de CSS-waarden levert ten onrechte "voldoet"
op. Hoe je de uitkomst weegt, staat in "Foto, verloop en dunne lijnen: zo toetst W3C"
hieronder: niet het slechtste punt beslist, maar of het pictogram herkenbaar blijft.

Voorbeeld (2026-08-02): shift2.nl heeft een wit mannetje-icoon op een verloop over een foto.
Gemeten 2,05:1, op het slechtste punt 1,26:1. Toen keurden we af op dat slechtste punt. Volgens
W3C is de vraag of je het mannetje nog herkent als je het stuk onder de 3:1 wegdenkt; dat is
toen niet beoordeeld. Ijsselstein.nl gebruikt hetzelfde icoon op een vaste donkerblauwe
achtergrond `#003C49` en komt op 9,65:1.

De volledige testvolgorde (eerst de knop in de normale weergave, daarna de pagina in de
hoogcontrastweergave) staat in `Shift2_Regels_SC_1_4_3.md`.

## Eerst opzoeken WAT eronder valt, dan pas meten

Een oordeel over 1.4.11 is een uitspraak over alles wat op de pagina staat. Vier losse
metingen zijn dat niet, ook niet als ze alle vier voldoen. Begin daarom met de inventarisatie:

```
npm run cli -- get-nietteksten <url> [--klik="tekst:Contrast verhogen"]
```

Die loopt alle bedienbare elementen af, bepaalt in de browser welke eronder vallen en meet
die. Belangrijk is de lijst **overgeslagen met reden**: daar staat per element waarom het
afvalt — zichtbare tekst, logo, niets te meten. Loop die na. Staat er iets tussen dat wel
betekenis draagt, meet dat dan alsnog met `get-pixelcontrast`. En de aantallen tellen op:
bekeken = onzichtbaar + overgeslagen + eronder. Doen ze dat niet, dan is er iets stil
weggevallen.

Zichtbare tekst wordt in de browser bepaald, niet uit de HTML. Een knop met een `sr-only`-tekst
heeft in de code tekst en op het scherm niet, en telt dus als pictogram. Dat verschil is in
opgehaalde HTML niet te zien.

**Meet ook de toestanden, niet alleen de ruststand.** 1.4.11 geldt voor de weergaven die een
element aanneemt. Wisselt een knop op zweven van kleur, dan is dat een tweede weergave die de
eis net zo goed moet halen — en die zie je in de ruststand niet. `get-nietteksten` zet de muis
op elk element en meet opnieuw; het strengste van de twee bepaalt het oordeel. Op de homepage
gaan de sociale pictogrammen van 21:1 naar 6,69:1 op zweven: een echte verandering, maar ruim
boven de eis.

Valkuil bij die tweede meting: de muis op een element zetten scrollt het in beeld. Vanaf dat
moment lopen venstercoördinaten en paginacoördinaten uiteen, en fotografeer je een leeg stuk
achtergrond dat keurig 1:1 oplevert. Vijf pictogrammen kelderden zo van 21:1 naar 1:1 zonder
dat er iets aan de hand was. Zie je een verhouding van precies 1:1, wantrouw dan eerst de
meting.

Focustoestanden zitten er nog **niet** in. Dat is een gat, en de uitvoer zegt dat ook.

**Een pictogram meet je anders dan een veldrand.** Een pictogramknop is meestal een doorzichtig
linkvak om een svg: dat vak heeft geen rand en geen vulling, dus een omtrekmeting geeft
achtergrond tegen achtergrond en levert 1:1 op alle vier de zijden. Bij de eerste sweep over
heuvelrug.nl leverde dat acht afkeuringen op die geen van alle bestonden. Voor een pictogram
telt de tekening tegen wat eromheen ligt; voor een veldrand de begrenzing. `get-nietteksten`
kiest zelf welke van de twee.

Aanleiding (2026-08-17): Frits vroeg waarom er vijf bepaalde elementen onder 1.4.11 stonden.
Antwoord: niemand had ze gekozen. Elke `get-contrast`-aanroep werd aan 1.4.3 én 1.4.11
gehangen, ook als er alleen tekstkleuren waren gemeten. Op de homepage: 43 bedienbare elementen
bekeken, 1 onzichtbaar, 35 overgeslagen met reden (30 met zichtbare tekst, 1 logo, 1 zonder
pictogram), 7 eronder, waarvan 1 onder de eis.

## Een verhouding, geen kwalificatie — en die meet je op de beeldpunten

"Ruim boven 3:1" is geen onderbouwing. Er hoort een gemeten verhouding te staan, met de twee
kleuren waartussen gemeten is, en bij een afkeuring een schermafdruk waarop het te zien is.
Dit is dezelfde fout als bij 1.4.10, waar de vraag naar het uitklapmenu werd weggeschoven met
"dat valt onder 2.1.1" in plaats van dat er op 320 pixels geklikt werd: een argument op de plek
waar een meting hoort. Ook een kwalificatie in de plaats van een cijfer is die fout.

Staat het element op een foto, een verloop of een halfdoorzichtige laag, dan gebruik je
`npm run cli -- get-pixelcontrast <url> --selector=<css>`. Dat maakt een opname van het gebied,
leest de werkelijke beeldpunten uit en geeft de slechtste verhouding per zijde, met een
uitsnede op acht keer van elke zijde die onder de 3:1 blijft.

**In wélke weergave je meet, is de eerste vraag — niet de laatste.** Heeft de site een
hoogcontrastknop die zelf voldoet, dan wordt de standaardweergave niet meer inhoudelijk op
contrast getoetst en gaat het om de weergave ná het aanzetten. Dat is stap 2 uit
`Shift2_Regels_SC_1_4_3.md` en die geldt hier onverkort:

```
npm run cli -- get-pixelcontrast <url> --selector=<css> --klik="tekst:Contrast verhogen"
```

Doe dat headless, niet in de auditsessie: de hoogcontrastweergave blijft in `localStorage`
staan en vervuilt anders elke volgende meting.

Vier dingen die de meting zelf fout doen als je ze niet weet:

| Valkuil | Wat er gebeurt | Hoe de meting het opvangt |
|---|---|---|
| De standaardweergave meten terwijl de site een geldige hoogcontrastknop heeft | Je beoordeelt een weergave die niet meetelt | `--klik`; de uitkomst vermeldt in `weergave` welke gemeten is |
| Eén vast aftastpunt gebruiken | Een randlijn van één beeldpunt ligt bij een element dat op een halve beeldpunt begint niet waar je hem verwacht, en dan mis je hem volledig | Een bandje van vijf beeldpunten naar binnen; de beste daarvan telt, en `diepte` zegt waar hij zat |
| Alleen de randlijn of alleen de vulling nemen | Een element mag zich door allebei onderscheiden; op de plek waar de achtergrond net zo licht is als een grijs lijntje wijst het witte vlak het veld nog prima aan | Zit in datzelfde bandje |
| De hoeken meemeten | Bij een afgeronde hoek kijkt een rechte omtrek langs het element heen: binnen én buiten wijzen naar de achtergrond, en er komt 1:1 uit op een element dat verder voldoet | De ronding wordt uit de opmaak gelezen en die strook overgeslagen |

**Keur nooit af op het getal alleen — leg de uitsnede ernaast.** Bij de onderrand van deze
zoekbalk meldde de meting 1,86:1, wit tegen lichtgrijs, terwijl op de uitsnede een zwarte lijn
stond die het gewoon goed deed: het aftastpunt lag één beeldpunt naast de rand. Kijk ook naar
`dwarsdoorsnede_bovenrand`; staat daar niet eerst de achtergrond en dan de vulling, dan meet je
iets anders dan de rand, hoe geloofwaardig het getal er ook uitziet.

Aanleiding (2026-08-17): de zoekbalk op de homepage van heuvelrug.nl staat op een foto. Gemeten
in de hoogcontrastweergave — de weergave die telt, want de knop van deze site voldoet met
5,68:1: links 7,57:1, boven 2,56:1, onder 2,09:1, rechts 1,93:1. De drie zijden die tekortkomen
zijn alle drie de **zoekknop**, die in die weergave zwart is en tegen een donker stuk foto
staat; het witte veld zelf haalt de eis. De knop blijft aanwijsbaar: het witte vergrootglas erop
en de grens met het witte veld ernaast halen allebei 21:1. Zonder de uitsplitsing per zijde zou
hier "1,93:1, valt af" hebben gestaan over een balk die het grotendeels goed doet.

## Foto, verloop en dunne lijnen: zo toetst W3C

Besluit Frits 2026-10-11: hier volgen we W3C, ook waar onze eerdere regel strenger was. Het is
hun eigen testprocedure, en een afkeuring die strenger is dan W3C kan een leverancier met de
W3C-tekst in de hand aanvechten.

**Op een foto of verloop beslist niet het slechtste punt, maar de herkenbaarheid.** Neem het
deel van het onderdeel met het minste contrast. Haalt dat 3:1, dan voldoet het. Haalt het dat
niet, denk dat deel dan weg, alsof je het niet ziet. Herken je het onderdeel nog aan wat
overblijft, dan voldoet het; valt het weg of wordt het onherkenbaar, dan is het een afkeuring
(Understanding 1.4.11, "Testing principles" en "Gradients", Figuur 23). Een wit pictogram
waarvan de onderste helft op een licht stuk foto staat, kan dus voldoen als de bovenste helft
de vorm al duidelijk maakt. Schrijf in de toelichting welk deel onder de 3:1 viel en waarom het
onderdeel daarna nog wel of niet herkenbaar is, met de uitsnede ernaast. `get-pixelcontrast`
blijft de meting: die geeft het slechtste punt per zijde, en daarmee weet je wélk deel je
moet wegdenken.

**Beoordeel de ingestelde kleur, niet de vervaagde weergave.** Een dunne lijn wordt door het
scherm vaak lichter getekend dan de kleur die de site of het document heeft ingesteld. W3C zegt:
gebruik de kleur uit de code of het document, niet wat er op het scherm verschijnt
(Understanding 1.4.11, tweede noot). Een veldrand die in de CSS #767676 is (4,54:1) voldoet dus,
ook als de beeldpunten op het scherm #A0A0A0 laten zien. Dunne lijnen raadt W3C wel af; dat
kan in het advies, niet als afkeuring.
- Op een website: de kleur uit de opgemaakte stijl (`get-contrast`, `get-nietteksten`). Meet
  alleen op de beeldpunten waar er geen bruikbare stijlkleur is: een foto, een verloop, een
  halfdoorzichtige laag, of een achtergrond die `rgba(0,0,0,0)` geeft.
- In een PDF met een getekende grafiek (vectoren): de vul- en lijnkleur uit het document.
  `get-pdfnietteksten` leest nog beeldpunten; bij een dunne lijn onder de 3:1 kijk je daarom
  de kleur in het document na voordat je afkeurt.
- Bij een plaatje of foto, ook een grafiek die als afbeelding in een PDF staat: daar zijn de
  beeldpunten van het plaatje zelf de bron. Lees ze af op de eigen resolutie van het plaatje,
  niet op een vergrote weergave.

## Alleen wat je NODIG hebt om iets te begrijpen of te bedienen

1.4.11 geldt niet voor elk gekleurd element. De vraag is of het grafische onderdeel nodig is om
de inhoud te begrijpen of het element te bedienen. Is het weg te denken zonder dat iemand iets
mist, dan is het decoratief en valt het buiten dit criterium.

**Geen bevinding:**

| Wat | Waarom |
|---|---|
| Omranding van een knop met tekst erin | De knop is te herkennen aan zijn tekst; de rand voegt niets toe |
| Opsommingstekens (bolletjes, streepjes) | De lijstitems staan als tekst onder elkaar; wie het bolletje niet ziet mist geen informatie |
| Decoratieve lijnen, vlakken en achtergrondvormen | Dragen geen informatie |
| Een kleurvlak dat alleen de opmaak verzorgt | Idem |

**Wel beoordelen:**

| Wat | Waarom |
|---|---|
| Een icoon zonder tekst ernaast | Dat icoon is de enige aanduiding van de functie |
| Focusindicator | Nodig om te zien waar je bent bij toetsenbordbediening |
| De rand van een invulveld zonder andere markering | Nodig om te zien waar je moet typen |
| Segmenten van een grafiek, legendasymbolen | Dragen de informatie zelf |
| Een streepje of pijl dat een status aanduidt | Draagt informatie |

Twijfel je? Denk het element weg en kijk of er informatie verdwijnt. Zo niet, dan is het
decoratief.

Aanleiding: BEV-03 (2026-08-04), Financiële wegwijzer. De blauwe opsommingsbolletjes halen met
`#41C0F0` op wit maar 2,1:1, maar zijn decoratief: de lijstitems staan als tekst onder elkaar en
de indeling in subsidies en leningen blijkt al uit de kolommen. Ook de omranding van de acht
knoppen viel af, want de knoppen hebben tekst. Vastgesteld door Frits.

## Grafieken: tegen de achtergrond én tegen elkaar (G209)

Dit geldt voor elke grafiek, op een website en in een PDF. Tot 2026-10-11 stond het alleen bij
de PDF-regels.

**TEGEN DE ACHTERGROND ÉN TEGEN ELKAAR.** De onderdelen van een grafiek die nodig zijn om
de informatie te begrijpen, moeten 3:1 halen tegen de achtergrond, én tegen een aangrenzend
onderdeel als die twee van elkaar onderscheiden moeten worden (W3C Understanding 1.4.11, het
voorbeeld met de taartgrafiek: "sufficient contrast around and between the slices"). De
voldoende techniek daarvoor is G209, "Provide sufficient contrast at the boundaries between
adjoining colors"; W3C noemt hem bij de situatie "Color is required to understand
graphical content".
WAT JE MEET HANGT AF VAN WAT ER TUSSEN LIGT. Raken twee vlakken elkaar, dan meet je de twee
kleuren tegen elkaar. Ligt er een lijn tussen, zoals de witte scheidingslijnen in een
cirkeldiagram, dan is die lijn de grens die je ziet: meet dan elke kleur tegen die lijn, en
NIET de twee kleuren tegen elkaar. Een cirkeldiagram met witte lijnen keur je dus af op
"geel tegen wit 1,64:1", niet op het onderlinge contrast van twee segmenten.
`get-pdfnietteksten` zet dit onder `buren`, met de scheiding erbij.
Besluit Frits 2026-10-11 bij LEU-01 (V047): de bevinding gaf eerst lichtblauw tegen groen
(1,09:1) als onderbouwing, terwijl daar een witte lijn tussen ligt.

**EEN RAND TELT ALLEEN ALS HIJ TEGEN BEIDE KANTEN 3:1 HAALT (G209).** Halen twee kleuren
die tegen elkaar aan liggen onderling geen 3:1, dan kan een rand ertussen dat oplossen, maar
alleen als die rand 3:1 haalt met elk van de twee kleuren. De test uit G209: meet elke kleur
tegen de kleur ernaast, of tegen de rand als die er is. Dat geldt ook voor de grens met de
achtergrond: een donkere omlijning om een lichte balk telt pas als hij 3:1 haalt tegen de
achtergrond én tegen de vulkleur van de balk. Een rand die alleen tegen de achtergrond
afsteekt, telt niet.
MEET DE LIJN ZELF, OP DE PLEK WAAR HIJ LIGT. Een lijn kan een grens duidelijker maken en
toch te weinig contrast hebben; schrijf daarom niet "de lijn maakt de grens niet duidelijker",
maar meet hem. Lees de kleur af in de bron: in de code of het document, of bij een plaatje
op de eigen resolutie van dat plaatje (niet op een vergrote weergave, die de lijn vervaagt).
Neem de kleur van de lijn op de grens zelf, niet die van de rand elders om hetzelfde vlak:
op pagina 74 van LEU-01 is de rand aan de bovenkant van de grijze balk #6B6B6B, maar tussen
grijs en turquoise ligt #4B8687, met één beeldpunt overgang (#AAAAAA) ernaast. Een eerdere
versie van V047 noemde 2,63:1 op grond van die #6B6B6B. Schrijf het zo:
"De scheidingslijn tussen deze delen (#4B8687) heeft tegenover het turquoise een contrast
van 2,05:1. Daardoor is ook met deze lijn de grens onvoldoende zichtbaar."
Noem de kant waar het misgaat, met de laagste verhouding. Besluit Frits 2026-10-11.
Vastgelegd door Frits op 2026-10-10 en 2026-10-11 bij LEU-01 (V047). Een rand telde eerst
mee zodra hij tegen wit afstak; volgens G209 is dat te mild. Op pagina 74 haalt de rand om
het turquoise 4,15:1 tegen wit, maar 2,05:1 tegen het turquoise zelf. Blauw en paars daar
zijn even donker (1,77:1); dat welk deel welke overtreding is alleen aan de kleur te zien is,
is 1.4.1 (V044), dat je de grens tussen de twee niet ziet is 1.4.11.

**ADVIES BIJ EEN GRAFIEK: LABELS ÉN WAARDEN.** Alleen een naam bij een segment vertelt niet
hoe groot het is. W3C noemt labels met waarden die dezelfde informatie overbrengen als
alternatief (Understanding 1.4.11, Figuur 47); de andere oplossingen zijn kleuren die onderling
3:1 halen, of contrasterende randen (G209). Besluit Frits 2026-10-11 bij V047.

**EEN LIJNGRAFIEK IS ANDERS DAN VLAKKEN.** De lijnen van een lijngrafiek moeten 3:1 halen tegen
de achtergrond, maar niet tegen elkaar: ze overlappen elkaar weinig, en waar ze elkaar kruisen
vult het oog de lijn aan (W3C Understanding 1.4.11, Figuur 20, en de "law of continuity"). Wel
moeten de rasterlijnen 3:1 halen als je ze nodig hebt om de waarden af te lezen; W3C rekent ze
in dat voorbeeld uitdrukkelijk tot de onderdelen die nodig zijn. "Tegen elkaar" geldt dus voor
vlakken die aan elkaar grenzen -- segmenten van een cirkel, delen van een gestapelde balk,
gebieden op een kaart -- en niet voor lijnen die elkaar kruisen.

## Uitzonderingen en grensgevallen volgens W3C

Uit W3C Understanding 1.4.11, naast deze regels gelegd op 2026-10-11. Elk punt noemt waar het
staat, zodat je het kunt nalezen.

**Niet afronden.** 3:1 is een drempel: 2,999:1 haalt hem niet. Schrijf de verhouding met twee
decimalen en keur af onder 3,00 (Understanding, eerste noot).

**Uitgezonderd: inactieve elementen.** Een knop die zichtbaar is maar nog niet bediend kan
worden, zoals een verzendknop die pas werkt als alle velden zijn ingevuld, hoeft geen 3:1 te
halen (Understanding, "Inactive User Interface Components").

**Uitgezonderd: de browser zelf.** Wat de browser tekent en de site niet aanpast, valt erbuiten,
ook de standaard focusrand. Die moet onder 2.4.7 wel zichtbaar zijn. Past de site de weergave
aan, dan geldt de eis wel (Understanding, Figuur 29, en de tekst van het criterium zelf).

**Uitgezonderd: logo's.** Een logo wordt in de huiskleuren getoond en hoeft geen 3:1 te halen.
Behalve als de site het zelf flets weergeeft, bijvoorbeeld grijs tot je erover beweegt: die
weergave is een keuze van de site en niet van de huisstijl, en dan geldt de eis wel
(Understanding, "Logos", Figuur 22 en 27). Is het logo een link, dan is een logo met meer
contrast een aanbeveling en geen afkeuring.

**Uitgezonderd: wat alleen in deze vorm kan.** Vlaggen, foto's van mensen en landschappen,
schermafdrukken van een website, medische afbeeldingen in de kleuren van het lichaam, en
heatmaps waarin de kleur de meetwaarde is (Understanding, "Essential exception"). Kaarten
vallen voor ons onder de wettelijke uitzondering voor de overheid.

**Niet nodig voor het begrip.** Een grafisch onderdeel hoeft geen 3:1 te halen als dezelfde
informatie er als tekst staat (labels én waarden bij de grafiek), als hij er alleen voor de
sier staat, of als de informatie er ook in een andere vorm is, zoals een tabel of een lange
beschrijving (Understanding, "Required for understanding"). De tekst in of bij de grafiek valt
dan onder 1.4.3.

**Een teken als symbool is geen tekst.** Een X als sluitknop of een > als pijl wordt gebruikt
om zijn vorm, niet als woord. Dat is niet-tekstuele content: 3:1 onder 1.4.11, niet 4,5:1
onder 1.4.3 (Understanding, "Symbolic or graphical text characters", Figuur 26). Een sterk
gestileerde letter die als beeld werkt valt hier ook onder.

**Welke kleuren je meet bij een bedieningselement.** Een invulveld meet je tegen de kleur
buiten het veld: wit veld, donkere rand, witte pagina betekent dat de rand moet afsteken tegen
de witte pagina (Understanding, "Adjacent colors", Figuur 2). Ligt een veld met een lichte
binnenkant op een donkere achtergrond, dan is dat verschil genoeg en hoeft een rand ertussen
niet zelf te contrasteren: hij hoort bij de kleur waar hij het meest op lijkt (Figuur 3). Een
toestandsaanduiding binnen het element, zoals het vinkje in een selectievakje of de knop van
een schuifregelaar, meet je tegen de kleur van het element zelf (Figuur 4).

**Waar de focusrand tegen moet afsteken hangt af van waar hij ligt.** Buiten het element: tegen
de achtergrond. Binnen het element: tegen de kleur van het element. Op de rand van het element:
tegen allebei. Deels binnen en deels buiten: één van de twee delen is genoeg (Understanding,
"Relationship with Focus Visible", Figuur 8 tot 14). Een focusrand die door de opmaak verdwijnt
of onzichtbaar wordt, is fout-techniek F78. Een focusrand in twee kleuren, zodat hij op elke
achtergrond afsteekt, is voldoende techniek C40.

**Zweven en andere toestanden.** Een extra effect bij zweven, zoals een lichtgrijze achtergrond,
hoeft zelf geen 3:1 te halen: de muisaanwijzer laat al zien waar je bent. Het element mag door
dat effect wel zijn eigen contrast niet verliezen (Understanding, "Hover states", Figuur 40).
Dat is wat `get-nietteksten` meet: het pictogram of de rand in de zweefstand, tegen wat er dan
omheen ligt. Of de focus- of zweefstand genoeg verschilt van de ruststand, valt niet onder
1.4.11; verschilt alleen de kleur, dan is dat 1.4.1 (Figuur 15).

**Een gekleurde onderstreping als enige kenmerk van een link** moet 3:1 halen tegen de
achtergrond (Understanding, Figuur 41). De gewone onderstreping in de tekstkleur voldoet altijd,
want die tekst haalt al 4,5:1 onder 1.4.3 (Figuur 28).

**Een grafiek die pas bij aanwijzen iets laat zien.** Geeft een grafiek de waarden of meer
contrast pas als je met de muis of het toetsenbord op een onderdeel staat, dan moet de
standaardweergave al genoeg contrast of tekst hebben: anders weet niemand dat er iets aan te
wijzen valt (Understanding, "Interactive changes in contrast", Figuur 24).

**Alleen een andere tint is 1.4.1, niet 1.4.11.** Sterren die geel of wit gevuld zijn met
dezelfde zwarte omtrek verschillen alleen in tint; dat is een afkeuring onder 1.4.1. Zijn ze
geel tegen wit met 1,2:1 en zonder omtrek, dan is het 1.4.11 (Understanding, "Relationship
with Use of Color", Figuur 7). Een link die 3:1 verschilt van de lopende tekst voldoet aan
1.4.1 (techniek G183).

**De technieken.** Voldoende volgens W3C (Understanding 1.4.11, "Techniques"):

| Situatie | Techniek |
|---|---|
| Kleur wijst een bedieningselement aan | G174: een knop naar een weergave met genoeg contrast. Dat is onze hoogcontrastregel. |
| Kleur wijst de focus aan | G195: een eigen, zichtbare focusrand. C40: een focusrand in twee kleuren. |
| Kleur is nodig om een graphic te begrijpen | G207: 3:1 voor pictogrammen. G209: genoeg contrast op de grens tussen aangrenzende kleuren. |

Fout-techniek: F78, een focusrand die door de opmaak verdwijnt of onzichtbaar wordt. Een
techniek is een manier om te voldoen, geen eis; zie `Shift2_Bewijsvoering.md`.

## Regels

- Zelfde hoogcontrast-werkwijze als 1.4.3: heeft de site een hoogcontrast-knop met voldoende eigen contrast, dan een opmerking op het homepage-sample (status resolved, impact en responsibility leeg), QuickFinding 0a811ca3-e7b3-4909-846a-68525eb55948, en daarna HTML-paginas niet meer inhoudelijk checken.
- Bij een PDF gaat 1.4.11 over de niet-tekstuele dragers in het document: de lijnen en
  vlakken van een grafiek of diagram, de zones van een kaart, een pictogram dat betekenis
  draagt. Een PDF heeft geen bedieningselementen, dus die helft van het criterium vervalt;
  wat overblijft is "betekenisvolle graphics".
- PAC GAAT VOOR, JE EIGEN METING VULT AAN, net als bij 1.4.3. Ligt er PAC-uitvoer met
  contrastmeldingen die over een afbeelding of grafisch element gaan in plaats van over tekst,
  dan is dat een afkeuring onder 1.4.11. Gaan de meldingen over tekst, dan horen ze onder
  1.4.3; PAC benoemt dat zelf ("Tekst met onvoldoende contrast").
- Meet het met `npm run cli -- get-pdfnietteksten <pdf-url>`. Dat zoekt per pagina de
  afbeeldingen en groepen tekeningen op, telt de vlakke kleuren erin en zet elke kleur tegen de
  achtergrond en tegen de kleur ernaast, met een uitsnede per onderdeel. Het werkt onafhankelijk
  van de tagstructuur. Lees `overgeslagen_met_reden` na: tabelranden en gekleurde vlakken achter
  tekst slaat het over, want die horen niet hier (een vlak achter tekst is 1.4.3). Een onderdeel
  met `fotoOfVerloop` heeft geen vlakke kleuren; daar weeg je met de uitsnede.
  Het commando keurt niets af. Een kleur onder 3:1 is alleen een afkeuring als het onderdeel
  nodig is om de informatie te begrijpen, en als die informatie er niet ook anders staat, zoals
  een percentage bij elk segment. Lichte tinten van een grafiekvlak, sierlijnen en het logo
  tellen niet mee; een kaart valt onder de wettelijke uitzondering. Wat je bij een grafiek
  meet en hoe je het opschrijft, staat in de sectie "Grafieken" hierboven.
  `get-pdfcontrast` meet alleen TEKST. Tot 2026-10-10 stond hier dat je 1.4.11 daarmee mat;
  op LEU-01 las de agent de kleuren van de cirkeldiagrammen daarom met een eigen stukje code
  uit, en de kaart toonde "niet gemeten" bij een oordeel dat wel op een meting rustte.
- Bevat het document geen grafieken, diagrammen, kaarten of betekenisvolle pictogrammen, dan
  is 1.4.11 `niet_aanwezig`. Dat is een afgerond oordeel en vraagt geen PAC-uitvoer: dát er
  niets van die soort in staat, zie je aan de gerenderde pagina's. Schrijf wel waaróp je hebt
  gekeken.
- `niet_te_bepalen` is bij contrast nog maar één geval: een SCAN, een pagina met beeld maar
  zonder tekstlaag. Die komt terug onder `paginasZonderTekstlaag`; doet hij ertoe, vraag dan
  een schermafdruk met een contrastmeting. Een LEGE pagina (`paginasLeeg`) is iets anders: daar
  staat niets op en er is niets aan de hand.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Bedieningselementen en betekenisvolle graphics halen 3:1

### In het kort

Een pictogramknop, de rand van een invulveld, een grafieksegment, een statuspijl: alles wat
je nodig hebt om iets te begrijpen of te bedienen moet 3:1 halen tegen wat eromheen ligt.
Wat je kunt wegdenken zonder iets te missen, zoals de rand van een knop met tekst erin of
een opsommingsbolletje, valt erbuiten.

Eerst opzoeken wat eronder valt, dan meten. Heeft de site een hoogcontrastknop die zelf
voldoet, dan telt de weergave mét die knop. Een verhouding is een getal met twee kleuren en
een uitsnede, geen "ruim boven 3:1".

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-nietteksten <url>`, met `--klik="tekst:Contrast verhogen"` als de site een
   geldige hoogcontrastknop heeft: loopt alle bedienbare elementen af, bepaalt welke eronder
   vallen en meet die in ruststand én met de muis erop.
2. [meting] `get-pixelcontrast <url> --selector=<css>` voor elk element dat op een foto, een
   verloop of een halfdoorzichtige laag staat: de werkelijke beeldpunten, per zijde, met een
   uitsnede. Alleen daar: waar een stijlkleur bestaat, telt die.
3. [meting] De hoogcontrastknop zelf, één keer op de homepage: als icoon zonder tekst geldt
   3:1 onder dit criterium; met zichtbare tekst is het 1.4.3.

#### Stap 2 — Beoordelen

4. [agent] Loop `overgeslagen_met_reden` na en tel: bekeken = onzichtbaar + overgeslagen +
   eronder. Staat er iets tussen dat betekenis draagt, meet dat alsnog.
5. [agent] Per element onder de eis: leg de uitsnede ernaast. Precies 1:1 is eerst een
   verdachte meting, daarna pas een afkeuring. Bij een pictogram telt de tekening, bij een
   veld de rand. Op een foto of verloop: denk het deel onder de 3:1 weg en kijk of het
   element herkenbaar blijft. Bij een dunne lijn: de ingestelde kleur telt, niet de vervaagde
   weergave. Zie "Foto, verloop en dunne lijnen: zo toetst W3C".
6. [agent] Decoratief, nodig of uitgezonderd? Denk het element weg; verdwijnt er geen
   informatie, dan valt het erbuiten. Uitgezonderd zijn inactieve elementen, wat de browser
   zelf tekent, logo's (tenzij de site ze zelf flets maakt) en wat alleen in deze vorm kan;
   staat dezelfde informatie er als tekst, dan is het onderdeel niet nodig. Zie
   "Uitzonderingen en grensgevallen volgens W3C". Een X of > als knop telt als pictogram.
   Bij een grafiek: de sectie "Grafieken".
7. [jij] Focustoestanden zitten nog niet in de meting. Tab in de auditsessie langs de
   bedienbare elementen en kijk of de focusrand 3:1 haalt: buiten het element tegen de
   achtergrond, binnen het element tegen het element, op de rand tegen allebei. De
   ongewijzigde focusrand van de browser valt erbuiten.

#### Stap 3 — Vastleggen

8. [agent] Stuur de vijf deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
9. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.
10. [agent] Heeft de site een hoogcontrastknop die zelf voldoet, en heb je daarom in de
   hoogcontrastweergave gemeten, maak dan op het **homepage-sample** een opmerking met de
   snelle bevinding 0a811ca3 ("Hoog contrast - Contrast switch"), tekst ongewijzigd, als
   voorstel. Koppel hem aan het gebied "De hoogcontrastknop zelf ..." met uitkomst
   `opmerking`, en zet het oordeel van die pagina op `opmerking`. Precies zoals bij 1.4.3,
   waar dezelfde situatie de opmerking uit de snelle bevinding voor 1.4.3 oplevert. De
   opdrachtgever moet weten dat de standaardweergave niet is beoordeeld, ook als daar
   elementen onder de 3:1 zitten. Op NIS-01 (2026-10-23) ontbrak hij: de regel stond alleen
   in de lijst onderaan dit bestand, niet in deze stappen, terwijl 1.4.3 hem wel had.

### Zo is het vastgesteld

`get-nietteksten` inventariseert in de browser wat onder 1.4.11 valt, met de lijst van wat
is overgeslagen en waarom, en meet rust en hover. `get-pixelcontrast` meet op de
beeldpunten waar stijlwaarden niets zeggen, per zijde en met hoekronding overgeslagen.

Wat hier niet uit blijkt: de focustoestand, of een gemeten element werkelijk nodig is om
iets te begrijpen, en of een element op een foto herkenbaar blijft als je het deel onder de
3:1 wegdenkt. Dat weegt de agent, en de uitsnede beslist bij twijfel over het getal.

### Deelgebieden

1. Pictogramknoppen zonder zichtbare tekst: de tekening tegen de omgeving
2. Randen van invoervelden en andere bedieningselementen zonder andere markering
3. Betekenisvolle graphics: grafieksegmenten, legendasymbolen, statuspijlen en -strepen
4. Toestanden: met de muis erop gemeten; focus nog niet gemeten, dus nagelopen in de auditsessie
5. De hoogcontrastknop zelf, één keer op de homepage, en welke weergave daarna telt

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
