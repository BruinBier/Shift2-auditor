---
name: wcag-2-1-4-character-key-shortcuts
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.1.4 (Character Key Shortcuts) on Dutch government websites. Use when conducting accessibility audits to verify that single-character keyboard shortcuts (letters, numbers, punctuation, symbols) can be turned off, remapped to include a modifier key, or are only active when the relevant component has focus. Covers speech input conflicts, accidental activation, the distinction between character keys and modifier keys, and the Shift nuance. Relevant for web applications with custom shortcuts, but rarely an issue on standard gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.1.4 Enkel teken sneltoetsen — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.1.4 (Niveau A):**
Als een sneltoets in content is geïmplementeerd met alleen letters (inclusief hoofdletters en kleine letters), leestekens, cijfers of symbolen, dan is ten minste één van de volgende dingen waar:

- **Uitzetten:** Er is een mechanisme om de sneltoets uit te zetten.
- **Opnieuw toewijzen (remappen):** Er is een mechanisme om de sneltoets opnieuw toe te wijzen zodat deze één of meer niet-afdrukbare toetsen bevat (bijv. Ctrl, Alt).
- **Alleen actief bij focus:** De sneltoets voor een component van de gebruikersinterface is alleen actief wanneer dat component focus heeft.

**Kernprincipe:** Sneltoetsen die bestaan uit een enkel afdrukbaar teken (letter, cijfer, leesteken, symbool) zonder modifier-toets, kunnen per ongeluk worden geactiveerd — vooral door spraaksoftware en mensen met motorische beperkingen. Ze moeten daarom uitzet- of herconfigueerbaar zijn, of alleen werken als het relevante element focus heeft.

---

## Wat zijn "enkel teken sneltoetsen"?

### WEL onder SC 2.1.4 (afdrukbare tekens):

| Toets | Voorbeeld |
|-------|-----------|
| Letters | `a`, `s`, `j`, `k`, `?` |
| Hoofdletters | `A`, `S` (Shift+a produceert nog steeds een afdrukbaar teken) |
| Cijfers | `1`, `2`, `3` |
| Leestekens | `.`, `,`, `/`, `?`, `!` |
| Symbolen | `+`, `-`, `*`, `@` |

### NIET onder SC 2.1.4 (niet-afdrukbare/modifier toetsen):

| Toets | Waarom niet |
|-------|------------|
| Ctrl, Alt, Cmd | Modifier-toetsen |
| Escape | Niet-afdrukbaar |
| Tab, Enter, Spatie | Niet-afdrukbaar (functionele toetsen) |
| Pijltjestoetsen | Niet-afdrukbaar |
| F1-F12 | Functietoetsen |
| Home, End, Page Up/Down | Niet-afdrukbaar |
| Delete, Insert | Niet-afdrukbaar |

### De Shift-nuance

**Shift is GEEN echte modifier-toets in de context van SC 2.1.4.** Als Shift+A het teken "A" produceert, is dat nog steeds een afdrukbaar teken. De focus moet liggen op het resultaat: als de combinatie een **afdrukbaar teken** oplevert, valt het onder SC 2.1.4.

Hetzelfde geldt voor AltGr: op een Nederlands toetsenbord produceert AltGr+e het teken "€" — dat is een afdrukbaar teken en valt onder SC 2.1.4.

**Echte modifier-combinaties** die NIET onder SC 2.1.4 vallen:
- Ctrl+S (opslaan) — Ctrl is een modifier, "S" wordt niet als teken ingevoerd
- Alt+F4 (sluiten) — Alt is een modifier
- Ctrl+Shift+T (tab heropenen) — modifier-combinatie

---

## De drie oplossingen

Als een website enkel-teken sneltoetsen implementeert, moet minstens één van deze drie oplossingen aanwezig zijn:

### Oplossing 1: Uitzetten
De gebruiker kan de sneltoets uitschakelen (per sneltoets of allemaal tegelijk).

### Oplossing 2: Opnieuw toewijzen (remappen)
De gebruiker kan de sneltoets opnieuw toewijzen naar een combinatie met een modifier-toets (bijv. van `s` naar `Ctrl+s`).

### Oplossing 3: Alleen actief bij focus
De sneltoets werkt alleen als het relevante component focus heeft. Een `s`-toets om te zoeken werkt alleen als het zoekveld focus heeft — niet als een willekeurig ander element focus heeft.

**Belangrijk: focus op het component zelf, niet op de hele applicatie**

Dit punt wordt vaak verkeerd begrepen. De sneltoets mag alleen werken als het **specifieke interactieve component** waar de sneltoets bij hoort focus heeft.

**YouTube-voorbeeld:** De `k`-toets activeert play/pause.
- Als `k` alleen werkt wanneer de play-knop focus heeft → PASS
- Als `k` ook werkt wanneer de focus op de volumeregelaar staat → FAIL (de sneltoets werkt op een ander component binnen de speler)
- Dat `k` niet werkt buiten de videospeler maakt het probleem kleiner, maar het is er nog steeds binnen de speler

**iframe-nuance:** Op gemeente-websites staat een YouTube-video meestal in een iframe. De sneltoetsen werken dan alleen binnen het iframe, niet op de hele pagina. Het probleem is er dan nog steeds, maar is beperkt tot de videospeler. Op youtube.com zelf werken de sneltoetsen op de hele pagina, omdat de speler daar niet in een iframe staat.

**De beste aanpak** (en de eenvoudigste): gebruik altijd modifier-combinaties (Ctrl+, Alt+) voor sneltoetsen. Dan is SC 2.1.4 niet van toepassing.

---

## Waarom is dit belangrijk?

### Spraaksoftware (primaire doelgroep)

Spraaksoftware (zoals Dragon NaturallySpeaking) zet gesproken woorden om in toetsaanslagen. Als een gebruiker het woord "januari" dicteert, stuurt de software de letters j-a-n-u-a-r-i als toetsaanslagen. Als de letter `j` een sneltoets is (bijv. "volgende item"), wordt de functie per ongeluk geactiveerd terwijl de gebruiker alleen tekst wilde dicteren.

**Spraakgebruikers en modifier-combinaties:** Spraakgebruikers kunnen zonder problemen modifier-combinaties uitspreken (bijv. "press Control Foxtrot" voor Ctrl+F). Ze kunnen ook native spraakcommando's schrijven die modifier-combinaties oproepen (bijv. "Druk dit af" → Ctrl+P). Dit werkt goed. Het probleem ontstaat alleen bij enkel-teken sneltoetsen: een gesproken woord wordt dan een spervuur van ongewenste opdrachten.

### Mobiel domein

Dit succescriterium wordt steeds belangrijker in het mobiele domein, omdat een groeiend aantal apps toetsenbordbediening vollediger mogelijk maakt (externe toetsenborden bij tablets, Bluetooth-toetsenborden).

### Motorische beperkingen

Mensen met motorische beperkingen kunnen per ongeluk toetsen indrukken, toetsen langer ingedrukt houden dan bedoeld, of moeite hebben met fijne motorische controle. Enkel-teken sneltoetsen worden dan onbedoeld geactiveerd.

### Cognitieve beperkingen

Onverwachte acties door per ongeluk ingedrukte toetsen zijn desoriënterend en kunnen leiden tot verlies van werk of context.

---

## Beslisboom

```
Heeft de pagina enkel-teken sneltoetsen?
│
├─ NEE → SC 2.1.4 is niet van toepassing → PASS
│        (geen sneltoetsen, of alleen modifier-combinaties)
│
└─ JA → De pagina heeft sneltoetsen met alleen
        letters, cijfers, leestekens of symbolen
   │
   ├─ Zijn de sneltoetsen alleen actief als het
   │  relevante component focus heeft?
   │  └─ JA → PASS (oplossing 3)
   │
   ├─ Kan de gebruiker de sneltoetsen uitzetten?
   │  └─ JA → PASS (oplossing 1)
   │
   ├─ Kan de gebruiker de sneltoetsen remappen naar
   │  modifier-combinaties?
   │  └─ JA → PASS (oplossing 2)
   │
   └─ Geen van bovenstaande → FAIL (F99)
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer of de pagina enkel-teken sneltoetsen heeft

Dit is de cruciale eerste stap. De meeste standaard websites hebben GEEN enkel-teken sneltoetsen.

**Hoe te testen:**
1. Klik ergens op de pagina (maar niet in een invoerveld)
2. Druk systematisch op alle lettertoetsen (a-z), cijfertoetsen (0-9), en veelgebruikte leestekens
3. Houd Shift ingedrukt en druk dezelfde toetsen nogmaals
4. Observeer of er iets gebeurt (navigatie, actie, pop-up, etc.)

**Alternatief:** Inspecteer de JavaScript-code op `keydown`, `keyup`, of `keypress` event listeners die reageren op enkel-teken toetsen.

### Stap 2: Als er enkel-teken sneltoetsen zijn, controleer de drie oplossingen

Per gevonden sneltoets:
1. Is de sneltoets alleen actief als het component focus heeft? → PASS
2. Kan de sneltoets worden uitgezet? → PASS
3. Kan de sneltoets worden geremapt? → PASS
4. Geen van bovenstaande? → FAIL

### Stap 3: Controleer de toegankelijkheid van het uit/remap-mechanisme

Als er een instellingenmenu is om sneltoetsen uit te zetten of te remappen:
- Is dit menu zelf toetsenbord-bedienbaar?
- Is het vindbaar?

---

## Veelvoorkomende patronen

### Patroon A: Standaard gemeente-website (SIMsite/Drupal)

**Dit criterium is zelden een probleem op standaard gemeente-websites.** De meeste gemeente-websites zijn informatie-websites zonder custom enkel-teken sneltoetsen. SIMsite en Drupal implementeren standaard geen enkel-teken sneltoetsen.

**Audit-uitkomst:** Bijna altijd "niet van toepassing" of PASS.

### Patroon B: Webapplicaties (e-loket, afsprakensysteem)

Complexere webapplicaties kunnen enkel-teken sneltoetsen hebben:
- Kalenderwidget: pijltjestoetsen (niet-afdrukbaar → n.v.t.) maar soms `t` voor "vandaag" (today)
- Kaartapplicatie: `+` en `-` voor zoom
- E-mailapplicatie: `j`/`k` voor vorige/volgende

**Audit:** Controleer of deze sneltoetsen een van de drie oplossingen bieden.

### Patroon C: Third-party widgets

Ingesloten widgets (chat, video-speler, social media) kunnen eigen enkel-teken sneltoetsen hebben.

**Audit:** Test of de sneltoetsen alleen werken als de widget focus heeft (oplossing 3). Als de sneltoetsen ook werken wanneer de widget geen focus heeft → FAIL.

### Patroon D: Selecteerlijsten en autocomplete

Wanneer een `<select>` element of custom dropdown **focus heeft**, is het normaal dat lettertoetsen door de opties navigeren (bijv. "A" springt naar het eerste item dat met A begint). Dit is **GEEN failure** — de sneltoets is alleen actief als het component focus heeft (oplossing 3).

---

## Onderscheid met andere SC's

| SC | Relatie met 2.1.4 |
|----|------------------|
| **2.1.1** | Toetsenbordbediening: alle functionaliteit moet met toetsenbord bereikbaar zijn. 2.1.4 gaat specifiek over het voorkomen van onbedoelde activering van enkel-teken sneltoetsen. |
| **2.1.2** | Geen toetsenbordval: focus moet altijd weg te bewegen zijn. Ander probleem. |
| **2.1.4** | **Enkel-teken sneltoetsen: uitzetten, remappen of alleen bij focus** |
| **3.2.1** | Bij focus: het ontvangen van focus mag geen onverwachte contextwijziging veroorzaken. Verwant maar ander mechanisme. |

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: De sneltoets gebruikt geen modifier-toets**

| Beschrijving |
|-------------|
| Gebruikers in staat stellen enkel-teken sneltoetsen uit te zetten |
| Mechanisme bieden om sneltoetsen te remappen naar modifier-combinaties (het remap-mechanisme mag niet-afdrukbare tekens bevatten; alternatieven kunnen strings tot 25 tekens zijn die als spraakcommando's werken) |

**Situatie B: De sneltoets is alleen actief bij focus**

Geen specifieke technique nodig — de implementatie zelf is de oplossing.

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F99 | Enkel-teken sneltoetsen implementeren die niet kunnen worden uitgezet of geremapt |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [sneltoets identificatie]
Element:         [beschrijving van de functionaliteit]
Sneltoets:       [welke toets, bijv. "j" voor volgende item]
Locatie:         [pagina / component]
Beoordeling:     [PASS | FAIL | N.v.t.]

Alleen bij focus: [ja/nee]
Uitzetten:       [ja/nee — hoe]
Remappen:        [ja/nee — hoe]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [F99]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Dit criterium is zelden relevant op gemeente-websites

**In de praktijk is SC 2.1.4 bijna nooit een probleem op standaard informatie-websites van gemeenten.** De meeste gemeente-websites implementeren geen enkel-teken sneltoetsen. Het criterium is vooral relevant voor:
- Complexe webapplicaties (Gmail, Slack, etc.)
- Online editors en ontwikkelomgevingen
- Game-achtige interfaces
- Kaartapplicaties met toetsenbordnavigatie

### Testmethode samengevat

1. **Als er een video op de pagina staat: speel deze eerst af**
2. Klik op de pagina (niet in een invoerveld)
3. Druk op veelgebruikte sneltoets-tekens: **Spatie, M, K, J, L, F, C** (dit zijn typische video-sneltoetsen)
4. Druk op alle letter- en cijfertoetsen
5. Gebeurt er iets? → Zo nee, criterium is niet van toepassing
6. Zo ja → Controleer de drie oplossingen

### Technisch of redactioneel issue?

SC 2.1.4 is altijd een **technisch issue**:
- Sneltoetsen worden in JavaScript geïmplementeerd
- Bij Shift2-audits valt dit onder de **technische audit** (Cardan/template)

### Wie heeft er baat bij?

- **Gebruikers van spraaksoftware** — dicteren produceert lettertoetsen die sneltoetsen activeren
- **Motorisch beperkte gebruikers** — onbedoeld indrukken van toetsen
- **Mensen met cognitieve beperkingen** — onverwachte acties zijn desoriënterend
- **Alle toetsenbordgebruikers** — per ongeluk indrukken van verkeerde toets

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.1.4 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 2.1.4:** https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html
- **Failure F99 (enkel-teken sneltoetsen):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F99
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
