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
