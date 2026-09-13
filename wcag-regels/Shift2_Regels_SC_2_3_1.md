# Shift2-beoordelingsregels SC 2.3.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_3_1.md` als ze elkaar tegenspreken.

## De vraag

Flitst er iets op de pagina vaker dan drie keer per seconde? Dat mag niet, tenzij het
flitsende vlak klein genoeg is (ongeveer 2,8% van het beeld, een kwart van een gezichtsveld
van tien graden) of de helderheidssprong te zwak is om iets te doen. Dit is een van de vier
criteria met **non-interferentie**: ook een video die de bezoeker zelf start en een kader van
een ander domein tellen mee, en één flitsend onderdeel keurt de hele pagina af.

## Geen flitsende content is `voldoet`, niet `niet_aanwezig`

Zie `Shift2_Voldoet_Of_Niet_Aanwezig.md`: de eis is een verbod, en een statische pagina houdt
zich daaraan. Een PDF kan niet flitsen en voldoet dus ook. Zet 2.3.1 nooit op
`niet_aanwezig` omdat er niets beweegt; dat is precies de fout die op 2026-08-04 bij BEV-03
is gecorrigeerd.

Komen er bij `get-flitsen` geen beeldjes binnen, dan heeft de pagina niet opnieuw getekend en
kan er niets geflitst hebben. Ook dat is `voldoet`.

## Wat wél een afkeuring is

- **Een video met stroboscoop, bliksem, explosies of snelle camera-flitsen**, ook als de
  bezoeker hem zelf start. Meet hem op zijn eigen pagina met `get-flitsen <video-url>`, want
  op de pagina zelf staat hij achter een voorblad of een toestemmingsscherm.
- **Een geanimeerde afbeelding of een CSS- of scriptanimatie** die sneller dan drie keer per
  seconde van helder naar donker springt: knipperende lichtjes, vuurwerk, een laadanimatie
  die flitst.
- **Een kader van een ander domein** met zulke content. De site-eigenaar is er
  verantwoordelijk voor, ook al staat het in een advertentie of een sociale-mediawidget.

Impact **kritiek**: dit kan een aanval uitlokken. Verantwoordelijkheid **redacteur** bij een
video of afbeelding, **ontwikkelaar** bij een animatie in de code.

## Wat GEEN bevinding is

- **Beweging zonder helderheidssprongen**: een vloeiende overgang, een langzame fade, een
  carrousel die schuift. Of dat te pauzeren is, hoort bij 2.2.2.
- **Een knipperende cursor** of een knipperend pictogram van één keer per seconde.
- **Een flitsend vlakje dat kleiner is dan de gebiedsgrens**. Let op: dat is 2,8% van het
  beeld, niet een kwart van het scherm.

## De meting is een zeef, geen keuring

`get-flitsen` leest de beeldjes mee die de browser tekent en telt per blok de tegengestelde
helderheidssprongen (10% van de schaal, donkerste onder 0,80), met een aparte toets op
verzadigd rood. Het beeld wordt verkleind en samengeperst, en alleen wat in beeld staat wordt
opgenomen. Meldt de zeef sprongen, laat het videobestand dan door PEAT halen voor een echt
oordeel; keur nooit af op het getal alleen.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Niets flitst vaker dan drie keer per seconde

### In het kort

Een flits is een snelle sprong van helder naar donker en terug. Meer dan drie per seconde
kan bij wie daar gevoelig voor is een aanval uitlokken, en daarom mag het nergens op de
pagina: niet in een video, niet in een animatie, niet in een kader van een ander domein.
Ook een video die de bezoeker zelf start telt mee.

Beweegt er niets, dan voldoet de pagina. Dat is geen "niet aanwezig": de eis is een
verbod, en een stille pagina houdt zich eraan. Een PDF kan niet flitsen en voldoet dus.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-flitsen <url>`: de pagina tien seconden laten tekenen en per blok de
   helderheidssprongen tellen. Komen er geen beeldjes, dan heeft de pagina niet opnieuw
   getekend en kan er niets geflitst hebben.
2. [meting] `get-flitsen <video-url>` voor elke video die het commando op de pagina vond: de
   video op zijn eigen pagina, met de speler gedempt aan. Eerst het insluitadres; weigert
   YouTube dat, dan de watchpagina. Staat er een toestemmingsvenster voor, dan blijft de
   uitkomst `beslist: false` tot je `--klik="tekst:Alles afwijzen"` meegeeft.
3. [meting] `get-beweging <url>`: wat er uit zichzelf beweegt of bijwerkt. Alleen wat
   beweegt kan flitsen; dit zegt wáár je moet kijken.

#### Stap 2 — Beoordelen

4. [agent] Geen beeldjes of geen sprongen: `voldoet`. Schrijf bij de deelgebieden op wat er
   gemeten is, ook als de uitkomst nul was.
5. [agent] Meldt de zeef sprongen, kijk dan naar het blok: hoe groot is het vlak, en zit het
   in een video, een afbeelding, een animatie of een kader? Een vlakje onder de gebiedsgrens
   is geen afkeuring.
6. [jij] Bij een video waar de zeef sprongen meldt, of die zichtbaar bliksem, stroboscoop of
   explosies bevat: laat het videobestand door PEAT halen. De zeef is geen keuring.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-flitsen` leest de beeldjes mee die de browser tekent en telt per blok de tegengestelde
helderheidssprongen, met een aparte toets op verzadigd rood; een video meet het op zijn
eigen pagina met de speler aan. `get-beweging` zegt wat er beweegt en dus kan flitsen.

Wat hier niet uit blijkt: het beeld wordt verkleind en samengeperst, en alleen wat in beeld
staat wordt opgenomen. Een video achter een toestemmingsscherm is niet gemeten zolang dat
scherm er staat. Dit is een zeef die zegt waar je moet kijken; een echt oordeel over een
video komt uit PEAT.

### Deelgebieden

1. Video's op de pagina, elk apart gemeten op zijn eigen pagina met de speler aan
2. Geanimeerde afbeeldingen: GIF, APNG en SVG-animaties
3. CSS- en scriptanimaties, laadanimaties en carrousels
4. Kaders van een ander domein: kaarten, sociale media, advertenties en widgets

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.4.2, 3.1.1,
> 3.1.2, 3.3.1, 3.3.3 en 3.3.7: die criteria hadden geen regelbestand en dus geen kaartblok.
> De regels komen uit de checklist, uit `Shift2_Voldoet_Of_Niet_Aanwezig.md` en uit de
> beschrijving van `get-flitsen` in CLAUDE.md; er zitten nog geen correcties uit audits in.
> Zet uitleg bij deze lijst altijd als blokcitaat: een gewone alinea eronder plakt de
> kaartlezer aan het laatste gebied vast.
