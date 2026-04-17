---
name: wcag-1-2-1-audio-video-only
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.2.1 (Audio-only and Video-only - Prerecorded) on Dutch government websites. Use when conducting accessibility audits on prerecorded audio (podcasts, geluidsopnames, audiofragmenten) and prerecorded video without audio (stille video's, animaties, bewegende instructies). Covers transcript requirements, audio descriptions for video-only, media alternatives, and the exception for media als tekstalternatief. Trigger this skill when analyzing pages with embedded audio players, video players, or links to audio/video files. Essential for gemeente website audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.2.1 Alleen audio en alleen video (vooraf opgenomen) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.2.1 (Niveau A):**
Voor vooraf opgenomen alleen-audio en vooraf opgenomen alleen-video media geldt het volgende, behalve wanneer de audio of video een media-alternatief voor tekst is en duidelijk als zodanig is gelabeld:

- **Alleen audio (vooraf opgenomen):** Er wordt een alternatief voor tijdgebonden media aangeboden dat gelijkwaardige informatie biedt.
- **Alleen video (vooraf opgenomen):** Er wordt een alternatief voor tijdgebonden media OF een audiospoor aangeboden dat gelijkwaardige informatie biedt.

**Kernprincipe:** Gebruikers die de audio niet kunnen horen of de video niet kunnen zien, moeten via een alternatief dezelfde informatie kunnen verkrijgen.

**Belangrijk:** Dit criterium geldt ALLEEN voor:
- **Vooraf opgenomen** content (niet live — live valt onder SC 1.2.4 en 1.2.9)
- **Alleen audio** (zonder video) OF **alleen video** (zonder audio)
- **Gesynchroniseerde media** (audio + video samen) vallen onder SC 1.2.2, 1.2.3, 1.2.5

---

## Scope: wat valt wel en niet onder 1.2.1?

### Wel onder SC 1.2.1:

| Type | Voorbeeld | Vereist alternatief |
|------|-----------|-------------------|
| Podcast | Opgenomen gemeentepodcast | Teksttranscript |
| Geluidsopname | Opname raadsvergadering (alleen audio) | Teksttranscript |
| Audiofragment | Toespraak burgemeester | Teksttranscript |
| Audioboek | Voorgelezen beleidsstuk | Teksttranscript |
| Stille video | Animatie zonder geluid | Tekstbeschrijving OF audiospoor |
| Video-instructie zonder audio | Stapsgewijze visuele instructie | Tekstbeschrijving OF audiospoor |
| Timelapse | Timelapse van bouwproject | Tekstbeschrijving OF audiospoor |

### Niet onder SC 1.2.1:

| Type | Waarom niet | Valt onder |
|------|------------|-----------|
| Video met audio | Gesynchroniseerde media | SC 1.2.2, 1.2.3, 1.2.5 |
| Livestream audio | Niet vooraf opgenomen | SC 1.2.9 |
| Livestream video | Niet vooraf opgenomen | SC 1.2.4 |
| Media-alternatief voor tekst | Uitzondering in criterium | Niet van toepassing* |
| Achtergrondmuziek/-geluid | Decoratief | Niet van toepassing |

*\*De uitzondering geldt wanneer audio/video expliciet dient als alternatief voor al aanwezige tekst en als zodanig is gelabeld.*

---

## Beslisboom

```
Media-element gevonden op de pagina
│
├─ Is het vooraf opgenomen (niet live)?
│  ├─ NEE → Niet onder SC 1.2.1 (check SC 1.2.4 / 1.2.9)
│  └─ JA ↓
│
├─ Is het alleen audio OF alleen video?
│  ├─ NEE (audio + video samen) → Niet onder SC 1.2.1 (check SC 1.2.2/1.2.3)
│  └─ JA ↓
│
├─ Is het een media-alternatief voor tekst, duidelijk zo gelabeld?
│  ├─ JA → UITZONDERING: SC 1.2.1 niet van toepassing
│  └─ NEE ↓
│
├─ ALLEEN AUDIO:
│  ├─ Is er een teksttranscript?
│  │  ├─ JA → Is het transcript gelijkwaardig en vindbaar? → PASS / FAIL
│  │  └─ NEE → FAIL
│  │
│  └─ Bevat het transcript:
│     ├─ Alle gesproken tekst (woordelijk)?
│     ├─ Spreker-identificatie?
│     ├─ Relevante niet-spraakgeluiden?
│     └─ Alle informatie nodig om context te begrijpen?
│
└─ ALLEEN VIDEO:
   ├─ Is er een tekstbeschrijving OF audiospoor?
   │  ├─ JA → Is het gelijkwaardig en vindbaar? → PASS / FAIL
   │  └─ NEE → FAIL
   │
   └─ Bevat het alternatief:
      ├─ Beschrijving van visuele acties?
      ├─ Beschrijving van tekst in beeld?
      ├─ Beschrijving van scènewisselingen?
      └─ Alle informatie nodig om de video te begrijpen?
```

---

## De 5 auditgebieden

### 1. ALLEEN AUDIO — TRANSCRIPT AANWEZIG

**Regel:** Vooraf opgenomen alleen-audio moet een teksttranscript hebben dat gelijkwaardige informatie biedt.

```html
<!-- FAIL: audio zonder transcript -->
<audio controls src="raadsvergadering-2025-01-15.mp3">
  <p>Uw browser ondersteunt geen audio.</p>
</audio>

<!-- PASS: audio met transcript -->
<audio controls src="raadsvergadering-2025-01-15.mp3">
  <p>Uw browser ondersteunt geen audio.</p>
</audio>
<p><a href="/transcripten/raadsvergadering-2025-01-15">
  Teksttranscript van de raadsvergadering (15 januari 2025)
</a></p>

<!-- PASS: audio met transcript direct op pagina -->
<audio controls src="toespraak-burgemeester.mp3"></audio>
<details>
  <summary>Transcript van de toespraak</summary>
  <p>Burgemeester Jansen: "Beste inwoners van IJsselstein, vandaag
  markeren wij een bijzonder moment..."</p>
</details>
```

### 2. ALLEEN AUDIO — TRANSCRIPTKWALITEIT

**Regel:** Het transcript moet gelijkwaardig zijn — niet alleen een samenvatting maar een volledige weergave.

**Het transcript bevat:**
- **Alle gesproken tekst** — woordelijk, niet samenvattend
- **Spreker-identificatie** — wie zegt wat
- **Relevante niet-spraakgeluiden** — [applaus], [gelach], [muziek speelt], [stilte]
- **Context** — alle informatie die nodig is om de audio te begrijpen

```
GOED TRANSCRIPT:

Voorzitter Van Dam: "Ik open de vergadering van 15 januari 2025.
Als eerste agendapunt behandelen wij het bestemmingsplan Binnenstad."

[korte stilte]

Wethouder Jansen: "Dank u, voorzitter. Het plan omvat drie
kernpunten..."

Voorzitter Van Dam: "Zijn er vragen vanuit de raad?"

[geen reacties]

Voorzitter Van Dam: "Dan gaan we over tot stemming."

---

SLECHT TRANSCRIPT (samenvatting):

De raad besprak het bestemmingsplan Binnenstad. Er waren
geen vragen en het plan werd goedgekeurd.
```

### 3. ALLEEN VIDEO — ALTERNATIEF AANWEZIG

**Regel:** Vooraf opgenomen alleen-video (zonder audio) moet een tekstbeschrijving OF een audiospoor hebben dat gelijkwaardige informatie biedt.

```html
<!-- FAIL: stille video zonder alternatief -->
<video controls src="instructie-afval-scheiden.mp4"></video>

<!-- PASS: stille video met tekstbeschrijving -->
<video controls src="instructie-afval-scheiden.mp4"></video>
<div>
  <h3>Beschrijving van de instructievideo</h3>
  <p>De video toont in vier stappen hoe u afval scheidt:</p>
  <ol>
    <li>Stap 1: Scheidt papier en karton in de blauwe container.</li>
    <li>Stap 2: Plastic, blik en drinkpakken gaan in de oranje zak.</li>
    <li>Stap 3: Groente-, fruit- en tuinafval in de groene container.</li>
    <li>Stap 4: Restafval in de grijze container.</li>
  </ol>
</div>

<!-- PASS: stille video met audiospoor -->
<video controls src="instructie-afval-scheiden.mp4">
  <track kind="descriptions" src="beschrijving.vtt" srclang="nl"
         label="Audiobeschrijving">
</video>
```

### 4. VINDBAARHEID VAN HET ALTERNATIEF

**Regel:** Het alternatief moet eenvoudig te vinden zijn — direct bij het media-element of met een duidelijke link ernaartoe.

```html
<!-- FAIL: transcript ergens anders op de site, geen link -->
<audio controls src="podcast-aflevering-3.mp3"></audio>
<!-- Transcript staat op /transcripten/aflevering-3 maar er is
     geen link bij de audiospeler -->

<!-- PASS: link direct bij de speler -->
<audio controls src="podcast-aflevering-3.mp3"></audio>
<p><a href="/transcripten/aflevering-3">
  Lees het transcript van aflevering 3
</a></p>

<!-- PASS: transcript direct zichtbaar op dezelfde pagina -->
<audio controls src="podcast-aflevering-3.mp3"></audio>
<details>
  <summary>Transcript aflevering 3</summary>
  <p>...</p>
</details>

<!-- PASS: transcript in expandable sectie -->
<audio controls src="podcast-aflevering-3.mp3"></audio>
<button aria-expanded="false" aria-controls="transcript-3">
  Toon transcript
</button>
<div id="transcript-3" hidden>
  <p>...</p>
</div>
```

### 5. UITZONDERING: MEDIA-ALTERNATIEF VOOR TEKST

**Regel:** Als de audio of video expliciet dient als alternatief voor tekst die al op de pagina staat, en dit duidelijk zo is gelabeld, is SC 1.2.1 niet van toepassing.

```html
<!-- UITZONDERING: audio als alternatief voor aanwezige tekst -->
<h2>Toespraak burgemeester bij nieuwjaarsontvangst</h2>
<p>Beste inwoners, vandaag markeren wij een bijzonder moment.
   Ons gemeente heeft in het afgelopen jaar grote stappen gezet...</p>
<!-- volledige tekst van de toespraak -->

<p>Luister naar de gesproken versie van deze toespraak:</p>
<audio controls src="toespraak-nieuwjaar.mp3"></audio>
<!-- De audio is een alternatief voor de al aanwezige tekst →
     SC 1.2.1 niet van toepassing, mits duidelijk gelabeld -->
```

**Let op:** De uitzondering geldt alleen als:
1. De tekst al volledig op de pagina staat
2. De media duidelijk is gelabeld als alternatief ("Luister naar de gesproken versie")
3. De media geen aanvullende informatie bevat die niet in de tekst staat

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Raadsvergadering (alleen audio)

```html
<!-- Typisch patroon: opname raadsvergadering -->
<h2>Raadsvergadering 15 januari 2025</h2>
<audio controls src="/media/raad-2025-01-15.mp3"></audio>
```

**Analyse:** Dit is alleen-audio, vooraf opgenomen. Er is een transcript vereist.

**Aanbeveling:**
```html
<h2>Raadsvergadering 15 januari 2025</h2>
<audio controls src="/media/raad-2025-01-15.mp3"></audio>
<p><a href="/raad/notulen/2025-01-15">
  Notulen van de raadsvergadering (teksttranscript)
</a></p>
```

**Opmerking:** Notulen zijn vaak al beschikbaar op gemeente-websites. Als de notulen gelijkwaardig zijn aan de audio-opname (alle uitspraken, stemmingen, etc.) dan fungeren deze als transcript. Verwijs er dan expliciet naar bij de audiospeler.

### Patroon B: Gemeentepodcast

```html
<!-- Podcast op gemeentepagina -->
<h2>Podcast IJsselstein Vertelt - Aflevering 5: Duurzaamheid</h2>
<iframe src="https://open.spotify.com/embed/episode/..." ...></iframe>
```

**Analyse:** Embedded audio (via Spotify/SoundCloud/etc.), vooraf opgenomen, alleen audio. Transcript vereist.

**Aanbeveling:** Voeg een link naar een transcript toe direct onder de embed:
```html
<iframe src="https://open.spotify.com/embed/episode/..." ...></iframe>
<p><a href="/podcast/aflevering-5-transcript">
  Transcript van aflevering 5
</a></p>
```

### Patroon C: Instructievideo zonder geluid

```html
<!-- Animatie/instructie zonder audio -->
<video controls autoplay muted loop src="afval-scheiden-animatie.mp4">
</video>
```

**Analyse:** Video zonder audio (muted + geen audiospoor), vooraf opgenomen. Tekstbeschrijving of audiospoor vereist.

**Aanbeveling:** Voeg een tekstbeschrijving toe die alle visuele stappen beschrijft.

### Patroon D: YouTube/Vimeo embed

```html
<!-- Veel voorkomend: YouTube embed -->
<iframe src="https://www.youtube.com/embed/ABC123" ...></iframe>
```

**Analyse:** Bepaal eerst of dit alleen-audio, alleen-video of gesynchroniseerde media is:
- YouTube-video met geluid → **gesynchroniseerde media** → niet SC 1.2.1 maar SC 1.2.2/1.2.3
- YouTube-video zonder geluid → **alleen-video** → SC 1.2.1 van toepassing
- Vaak moeilijk te bepalen bij embedded content — controleer de bron

### Patroon E: Achtergrondvideo/sfeerbeeld

```html
<!-- Achtergrondvideo op homepage -->
<video autoplay muted loop playsinline class="hero-video">
  <source src="sfeer-ijsselstein.mp4" type="video/mp4">
</video>
```

**Analyse:** Decoratieve achtergrondvideo zonder informatieve inhoud.

**Beoordeling:** Als de video puur decoratief is (sfeerbeeld, geen informatie die niet elders beschikbaar is), is SC 1.2.1 strikt genomen niet van toepassing — het is geen content die informatie overbrengt. Wel moet de video:
- Geen auto-play met geluid hebben (SC 1.4.2)
- Pauzeerbaar zijn (SC 2.2.2)
- Geen beweging bevatten die afleidt zonder pauzeermogelijkheid (SC 2.3.1 bij flitsen)

### Patroon F: ReadSpeaker / voorleesfunctie

Veel gemeente-websites hebben ReadSpeaker geïntegreerd. ReadSpeaker genereert audio van de paginatekst.

**Analyse:** Dit is een media-alternatief voor tekst — de tekst staat al op de pagina en ReadSpeaker biedt een gesproken versie aan. Dit valt onder de **uitzondering** van SC 1.2.1: geen apart transcript vereist.

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Situatie | Beschrijving |
|------|----------|-------------|
| G158 | Alleen audio | Alternatief voor tijdgebonden media voor alleen-audio content |
| G159 | Alleen video | Alternatief voor tijdgebonden media voor alleen-video content |
| G166 | Alleen video | Audio aanbieden die de belangrijke video-inhoud beschrijft |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| H96 | `<track>` element gebruiken voor audiobeschrijvingen |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F30 | Tekstalternatieven gebruiken die geen echte alternatieven zijn (bijv. bestandsnamen, placeholder-tekst) |
| F67 | Lange beschrijvingen voor niet-tekstuele content die niet hetzelfde doel dient of niet dezelfde informatie biedt |

---

## Rapportageformat

Voor elke bevinding:

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: transcript aanwezig | transcriptkwaliteit |
                  video-alternatief | vindbaarheid | uitzondering]
Element:         [beschrijving van het media-element]
Locatie:         [positie op pagina / HTML-selector]
Mediatype:       [alleen-audio | alleen-video]
Beoordeling:     [PASS | FAIL | UITZONDERING | N.v.t.]
HTML-code:       [relevante code snippet]

Probleem:        [alleen bij FAIL]
Technique:       [W3C failure/sufficient technique code]
Aanbeveling:     [concrete oplossing]
```

---

## Relatie met andere SC's in de 1.2-reeks

| SC | Naam | Niveau | Van toepassing op |
|----|------|--------|------------------|
| **1.2.1** | **Alleen audio/video (vooraf opgenomen)** | **A** | **Alleen-audio, alleen-video** |
| 1.2.2 | Ondertiteling (vooraf opgenomen) | A | Gesynchroniseerde media |
| 1.2.3 | Audiodescriptie of media-alternatief | A | Gesynchroniseerde media |
| 1.2.4 | Ondertiteling (live) | AA | Live audio in gesynchroniseerde media |
| 1.2.5 | Audiodescriptie (vooraf opgenomen) | AA | Gesynchroniseerde media |
| 1.2.6 | Gebarentaal (vooraf opgenomen) | AAA | Gesynchroniseerde media |
| 1.2.7 | Verlengde audiodescriptie | AAA | Gesynchroniseerde media |
| 1.2.8 | Media-alternatief (vooraf opgenomen) | AAA | Gesynchroniseerde media |
| 1.2.9 | Alleen audio (live) | AAA | Live alleen-audio |

Bij het auditen van mediaspelers op gemeente-websites is het belangrijk om eerst te classificeren welk type media het is, om te bepalen welke SC's van toepassing zijn.

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.2.1 is Niveau A:**
- Verplicht voor compliance
- Komt minder vaak voor op gemeente-websites dan bijv. SC 1.1.1 of 1.3.1
- Maar wanneer audio/video aanwezig is, ontbreekt het transcript vaak
- Raadsvergaderingen zijn de meest voorkomende audio-content op gemeente-websites
- Notulen kunnen als transcript dienen als ze gelijkwaardig zijn

## Bronnen

- **WCAG 2.2 Understanding 1.2.1:** https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html
- **Technique G158 (Audio-only transcript):** https://www.w3.org/WAI/WCAG22/Techniques/general/G158
- **Technique G159 (Video-only alternative):** https://www.w3.org/WAI/WCAG22/Techniques/general/G159
- **Technique G166 (Audio for video-only):** https://www.w3.org/WAI/WCAG22/Techniques/general/G166
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
