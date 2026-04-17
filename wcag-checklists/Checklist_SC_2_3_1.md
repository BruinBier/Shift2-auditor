---
name: wcag-2-3-1-three-flashes-or-below-threshold
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.3.1 (Three Flashes or Below Threshold) on Dutch government websites. Use when conducting accessibility audits to verify that web pages do not contain content that flashes more than three times per second, unless below general flash and red flash thresholds. Covers seizure prevention, non-interference requirement, PEAT tool, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.3.1 Drie flitsen of beneden drempelwaarde — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.3.1 (Niveau A):**
Webpagina's bevatten niets dat meer dan drie keer flitst in enige periode van één seconde, of de flits is beneden de drempelwaarden voor algemene flitsen en rode flitsen.

**Kernprincipe:** Flitsende content kan epileptische aanvallen veroorzaken bij mensen met fotosensitieve epilepsie. Dit is het enige WCAG-criterium dat direct fysiek letsel kan voorkomen. Maximaal 3 flitsen per seconde, of de flits moet klein/zwak genoeg zijn om onder de drempelwaarde te blijven.

---

## Non-interferentie: speciale status

SC 2.3.1 is één van slechts vier Niveau A-criteria met de status **non-interferentie** (Conformance Requirement 5). De andere drie zijn SC 1.4.2 (Geluidsbediening), SC 2.1.2 (Geen toetsenbordval) en SC 2.2.2 (Pauzeren, stoppen, verbergen).

**Álle content op de pagina** moet aan dit criterium voldoen. Een failure kan niet worden "gecompenseerd" door een alternatief. Een mechanisme om de flitsen uit te zetten is ook niet voldoende, omdat een epileptische aanval al binnen één seconde kan worden getriggerd — er is dus te weinig tijd om het flitsen uit te zetten of te stoppen.

---

## Reële gevaren

Dit criterium is niet theoretisch. Er zijn gedocumenteerde incidenten:
- Op sociale media zijn bewust kwaadaardige animaties gepubliceerd die epileptische aanvallen veroorzaakten bij mensen van een epilepsie-stichting
- Van Oosterse anime-series is bekend dat die soms epilepsie veroorzaken (het bekendste voorbeeld veroorzaakte honderden ziekenhuisopnames bij kinderen in Japan)

---

## Wat is een "flits"?

Een **flits** is een paar tegengestelde veranderingen in relatieve luminantie (lichtheid) die groot genoeg zijn en in het juiste frequentiebereik om aanvallen te kunnen veroorzaken bij sommige mensen.

```
Flits = twee tegengestelde overgangen:
- Van licht naar donker EN terug naar licht
- Of van donker naar licht EN terug naar donker

Eén volledige flitscyclus = twee overgangen
3 flitsen per seconde = 6 overgangen per seconde
```

### Twee typen flitsen

**1. Algemene flits (general flash)**
Een paar tegengestelde veranderingen in relatieve luminantie van ≥10% van de maximale relatieve luminantie, waarbij de relatieve luminantie van het donkerste beeld lager is dan 0,80.

**2. Rode flits (red flash)**
Een paar tegengestelde overgangen met verzadigd rood. Mensen zijn gevoeliger voor rood flitsen dan voor andere kleuren. Er geldt daarom een speciale drempelwaarde.

---

## Wanneer is content veilig?

Content voldoet (PASS) als **een van de volgende** waar is:

### Optie 1: Maximaal 3 flitsen per seconde (of meer dan 60)

```
Er zijn niet meer dan 3 algemene flitsen
EN niet meer dan 3 rode flitsen
in enige periode van 1 seconde.

Óf de content flitst meer dan 60 keer per seconde
(dan worden de individuele flitsen niet meer
waargenomen en is het veilig).

Gevaarlijk bereik: 3-60 flitsen per seconde.
Daaronder en daarboven is veilig.
```

### Optie 2: Het flitsende gebied is klein genoeg

```
Het gecombineerde oppervlak van gelijktijdig
flitsende content beslaat niet meer dan 25% van
een gezichtsveld van 10 graden op het scherm bij
een normale kijkafstand.

In de praktijk: bij een scherm van 1024×768 pixels
is een rechthoek van 341 × 256 pixels op een
willekeurige plek op het beeldscherm een goede
schatting voor een visueel veld van 10 graden
(bij een scherm van 15-17 inch op een kijkafstand
van 56-66 cm).

Beeldschermen met een hogere resolutie die dezelfde
weergave tonen, leveren kleinere en veiliger
beelden op. Het zijn dus lagere resoluties die
worden gebruikt om de drempels te bepalen.
```

### Optie 3: De flits is te zwak (beneden drempelwaarde)

```
De verandering in relatieve luminantie is minder
dan 10% van het maximum, of het donkerste beeld
heeft een luminantie boven 0,80.

Zwakke flitsen die nauwelijks waarneembaar zijn,
vallen onder de drempelwaarde.
```

---

## Beslisboom

```
Bevat de pagina flitsende content?
│
├─ NEE → PASS (geen flitsende content)
│
└─ JA → Flitst het meer dan 3 keer per seconde?
   │
   ├─ NEE (≤ 3 flitsen/sec.) → PASS (via G19)
   │
   └─ JA (> 3 flitsen/sec.)
      │
      ├─ Is het flitsende gebied kleiner dan
      │  ~341 × 256 pixels (25% van 10° gezichtsveld)?
      │  └─ JA → PASS (klein genoeg)
      │
      ├─ Zijn de flitsen beneden de drempelwaarde
      │  voor luminantie?
      │  └─ JA → PASS (te zwak om aanvallen
      │           te veroorzaken)
      │
      └─ Geen van bovenstaande → FAIL
```

---

## Wat kan flitsen op een webpagina?

```
Veelvoorkomende bronnen van flitsen:
- Video's (stroboscoop-effecten, bliksem, explosies,
  muzzle flash, flitsende camera's)
- Geanimeerde GIF's (met snelle kleurwisselingen)
- CSS-animaties (snelle opacity- of achtergrond-
  kleurwisselingen)
- JavaScript-animaties
- Canvas/WebGL-animaties
- Embedded content van derden (advertenties,
  social media embeds)
- Slideshows met snelle overgangen
- Laadanimaties met flitsend effect

- Het automatisch afspelen van video bij het openen van een webpagina.
- Stroboscopische effecten in video's (discotheek, lichtshows).
- Reclamebanners met een flitsende achtergrond.
- Ingesloten social media content met snelle animaties.

NIET flitsend (veilig):
- Vloeiende fade-in/fade-out overgangen
- Langzame kleurveranderingen
- Subtiele hover-effecten
- Cursor-knipperen in invoervelden
```

### Flitsen vs. knipperen (blinken)

```
Flitsen: snelle, scherpe wisselingen in luminantie
die aanvallen kunnen veroorzaken.
→ SC 2.3.1 (gezondheidsrisico)

Knipperen (blinken): content die herhaaldelijk
wisselt tussen zichtbaar en onzichtbaar, of
herhaaldelijk tussen twee toestanden.
→ SC 2.2.2 Pauzeren, stoppen, verbergen
   (afleiding, maar minder gevaarlijk)

BELANGRIJK ONDERSCHEID SC 2.3.1 vs. SC 2.2.2:
Als content minder dan 3 keer per seconde "flitst",
is er geen probleem voor SC 2.3.1. Maar het is
WÉL een probleem voor SC 2.2.2 als het knipperen
langer dan 5 seconden duurt. Bij SC 2.2.2 is de
eis dat de content gestopt, gepauzeerd of verborgen
kan worden.

Samengevat:
- > 3 flitsen/sec. → SC 2.3.1 (kan niet gefixt
  met stopmechanisme)
- ≤ 3 flitsen/sec. maar > 5 sec. knipperen
  → SC 2.2.2 (moet stopbaar zijn)
```

---

## Stapsgewijze auditprocedure

### Stap 1: Visuele inspectie

- Laad de pagina en kijk of er flitsende content is
- Let op video's, animaties, GIF's, slideshows
- Controleer of er content is die snel wisselt tussen licht en donker

### Stap 2: Beoordeel de frequentie

- Als er flitsende content is: flitst het meer dan 3 keer per seconde?
- In de meeste gevallen is dit visueel te beoordelen
- Bij twijfel: gebruik een tool

### Stap 3: Als > 3 flitsen/seconde

- Beoordeel de grootte van het flitsende gebied
- Is het kleiner dan ~341 × 256 pixels? → waarschijnlijk PASS
- Gebruik PEAT (Photosensitive Epilepsy Analysis Tool) voor een nauwkeurige meting

### Stap 4: Tool-gebaseerde analyse (indien nodig)

- **PEAT** (Trace Center Photosensitive Epilepsy Analysis Tool): analyseert video- of schermopnames op flitsfrequentie en -intensiteit
- **Harding Test**: commercieel hulpmiddel voor broadcast-standaarden

---

## De 4 auditgebieden

### 1. VIDEO'S

```
Controleer:
- Bevat de video snelle licht/donker-wisselingen?
- Stroboscoop-effecten?
- Bliksemflitsen?
- Explosies of muzzle flash?
- Snelle camera-flitsen?

Let op: ook video's die pas starten na
gebruikersactie vallen onder SC 2.3.1.
Het criterium geldt voor álle content
op de pagina.
```

### 2. GEANIMEERDE GIF'S

```
Controleer:
- Bevat de GIF snelle kleur- of lichtwisselingen?
- Wisselt het sneller dan 3 keer per seconde?

GIF's zijn een veelvoorkomende bron van flitsende
content, vooral in social media embeds.
```

### 3. CSS- EN JAVASCRIPT-ANIMATIES

```
Controleer:
- Zijn er CSS-animaties met snelle opacity-
  of achtergrondkleurwisselingen?
- JavaScript-animaties met snel veranderende
  elementen?
- Canvas/WebGL-animaties?
- Laadanimaties met flitsend effect?
```

### 4. EMBEDDED CONTENT VAN DERDEN

```
Controleer:
- Advertenties die flitsende content bevatten
- Social media embeds met auto-play video
- Widgets van derden

Let op: non-interferentie geldt ook voor
content van derden. De website-eigenaar is
verantwoordelijk.
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Video's op de website

Gemeenten plaatsen soms video's over beleid, evenementen, of promotie:
- Promotievideo's met snelle beeldwisselingen → controleer frequentie
- Video's van evenementen (vuurwerk, lichtshows) → potentieel risico
- Instructievideo's: meestal veilig

### Patroon B: Slideshows/carrousels

Hero-slideshows op de homepage:
- Meestal veilige overgangssnelheden (1-5 seconden per slide)
- Controleer of de overgang zelf niet flitst (scherpe knip vs. fade)

### Patroon C: Laadanimaties

Wacht-indicatoren bij het laden van content:
- Draaiend icoon: meestal veilig
- Knipperend icoon: controleer frequentie

### Patroon D: Feestelijke/seizoensgebonden content

Sommige gemeenten voegen feestelijke animaties toe (bijv. kerst, Koningsdag):
- Knipperende lichtjes → potentieel risico als > 3/sec.
- Vuurwerk-animaties → controleer

---

## In de praktijk: gaat zelden fout

Op gemeente-websites komt flitsende content **zeer zelden** voor. De meeste gemeente-websites bevatten:
- Statische content
- Video's met normaal tempo
- Subtiele CSS-animaties

Desondanks moet het bij elke audit worden gecontroleerd vanwege:
1. De **non-interferentie**-status
2. Het **gezondheidsrisico** (fysiek letsel mogelijk)
3. Mogelijke **content van derden** die ongecontroleerd flitsende elementen bevat

---

## Relatie met andere SC's

| SC | Relatie met 2.3.1 |
|----|------------------|
| **2.3.2** | Drie flitsen (AAA): strengere eis — helemaal geen flitsen > 3/sec., ongeacht grootte of intensiteit |
| **2.2.2** | Pauzeren, stoppen, verbergen: gaat over bewegende/knipperende content (afleiding). 2.3.1 gaat over flitsen (gezondheidsrisico) |
| **1.4.2** | Geluidsbediening: ook non-interferentie |
| **2.1.2** | Geen toetsenbordval: ook non-interferentie |
| **2.3.1** | **Drie flitsen of beneden drempelwaarde: voorkom aanvallen door flitsende content** |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G19 | Zorgen dat geen component van de content meer dan 3 keer flitst in enige periode van 1 seconde |
| G176 | Het flitsende gebied klein genoeg houden |
| G15 | Een tool gebruiken om te controleren of content niet de drempelwaarden overschrijdt |

### Advisory Techniques

- Contrast verminderen voor alle flitsende content
- Volledig verzadigd rood vermijden bij flitsende content
- Aantal flitsen verminderen, zelfs als ze onder de drempelwaarde zijn
- Mechanisme bieden om flitsende content te onderdrukken voordat het begint

### Failure Techniques

Er zijn geen formele failure techniques, maar het onderstaande is een failure:
- Content die meer dan 3 keer per seconde flitst, het flitsende gebied is groter dan ~341 × 256 pixels, en de luminantieverandering overschrijdt de drempelwaarde

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: video's | geanimeerde GIF's |
                  CSS/JS-animaties | embedded content]
Element:         [beschrijving van het element]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL | N.v.t.]

Flitsfrequentie: [aantal per seconde, of "< 3"]
Flitsgebied:     [geschatte grootte in pixels]
Rood flitsen:    [ja/nee]
Drempelwaarde:   [boven / beneden / niet gemeten]

Probleem:        [specifieke beschrijving]
Technique:       [G19 / G176 / G15]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten

1. **Flitsende content in video's** — vaak onbewust, bijvoorbeeld een kort fragment met stroboscoop-effecten of snelle beeldwisselingen in een verder onschuldige video
2. **Content van derden zonder controle** — advertenties, social media embeds, widgets
3. **Feestelijke animaties** — knipperende lichtjes, vuurwerk die sneller dan 3/sec. flitsen

**Vermijd alle flitsende content.** Dit is de beste en eenvoudigste manier om aan SC 2.3.1 te voldoen. Gebruik in plaats daarvan:
- Subtiele animaties (vloeiende overgangen)
- Langzame fade-in/fade-out
- Kleurveranderingen zonder scherpe contrasten
- Gebruiker-geïnitieerde animaties

### Snelle audit-methode

1. Laad de pagina → kijk of er flitsende content is
2. Als er geen flitsende content is → **PASS** (noteer: "geen flitsende content aangetroffen")
3. Als er flitsende content is → schat de frequentie: ≤ 3/sec.? → PASS
4. Als > 3/sec. → beoordeel grootte en intensiteit, gebruik eventueel PEAT
5. Controleer ingesloten content van derden

### Hulpmiddel: PEAT

- **Photosensitive Epilepsy Analysis Tool (PEAT):** gratis tool van het Trace Center
- Analyseert video- of schermopnames
- Rapporteert of content de drempelwaarden overschrijdt
- Download: https://trace.umd.edu/peat/

### Technisch of redactioneel issue?

SC 2.3.1 is **zowel technisch als redactioneel**:
- **Technisch:** CSS/JS-animaties die te snel flitsen
- **Redactioneel:** video's of GIF's met flitsende content die worden geplaatst
- Bij Shift2: controleren bij zowel technische als content-audit

### Wie heeft er baat bij?

- **Mensen met fotosensitieve epilepsie** — het enige WCAG-criterium dat direct fysiek letsel voorkomt
- **Mensen met andere fotosensitieve aanvalsstoornissen** — vergelijkbaar risico
- **Mensen met migraine** — flitsende content kan migraine-aanvallen uitlokken
- **Alle gebruikers** — flitsende content is voor iedereen onaangenaam

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.3.1 is Niveau A — dus verplicht.**

**Non-interferentie:** een failure op SC 2.3.1 betekent dat de hele pagina niet conform is, ongeacht de toegankelijkheid van de rest van de content. Dit is het enige WCAG-criterium met een direct gezondheidsrisico.

---

## Bronnen

- **WCAG 2.2 Understanding 2.3.1:** https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- **Technique G19 (max. 3 flitsen):** https://www.w3.org/WAI/WCAG22/Techniques/general/G19
- **Technique G176 (klein flitsgebied):** https://www.w3.org/WAI/WCAG22/Techniques/general/G176
- **Technique G15 (tool gebruiken):** https://www.w3.org/WAI/WCAG22/Techniques/general/G15
- **PEAT Tool:** https://trace.umd.edu/peat/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
