---
name: wcag-1-2-2-captions-prerecorded
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.2.2 (Captions - Prerecorded) on Dutch government websites. Use when conducting accessibility audits on prerecorded synchronized media (video met audio) to verify that captions/ondertiteling are present and of adequate quality. Covers YouTube embeds, Vimeo embeds, HTML5 video elements, auto-generated vs. handmatige ondertiteling, open vs. closed captions, and caption quality assessment. Trigger this skill when analyzing pages with video content containing audio. Essential for gemeente website audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.2.2 Ondertiteling (vooraf opgenomen) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.2.2 (Niveau A):**
Ondertiteling wordt geleverd voor alle vooraf opgenomen audiocontent in gesynchroniseerde media, behalve wanneer de media een media-alternatief voor tekst is en duidelijk als zodanig is gelabeld.

**Kernprincipe:** Mensen die doof of slechthorend zijn moeten via ondertiteling de audiocontent van een video kunnen volgen.

**Belangrijk verschil — ondertiteling vs. ondertitels:**
- **Ondertiteling (captions):** Bevat alle gesproken tekst, spreker-identificatie EN relevante niet-spraakgeluiden. Bedoeld voor dove/slechthorende gebruikers.
- **Ondertitels (subtitles):** Bevatten alleen gesproken dialoog, meestal in een andere taal. Niet voldoende voor SC 1.2.2.

In de Nederlandse praktijk wordt de term "ondertiteling" voor beide gebruikt. Bij het auditen moet worden beoordeeld of de ondertiteling voldoende is voor dove gebruikers.

---

## Scope: wat valt wel en niet onder 1.2.2?

### Wel onder SC 1.2.2:

| Type | Voorbeeld |
|------|-----------|
| YouTube-video met audio | Gemeentelijke video over beleid |
| Vimeo-video met audio | Promotievideo gemeente |
| HTML5 `<video>` met audio | Zelf gehoste video |
| Opgenomen raadsvergadering (video + audio) | Video-opname met beeld |
| Instructievideo met gesproken uitleg | Video over afvalscheiding |
| Interview/toespraak op video | Video burgemeester |
| Animatie met audio | Uitleganimatie met voice-over |
| Concertregistratie | Concert waarbij muziek informatieve rol speelt |

### Niet onder SC 1.2.2:

| Type | Waarom niet | Valt onder |
|------|------------|-----------|
| Alleen-audio (podcast) | Geen gesynchroniseerde media | SC 1.2.1 |
| Alleen-video (zonder audio) | Geen audiocontent | SC 1.2.1 |
| Livestream video | Niet vooraf opgenomen | SC 1.2.4 (niveau AA) |
| Media-alternatief voor tekst | Uitzondering in criterium | N.v.t.* |

*\*De uitzondering geldt wanneer de video expliciet dient als alternatief voor tekst die al op de pagina staat en als zodanig is gelabeld.*

---

## Beslisboom

```
Video-element gevonden op de pagina
│
├─ Bevat de video audio (gesproken tekst, muziek, geluidseffecten)?
│  ├─ NEE → Niet onder SC 1.2.2 (check SC 1.2.1 voor alleen-video)
│  └─ JA ↓
│
├─ Is de video vooraf opgenomen (niet live)?
│  ├─ NEE → Niet onder SC 1.2.2 (check SC 1.2.4)
│  └─ JA ↓
│
├─ Is de video gepubliceerd na 23 september 2020 (of datum onbekend)?
│  ├─ NEE (vóór 23-09-2020) → Valt buiten scope Toegankelijkheidswet
│  └─ JA / onbekend ↓
│
├─ Is de video een media-alternatief voor tekst, duidelijk zo gelabeld?
│  ├─ JA → UITZONDERING: SC 1.2.2 niet van toepassing
│  └─ NEE ↓
│
├─ Is er ondertiteling beschikbaar?
│  ├─ NEE → FAIL
│  └─ JA ↓
│
└─ Kwaliteitscheck ondertiteling:
   ├─ Bevat alle gesproken tekst? → JA/NEE
   ├─ Identificeert sprekers bij meerdere sprekers? → JA/NEE
   ├─ Bevat relevante niet-spraakgeluiden? → JA/NEE
   ├─ Is gesynchroniseerd met de audio? → JA/NEE
   ├─ Is in dezelfde taal als de gesproken audio? → JA/NEE
   └─ Is nauwkeurig (geen ernstige fouten)? → JA/NEE
       └─ Alles JA → PASS | Anders → FAIL (F8)
```

---

## Stapsgewijze auditprocedure

Volg deze stappen om te bepalen of een vooraf opgenomen video met geluid voldoet:

### Stap 1: Controleer of er een video met geluid op de webpagina staat
Zoek naar video's die gesproken tekst, muziek of andere belangrijke geluiden bevatten.

### Stap 2: Controleer de publicatiedatum van de video
- **Gepubliceerd vóór 23 september 2020:** De video hoeft niet te voldoen aan SC 1.2.2 (valt buiten de scope van de Toegankelijkheidswet voor bestaande content).
- **Gepubliceerd na 23 september 2020 of datum onbekend:** De video moet voldoen.

**Hoe de publicatiedatum achterhalen:**
- YouTube: Klik op de videotitel om naar YouTube te gaan, datum staat onder de video
- Vimeo: Datum vaak zichtbaar op de videopagina
- CMS-metadata: Controleer de `article:published_time` meta-tag in de HTML
- Onbekend: Behandel als "moet voldoen"

### Stap 3: Controleer de ondertiteling door de video (gedeeltelijk of helemaal) af te spelen
- Kijk of alle gesproken tekst correct is ondertiteld.
- Controleer of de ondertiteling synchroniseert met de audio (op het juiste moment verschijnt).

### Stap 4: Controleer of de ondertiteling correct wordt aangeboden
- **Open captions (in de video zelf):** Dit is goed.
- **Closed captions (in-/uitschakelbaar via CC-knop):** Dit is goed.
- **Los ondertitelingsbestand (.srt/.vtt):** Toegestaan, mits de gebruiker het kan downloaden en gebruiken.
- **Geen ondertiteling of onvolledig:** Dit is niet goed → FAIL.

### Stap 5: Controleer of belangrijke geluiden en muziek ondertiteld zijn
Sommige geluiden zijn nodig om de video te begrijpen, zoals:
- "telefoon rinkelt", "dramatische muziek speelt", "[publiek lacht]"
- Deze informatie moet ook in de ondertiteling staan.

### Stap 6: Controleer de kwaliteit van de ondertiteling
- Als ontbrekende leestekens of verkeerde spreker-identificatie de video moeilijk te volgen maken, is dat een probleem (F8).
- Automatische ondertiteling met ernstige fouten is onvoldoende.

---

### 1. ONDERTITELING AANWEZIG

**Regel:** Alle vooraf opgenomen gesynchroniseerde media moeten ondertiteling hebben.

**Hoe te controleren:**
- YouTube: Klik op het CC-icoon (of tandwiel → ondertiteling). Controleer of er ondertiteling beschikbaar is.
- Vimeo: Controleer of CC-knop beschikbaar is.
- HTML5 `<video>`: Controleer of er een `<track kind="captions">` of `<track kind="subtitles">` element aanwezig is.
- Embedded players: Activeer ondertiteling in de player en controleer.

```html
<!-- FAIL: video zonder ondertiteling -->
<video controls src="toespraak-burgemeester.mp4"></video>

<!-- PASS: video met ondertiteling via track-element -->
<video controls src="toespraak-burgemeester.mp4">
  <track kind="captions" src="toespraak.vtt" srclang="nl"
         label="Nederlandse ondertiteling" default>
</video>

<!-- PASS: YouTube embed (ondertiteling in YouTube zelf) -->
<iframe src="https://www.youtube.com/embed/ABC123?cc_load_policy=1"
        title="Toespraak burgemeester">
</iframe>
<!-- Mits de YouTube-video daadwerkelijk ondertiteling heeft -->
```

### 2. TYPE ONDERTITELING: OPEN VS. CLOSED

**Closed captions (gesloten ondertiteling):**
- In-/uitschakelbaar door de gebruiker
- Voorkeur vanuit toegankelijkheid (gebruiker heeft controle)
- Voorbeelden: YouTube CC, VTT-tracks, SRT-bestanden

**Open captions (open ondertiteling):**
- Permanent in het beeld gebrand
- Kan niet worden uitgeschakeld
- Acceptabel voor SC 1.2.2, maar minder flexibel

Beide vormen zijn voldoende voor SC 1.2.2. Closed captions zijn de voorkeur.

### 3. AUTO-GEGENEREERDE ONDERTITELING

**Belangrijk auditpunt:** YouTube genereert automatisch ondertiteling via spraakherkenning. Deze automatische ondertiteling:

- Is vaak **onvoldoende nauwkeurig** voor Nederlandse content
- Mist spreker-identificatie
- Mist niet-spraakgeluiden
- Bevat regelmatig ernstige fouten bij namen, plaatsnamen, vakjargon

**Beoordeling:**
- Automatische ondertiteling die aantoonbaar onnauwkeurig is → **FAIL** (F8)
- Automatische ondertiteling die overwegend nauwkeurig is → **PASS met opmerking**
- Handmatig gecorrigeerde/gemaakte ondertiteling → **PASS** (beste praktijk)

**Hoe herken je auto-gegenereerde ondertiteling op YouTube:**
1. Klik op tandwiel → Ondertiteling
2. Als er staat "Nederlands (automatisch gegenereerd)" → automatisch
3. Als er staat "Nederlands" (zonder "automatisch gegenereerd") → handmatig toegevoegd

**Auditaanpak:**
- Bekijk minimaal 1-2 minuten van de video met ondertiteling aan
- Controleer op grove fouten, gemiste woorden, onjuiste namen
- Noteer specifieke voorbeelden van fouten als bewijs

### 4. KWALITEIT VAN DE ONDERTITELING

**Vereisten voor goede ondertiteling (SC 1.2.2):**

| Aspect | Vereist | Voorbeeld |
|--------|---------|-----------|
| Gesproken tekst | JA — woordelijke transcriptie | Elk woord dat wordt gesproken |
| Spreker-identificatie | JA, bij meerdere sprekers | [Burgemeester Jansen]: ... |
| Belangrijke geluidseffecten | JA | [deur slaat dicht], [telefoon rinkelt] |
| Muziek en sfeer | JA, als informatief | [dramatische muziek speelt], [opzwepende beat] |
| Reacties | JA | [publiek lacht], [applaus] |
| Synchronisatie | JA | Tekst verschijnt wanneer audio klinkt |
| Taal | Zelfde taal als audio | NL video → NL ondertiteling, EN video → EN ondertiteling |
| Nauwkeurigheid | JA | Geen ernstige transcriptiefouten |

**Wat hoeft NIET in ondertiteling:**
- Audiodescripties (die zijn voor SC 1.2.5)
- Onbelangrijke achtergrondgeluiden
- Letterlijke "eh" en "uhm" (mag vereenvoudigd)

```
GOEDE ONDERTITELING:

[Burgemeester Jansen]: Welkom bij de opening van het
nieuwe gemeentehuis.
[applaus]
[Wethouder De Vries]: Dank u. Ik wil graag de architect
voorstellen die dit ontwerp heeft gemaakt.
[muziek speelt]

---

SLECHTE ONDERTITELING (F8):

Welkom bij de operatie van het nieuwe huis.
Danku ik wil graag de architectuur stellen.
```

### 5. VINDBAARHEID EN ACTIVERING

**Regel:** Gebruikers moeten de ondertiteling eenvoudig kunnen vinden en activeren.

**Controleer:**
- Is de CC-knop zichtbaar in de videospeler?
- Kan de ondertiteling worden in-/uitgeschakeld?
- Werkt de ondertiteling op verschillende apparaten?
- Is de ondertiteling standaard actief of eenvoudig te activeren?

**YouTube-embeds met verplichte ondertiteling:**
```html
<!-- Ondertiteling standaard aan -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID?cc_load_policy=1"
        title="Beschrijvende titel">
</iframe>

<!-- Ondertiteling beschikbaar maar niet standaard aan (ook acceptabel) -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID"
        title="Beschrijvende titel">
</iframe>
```

### 6. ALTERNATIEF ALS ONDERTITELING ONTBREEKT

**Regel:** Als een video geen ondertiteling heeft, moet er een toegankelijk alternatief beschikbaar zijn zodat gebruikers de informatie toch kunnen begrijpen.

**Toegestane alternatieven:**
- **Alternatieve video met ondertiteling:** Onder de originele video wordt een andere versie van dezelfde video aangeboden, mét ondertiteling. Geldig mits de ondertiteling volledig en correct is.
- **Los ondertitelingsbestand (.srt/.vtt):** Als er geen ingebouwde ondertiteling is, kan een downloadbaar ondertitelingsbestand worden aangeboden.

```html
<!-- Voorbeeld: alternatieve video met ondertiteling -->
<h2>Toespraak burgemeester</h2>
<iframe src="https://www.youtube.com/embed/ABC123"
        title="Toespraak burgemeester (zonder ondertiteling)">
</iframe>
<p><a href="https://www.youtube.com/watch?v=DEF456">
  Bekijk de versie met ondertiteling
</a></p>

<!-- Voorbeeld: los ondertitelingsbestand -->
<video controls src="toespraak.mp4"></video>
<p><a href="/media/toespraak-ondertiteling.srt">
  Download ondertitelingsbestand (.srt)
</a></p>
```

**Let op:** Een los transcript (niet-gesynchroniseerd) is **geen** geldig alternatief voor SC 1.2.2. Het transcript voldoet aan SC 1.2.1, maar ondertiteling moet gesynchroniseerd zijn met de video.

### 7. UITZONDERING: MEDIA-ALTERNATIEF VOOR TEKST

**Regel:** Als de video dient als alternatief voor tekst die al op de pagina staat, en dit duidelijk zo is gelabeld, is SC 1.2.2 niet van toepassing.

```html
<!-- UITZONDERING: video als alternatief voor aanwezige tekst -->
<h2>Verslag raadsvergadering 15 januari 2025</h2>
<p>[Volledig verslag van de vergadering in tekst...]</p>

<p>Bekijk de video-opname van deze vergadering
   (media-alternatief voor bovenstaande tekst):</p>
<iframe src="https://www.youtube.com/embed/ABC123"
        title="Video-opname raadsvergadering 15 januari 2025">
</iframe>
<!-- Video bevat niet meer informatie dan de tekst erboven →
     uitzondering van toepassing -->
```

**Let op:** De uitzondering geldt alleen als:
1. De tekst al volledig op de pagina staat
2. De video niet meer informatie bevat dan de tekst
3. De video duidelijk is gelabeld als media-alternatief

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: YouTube-embed (meest voorkomend)

```html
<iframe src="https://www.youtube.com/embed/qoLnoH6lZBM"
        title="Ondertekening Kust">
</iframe>
```

**Auditprocedure:**
1. Open de video op YouTube (klik "Bekijken op YouTube")
2. Controleer of CC-knop beschikbaar is
3. Activeer ondertiteling
4. Check of het automatisch gegenereerd of handmatig is
5. Bekijk 1-2 minuten en beoordeel kwaliteit

**Veelvoorkomend probleem:** Gemeente plaatst YouTube-video maar controleert niet of er (goede) ondertiteling is. YouTube genereert soms automatisch ondertiteling, soms niet.

### Patroon B: Raadsvergadering video-opname

Veel gemeenten gebruiken platforms als Notubiz, CompanyWebcast of iBabs voor raadsvergaderingen.

**Auditaanpak:**
- Controleer of het platform ondertiteling ondersteunt
- Vaak is er een los transcript (notulen) beschikbaar — dit is voldoende voor SC 1.2.1 maar **niet** voor SC 1.2.2 (ondertiteling moet gesynchroniseerd zijn)
- Een los transcript zonder synchronisatie is **geen** ondertiteling

### Patroon C: Vimeo-embed

```html
<iframe src="https://player.vimeo.com/video/123456789"
        title="Promotievideo gemeente">
</iframe>
```

**Auditprocedure:** Vergelijkbaar met YouTube. Check CC-beschikbaarheid in Vimeo-player.

### Patroon D: HTML5 video met track-element

```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="ondertiteling.vtt" srclang="nl"
         label="Nederlandse ondertiteling">
</video>
```

**Auditprocedure:**
1. Controleer in de HTML of een `<track>` element aanwezig is
2. Controleer of `kind="captions"` of `kind="subtitles"` is opgegeven
3. Controleer of het VTT/SRT-bestand daadwerkelijk laadt
4. Activeer ondertiteling en beoordeel kwaliteit

### Patroon E: Cookie-wall blokkeert video

SIMsite-websites tonen vaak een cookiemelding in plaats van de YouTube-embed als externe media-cookies niet zijn geaccepteerd.

```html
<div class="ParagraphVideo_paragraphVideo__E68Zn">
  <!-- Video wordt pas geladen na cookie-acceptatie -->
</div>
```

**Auditaanpak:**
- Accepteer cookies voor externe media om de video te kunnen beoordelen
- De ondertitelingsverplichting geldt voor de video zelf, niet voor de cookiewall
- Noteer in het rapport dat de video pas na cookie-acceptatie zichtbaar is

### Patroon F: Sociale media video-embed

```html
<iframe src="https://www.facebook.com/plugins/video.php?..."
        title="Facebook video">
</iframe>
```

**Auditaanpak:** Controleer of het sociale mediaplatform ondertiteling ondersteunt en of deze is geactiveerd.

---

## Ondertitelingsformaten

| Formaat | Extensie | Gebruik |
|---------|----------|---------|
| WebVTT | .vtt | HTML5 `<track>`, meest standaard |
| SRT | .srt | Breed ondersteund, YouTube/Vimeo upload |
| TTML/DFXP | .ttml/.dfxp | Professionele broadcast |
| YouTube auto | — | Automatisch gegenereerd door YouTube |

**WebVTT-voorbeeld:**
```
WEBVTT

00:00:01.000 --> 00:00:04.500
[Burgemeester Jansen]: Welkom bij de opening
van het nieuwe gemeentehuis.

00:00:05.000 --> 00:00:07.000
[applaus]

00:00:08.000 --> 00:00:12.500
[Wethouder De Vries]: Dank u. Ik wil graag
de architect voorstellen.
```

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G93 | Open (altijd zichtbare) ondertiteling aanbieden |
| G87 | Gesloten ondertiteling aanbieden (closed captions) |
| H95 | Het `<track>` element gebruiken voor ondertiteling |

**Specifiek voor G87 (closed captions):**
- SM11: Gesynchroniseerde tekststreams in SMIL 1.0
- SM12: Gesynchroniseerde tekststreams in SMIL 2.0
- H95: `<track>` element voor ondertiteling
- Elk media-formaat met speler die closed captions ondersteunt

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F8 | Ondertiteling die dialoog of belangrijke geluidseffecten weglaat |
| F75 | Gesynchroniseerde media zonder ondertiteling aanbieden wanneer de media meer informatie bevat dan de bijbehorende tekst |

---

## Rapportageformat

Voor elke bevinding:

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-7: aanwezigheid | type | auto-gegenereerd |
                  kwaliteit | vindbaarheid | alternatief |
                  uitzondering]
Element:         [beschrijving van het video-element]
Locatie:         [positie op pagina / URL]
Videobron:       [YouTube / Vimeo / HTML5 / extern platform]
Beoordeling:     [PASS | FAIL | UITZONDERING | N.v.t.]

Ondertiteling:   [aanwezig/afwezig]
Type:            [open / closed / auto-gegenereerd / handmatig]
Kwaliteit:       [goed / onvoldoende / niet beoordeeld]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [W3C failure/sufficient technique code]
Bewijs:          [specifieke voorbeelden van fouten indien van toepassing]
Aanbeveling:     [concrete oplossing]
```

---

## Relatie met andere SC's

| SC | Naam | Niveau | Relatie met 1.2.2 |
|----|------|--------|------------------|
| 1.2.1 | Alleen audio/video | A | Transcript voor alleen-audio/video |
| **1.2.2** | **Ondertiteling (vooraf opgenomen)** | **A** | **Gesynchroniseerde ondertiteling** |
| 1.2.3 | Audiodescriptie of media-alternatief | A | Visuele informatie toegankelijk maken |
| 1.2.4 | Ondertiteling (live) | AA | Zelfde als 1.2.2 maar voor live |
| 1.2.5 | Audiodescriptie (vooraf opgenomen) | AA | Beschrijving van visuele content |

**Belangrijk onderscheid 1.2.1 vs. 1.2.2:**
- SC 1.2.1 vereist een **transcript** (los tekstdocument) voor alleen-audio
- SC 1.2.2 vereist **gesynchroniseerde ondertiteling** (tekst in/over de video)
- Een los transcript is NIET voldoende voor SC 1.2.2
- Gesynchroniseerde ondertiteling is NIET vereist voor SC 1.2.1

---

## Praktische audittips voor gemeente-websites

### Veelgemaakte fouten

1. **Geen ondertiteling bij YouTube-embeds** — Gemeente plaatst video zonder te controleren of er ondertiteling is
2. **Automatische YouTube-ondertiteling als voldoende beschouwen** — Auto-gegenereerd is vaak te onnauwkeurig voor Nederlandse content
3. **Transcript in plaats van ondertiteling** — Een los transcript voldoet niet aan SC 1.2.2
4. **Ondertiteling alleen in het Engels** — Nederlandse video vereist Nederlandse ondertiteling
5. **Ondertiteling mist niet-spraakgeluiden** — Alleen dialoog is onvoldoende (dat zijn ondertitels, geen ondertiteling)
6. **Cookie-wall onderzocht maar video niet** — Video wordt pas zichtbaar na cookie-acceptatie

### Aanbevelingen voor gemeenten

**Bij eigen video's:**
1. Maak handmatige ondertiteling aan (VTT of SRT)
2. Upload naar YouTube als ondertitelingsbestand
3. Controleer synchronisatie en nauwkeurigheid
4. Voeg spreker-identificatie toe bij meerdere sprekers
5. Voeg relevante niet-spraakgeluiden toe

**Bij YouTube-video's van derden:**
- Controleer of de bron ondertiteling heeft
- Als de bron geen goede ondertiteling heeft, overweeg een alternatief (transcript op de pagina)
- Meld bij de bron dat ondertiteling nodig is

**Bij raadsvergaderingen:**
- Platform moet ondertiteling ondersteunen
- Notulen zijn geen vervanging voor gesynchroniseerde ondertiteling
- Overweeg automatische ondertiteling + handmatige correctie

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.2.2 is Niveau A:**
- Verplicht voor compliance
- Eén van de meest voorkomende schendingen op gemeente-websites
- Gemeenten plaatsen regelmatig video's zonder ondertiteling
- YouTube auto-ondertiteling wordt vaak onterecht als voldoende beschouwd

**Publicatiedatum bepaalt verplichting:**
- Video's gepubliceerd **vóór 23 september 2020** hoeven niet te voldoen (bestaande content bij inwerkingtreding Toegankelijkheidswet)
- Video's gepubliceerd **na 23 september 2020** moeten voldoen
- Video's met **onbekende publicatiedatum** worden behandeld als "moet voldoen"

**Let op:** SC 1.2.4 (live ondertiteling, niveau AA) is ook verplicht voor overheidswebsites. Live gestreamde raadsvergaderingen moeten live ondertiteling hebben.

---

## Bronnen

- **WCAG 2.2 Understanding 1.2.2:** https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html
- **Technique G87 (Closed captions):** https://www.w3.org/WAI/WCAG22/Techniques/general/G87
- **Technique G93 (Open captions):** https://www.w3.org/WAI/WCAG22/Techniques/general/G93
- **Technique H95 (Track element):** https://www.w3.org/WAI/WCAG22/Techniques/html/H95
- **Failure F8 (Ontbrekende dialoog/geluiden):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F8
- **Failure F75 (Geen ondertiteling):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F75
- **W3C WAI — Captions/Subtitles:** https://www.w3.org/WAI/media/av/captions/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
