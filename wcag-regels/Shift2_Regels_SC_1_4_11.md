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
op. Neem in dat geval het slechtste punt, niet het gemiddelde.

Voorbeeld (2026-08-02): shift2.nl heeft een wit mannetje-icoon op een verloop over een foto.
Gemeten 2,05:1, op het slechtste punt 1,26:1. Dat haalt de 3:1 niet. Ijsselstein.nl gebruikt
hetzelfde icoon op een vaste donkerblauwe achtergrond `#003C49` en komt op 9,65:1.

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

## Regels

- Zelfde hoogcontrast-werkwijze als 1.4.3: heeft de site een hoogcontrast-knop met voldoende eigen contrast, dan een opmerking op het homepage-sample (status resolved, impact en responsibility leeg), QuickFinding 0a811ca3-e7b3-4909-846a-68525eb55948, en daarna HTML-paginas niet meer inhoudelijk checken.
- Bij PDF-content is 1.4.11 meestal niet relevant.

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
   uitsnede.
3. [meting] De hoogcontrastknop zelf, één keer op de homepage: als icoon zonder tekst geldt
   3:1 onder dit criterium; met zichtbare tekst is het 1.4.3.

#### Stap 2 — Beoordelen

4. [agent] Loop `overgeslagen_met_reden` na en tel: bekeken = onzichtbaar + overgeslagen +
   eronder. Staat er iets tussen dat betekenis draagt, meet dat alsnog.
5. [agent] Per element onder de eis: leg de uitsnede ernaast. Precies 1:1 is eerst een
   verdachte meting, daarna pas een afkeuring. Bij een pictogram telt de tekening, bij een
   veld de rand.
6. [agent] Decoratief of nodig? Denk het element weg; verdwijnt er geen informatie, dan valt
   het erbuiten.
7. [jij] Focustoestanden zitten nog niet in de meting. Tab in de auditsessie langs de
   bedienbare elementen en kijk of de focusrand 3:1 haalt.

#### Stap 3 — Vastleggen

8. [agent] Stuur de vijf deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
9. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-nietteksten` inventariseert in de browser wat onder 1.4.11 valt, met de lijst van wat
is overgeslagen en waarom, en meet rust en hover. `get-pixelcontrast` meet op de
beeldpunten waar stijlwaarden niets zeggen, per zijde en met hoekronding overgeslagen.

Wat hier niet uit blijkt: de focustoestand, en of een gemeten element werkelijk nodig is om
iets te begrijpen. Dat weegt de agent, en de uitsnede beslist bij twijfel over het getal.

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
