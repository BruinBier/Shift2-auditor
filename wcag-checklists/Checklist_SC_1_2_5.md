---
name: wcag-1-2-5-audio-description-prerecorded
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.2.5 (Audio Description - Prerecorded) on Dutch government websites. Use when conducting accessibility audits on prerecorded synchronized media (video met audio) at Level AA. Unlike SC 1.2.3 (Level A), a transcriptie is NIET meer voldoende — audiodescriptie is verplicht. Covers the distinction with SC 1.2.3, practical assessment of municipality videos, talking head exception, and guidance on when audio description is and isn't needed. Essential for gemeente website audits under the Dutch Toegankelijkheidswet which requires Level AA compliance.
---

# WCAG 1.2.5 Audiodescriptie (vooraf opgenomen) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.2.5 (Niveau AA):**
Audiodescriptie wordt geleverd voor alle vooraf opgenomen videocontent in gesynchroniseerde media.

**Kernprincipe:** Mensen die blind of slechtziend zijn moeten de visuele informatie in een video kunnen begrijpen via audiodescriptie.

**Cruciaal verschil met SC 1.2.3 (Niveau A):**

| | SC 1.2.3 (Niveau A) | SC 1.2.5 (Niveau AA) |
|---|---|---|
| Audiodescriptie | ✅ Voldoende | ✅ Voldoende |
| Transcriptie (media-alternatief) | ✅ Voldoende | ✅ Alleen als audiodescriptie niet mogelijk is (onvoldoende pauzes) |
| Verplichting | Audiodescriptie OF transcriptie | Audiodescriptie verplicht, tenzij onvoldoende pauzes → dan transcriptie |

**Omdat de Toegankelijkheidswet Niveau AA vereist, is SC 1.2.5 de norm die in de praktijk geldt voor alle Nederlandse overheidswebsites.**

**Waarom is audiodescriptie verplicht op niveau AA?**
Bij niveau AA moeten blinde en slechtziende gebruikers de video kunnen volgen zonder eerst een apart tekstbestand te lezen. Een audiodescriptie zorgt ervoor dat alle essentiële visuele informatie direct gesproken wordt tijdens de video. Dit maakt het mogelijk om de video in real-time te ervaren, net als ziende kijkers.

---

## Wanneer is audiodescriptie NIET nodig?

**Als alle visuele informatie al via de audiotrack wordt overgebracht, is geen audiodescriptie nodig.**

> **W3C:** "For 1.2.3, 1.2.5, and 1.2.7, if all of the important information in the video track is already provided in the audio track, no audio description is necessary."

Dit geldt voor:
- **Talking head video's:** Een persoon spreekt in de camera zonder relevante visuele toevoegingen
- **Video's waarin de spreker alles beschrijft:** De voice-over noemt alle visuele informatie expliciet (bijv. "Hier zie je een grafiek met stijgende omzetcijfers")
- **Video's waar het beeld geen aanvullende informatie biedt:** De video herhaalt alleen wat al in de audio zit

**Let op:** Zodra er tekst in beeld verschijnt (namen, titels, logo's), grafieken worden getoond, of relevante handelingen plaatsvinden die niet worden benoemd, is er wél visuele informatie die niet in de audio zit → audiodescriptie nodig.

---

## Scope: wat valt wel en niet onder 1.2.5?

### Wel onder SC 1.2.5:

| Type | Voorbeeld |
|------|-----------|
| Video met audio waarbij visuele info niet in audio zit | Instructievideo met schermstappen |
| Video met grafieken/diagrammen | Presentatievideo met statistieken |
| Video met tekst op scherm | Namen/titels die niet worden voorgelezen |
| Video met handelingen | Ondertekeningsceremonie |
| Animatie met visuele informatie | Infographic-animatie met cijfers |
| Raadsvergadering met slides | PowerPoint die niet wordt voorgelezen |

### Niet onder SC 1.2.5:

| Type | Waarom niet |
|------|------------|
| Alleen-audio (podcast) | Geen videocontent |
| Alleen-video (zonder audio) | Geen gesynchroniseerde media |
| Live video | Niet vooraf opgenomen |
| Talking head (geen visuele info) | Alle info zit al in de audio |
| Video als media-alternatief voor tekst | Uitzondering (impliciet) |

---

## Beslisboom

```
Video met audio gevonden op de pagina
│
├─ Is de video vooraf opgenomen (niet live)?
│  ├─ NEE → SC 1.2.5 niet van toepassing
│  └─ JA ↓
│
├─ Is de video gepubliceerd na 23 september 2020 (of datum onbekend)?
│  ├─ NEE (vóór 23-09-2020) → Valt buiten scope Toegankelijkheidswet
│  └─ JA / onbekend ↓
│
├─ Bevat de video visuele informatie die NIET via de audiotrack
│  wordt overgebracht?
│  ├─ NEE → PASS (alle info zit al in de audio)
│  └─ JA ↓
│
├─ Is er audiodescriptie beschikbaar?
│  ├─ JA → Check kwaliteit → PASS / FAIL
│  └─ NEE ↓
│
├─ Zijn er voldoende pauzes in de dialoog voor audiodescriptie?
│  ├─ JA → FAIL (audiodescriptie had toegevoegd moeten worden, F113)
│  └─ NEE (onvoldoende pauzes) ↓
│
└─ Is er een transcriptie met alle visuele en auditieve info?
   ├─ JA → PASS (transcriptie is geaccepteerd alternatief
   │        bij onvoldoende pauzes)
   └─ NEE → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer video's met audio op de pagina
Zoek naar video-elementen (YouTube, Vimeo, HTML5 `<video>`) die zowel beeld als geluid bevatten.

### Stap 2: Controleer de publicatiedatum
- **Vóór 23 september 2020:** Valt buiten scope Toegankelijkheidswet.
- **Na 23 september 2020 of onbekend:** Moet voldoen.

### Stap 3: Bepaal of visuele informatie aanvullend is op de audio
Bekijk de video en beantwoord:
- **Tekst in beeld:** Worden namen, titels, logo's, statistieken of andere tekst getoond die niet worden voorgelezen?
- **Handelingen:** Vinden er visuele handelingen plaats die niet worden beschreven?
- **Grafieken/diagrammen:** Worden er visuele data getoond die niet worden benoemd?
- **Scènewisselingen:** Zijn er relevante wisselingen van locatie of setting die niet worden vermeld?
- **Gezichtsuitdrukkingen/gebaren:** Dragen deze betekenis die niet uit de audio blijkt?

**Als alle visuele informatie al in de audio zit → PASS.**

### Stap 4: Controleer op audiodescriptie
- Is er een aparte audiotrack met beschrijvingen van de visuele content?
- Bij YouTube: is er een audiodescriptie-track beschikbaar? (zeldzaam bij gemeente-video's)
- Bij HTML5 `<video>`: is er een `<track kind="descriptions">` element?
- Is er een alternatieve versie van de video mét audiodescriptie?
- Is er een los audiobestand (MP3) met audiodescriptie?

### Stap 5: Beoordeel de kwaliteit van de audiodescriptie

**Wat moet audiodescriptie bevatten?**
- Beelden die essentieel zijn om de video te begrijpen
- Tekst die in beeld verschijnt (namen van sprekers, titels)
- Logo's en slogans aan het begin of einde (zodat de afzender duidelijk is)
- Handelingen, scènewisselingen, relevante uitdrukkingen

**Kwaliteitscriteria:**

| Aspect | Vereist |
|--------|---------|
| Alle relevante visuele elementen beschreven | JA |
| Gesynchroniseerd met de video | JA |
| Passend in pauzes in de dialoog | JA (bij standaard audiodescriptie) |
| Zelfde taal als de video | JA |
| Verstoort de originele audio niet | JA |
| Objectieve, feitelijke beschrijvingen | JA |

### Stap 6: Documenteer bevindingen
Rapporteer per video-element met het rapportageformat onderaan deze skill.

---

## De 5 auditgebieden

### 1. VISUELE INFORMATIE NIET IN AUDIOTRACK

Identiek aan SC 1.2.3. Kernvraag: biedt de video visuele informatie die niet uit de audiotrack blijkt?

**Veelvoorkomende situaties op gemeente-websites:**

| Video | Visuele info niet in audio | Audiodescriptie nodig? |
|-------|---------------------------|----------------------|
| Burgemeester spreekt in camera | Nee (talking head) | Nee |
| Instructievideo afvalscheiding met beelden | Ja (containers, locaties) | Ja |
| Ondertekeningsceremonie met namen op scherm | Ja (namen, titels, organisaties) | Ja |
| Raadsvergadering met slides | Ja (slides niet voorgelezen) | Ja |
| Promotievideo met dronebeelden + muziek | Context-afhankelijk | Beoordeel per geval |
| Infographic-animatie met cijfers | Ja (specifieke data) | Ja |

### 2. AUDIODESCRIPTIE AANWEZIG

**Vormen van audiodescriptie:**

- **Geïntegreerde audiodescriptie:** Beschrijvingen ingesproken tijdens pauzes in de originele audio
- **Aparte audiotrack:** Tweede audiotrack die kan worden in-/uitgeschakeld
- **Alternatieve video met audiodescriptie:** Tweede versie van de video, mét audiodescriptie
- **Los audiobestand (MP3):** Apart geluidsbestand dat naast de video kan worden afgespeeld

```html
<!-- HTML5 video met audiodescriptie-track -->
<video controls>
  <source src="instructie-afval.mp4" type="video/mp4">
  <track kind="descriptions" src="beschrijving.vtt" srclang="nl"
         label="Audiodescriptie">
</video>

<!-- Alternatieve video met audiodescriptie -->
<iframe src="https://www.youtube.com/embed/ABC123"
        title="Instructievideo afvalscheiding">
</iframe>
<p><a href="https://www.youtube.com/watch?v=DEF456">
   Bekijk de versie met audiodescriptie
</a></p>

<!-- Los audiobestand -->
<iframe src="https://www.youtube.com/embed/ABC123"
        title="Instructievideo afvalscheiding">
</iframe>
<p><a href="/media/audiodescriptie-afvalscheiding.mp3">
   Download audiodescriptie (MP3)
</a></p>
```

### 3. KWALITEIT VAN DE AUDIODESCRIPTIE

**Goede audiodescriptie:**
```
[Originele audio]: "Welkom bij deze instructievideo over afvalscheiding."
[Audiodescriptie]: "Op het scherm verschijnt het logo van gemeente
Voorne aan Zee. Een animatie toont vier gekleurde afvalcontainers:
groen voor GFT, grijs voor restafval, blauw voor papier en oranje
voor plastic."
[Originele audio]: "In uw gemeente hanteren we vier verschillende
soorten afval."
```

**Slechte audiodescriptie (F113):**
```
[Originele audio]: "Welkom bij deze instructievideo over afvalscheiding."
[Geen audiodescriptie — terwijl logo en animatie met containers
te zien zijn die niet in de audio worden benoemd]
[Originele audio]: "In uw gemeente hanteren we vier verschillende
soorten afval."
[Geen audiodescriptie — terwijl de kleuren en labels van de
containers alleen visueel worden getoond]
```

### 4. VINDBAARHEID EN ACTIVERING

**Controleer:**
- Is de audiodescriptie eenvoudig te vinden en te activeren?
- Staat de link naar een alternatieve video/audiobestand direct naast de video?
- Is het duidelijk gelabeld? ("Versie met audiodescriptie", "Audiodescriptie downloaden")
- Kan de audiodescriptie in de videospeler worden in-/uitgeschakeld?

### 5. PAUZES IN DIALOOG

**Specifiek voor SC 1.2.5:** Audiodescriptie wordt tijdens pauzes in de dialoog ingevoegd.

**Wat als er onvoldoende pauzes in de dialoog zijn?**

Dit is een veelvoorkomend probleem. Als er geen of onvoldoende ruimte in de video is om audiodescriptie in te voegen:

- **Als de visuele informatie is opgenomen in een transcriptie → SC 1.2.5 is voldaan.** Wanneer audiodescriptie technisch niet mogelijk is vanwege gebrek aan pauzes, is een transcriptie met alle visuele en auditieve informatie een geaccepteerd alternatief, ook op niveau AA.
- F113: Het niet gebruiken van wél beschikbare pauzes is een failure — deze failure geldt alleen als er pauzes zijn die niet benut worden
- Audio ducking (het dempen van achtergrondgeluid) is een techniek die kan helpen om toch ruimte te creëren
- SC 1.2.7 (niveau AAA) biedt een aanvullende oplossing: uitgebreide audiodescriptie waarbij de video pauzeert

**Auditadvies bij onvoldoende pauzes:**
```
Situatie:   Video bevat visuele info niet in audio,
            maar onvoldoende pauzes voor audiodescriptie.

Optie 1:    Transcriptie met visuele beschrijvingen beschikbaar
SC 1.2.3:   PASS
SC 1.2.5:   PASS — transcriptie is geaccepteerd alternatief
             als audiodescriptie niet mogelijk is.

Optie 2:    Geen transcriptie en geen audiodescriptie
SC 1.2.3:   FAIL
SC 1.2.5:   FAIL

Aanbeveling: Bij voorkeur video opnieuw opnemen met pauzes,
             of alternatieve versie maken met audiodescriptie.
             Als minimum: transcriptie met alle visuele info.
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Talking head — PASS zonder audiodescriptie

```
Video: Wethouder spreekt nieuwjaarsboodschap in.
Beeld: Alleen pratend hoofd, neutrale achtergrond.
Geen tekst op scherm, geen handelingen.
→ SC 1.2.5: PASS — alle info zit in de audio.
```

**Maar let op subtiele visuele info:**
```
Video: Wethouder spreekt nieuwjaarsboodschap in.
Beeld: Pratend hoofd, MAAR naam en functie verschijnen
als tekst onderin beeld. Logo gemeente in de hoek.
→ SC 1.2.5: Audiodescriptie nodig voor naam/functie/logo
  (tenzij spreker zichzelf voorstelt en de gemeente noemt).
```

### Patroon B: Instructievideo — vaak FAIL

```
Video: "Hoe vraag je een parkeervergunning aan?"
Audio: Voice-over legt stappen uit.
Beeld: Schermopnames met specifieke knoppen, velden en menu's.
→ SC 1.2.5: FAIL als schermstappen niet volledig in
  de voice-over worden beschreven.
Aanbeveling: Laat de voice-over elk schermbeeld volledig
  beschrijven, of voeg audiodescriptie toe.
```

### Patroon C: Ceremonie-/ondertekeningsvideo — vaak FAIL

```
Video: Ondertekening samenwerkingsovereenkomst.
Audio: Achtergrondmuziek, korte interviews.
Beeld: Namen/titels op scherm, wie ondertekent, organisaties.
→ SC 1.2.5: FAIL — namen en handelingen niet in audio.
Aanbeveling: Audiodescriptie toevoegen met namen, functies
  en organisaties van ondertekenaars.
```

### Patroon D: Raadsvergadering met presentatieslides — vaak FAIL

```
Video: Raadsvergadering met PowerPoint op scherm.
Audio: Sprekers bespreken onderwerpen, verwijzen naar slides.
Beeld: Slides met grafieken, tabellen, tekst.
→ SC 1.2.5: FAIL als slides niet volledig worden voorgelezen.
Aanbeveling: Presentatie als apart document aanbieden is
  NIET voldoende voor SC 1.2.5 (dat is een transcriptie).
  Audiodescriptie van de slides is nodig.
```

### Patroon E: Promotievideo met dronebeelden

```
Video: Luchtbeelden gemeente met achtergrondmuziek.
Audio: Alleen muziek, geen spraak.
→ Mogelijk video-only: check of muziek informatief is.
  Als puur sfeerversterkend → SC 1.2.1 (video-only).
  Als gesynchroniseerde media → SC 1.2.5 van toepassing.
```

### Patroon F: Infographic-animatie

```
Video: Geanimeerde infographic over gemeentefinanciën.
Audio: Voice-over beschrijft hoofdlijn.
Beeld: Specifieke bedragen, percentages, grafieklabels.
→ SC 1.2.5: FAIL als specifieke cijfers niet in audio zitten.
Aanbeveling: Voice-over moet alle cijfers noemen, of
  audiodescriptie toevoegen voor ontbrekende data.
```

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G78 | Een tweede, door de gebruiker selecteerbare, audiotrack met audiodescriptie |
| G173 | Een versie van de video met audiodescriptie aanbieden |
| G8 | Een video met uitgebreide audiodescriptie aanbieden (video pauzeert) |

**Specifieke technieken voor G173:**
- SM6: Audiodescriptie in SMIL 1.0
- SM7: Audiodescriptie in SMIL 2.0
- Gebruik van een video-formaat met ondersteuning voor audiodescriptie

**Nieuw (2025):**
- G226: Audiodescriptie opnemen door vertelling in de soundtrack te integreren (de beste aanpak: maak de video meteen toegankelijk door de spreker alles te laten beschrijven)

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| H96 | Het `<track kind="descriptions">` element gebruiken |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F113 | Het niet gebruiken van beschikbare pauzes in dialoog om audiodescriptie te bieden voor belangrijke visuele content |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: visuele info | aanwezigheid |
                  kwaliteit | vindbaarheid | pauzes]
Element:         [beschrijving van het video-element]
Locatie:         [positie op pagina / URL]
Videobron:       [YouTube / Vimeo / HTML5 / extern platform]
Publicatiedatum: [datum / onbekend]
Beoordeling:     [PASS | FAIL | N.v.t.]

Visuele info
niet in audio:   [ja/nee — beschrijf welke info ontbreekt]
Audiodescriptie: [aanwezig/afwezig]
Vorm:            [geïntegreerd / aparte track / alternatieve video /
                  los audiobestand / n.v.t.]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [W3C technique code]
Aanbeveling:     [concrete oplossing]
```

---

## Relatie met andere SC's in de 1.2-serie

| SC | Naam | Niveau | Relatie met 1.2.5 |
|----|------|--------|------------------|
| 1.2.1 | Alleen audio/video | A | Transcript voor alleen-audio/video |
| 1.2.2 | Ondertiteling (vooraf opgenomen) | A | Voor dove gebruikers (audio → tekst) |
| 1.2.3 | Audiodescriptie of media-alternatief | A | Audiodescriptie OF transcriptie |
| **1.2.5** | **Audiodescriptie (vooraf opgenomen)** | **AA** | **Audiodescriptie verplicht** |
| 1.2.7 | Uitgebreide audiodescriptie | AAA | Video pauzeert voor extra beschrijving |
| 1.2.8 | Media-alternatief | AAA | Volledige transcriptie verplicht |

**Escalatiepad:**
```
Niveau A  (SC 1.2.3): Audiodescriptie OF transcriptie
Niveau AA (SC 1.2.5): Audiodescriptie verplicht
Niveau AAA (SC 1.2.7): Uitgebreide audiodescriptie (video pauzeert)
Niveau AAA (SC 1.2.8): Volledige transcriptie ook verplicht
```

---

## Praktische audittips

### Realiteit op gemeente-websites

Audiodescriptie is op gemeente-websites **vrijwel nooit aanwezig**. Dit maakt SC 1.2.5 een van de meest geschonden criteria. De meeste gemeenten zijn zich niet bewust van deze verplichting.

**Positieve kanttekening:** Veel gemeente-video's zijn talking head video's waar audiodescriptie niet nodig is. Bij het auditeren is het belangrijk om eerst goed te bepalen of er daadwerkelijk visuele informatie is die niet in de audio zit.

### Beste advies aan gemeenten

**Preventief (bij nieuwe video's):**
1. **Laat de spreker alles beschrijven** — dit is de meest effectieve en goedkoopste oplossing (G226)
2. Benoem tekst die in beeld verschijnt altijd ook in de gesproken tekst
3. Beschrijf visuele handelingen terwijl ze plaatsvinden
4. Vermijd het tonen van informatie die alleen visueel is

**Correctief (bij bestaande video's):**
1. Maak een alternatieve versie met audiodescriptie
2. Of voeg een los audiobestand (MP3) toe met audiodescriptie
3. Een transcriptie is niet voldoende voor SC 1.2.5, maar voldoet wel aan SC 1.2.3

### Veelgemaakte fouten

1. **Aannemen dat ondertiteling voldoende is** — ondertiteling (SC 1.2.2) beschrijft de audio voor dove gebruikers; audiodescriptie beschrijft het beeld voor blinde gebruikers
2. **Aannemen dat een transcriptie voldoende is** — op niveau AA (SC 1.2.5) is alleen audiodescriptie voldoende, niet een transcriptie
3. **Visuele informatie niet herkennen** — namen/titels op scherm, logo's, grafieken en handelingen worden over het hoofd gezien
4. **Talking head verkeerd beoordelen** — een video lijkt talking head maar toont toch namen, titels of grafieken

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.2.5 is Niveau AA — dus verplicht.**

Dit betekent dat voor alle vooraf opgenomen video's met visuele informatie die niet in de audiotrack zit, audiodescriptie beschikbaar moet zijn. Een transcriptie alleen is niet voldoende.

**Publicatiedatum:**
- Video's gepubliceerd **vóór 23 september 2020** hoeven niet te voldoen
- Video's gepubliceerd **na 23 september 2020** of met **onbekende datum** moeten voldoen

---

## Bronnen

- **WCAG 2.2 Understanding 1.2.5:** https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded.html
- **Technique G78 (Tweede audiotrack):** https://www.w3.org/WAI/WCAG22/Techniques/general/G78
- **Technique G173 (Video met audiodescriptie):** https://www.w3.org/WAI/WCAG22/Techniques/general/G173
- **Technique G8 (Uitgebreide audiodescriptie):** https://www.w3.org/WAI/WCAG22/Techniques/general/G8
- **Technique G226 (Beschrijving in soundtrack):** https://www.w3.org/WAI/WCAG22/Techniques/general/G226
- **Failure F113 (Pauzes niet benut):** https://www.w3.org/WAI/WCAG21/Techniques/failures/F113
- **Advisory H96 (Track element):** https://www.w3.org/WAI/WCAG22/Techniques/html/H96
- **W3C WAI — Audio Description:** https://www.w3.org/WAI/media/av/description/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
