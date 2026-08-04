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

## Regels

- Zelfde hoogcontrast-werkwijze als 1.4.3: heeft de site een hoogcontrast-knop met voldoende eigen contrast, dan een opmerking op het homepage-sample (status resolved, impact en responsibility leeg), QuickFinding 0a811ca3-e7b3-4909-846a-68525eb55948, en daarna HTML-paginas niet meer inhoudelijk checken.
- Bij PDF-content is 1.4.11 meestal niet relevant.
