---
name: wcag-2-2-2-pause-stop-hide
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.2.2 (Pause, Stop, Hide) on Dutch government websites. Use when conducting accessibility audits to verify that moving, blinking, scrolling, or auto-updating content can be paused, stopped, or hidden by the user. Covers carrousels/sliders, animaties, nieuws-tickers, auto-updating content, animated GIFs, video-achtergronden, en laad-animaties. This is a Conformance Requirement 5 (Non-Interference) criterion. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.2.2 Pauzeren, stoppen, verbergen — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.2.2 (Niveau A):**
Voor bewegende, knipperende, scrollende of automatisch bijgewerkte informatie geldt het volgende:

**Bewegend, knipperend, scrollend:** Voor alle bewegende, knipperende of scrollende informatie die (1) automatisch start, (2) langer dan vijf seconden duurt, en (3) parallel met andere content wordt weergegeven, is er een mechanisme voor de gebruiker om het te pauzeren, stoppen of verbergen, tenzij de beweging, het knipperen of het scrollen onderdeel is van een activiteit waar het essentieel is.

**Automatisch bijgewerkt:** Voor alle automatisch bijgewerkte informatie die (1) automatisch start en (2) parallel met andere content wordt weergegeven, is er een mechanisme voor de gebruiker om het te pauzeren, stoppen of verbergen, of om de updatefrequentie te regelen, tenzij de automatische bijwerking onderdeel is van een activiteit waar het essentieel is.

**Kernprincipe:** Gebruikers moeten controle hebben over bewegende of veranderende content. Bewegende content leidt af, maakt het moeilijk om stationaire tekst te lezen, en kan desoriënterend zijn voor mensen met cognitieve beperkingen of aandachtstoornissen.

---

## Conformance Requirement 5: Non-Interference

**SC 2.2.2 valt onder Conformance Requirement 5.** Dit betekent:
- Eén failure maakt de **hele pagina** non-conformant
- Geldt voor **alle content** op de pagina
- Even kritiek als SC 2.1.2 (Geen toetsenbordval)

**Belangrijk:** De niet-interferentie eis geldt ook voor alternatieven. Als er een alternatief wordt geboden voor niet-toegankelijke content, moet dat alternatief óók voldoen aan SC 2.2.2. Je kunt dus niet zeggen: "de carrousel is niet pauzeerbaar, maar we bieden een tekstversie aan" — de carrousel zelf moet ook pauzeerbaar zijn.

---

## Twee categorieën met verschillende regels

### Categorie 1: Bewegend, knipperend, scrollend

Drie voorwaarden moeten ALLE DRIE waar zijn voordat het criterium van toepassing is:

| Voorwaarde | Beschrijving |
|-----------|-------------|
| (1) Start automatisch | De beweging begint zonder actie van de gebruiker |
| (2) Langer dan 5 seconden | De beweging duurt meer dan 5 seconden |
| (3) Parallel met andere content | Er staat andere content naast/boven/onder de bewegende content |

Als alle drie waar zijn → er moet een mechanisme zijn om te pauzeren, stoppen of verbergen.

**Vijf-seconden-regel:** Beweging die automatisch stopt binnen 5 seconden is GEEN failure. Dit geeft voldoende tijd om aandacht te trekken zonder langdurig af te leiden.

### Categorie 2: Automatisch bijgewerkt

Twee voorwaarden:

| Voorwaarde | Beschrijving |
|-----------|-------------|
| (1) Start automatisch | De bijwerking begint zonder actie van de gebruiker |
| (2) Parallel met andere content | Er staat andere content naast de bijgewerkte content |

**Geen vijf-seconden-uitzondering** voor auto-updating — het heeft geen zin om iets een paar seconden automatisch bij te werken en dan te stoppen.

**Extra optie bij auto-updating:** Naast pauzeren/stoppen/verbergen mag de auteur ook de mogelijkheid bieden om de **updatefrequentie te regelen**.

---

## Wat telt als "parallel met andere content"?

Het criterium is alleen van toepassing als de bewegende/bijgewerkte content **naast andere content** op de pagina staat. Als de hele pagina uit de bewegende content bestaat (bijv. een video die de volledige pagina is), is het criterium niet van toepassing.

**Voorbeeld:** Een carrousel op de homepage met daaronder nieuwsberichten → de carrousel beweegt parallel met de nieuwsberichten → criterium is van toepassing.

---

## Wat is een geldig "mechanisme"?

Een pauze/stop/verberg-mechanisme moet:
- De gebruiker echte controle geven (een "pauzeknop")
- De focus niet vasthouden of de pagina onbruikbaar maken
- Toegankelijk zijn met het toetsenbord

**NIET geldig:**
- Een animatie die alleen stopt zolang de gebruiker er met de muis op hovert (en herstart zodra de muis weggaat) → dit maakt de pagina onbruikbaar
- Een mechanisme dat alleen via de muis bereikbaar is
- Een onzichtbare of niet-vindbare knop

---

## Onderscheid: knipperen vs. flitsen

| Term | SC | Betekenis |
|------|-----|-----------|
| **Knipperen (blinking)** | 2.2.2 | Afleidende visuele afwisseling. Mag max. 5 sec of moet pauzeerbaar zijn. |
| **Flitsen (flashing)** | 2.3.1 | Kan epileptische aanvallen veroorzaken (>3 per seconde, groot en helder genoeg). |

Als content meer dan 3 keer per seconde knippert, is het geen "knipperen" meer maar "flitsen" en valt het onder SC 2.3.1 (Three Flashes).

---

## Beslisboom

```
Bewegende/knipperende/scrollende content gevonden
│
├─ Start het automatisch (zonder gebruikersactie)?
│  └─ NEE → SC 2.2.2 niet van toepassing
│
├─ Wordt het parallel met andere content weergegeven?
│  └─ NEE (hele pagina is de content) → Niet van toepassing
│
├─ Is het bewegend/knipperend/scrollend?
│  ├─ JA → Duurt het langer dan 5 seconden?
│  │  ├─ NEE → PASS (stopt binnen 5 sec)
│  │  └─ JA → Is er een pauzeer/stop/verberg-mechanisme?
│  │     ├─ JA → PASS
│  │     └─ NEE → Is de beweging essentieel?
│  │        ├─ JA → PASS (uitzondering)
│  │        └─ NEE → FAIL
│  │
│  └─ Is het auto-updating?
│     └─ JA → Is er een mechanisme om te pauzeren/stoppen/
│              verbergen/frequentie te regelen?
│        ├─ JA → PASS
│        └─ NEE → Is de auto-update essentieel?
│           ├─ JA → PASS (uitzondering)
│           └─ NEE → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle bewegende/bijgewerkte content

Scan de pagina op:
- Carrousels/sliders
- Animaties (CSS, JavaScript, SVG)
- Animated GIFs
- Scrollende tekst (marquee, nieuws-ticker)
- Video-achtergronden
- Auto-updating secties (live feeds, tickers)
- Laad-animaties en spinners
- Knipperende elementen

### Stap 2: Controleer de drie voorwaarden

Per gevonden element:
1. Start het automatisch? (zonder klik/hover van de gebruiker)
2. Duurt het langer dan 5 seconden? (voor bewegend/knipperend/scrollend)
3. Staat het parallel met andere content?

### Stap 3: Controleer het mechanisme

Als alle voorwaarden waar zijn:
- Is er een pauze-, stop- of verberg-knop?
- Is deze knop vindbaar, zichtbaar, toetsenbord-bedienbaar?
- Werkt het mechanisme echt (pauzeert het daadwerkelijk)?

**Let op: het mechanisme zelf moet ook toegankelijk zijn.** Als de pauzeknop niet toetsenbord-bedienbaar is, of onvoldoende contrast heeft, of geen accessible name heeft, keur het dan af bij de betreffende succescriteria (bijv. SC 2.1.1 voor toetsenbordbediening, SC 4.1.2 voor naam/rol/waarde). De pauzeknop hoeft niet bij SC 2.2.2 afgekeurd te worden voor toegankelijkheidsproblemen van de knop zelf — die vallen onder hun eigen criteria.

### Stap 4: Controleer na pauzeren

Als er een pauzeerknop is:
- Kan de content worden hervat vanaf het punt waar gepauzeerd werd?
- Of wordt het vanaf het begin hervat? (beide zijn acceptabel, maar hervatten vanaf het pauzepunt is beter)

---

## De 7 auditgebieden

### 1. CARROUSELS/SLIDERS

Het meest voorkomende issue op gemeente-websites.

```
Automatisch roterende carrousel op de homepage:
- Start automatisch → JA
- Langer dan 5 seconden → JA (roteert continu)
- Parallel met andere content → JA
→ Er MOET een pauzeknop zijn

Controleer:
✓ Is er een pauze/stop-knop?
✓ Is de knop zichtbaar en vindbaar?
✓ Is de knop toetsenbord-bedienbaar?
✓ Stopt de carrousel echt bij klikken?
✓ Herstart de carrousel niet spontaan na pauzeren?
```

**Veelgemaakte fout:** Een carrousel die pauzeert bij hover maar automatisch verder gaat als de muis weggaat → dit is GEEN geldig mechanisme.

### 2. ANIMATIES EN CSS-TRANSITIES

```
Controleer:
- Achtergrondanimaties (bewegende patronen, parallax)
- Hero-animaties (tekst die binnenkomt, elementen die verschijnen)
- Scroll-triggered animaties
  → Niet van toepassing als ze pas starten bij gebruikersactie
    (scrollen is een gebruikersactie)
- Lottie/SVG-animaties
- CSS keyframe-animaties die eindeloos herhalen

Let op: prefers-reduced-motion
Respecteert de site de OS-instelling @media (prefers-reduced-motion: reduce)?
→ Dit is een best practice maar NIET voldoende als enig mechanisme
   (niet alle gebruikers kennen deze instelling)
```

### 3. ANIMATED GIFS

```
Animated GIF gevonden:
- Stopt het GIF binnen 5 seconden? → PASS
- Loopt het GIF eindeloos door? → Er moet een
  mechanisme zijn om het te stoppen

Technisch: GIFs hebben een loop-instelling.
Een GIF met beperkt aantal loops dat binnen 5 seconden stopt → PASS
Een GIF op infinite loop → FAIL (tenzij pauzeerbaar)
```

### 4. VIDEO-ACHTERGRONDEN

```
Autoplaying achtergrondvideo (vaak op homepagina's):
- Start automatisch → JA
- Langer dan 5 seconden → meestal JA
- Parallel met andere content → JA (er staat tekst overheen)
→ Er MOET een pauzeerknop zijn

Let op: dit geldt ook als de video gedempt is.
SC 2.2.2 gaat over visuele beweging, niet over geluid
(geluid valt onder SC 1.4.2 Audio Control)
```

### 5. SCROLLENDE TEKST / NIEUWS-TICKERS

```
Scrollende tekst (marquee-achtig):
- Start automatisch → JA
- Langer dan 5 seconden → JA
- Parallel met andere content → JA
→ Er MOET een pauzeer/stop-mechanisme zijn (F16)
```

### 6. AUTO-UPDATING CONTENT

```
Live feeds, sport-uitslagen, weer-updates, chatmodules,
beurskoersen die periodiek verversen:
- Start automatisch → JA
- Parallel met andere content → JA
→ Er MOET een mechanisme zijn om te pauzeren/stoppen/
   verbergen OF de updatefrequentie te regelen

Let op: GEEN vijf-seconden-uitzondering voor auto-updating

Bij hervatten na pauze:
- Real-time content (sport, weer) → hervat bij huidige
  stand (niet bij het punt van pauzeren)
- Niet-real-time content → hervat bij punt van pauzeren
```

**Goede voorbeelden:** KLM.nl heeft roterende banners met een pauzeknop. Ook op sites van de Rijksoverheid (bijv. sodm.nl) zijn carrousels met pauzeknop te vinden.

### 7. LAAD-ANIMATIES EN SPINNERS

```
Laad-indicatoren (spinners, voortgangsbalken):
- Is de animatie een laad-indicator die verdwijnt zodra
  de content geladen is?
  → Geen probleem — de animatie is "essentieel"
    (informeert de gebruiker dat er iets gebeurt)

- Is het een decoratieve animatie die eindeloos loopt
  naast geladen content?
  → WEL een probleem als het langer dan 5 sec duurt
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Homepage-carrousel

Veruit het meest voorkomende issue. De meeste gemeente-websites hebben een automatisch roterende carrousel op de homepage.

```
Controleer:
- Is er een pauzeknop? (vaak een ‖ icoon)
- Is de pauzeknop zichtbaar zonder hover?
- Is de pauzeknop toetsenbord-bedienbaar?
- Stopt de carrousel ook als een slide focus heeft?
```

### Patroon B: Sfeer-video op homepage

Sommige gemeenten hebben een achtergrondvideo die automatisch start.

```
Controleer:
- Is er een pauzeerknop voor de video?
- Geldt dit ook als de video muted is? → JA
```

### Patroon C: Nieuws- of evenementen-ticker

Scrollende tekst met de nieuwste berichten of evenementen.

```
Controleer:
- Kan de scrolling worden gepauzeerd?
- Is de pauzeerknop toegankelijk?
```

### Patroon D: Animated hero-banner

CSS-animaties in de hero-sectie (tekst die binnenschuift, achtergrond die beweegt).

```
Controleer:
- Duurt de animatie langer dan 5 seconden?
  → NEE: PASS (stopt automatisch)
  → JA: is er een mechanisme om te stoppen?
```

### Patroon E: Cookie-banner met animatie

Sommige cookie-banners hebben een inschuif-animatie.

```
Controleer:
- Duurt de animatie langer dan 5 seconden?
  → Meestal NEE (inschuif-animatie van ~1 seconde) → PASS
```

### Patroon F: Kaart-animatie

Interactieve kaarten (Google Maps) met automatische animatie bij laden.

```
Controleer:
- Stopt de animatie na het laden? → PASS
- Beweegt de kaart continu? → FAIL (tenzij pauzeerbaar)
```

---

## Onderscheid met andere SC's

| SC | Relatie met 2.2.2 |
|----|------------------|
| **1.4.2** | Audio Control: automatisch startend geluid moet te stoppen zijn. 2.2.2 gaat over visuele beweging. |
| **2.2.1** | Timing Adjustable: tijdslimieten moeten aan te passen zijn. 2.2.2 gaat over bewegende content. |
| **2.2.2** | **Pauzeren, stoppen, verbergen: bewegende/bijgewerkte content** |
| **2.3.1** | Three Flashes: flitsende content die aanvallen kan veroorzaken (>3/sec). 2.2.2 gaat over afleidende beweging. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G4 | Content kan worden gepauzeerd en hervat vanaf het pauzepunt |
| G11 | Content knippert minder dan 5 seconden |
| G152 | Animated GIF stopt na n cycli (binnen 5 seconden) |
| G186 | Bedieningselement op de pagina dat bewegende/knipperende/auto-updating content stopt |
| G191 | Link, knop of mechanisme dat de pagina herlaadt zonder knipperende content |
| SCR22 | Scripts om knipperen te beheersen en binnen 5 seconden te stoppen |
| SCR33 | Script om scrollende content te beheersen met pauzeer-mechanisme |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F16 | Scrollende content zonder pauzeer/herstart-mechanisme |
| F47 | Gebruik van het `<blink>` element |
| F4 | Gebruik van `text-decoration: blink` zonder stopmechanisme binnen 5 seconden |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-7: carrousel | animatie | animated GIF |
                  video-achtergrond | scrollende tekst |
                  auto-updating | laad-animatie]
Element:         [beschrijving]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL | N.v.t.]
Ernst:           [KRITIEK — Non-Interference criterium]

Start
automatisch:     [ja/nee]
Duur > 5 sec:    [ja/nee/n.v.t. (auto-updating)]
Parallel met
andere content:  [ja/nee]
Essentieel:      [ja/nee — waarom]

Mechanisme
aanwezig:        [ja/nee]
Mechanisme
type:            [pauzeknop / stopknop / verbergknop / frequentie]
Mechanisme
toegankelijk:    [ja/nee — toetsenbord-bedienbaar?]

Probleem:        [specifieke beschrijving]
Technique:       [G4/G11/G152/G186/F16/F47/F4]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Carrousel zonder pauzeknop** — veruit de meest voorkomende fout
2. **Carrousel die pauzeert bij hover maar niet bij focus** — en herstart zodra muis weggaat
3. **Achtergrondvideo zonder pauzeerknop** — zelfs als muted
4. **Animated GIFs op infinite loop** — decoratieve GIFs die eindeloos doorgaan
5. **Scrollende nieuws-ticker zonder stopmechanisme** (F16)
6. **Pauzeknop niet toetsenbord-bedienbaar** — alleen met muis te bereiken
7. **Pauzeknop niet vindbaar** — te klein, onzichtbaar, of alleen bij hover zichtbaar

### Technisch of redactioneel issue?

SC 2.2.2 is meestal een **technisch issue**:
- Carrousel-functionaliteit en pauzeknop zijn template-verantwoordelijkheid
- Animatie-instellingen zitten in CSS/JavaScript
- Bij Shift2-audits valt dit onder de **technische audit** (Cardan/template)

**Uitzondering:** Als een redacteur een animated GIF op de pagina plaatst, is dat deels een redactioneel issue.

### Wie heeft er baat bij?

- **Mensen met cognitieve beperkingen** — continue beweging leidt af en maakt concentratie moeilijk
- **Mensen met aandachtstoornissen (ADHD)** — knipperende/bewegende content is bijzonder storend
- **Slechtzienden** — moeite met het lezen van stationaire tekst als er iets beweegt
- **Mensen met leesproblemen** — bewegende tekst is moeilijk te volgen
- **Mensen met vestibulaire stoornissen** — beweging kan misselijkheid of duizeligheid veroorzaken
- **Screenreader-gebruikers** — auto-updating content kan een overweldigende stroom van meldingen veroorzaken via aria-live
- **Iedereen** — bewegende content is voor iedereen potentieel afleidend

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.2.2 is Niveau A — dus verplicht.**

**Extra gewicht:** Als Non-Interference criterium (Conformance Requirement 5) heeft een failure op SC 2.2.2 grotere consequenties — het maakt de hele pagina non-conformant.

---

## Bronnen

- **WCAG 2.2 Understanding 2.2.2:** https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- **Technique G4 (pauzeren en hervatten):** https://www.w3.org/WAI/WCAG22/Techniques/general/G4
- **Technique G186 (stopknop):** https://www.w3.org/WAI/WCAG22/Techniques/general/G186
- **Failure F16 (scrollende content):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F16
- **Failure F47 (blink element):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F47
- **Failure F4 (text-decoration: blink):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F4
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
