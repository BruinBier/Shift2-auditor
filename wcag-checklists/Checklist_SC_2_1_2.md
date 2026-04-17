---
name: wcag-2-1-2-no-keyboard-trap
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.1.2 (No Keyboard Trap) on Dutch government websites. Use when conducting accessibility audits to verify that keyboard focus can always be moved away from any component using only the keyboard. Covers modal dialogs, embedded content (iframes, video players, maps), custom widgets, cookie-banners, chat-widgets, and the critical distinction between permissible focus trapping (modal) and impermissible keyboard traps. This is a Conformance Requirement 5 (Non-Interference) criterion — one failure means the entire page is non-conformant. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.1.2 Geen toetsenbordval — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.1.2 (Niveau A):**
Als de toetsenbordfocus kan worden verplaatst naar een component van de pagina met behulp van een toetsenbordinterface, dan kan de focus ook weer worden verplaatst vanaf die component met alleen een toetsenbordinterface. Als hiervoor meer nodig is dan standaard Tab- of pijltjestoetsen of andere standaard exit-methoden, wordt de gebruiker geïnformeerd over de methode om de focus te verplaatsen.

**Kernprincipe:** Een toetsenbordgebruiker mag nooit "vastzitten" in een onderdeel van de pagina. Elk element waar je met het toetsenbord in kunt komen, moet je er ook weer met het toetsenbord uit kunnen.

---

## Conformance Requirement 5: Non-Interference

**SC 2.1.2 is een van de vijf criteria die vallen onder Conformance Requirement 5.** Dit betekent:

- Eén failure op SC 2.1.2 maakt de **hele pagina** non-conformant
- Het criterium geldt voor **alle content** op de pagina, ook content die niet wordt gebruikt om andere criteria te halen
- Dit maakt SC 2.1.2 tot een van de meest kritieke succescriteria

De vijf Non-Interference criteria zijn: 1.4.2 (Audio Control), 2.1.2 (No Keyboard Trap), 2.2.2 (Pause, Stop, Hide), 2.3.1 (Three Flashes), en de parseereis van 4.1.1.

---

## De drie voorwaarden

### 1. Focus erin = focus eruit
Als je met Tab (of andere toetsen) naar een component kunt navigeren, moet je er ook weer weg kunnen.

### 2. Met standaard toetsen OF gedocumenteerd
Bij voorkeur met:
- **Tab** / **Shift+Tab** — vooruit/achteruit door interactieve elementen
- **Pijltjestoetsen** — binnen een component
- **Escape** — sluiten van een overlay/dialog
- **Enter** — activeren van een knop (bijv. "Sluiten")

Als een **niet-standaard methode** nodig is, moet de gebruiker hierover worden geïnformeerd (bijv. "Druk F10 om de editor te verlaten").

### 3. Altijd een uitweg
Er mag geen situatie zijn waarin de gebruiker alleen de browser kan herstarten of de muis moet pakken om verder te navigeren.

---

## Toegestane vs. niet-toegestane focus-opsluiting

### Toegestaan: modale dialoog met focus-trap

Een modale dialoog (modal dialog) mag de focus **bewust** binnen de dialoog houden. Dit is zelfs een best practice:

```
Modale dialoog open:
- Tab cyclet binnen de dialoog (van laatste naar eerste element)
- Content achter de dialoog is inert (niet bereikbaar)
- Gebruiker kan de dialoog sluiten via:
  → Escape-toets
  → "Sluiten" / "Annuleren" / "OK" knop
  → Alle knoppen zijn toetsenbord-bedienbaar
→ PASS: dit is GEEN toetsenbordval
```

### Niet toegestaan: echte toetsenbordval

```
Situatie: gebruiker tabt in een embedded widget
- Tab blijft ronddraaien binnen de widget
- Escape werkt niet
- Er is geen "Sluiten"-knop
- De enige uitweg is de muis gebruiken of de browser herstarten
→ FAIL: dit IS een toetsenbordval
```

**Het cruciale verschil:** Bij een toegestane focus-trap (modal) is er ALTIJD een toetsenbord-bedienbare manier om de trap te verlaten. Bij een echte toetsenbordval is die er niet.

---

## Beslisboom

```
Toetsenbord-focus bereikt een component
│
├─ Kan de focus weg van de component met Tab/Shift+Tab?
│  └─ JA → PASS
│
├─ Kan de focus weg met Escape of pijltjestoetsen?
│  └─ JA → PASS
│
├─ Kan de focus weg met een andere toets?
│  ├─ JA → Is de gebruiker geïnformeerd over die toets?
│  │  ├─ JA → PASS
│  │  └─ NEE → FAIL (methode niet gecommuniceerd)
│  └─ NEE → Kan de focus weg met een zichtbare knop
│           (Sluiten/OK/Annuleren)?
│     ├─ JA → Is die knop toetsenbord-bedienbaar?
│     │  ├─ JA → PASS
│     │  └─ NEE → FAIL
│     └─ NEE → FAIL (toetsenbordval)
```

---

## Stapsgewijze auditprocedure

### Stap 1: Navigeer door de hele pagina met alleen het toetsenbord

1. Plaats de focus in de adresbalk van de browser
2. Druk herhaaldelijk op **Tab** om door alle interactieve elementen te navigeren
3. Ga door tot je weer bij de adresbalk of het einde van de pagina komt
4. Gebruik ook **Shift+Tab** om terug te navigeren

### Stap 2: Identificeer "risico-componenten"

Let extra op:
- Modale dialogen (cookie-banner, pop-ups)
- Embedded content (iframes, video-spelers, kaarten)
- Custom widgets (datepickers, rich text editors, carrousels)
- Formulieren met complexe interactie
- Chat-widgets
- Social media embeds
- Third-party content

### Stap 3: Test elk risico-component

Per component:
1. Tab erin
2. Tab erdoorheen (alle interactieve elementen binnen de component)
3. Tab eruit — kom je weer op de volgende interactieve content van de pagina?
4. Als Tab niet werkt: probeer Escape
5. Als Escape niet werkt: probeer Shift+Tab
6. Als niets werkt → FAIL

### Stap 4: Controleer modale dialogen

Bij elke modale dialoog:
1. Open de dialoog (via toetsenbord)
2. Tab door alle elementen in de dialoog
3. Controleer: cyclet de focus binnen de dialoog? (dit is correct)
4. Sluit de dialoog met Escape → werkt dit?
5. Sluit de dialoog met de "Sluiten"/"OK"/"Annuleren" knop → is deze bereikbaar met Tab en activeerbaar met Enter?
6. Na sluiten: keert de focus terug naar het element dat de dialoog opende?

---

## De 7 auditgebieden

### 1. MODALE DIALOGEN

De meest voorkomende bron van toetsenbordval-issues.

```
Cookie-banner (als modal):
- Kan de gebruiker de banner sluiten met Escape?
- Kan de gebruiker "Accepteren" / "Weigeren" bereiken met Tab?
- Is de banner toetsenbord-bedienbaar?

Pop-up / overlay:
- Kan de overlay worden gesloten met Escape?
- Is er een "Sluiten" (X) knop die met Tab bereikbaar is?
- Keert de focus terug na sluiten?
```

### 2. EMBEDDED VIDEO-SPELERS

Video-spelers (YouTube embed, Vimeo, eigen speler) kunnen toetsenbordvallen bevatten.

```
Controleer:
- Kan je met Tab naar de video-speler?
- Kan je met Tab DOOR de bedieningselementen (play, volume, etc.)?
- Kan je met Tab VOORBIJ de video-speler naar de volgende content?
- Werkt dit ook in fullscreen-modus?
  → Volledig scherm moet met het toetsenbord te sluiten zijn
    (meestal Escape)
```

**Uitzondering tijdens afspelen:** Zolang een video speelt, is het niet erg als je met het toetsenbord de video niet kunt verlaten. Als de video is **afgelopen of gepauzeerd**, dan moet dit wél kunnen. De redenering: tijdens het afspelen is de gebruiker bezig met de video; pas als de video stopt moet navigatie mogelijk zijn.

### 3. GOOGLE MAPS / KAART-EMBEDS

Ingesloten kaarten zijn een veelvoorkomende bron van toetsenbordvallen.

```
Controleer:
- Kan je met Tab naar de kaart?
- Kan je met Tab VOORBIJ de kaart?
  (Google Maps kan focus vangen als de kaart interactief is)
- Kan je de kaart verlaten met Escape?
```

### 4. FORMULIEREN EN DATEPICKERS

```
Datepicker / kalenderwidget:
- Kan je de datepicker openen met het toetsenbord?
- Kan je een datum kiezen met pijltjestoetsen?
- Kan je de datepicker sluiten met Escape?
- Kan je VOORBIJ de datepicker tabben?

Autocomplete / dropdown:
- Kan je een optie kiezen met pijltjestoetsen?
- Kan je de dropdown sluiten met Escape?
- Vangt de dropdown de focus niet permanent?

Rich text editor:
- Kan je de editor verlaten met Tab?
- Als Tab in de editor een tab-karakter invoegt:
  is er een alternatieve manier om eruit te komen?
  → De gebruiker moet hierover geïnformeerd worden
```

### 5. CHAT-WIDGETS

Veel gemeente-websites hebben een chat-widget (bijv. voor klantenservice).

```
Controleer:
- Kan de chat-widget worden geopend met het toetsenbord?
- Kan de chat-widget worden GESLOTEN met het toetsenbord?
- Vangt de open chat-widget de focus?
- Kan je VOORBIJ de gesloten chat-widget tabben?
```

### 6. SOCIAL MEDIA EMBEDS

Ingesloten tweets, Facebook-posts, Instagram-posts.

```
Controleer:
- Kan je met Tab in de embed?
- Kan je er met Tab ook weer uit?
- Bevat de embed interactieve elementen die focus vangen?
```

### 7. THIRD-PARTY IFRAMES

Alle embedded content van derden: advertenties, formulieren, kaarten, widgets.

```
Controleer:
- Kan je met Tab in het iframe?
- Kan je er met Tab ook weer uit?
- Heeft het iframe een tabindex die navigatie verstoort?
```

**Test iframes in meerdere browsers:** Iframes kunnen zich per browser anders gedragen. Test altijd in Chrome, Firefox én Edge. Een iframe dat in Chrome geen toetsenbordval oplevert, kan dat in Firefox wél doen (of omgekeerd).

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Cookie-banner

De cookie-banner is het eerste wat een toetsenbordgebruiker tegenkomt.

```
Goede cookie-banner:
✓ Focus gaat direct naar de banner bij laden
✓ Tab navigeert door "Accepteren" en "Instellingen"
✓ Enter activeert de gekozen optie
✓ Na keuze verdwijnt de banner en gaat focus naar de pagina
✓ Escape sluit de banner (met standaard weigering)

Slechte cookie-banner:
✗ Focus gaat niet naar de banner → gebruiker moet langs
  alle pagina-content tabben om bij de banner te komen
✗ Knoppen niet bereikbaar met Tab
✗ Banner verdwijnt maar focus is "zoek"
✗ Focus zit vast in de banner → TOETSENBORDVAL
```

### Patroon B: Afsprakensysteem

Gemeente-websites hebben vaak een afsprakensysteem met datepicker.

```
Controleer:
- Is de datepicker bereikbaar met Tab?
- Kan je met pijltjestoetsen door de kalender navigeren?
- Kan je de datepicker sluiten met Escape?
- Na keuze: gaat de focus naar het volgende veld?
```

### Patroon C: Plattegrond/kaart

```
Controleer:
- Is de kaart interactief (zoom, pan)?
- Vangt de kaart de focus bij Tab?
- Is er een "Skip" link of mechanisme om de kaart over te slaan?
```

### Patroon D: Video op homepagina

```
Controleer:
- Is de video-speler bereikbaar met Tab?
- Kan je voorbij de video tabben?
- Als de video autoplays: vangt de speler de focus?
```

### Patroon E: Zoek-autocomplete

```
Controleer:
- Bij typen verschijnt een dropdown met suggesties
- Kan je met pijltjestoetsen door suggesties navigeren?
- Kan je met Escape de suggesties sluiten?
- Kan je met Tab voorbij het zoekveld?
```

### Patroon F: Hamburger-menu (mobiel/responsive)

```
Controleer:
- Kan het menu worden geopend met Enter?
- Kan het menu worden gesloten met Escape?
- Zit de focus vast in het open menu? (toegestaan als modal)
- Na sluiten: keert focus terug naar de hamburger-knop?
```

---

## Onderscheid met andere SC's

### Verschil SC 2.1.1 en SC 2.1.2

Dit onderscheid is cruciaal en wordt vaak verward:

| Situatie | SC |
|----------|-----|
| Je kunt met het toetsenbord **niet IN** een component komen | **2.1.1** (Toetsenbordbediening) |
| Je kunt met het toetsenbord IN een component komen, maar er **niet meer UIT** | **2.1.2** (Geen toetsenbordval) |
| Je klikt met de **muis** in een component en kunt er niet meer uit | **Geen failure** — SC 2.1.2 gaat alleen over toetsenbordnavigatie |
| Door een toetsenbordval kun je andere content niet meer bereiken | Alleen onder **2.1.2** afkeuren |

**Voorbeeld:** Als je met het toetsenbord niet in een embedded widget kunt komen → afkeuren onder 2.1.1. Als je er met het toetsenbord wél in kunt maar niet meer uit → afkeuren onder 2.1.2. Niet dubbel afkeuren.

| SC | Relatie met 2.1.2 |
|----|------------------|
| **2.1.1** | Toetsenbordbediening: ALLE functionaliteit moet met toetsenbord bereikbaar zijn. 2.1.2 is specifieker: je mag niet VAST komen te zitten. |
| **2.1.2** | **Geen toetsenbordval: focus moet altijd weg te bewegen zijn** |
| **2.4.3** | Focusvolgorde: de volgorde van focus moet logisch zijn. Maar als je vastzitten is het 2.1.2. |
| **2.4.7** | Focus zichtbaar: de focus-indicator moet zichtbaar zijn. Maar als je vastzit is het 2.1.2. |
| **2.4.11** | Focus niet verborgen (minimum): gefocust element mag niet volledig verborgen zijn. |

**Vier fundamentele vragen voor toetsenbordtoegankelijkheid:**

1. **Kan ik erbij?** → SC 2.1.1 (Toetsenbordbediening)
2. **Kan ik eruit?** → SC 2.1.2 (Geen toetsenbordval)
3. **Is de volgorde logisch?** → SC 2.4.3 (Focusvolgorde)
4. **Kan ik zien waar ik ben?** → SC 2.4.7 (Focus zichtbaar)

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G21 | Zorgen dat gebruikers niet vastzitten in content |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F10 | Meerdere content-formaten combineren op een manier die gebruikers vastzet in één formaattype |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-7: modale dialogen | video-spelers |
                  kaart-embeds | formulieren/datepickers |
                  chat-widgets | social media embeds |
                  third-party iframes]
Element:         [beschrijving van het component]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL]
Ernst:           [KRITIEK — Non-Interference criterium]

Kan focus erin:  [ja/nee — met welke toets]
Kan focus eruit: [ja/nee — met welke toets]
Escape werkt:    [ja/nee/n.v.t.]
Instructie
aanwezig:        [ja/nee — alleen als niet-standaard toets nodig]

Probleem:        [specifieke beschrijving van de val]
Technique:       [G21 / F10]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

**Belangrijke noot:** Dit probleem komt in de praktijk eigenlijk bijna nooit voor op moderne gemeente-websites. Historisch waren toetsenbordvallen vooral een probleem bij plugins als Flash, Silverlight of Java. Nu deze plugins niet meer worden gebruikt, zijn echte toetsenbordvallen zeldzaam. Test het wel altijd — maar verwacht weinig failures.

De meest waarschijnlijke plekken waar je het nog kunt tegenkomen:

1. **Cookie-banner niet toetsenbord-bedienbaar** — focus gaat niet naar de banner, of knoppen niet bereikbaar
2. **Google Maps embed vangt focus** — Tab gaat de kaart in maar niet meer eruit
3. **Video-speler vangt focus** — embedded YouTube/Vimeo laat Tab niet door
4. **Datepicker zonder Escape** — kalenderwidget kan niet worden gesloten
5. **Chat-widget zonder sluitknop** — third-party chat vangt focus
6. **Rich text editor vangt Tab** — Tab voegt een tab-karakter in i.p.v. verder te navigeren
7. **Modale dialoog zonder Escape** — overlay kan alleen met muis worden gesloten
8. **Social media embed vangt focus** — ingesloten post laat Tab niet door

### Testtools

| Tool | Gebruik |
|------|---------|
| Toetsenbord | Tab, Shift+Tab, Escape, Enter, Pijltjestoetsen |
| Chrome DevTools | Focus-indicator volgen, event listeners inspecteren |
| Browser-extensies | axe DevTools kan sommige focus-issues detecteren |

**Belangrijkste tool: je eigen toetsenbord.** SC 2.1.2 is alleen betrouwbaar te testen door daadwerkelijk met het toetsenbord door de pagina te navigeren.

### Technisch of redactioneel issue?

SC 2.1.2 is vrijwel altijd een **technisch issue**:
- Focus-management is template/developer-verantwoordelijkheid
- Third-party widgets zijn een technische keuze
- Bij Shift2-audits valt dit onder de **technische audit** (Cardan/template)

### Wie heeft er baat bij?

- **Blinde gebruikers** — navigeren volledig met toetsenbord via screenreader; een val betekent dat ze de pagina moeten verlaten
- **Motorisch beperkte gebruikers** — gebruiken toetsenbord of alternatieve invoer; kunnen de muis niet pakken om te "ontsnappen"
- **Power users** — gebruiken toetsenbord voor efficiëntie
- **Iedereen met een kapotte muis** — tijdelijke beperking

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.1.2 is Niveau A — dus verplicht.**

**Extra gewicht:** Als Non-Interference criterium (Conformance Requirement 5) heeft een failure op SC 2.1.2 grotere consequenties dan een failure op de meeste andere criteria — het maakt de hele pagina non-conformant.

---

## Bronnen

- **WCAG 2.2 Understanding 2.1.2:** https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html
- **Technique G21 (niet vastzitten):** https://www.w3.org/WAI/WCAG22/Techniques/general/G21
- **Failure F10 (meerdere formaten):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F10
- **ACT Rule: Focusable element has no keyboard trap:** https://www.w3.org/WAI/standards-guidelines/act/rules/80af7b/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
