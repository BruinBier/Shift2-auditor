---
name: wcag-1-4-2-audio-control
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.4.2 (Audio Control) on Dutch government websites. Use when conducting accessibility audits to verify that automatically playing audio can be paused, stopped, or volume-controlled independently. Covers the 3-second rule, non-interference requirement, auto-playing video, embedded media, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.4.2 Geluidsbediening — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.4.2 (Niveau A):**
Als er audio op een webpagina automatisch wordt afgespeeld gedurende meer dan 3 seconden, is er een mechanisme beschikbaar om de audio te pauzeren of te stoppen, of is er een mechanisme beschikbaar om het audiovolume onafhankelijk van het algehele systeemvolume te regelen.

**Kernprincipe:** Gebruikers mogen niet worden overvallen door automatisch afspelend geluid. Als geluid automatisch start en langer duurt dan 3 seconden, moet de gebruiker het kunnen stoppen, pauzeren of het volume onafhankelijk kunnen regelen.

---

## Non-interferentie: speciale status

SC 1.4.2 is één van slechts vier Niveau A-criteria met de status **non-interferentie** (Conformance Requirement 5). De andere drie zijn SC 2.1.2 (Geen toetsenbordval), SC 2.3.1 (Drie flitsen) en SC 2.2.2 (Pauzeren, stoppen, verbergen).

Dit betekent: **álle content op de pagina** moet aan dit criterium voldoen, ongeacht of die content wordt gebruikt om aan andere succescriteria te voldoen. Als bijvoorbeeld een ingesloten advertentie of widget automatisch geluid afspeelt zonder bediening, faalt de hele pagina.

**Belangrijk:** je mag in het algemeen een alternatief bieden voor content die niet toegankelijk is, maar óók die alternatieve content moet aan dit criterium voldoen. Dit is inherent aan de non-interferentie-eis.

---

## Wanneer geldt het?

SC 1.4.2 geldt als aan **twee voorwaarden** is voldaan:

1. Audio speelt **automatisch** af (zonder expliciete gebruikersactie)
2. De audio duurt **langer dan 3 seconden**

```
WEL van toepassing:
- Achtergrondmuziek die automatisch start bij laden
- Video met geluid die automatisch afspeelt
- Audio-intro van meer dan 3 seconden
- Geluidseffecten die herhalen (loop)
- Ingesloten content van derden met auto-play geluid

NIET van toepassing:
- Geluid dat stopt binnen 3 seconden (en niet herhaalt)
- Audio die pas start na een gebruikersactie
  (bijv. klik op "Afspelen")
- Interactieve communicatie (videogesprek, conferentie)
```

**Automatisch** = zonder expliciete gebruikersactie. Als een gebruiker op een duidelijk gelabelde knop "Afspelen" klikt, is dat gebruiker-geïnitieerd. Audio die start bij het laden van de pagina is automatisch.

---

## Twee manieren om te voldoen

### Optie 1: Audio stopt automatisch binnen 3 seconden

```
Als het geluid automatisch stopt binnen 3 seconden
EN niet herhaalt (geen loop), is geen bediening nodig.

Controleer: duurt het geluid echt ≤ 3 seconden?
Gebruik een stopwatch of timer om te verifiëren.
```

### Optie 2: Mechanisme om te stoppen/pauzeren/regelen

Als audio langer dan 3 seconden duurt, moet er een mechanisme zijn:

```
Optie A: Pauzeren of stoppen
- Een duidelijk zichtbare pauze- of stopknop
- Een "geluid uit"-link bovenaan de pagina
- Mediaspelercontrols (play/pause, stop)

Optie B: Volume onafhankelijk regelen
- Volumeregelaar specifiek voor de audio op de pagina
- Onafhankelijk van het systeemvolume
- "Volume naar nul" telt als voldoende bediening
```

### Eisen aan het bedieningsmechanisme

```
Het mechanisme moet:
- Duidelijk zichtbaar zijn bij het laden van de pagina
- Niet pas zichtbaar worden na scrollen of hoveren
- Toegankelijk zijn met het toetsenbord
- Bereikbaar zijn VOORDAT de gebruiker door de
  hele pagina moet navigeren (bij voorkeur bovenaan)

Het mechanisme MAG visueel verborgen zijn voor
reguliere gebruikers, mits het zichtbaar wordt
zodra het focus krijgt (vergelijkbaar met een
skip-link). Zo kan het met Tab gevonden worden
door toetsenbordgebruikers en screenreader-
gebruikers.

Het systeemvolume dempen telt NIET als "pauzeren
of stoppen". Zowel pauze/stop als volumeregeling
moeten onafhankelijk van het systeemvolume werken.
```

---

## Waarom is dit zo belangrijk?

Automatisch geluid is bijzonder problematisch voor:

1. **Screenreader-gebruikers** — screenreaders produceren spraakuitvoer die via hetzelfde audiokanaal loopt. Automatisch geluid overstempt de screenreader, waardoor de gebruiker de pagina niet kan navigeren en het stopmechanisme niet kan vinden (catch-22)
2. **Slechthorenden** — kunnen screenreadergeluid niet goed scheiden van andere audio
3. **Mensen met dyslexie** — gebruiken soms voorleessoftware of een browser-tool om tekst te laten voorlezen; automatisch geluid interfereert hiermee
4. **Mensen met cognitieve beperkingen/ADHD** — onverwacht geluid is zeer afleidend; moeite met lezen terwijl audio afspeelt
5. **Alle gebruikers** — in stille omgevingen is onverwacht geluid storend

**Best practice (sterk aanbevolen):** Speel nooit automatisch geluid af. Laat de gebruiker het geluid altijd zelf starten via een expliciete actie. Dit is niet verplicht maar wordt nadrukkelijk aanbevolen door W3C.

---

## Beslisboom

```
Speelt er audio automatisch af op de pagina?
│
├─ NEE → SC 1.4.2 niet van toepassing
│
└─ JA → Stopt de audio automatisch binnen 3 seconden?
   │
   ├─ JA → Herhaalt de audio (loop)?
   │  │
   │  ├─ NEE → PASS (via G60)
   │  │
   │  └─ JA → Totaal > 3 seconden → behandel als
   │           langer dan 3 seconden
   │
   └─ NEE (langer dan 3 seconden)
      │
      ├─ Is er een mechanisme om te pauzeren/stoppen?
      │  └─ JA → Is het zichtbaar, toetsenbord-
      │           toegankelijk en bovenaan de pagina?
      │     ├─ JA → PASS
      │     └─ NEE → FAIL
      │
      ├─ Is er een mechanisme om het volume
      │  onafhankelijk te regelen?
      │  └─ JA → Werkt het onafhankelijk van
      │           het systeemvolume?
      │     ├─ JA → PASS
      │     └─ NEE → FAIL
      │
      └─ Geen van beide → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Bereid de test voor

- Controleer of het volume van de pc/laptop aan staat en goed hoorbaar is
- Test dit eventueel met een YouTube-video

### Stap 2: Laad de pagina en luister

- Laad de pagina in Chrome
- Als de pagina al open staat: ververs met **Ctrl+F5** (of Cmd+R op macOS) voor een volledige herlaad
- Luister of er automatisch geluid afspeelt (ook van video's die automatisch starten)
- Let op: sommige browsers blokkeren auto-play standaard. Test ook met auto-play ingeschakeld

### Stap 3: Meet de duur

- Als er geluid is: meet de duur met een timer
- Stopt het geluid binnen 3 seconden? → PASS (mits geen loop)
- Duurt het langer? → ga naar stap 4

### Stap 4: Zoek een bedieningsmechanisme

- Is er een zichtbare pauze/stop-knop?
- Is er een volumeregelaar?
- Staat het mechanisme bovenaan de pagina of bij het media-element?
- **Let op:** het mechanisme mag visueel verborgen zijn. Navigeer met Tab om te controleren of er een verborgen mechanisme zichtbaar wordt bij focus

### Stap 5: Test het mechanisme

- Werkt de pauze/stop-knop?
- Is het mechanisme bereikbaar met het toetsenbord?
- Werkt de volumeregeling onafhankelijk van het systeemvolume?

### Stap 6: Test met toetsenbord

- Herlaad de pagina
- Navigeer met alleen het toetsenbord (Tab)
- Kun je het bedieningsmechanisme bereiken voordat je door de hele pagina moet tabben?

---

## De 4 auditgebieden

### 1. VIDEO MET AUTO-PLAY

```
Video-elementen met autoplay-attribuut:

Controleer:
- Heeft de video geluid?
- Heeft <video> het "muted" attribuut?
  (muted auto-play = geen geluidsprobleem)
- Zijn er mediaspelercontrols zichtbaar?
- Zijn de controls toetsenbordtoegankelijk?

PASS:
<video autoplay muted controls>
(gedempt + controls beschikbaar)

FAIL:
<video autoplay>
(niet gedempt, geen zichtbare controls)
```

### 2. AUDIO-ELEMENTEN

```
<audio> elementen met autoplay:

Controleer:
- Speelt audio automatisch af?
- Duurt het langer dan 3 seconden?
- Zijn er controls?

PASS:
<audio autoplay controls>
(controls aanwezig)

FAIL:
<audio autoplay>
(geen controls, langer dan 3 seconden)
```

### 3. INGESLOTEN CONTENT (EMBEDS/IFRAMES)

```
Content van derden (YouTube, social media,
widgets, advertenties):

Controleer:
- Speelt de ingesloten content automatisch geluid?
- Heeft de embed eigen audiobediening?
- Let op: ook content van derden moet voldoen
  (non-interferentie)

FAIL:
YouTube-video met autoplay in iframe zonder
mogelijkheid tot stoppen of dempen
```

### 4. ACHTERGRONDGELUID EN GELUIDSEFFECTEN

```
JavaScript-gegenereerd geluid, achtergrondmuziek:

Controleer:
- Is er een duidelijke knop om het geluid te stoppen?
- Staat deze knop bovenaan de pagina?
- Is de knop toetsenbordtoegankelijk?
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Video op homepage

Sommige gemeente-websites hebben een hero-video op de homepage:
- Meestal gedempt (muted) → geen probleem voor SC 1.4.2
- Als niet gedempt → moet controls hebben
- Controleer of `muted` attribuut aanwezig is

### Patroon B: Ingesloten YouTube-video's

YouTube-video's in pagina's over gemeentelijk beleid, evenementen:
- YouTube-embeds hebben standaard controls → meestal PASS
- Let op: als `autoplay=1` in de iframe-URL staat → controleer of muted

### Patroon C: Chatbots met geluid

Sommige gemeenten hebben chatbots die geluidsmeldingen geven:
- Notificatiegeluid bij nieuw bericht: kort geluid (< 3 sec.) → PASS
- Doorlopend geluid → moet stopbaar zijn

### Patroon D: Interactieve kaarten

Kaarten met audio-uitleg of gesproken instructies:
- Moet controls hebben als audio automatisch start

---

## In de praktijk: gaat zelden fout

Op gemeente-websites komt automatisch afspelend geluid **zelden** voor. Moderne browsers blokkeren auto-play met geluid grotendeels. De meeste video's op gemeente-websites zijn:
- Gedempt (muted) bij auto-play
- Of starten pas na gebruikersactie

Desondanks moet het bij elke audit worden gecontroleerd, juist vanwege de non-interferentie-status.

---

## Relatie met andere SC's

| SC | Relatie met 1.4.2 |
|----|------------------|
| **1.4.7** | Achtergrondaudio (AAA): strengere eis — achtergrondaudio moet 20 dB zachter zijn dan voorgrondspraak, of uitschakelbaar |
| **2.2.2** | Pauzeren, stoppen, verbergen: ook non-interferentie. Gaat over bewegende/knipperende content |
| **2.1.2** | Geen toetsenbordval: ook non-interferentie |
| **2.3.1** | Drie flitsen: ook non-interferentie |
| **1.2.1** | Audio-only: gaat over alternatieven voor audio, niet over auto-play |
| **1.4.2** | **Geluidsbediening: auto-play audio > 3 sec. moet stopbaar zijn** |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G60 | Geluid afspelen dat automatisch stopt binnen 3 seconden |
| G170 | Een bediening bieden nabij het begin van de pagina die automatisch afspelend geluid stopt |
| G171 | Geluid alleen afspelen op verzoek van de gebruiker |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F23 | Geluid afspelen langer dan 3 seconden zonder mechanisme om het te stoppen |
| F93 | Geen manier om een HTML5 media-element met autoplay te pauzeren of te stoppen |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: video auto-play | audio-element |
                  ingesloten content | achtergrondgeluid]
Element:         [beschrijving van het element]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL | N.v.t.]

Auto-play:       [ja/nee]
Duur:            [seconden, of "doorlopend"]
Gedempt:         [ja/nee]
Mechanisme:      [pauze/stop / volumeregeling / geen]
Toetsenbord-
toegankelijk:    [ja/nee]
Positie:         [bovenaan pagina / bij element / niet
                  zichtbaar]

Probleem:        [specifieke beschrijving]
Technique:       [G60 / G170 / G171 / F23 / F93]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten

1. **Video met geluid die automatisch afspeelt** — zonder muted-attribuut en zonder zichtbare controls
2. **Ingesloten content van derden** — widget of embed die geluid afspeelt zonder bediening
3. **Bedieningsmechanisme niet toetsenbordtoegankelijk** — pauzeknop alleen bereikbaar met muis
4. **Bedieningsmechanisme pas zichtbaar na scrollen** — gebruiker moet eerst langs het geluid navigeren
5. **Geluidsloop** — kort geluid dat herhaalt en zo totaal > 3 seconden duurt

### Snelle audit-methode

1. Laad de pagina → luister of er automatisch geluid afspeelt
2. Als ja: stopt het binnen 3 seconden?
3. Als nee: is er een zichtbare en toetsenbordtoegankelijke pauze/stop of volumeknop?
4. Controleer ingesloten video's en iframes op auto-play
5. Inspecteer de broncode: zoek op `autoplay` (zonder `muted`)

### Browser auto-play beleid

Moderne browsers (Chrome, Firefox, Safari) blokkeren auto-play met geluid steeds vaker. Dit betekent:
- Test niet alleen in de standaard browser-instellingen
- Een website die technisch auto-play geluid heeft maar door de browser wordt geblokkeerd, voldoet niet per se — de code moet zelf correct zijn
- Test eventueel met browser-instellingen die auto-play toestaan

### Technisch of redactioneel issue?

SC 1.4.2 is een **technisch issue**:
- Auto-play en audiobediening worden in de code bepaald
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — kunnen de spraakuitvoer horen zonder interferentie
- **Slechthorenden** — hoeven screenreadergeluid niet te scheiden van ander geluid
- **Mensen met cognitieve beperkingen/ADHD** — worden niet afgeleid door onverwacht geluid
- **Alle gebruikers** — in stille omgevingen geen onverwacht geluid

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.4.2 is Niveau A — dus verplicht.**

**Non-interferentie:** een failure op SC 1.4.2 betekent dat de hele pagina niet conform is, ongeacht de toegankelijkheid van de rest van de content.

---

## Bronnen

- **WCAG 2.2 Understanding 1.4.2:** https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html
- **Technique G60 (geluid < 3 sec.):** https://www.w3.org/WAI/WCAG22/Techniques/general/G60
- **Technique G170 (bediening bovenaan):** https://www.w3.org/WAI/WCAG22/Techniques/general/G170
- **Failure F23 (geen stopmechanisme):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F23
- **Failure F93 (HTML5 autoplay):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F93
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
