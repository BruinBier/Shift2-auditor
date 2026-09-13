# Shift2-beoordelingsregels SC 3.3.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_3_2.md` als ze elkaar tegenspreken.

## 3.3.2 gaat over wat er staat, niet over hoe het gekoppeld is

Beoordeel of er een label of instructie **aanwezig** is bij een invoerveld, en of die de
gebruiker vertelt wat er wordt gevraagd. Dit is een oordeel over de inhoud die iemand ziet
en leest.

De programmatische koppeling — `for`, `aria-labelledby`, `aria-describedby` — hoort bij
**1.3.1** (Info en relaties). Die koppeling is **geen bewijs voor 3.3.2** en hoort niet in
de onderbouwing van dit criterium thuis.

### Waarom dit onderscheid ertoe doet

De twee criteria kunnen los van elkaar slagen en zakken:

- `<label for="f1">Veld 1</label>` — perfect gekoppeld, maar het label zegt niets.
  Voldoet aan 1.3.1, **niet** aan 3.3.2.
- Een duidelijk zichtbaar label "Uw postcode" dat niet aan het veld is gekoppeld.
  Voldoet aan 3.3.2, **niet** aan 1.3.1.

Wie de koppeling als bewijs voor 3.3.2 gebruikt, kan op beide criteria het verkeerde
antwoord geven — en dat valt niet op, want er staat een geloofwaardige zin.

### Wat je bij 3.3.2 wél beoordeelt

- Heeft elk invoerveld een zichtbaar label of een instructie?
- Zegt dat label wat er wordt gevraagd? "Veld 1", "Tekst" of alleen een sterretje is niet genoeg.
- Staat er uitleg waar het formaat niet vanzelf spreekt (datumnotatie, postcode, verplichte velden)?
- Is duidelijk welke velden verplicht zijn, en staat die uitleg vóór de velden?
- Verdwijnt de enige aanduiding zodra er iets is ingevuld? Een tijdelijke aanduiding in het
  veld zelf (`placeholder`) als enig label is een afkeuring: zodra de bezoeker typt, is niet
  meer te zien wat er werd gevraagd.

### Wat je NIET bij 3.3.2 beoordeelt

- `for`, `id`, `aria-labelledby`, `aria-describedby` → 1.3.1
- `autocomplete` op naam-, adres- en contactvelden → 1.3.5
- De foutmelding die verschijnt ná een verkeerde invoer → 3.3.1 en 3.3.3

Vastgelegd door Frits op 2026-08-15, naar aanleiding van heuvelrug.nl. Daar onderbouwde de
auditor 3.3.2 op twee pagina's met "een zichtbaar label met een for-koppeling" — het bewijs
van 1.3.1, gebruikt voor het verkeerde criterium.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Elk invoerveld zegt wat er wordt gevraagd

### In het kort

Bij elk veld hoort een zichtbaar label of een instructie die zegt wat er ingevuld moet
worden. "Veld 1" of alleen een sterretje is niet genoeg. Waar het formaat niet vanzelf
spreekt (datum, postcode) staat uitleg, en welke velden verplicht zijn staat vóór de
velden. Een tijdelijke tekst in het veld zelf als enig label is een afkeuring: zodra je
typt is hij weg.

Dit gaat over wat er staat. Of het label in de code aan het veld hangt, is 1.3.1 en geen
bewijs voor dit criterium. Zonder formulier is dit criterium niet aanwezig.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-html`: elk invoerveld met het label, de instructie, de placeholder en de
   verplichtmarkering die erbij staan.
2. [meting] `get-screenshot`: wat de bezoeker bij het veld werkelijk ziet, en waar de uitleg
   over verplichte velden staat.

#### Stap 2 — Beoordelen

3. [agent] Per veld: is er een zichtbaar label of instructie, en zegt die wat er wordt
   gevraagd?
4. [agent] Staat er uitleg bij velden met een formaat, en is duidelijk welke velden verplicht
   zijn, met die uitleg vóór de velden?
5. [agent] Is een placeholder ergens het enige label?
6. [agent] Gebruik `for` en `aria-labelledby` nergens als onderbouwing: dat is 1.3.1.
   `autocomplete` is 1.3.5, de foutmelding na verkeerde invoer is 3.3.1 en 3.3.3.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` geeft per veld wat er in de code bij staat; de opname laat zien wat er zichtbaar
bij staat. Het oordeel gaat over dat tweede.

Wat hier niet uit blijkt: een formulierstap achter een sessie, en of een label dat er staat
ook begrijpelijk is voor wie het formulier invult. Dat weegt de agent.

### Deelgebieden

1. Elk invoerveld heeft een zichtbaar label of instructie die zegt wat er wordt gevraagd
2. Uitleg bij velden waar het formaat niet vanzelf spreekt: datum, postcode, telefoonnummer
3. Verplichte velden zijn aangeduid, met de uitleg vóór de velden
4. Geen placeholder als enig label

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
