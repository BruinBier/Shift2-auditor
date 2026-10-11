# Shift2-beoordelingsregels SC 3.3.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_3_2.md` als ze elkaar tegenspreken.

## 3.3.2 gaat over wat er staat, niet over hoe het gekoppeld is

Beoordeel of er een label of instructie **aanwezig** is bij een invoerveld. Dit is een
oordeel over wat iemand ziet en leest. Of dat label duidelijk en beschrijvend genoeg is,
beoordeel je onder **2.4.6** (Koppen en labels), niet hier. Understanding 3.3.2 (Intent):
"whether or not labels (if used) are accurate, sufficiently clear, or descriptive is covered
separately by 2.4.6 Headings and Labels". Besluit Frits 2026-10-11: volg W3C.

De programmatische koppeling — `for`, `aria-labelledby`, `aria-describedby` — hoort bij
**1.3.1** (Info en relaties). Die koppeling is **geen bewijs voor 3.3.2** en hoort niet in
de onderbouwing van dit criterium thuis.

### Waarom dit onderscheid ertoe doet

De twee criteria kunnen los van elkaar slagen en zakken:

- `<label for="f1">Veld 1</label>` — perfect gekoppeld, maar het label zegt niets.
  Voldoet aan 1.3.1 en aan 3.3.2 (er is een label), **niet** aan 2.4.6 (het label
  beschrijft het doel niet).
- Een duidelijk zichtbaar label "Uw postcode" dat niet aan het veld is gekoppeld.
  Voldoet aan 3.3.2, **niet** aan 1.3.1.

Wie de koppeling als bewijs voor 3.3.2 gebruikt, kan op beide criteria het verkeerde
antwoord geven — en dat valt niet op, want er staat een geloofwaardige zin.

### Wat je bij 3.3.2 wél beoordeelt

- Heeft elk invoerveld een zichtbaar label of een instructie? Alleen een sterretje is geen
  label. Een pictogram dat het doel aangeeft, zoals een loep bij een zoekveld, mag als
  zichtbaar label dienen (Understanding 3.3.2, voorbeeld 4).
- Een label als "Veld 1" of "Tekst" is er wél. Of het iets zegt, is **2.4.6**: rapporteer het
  daar en niet hier.
- Staat er uitleg waar het formaat niet vanzelf spreekt (datumnotatie, postcode, verplichte velden)?
- Is duidelijk welke velden verplicht zijn, en staat die uitleg vóór de velden?
- Verdwijnt de enige aanduiding zodra er iets is ingevuld? Een tijdelijke aanduiding in het
  veld zelf (`placeholder`) als enig label is een afkeuring: zodra de bezoeker typt, is niet
  meer te zien wat er werd gevraagd.

### Wat je NIET bij 3.3.2 beoordeelt

- `for`, `id`, `aria-labelledby`, `aria-describedby` → 1.3.1
- `autocomplete` op naam-, adres- en contactvelden → 1.3.5
- De foutmelding die verschijnt ná een verkeerde invoer → 3.3.1 en 3.3.3
- Of een label duidelijk en beschrijvend is ("Veld 1", "Tekst") → 2.4.6

Vastgelegd door Frits op 2026-08-15, naar aanleiding van heuvelrug.nl. Daar onderbouwde de
auditor 3.3.2 op twee pagina's met "een zichtbaar label met een for-koppeling" — het bewijs
van 1.3.1, gebruikt voor het verkeerde criterium.

### Het zoekveld in de header valt eronder, op het homepage-sample

Het zoekveld in de header is een invoerveld en valt onder 3.3.2. Understanding 3.3.2
beoordeelt in voorbeeld 4 juist zo'n zoekveld: een loep naast het veld mag als zichtbaar
label dienen. Besluit Frits 2026-10-11: volg W3C.

Beoordeel het één keer, op het homepage-sample, net als de rest van header en footer. Op de
andere pagina's laat je het liggen; daar gaat het om de formulieren in de main-content.
Mankeert er iets aan, dan is het templatecode van de leverancier: maak een bevinding met
verantwoordelijke **ontwikkelaar** én een technisch issue voor de leverancier, zoals bij het
SIMsite-galerijpatroon onder 1.1.1. Zie `Shift2_Regels_SC_4_1_2.md` voor het technische
issue.

Gevolg: een homepage met een zoekveld in de header heeft voor 3.3.2 wél een invoerveld. Zet
op het homepage-sample het formulier-vinkje dus niet op "niet aanwezig" alleen omdat er
verder geen formulier staat.

> Gewijzigd op 2026-10-11. Tot dan viel het zoekveld in de header altijd en op elke pagina
> buiten de beoordeling, als templatecode (vastgelegd door Frits op 2026-09-14). Een pagina
> met alleen een zoekveld kreeg zo "niet aanwezig", terwijl W3C het zoekveld juist
> beoordeelt.

## Technieken (W3C)

- Voldoende: G131 (beschrijvende labels), samen met één van ARIA1 (`aria-describedby`),
  ARIA9 (`aria-labelledby` uit meerdere teksten), ARIA17 (groeperingsrollen), G89 (verwacht
  formaat met voorbeeld), G184 (instructie aan het begin van het formulier), G162 (labels op
  een voorspelbare plek), G83 (tekst bij een niet ingevuld verplicht veld), H90 (verplicht
  aangeven in `label` of `legend`) of PDF5. Verder H44 (`label`-element), PDF10 (labels in
  een PDF-formulier), H71 (`fieldset` en `legend`) en G167 (een knop naast het veld die het
  doel aangeeft, zoals bij een zoekveld).
- Aanvullend: G13 (vooraf zeggen wat er gebeurt bij een contextwijziging), ARIA2
  (`aria-required`).
- Fout: F82 (telefoonnummervelden die visueel bij elkaar staan zonder tekstlabel).

Bron: Understanding 3.3.2, "Techniques".

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Elk invoerveld zegt wat er wordt gevraagd

### In het kort

Bij elk veld hoort een zichtbaar label of een instructie. Alleen een sterretje is niet
genoeg; een loep bij een zoekveld wel. Waar het formaat niet vanzelf spreekt (datum,
postcode) staat uitleg, en welke velden verplicht zijn staat vóór de velden. Een tijdelijke
tekst in het veld zelf als enig label is een afkeuring: zodra je typt is hij weg.

Dit gaat over of er een label staat. Of het duidelijk is ("Veld 1"), is 2.4.6. Of het in de
code aan het veld hangt, is 1.3.1. Het zoekveld in de header telt mee, op het
homepage-sample. Zonder invoerveld is dit criterium niet aanwezig.

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

3. [agent] Per veld: is er een zichtbaar label of instructie? Een vaag label ("Veld 1") is
   2.4.6, niet 3.3.2. Op het homepage-sample hoort het zoekveld in de header erbij; op de
   andere pagina's niet.
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

Wat hier niet uit blijkt: een formulierstap achter een sessie. Of een label dat er staat
ook begrijpelijk is, weeg je onder 2.4.6.

### Deelgebieden

1. Elk invoerveld heeft een zichtbaar label of instructie die zegt wat er wordt gevraagd
2. Uitleg bij velden waar het formaat niet vanzelf spreekt: datum, postcode, telefoonnummer
3. Verplichte velden zijn aangeduid, met de uitleg vóór de velden
4. Geen placeholder als enig label

> Sinds 2026-10-11 (besluit Frits: volg W3C) lees je gebied 1 zo: is er een label of
> instructie? Een label dat er staat maar niets zegt ("Veld 1") is hier `ok` en een
> bevinding onder 2.4.6. De naam van het gebied is bewust ongewijzigd gelaten.
>
> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
