---
name: wcag-1-2-3-audio-description-media-alternative
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.2.3 (Audio Description or Media Alternative - Prerecorded) on Dutch government websites. Use when conducting accessibility audits on prerecorded synchronized media (video met audio) to verify that visuele informatie toegankelijk is via audiodescriptie of een volledige tekstbeschrijving. Covers the two approaches (audiodescriptie vs. media-alternatief), the critical distinction with SC 1.2.5, and practical gemeente patterns like raadsvergaderingen, instructievideo's en promotievideo's. Trigger this skill when analyzing pages with video content where important visual information is not conveyed through the audio track alone. Essential for gemeente website audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.2.3 Audiodescriptie of media-alternatief (vooraf opgenomen) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.2.3 (Niveau A):**
Een alternatief voor op tijd gebaseerde media of een audiodescriptie van de vooraf opgenomen videocontent wordt geleverd voor gesynchroniseerde media, behalve wanneer de media een media-alternatief voor tekst is en duidelijk als zodanig is gelabeld.

**Kernprincipe:** Mensen die blind of slechtziend zijn moeten de visuele informatie in een video kunnen begrijpen — via audiodescriptie OF via een volledige transcriptie.

**Cruciale eigenschap van SC 1.2.3:** Het biedt een keuze: audiodescriptie **OF** een media-alternatief (volledige transcriptie). Bij SC 1.2.5 (niveau AA) is audiodescriptie verplicht — daar is alleen een transcriptie niet meer voldoende.

---

## Twee benaderingen

SC 1.2.3 accepteert twee gelijkwaardige oplossingen:

### Benadering 1: Audiodescriptie

Een extra audiotrack die tijdens pauzes in de dialoog beschrijft wat er visueel gebeurt:
- Handelingen van personen
- Scènewisselingen
- Tekst op het scherm (grafieken, titels, ondertitels)
- Relevante gezichtsuitdrukkingen
- Andere visuele informatie die niet uit de dialoog blijkt

**Voorbeeld audiodescriptie:**
```
[Originele audio]: "Welkom bij de opening van het nieuwe gemeentehuis."
[Audiodescriptie]: "De burgemeester staat voor een groot modern gebouw
met glazen gevels. Ze knipt een rood lint door."
[Originele audio]: "Ik verklaar hierbij het gemeentehuis voor geopend."
[Audiodescriptie]: "Het publiek van circa tweehonderd mensen applaudisseert.
Op het scherm verschijnt de tekst: Gemeentehuis Voorne aan Zee, geopend 15 maart 2025."
```

### Benadering 2: Media-alternatief (volledige tekstbeschrijving)

Een volledig tekstdocument dat zowel de audio- als de visuele content beschrijft. Dit omvat:
- Alle gesproken tekst (dialoog)
- Beschrijving van geluiden
- Beschrijving van alle visuele informatie
- Beschrijving van setting en settingwisselingen
- Beschrijving van handelingen en uitdrukkingen van personen

**Voorbeeld media-alternatief:**
```
MEDIA-ALTERNATIEF: Video opening gemeentehuis

[Openingsshot: buitenaanzicht modern gebouw met glazen gevels,
bewolkte lucht, circa 200 mensen staan voor de ingang]

Burgemeester Jansen (staand voor het gebouw, met een schaar in de hand):
"Welkom bij de opening van het nieuwe gemeentehuis."

[De burgemeester knipt een rood lint door dat voor de ingang gespannen is]

Burgemeester Jansen: "Ik verklaar hierbij het gemeentehuis voor geopend."

[Het publiek applaudisseert. Op het scherm verschijnt een titel:
"Gemeentehuis Voorne aan Zee — geopend 15 maart 2025"]
```

**Voorbeeld transcript met visuele beschrijvingen (filmfragment):**
```
Captain Jack Sparrow staat op de mast van een schip op zee en kijkt
naar de kust in de verte. Hij kijkt naar beneden en springt van de
mast af op het dek van het schip, waar een laag water in staat.
Hij pakt een emmer en hoost water uit het schip. Dan ziet hij aan
een rots op zee drie lijken van piraten die zijn opgehangen. Hij
vaart erlangs en neemt zijn hoed voor ze af. Bij de piraten hangt
een bord met de tekst "Pirates Ye Be Warned". Hij vaart langs een
groep mensen vlak bij de kade. Ze laden en lossen een schip.
De mensen kijken en wijzen naar hem. Ondertussen vaart hij verder,
terwijl zijn schip steeds verder zinkt, totdat hij precies bij de
steiger is. Hij stapt van het schip op de steiger en loopt verder.
Zijn schip is gezonken.
```

Dit voorbeeld illustreert hoe een media-alternatief de visuele
handelingen beschrijft zodat iemand die de beelden niet kan zien
toch het verhaal volledig kan volgen.

---

## Scope: wat valt wel en niet onder 1.2.3?

### Wel onder SC 1.2.3:

| Type | Voorbeeld | Wanneer relevant |
|------|-----------|-----------------|
| Video met audio waarbij visuele info niet in audio zit | Instructievideo met schermstappen | Altijd |
| Video met grafieken/diagrammen | Presentatievideo met statistieken | Als grafieken niet worden beschreven |
| Video met tekst op scherm | Video met ondertitels in beeld | Als tekst niet wordt voorgelezen |
| Video met handelingen | Video van ondertekeningsceremonie | Als handelingen niet worden beschreven |

### Niet onder SC 1.2.3:

| Type | Waarom niet | Valt onder |
|------|------------|-----------|
| Alleen-audio | Geen visuele content | SC 1.2.1 |
| Alleen-video | Geen gesynchroniseerde media | SC 1.2.1 |
| Live video | Niet vooraf opgenomen | — |
| Media-alternatief voor tekst | Uitzondering | N.v.t. |

### Belangrijke nuance: wanneer is SC 1.2.3 NIET van toepassing?

**Als alle visuele informatie al via de audiotrack wordt overgebracht, is geen aanvullende audiodescriptie of media-alternatief nodig.**

Dit is het geval bij bijvoorbeeld:
- Een "pratend hoofd" video (talking head) zonder relevante visuele achtergrond
- Een video waarin de spreker alles wat te zien is, beschrijft
- Een audio-opname waarbij de video geen aanvullende informatie biedt
- Een video met gesproken uitleg als: "Hier zie je een grafiek met stijgende omzetcijfers" — de visuele informatie (grafiek) wordt al in de audio benoemd, dus extra audiodescriptie over die grafiek is niet nodig

> **W3C:** "For 1.2.3, 1.2.5, and 1.2.7, if all of the important information in the video track is already conveyed in the audio track, no additional audio description is necessary."

---

## Beslisboom

```
Video met audio gevonden op de pagina
│
├─ Is de video vooraf opgenomen (niet live)?
│  ├─ NEE → SC 1.2.3 niet van toepassing
│  └─ JA ↓
│
├─ Is de video gepubliceerd na 23 september 2020 (of datum onbekend)?
│  ├─ NEE (vóór 23-09-2020) → Valt buiten scope Toegankelijkheidswet
│  └─ JA / onbekend ↓
│
├─ Is de video een media-alternatief voor tekst, duidelijk zo gelabeld?
│  ├─ JA → UITZONDERING: SC 1.2.3 niet van toepassing
│  └─ NEE ↓
│
├─ Bevat de video visuele informatie die NIET via de audiotrack
│  wordt overgebracht?
│  ├─ NEE → SC 1.2.3 is voldaan (alle info zit al in de audio)
│  └─ JA ↓
│
├─ Is er een audiodescriptie beschikbaar?
│  ├─ JA → Check kwaliteit → PASS / FAIL
│  └─ NEE ↓
│
└─ Is er een volledig media-alternatief (tekstbeschrijving) beschikbaar?
   ├─ JA → Check kwaliteit en vindbaarheid → PASS / FAIL
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
- Wordt er visuele informatie getoond die niet door de spreker of het geluid wordt overgebracht?
- Staan er teksten, grafieken, diagrammen of ondertitels in beeld die niet worden voorgelezen?
- Vinden er visuele handelingen plaats die niet worden beschreven?

**Als alle visuele informatie al in de audio zit → SC 1.2.3 is automatisch voldaan.**

### Stap 4: Controleer op audiodescriptie
- Is er een aparte audiotrack met beschrijvingen van de visuele content?
- Bij YouTube: controleer of er een audiodescriptie-track beschikbaar is (zeldzaam)
- Bij HTML5 `<video>`: controleer op `<track kind="descriptions">`

### Stap 5: Controleer op media-alternatief
- Staat er een volledige tekstbeschrijving bij of naast de video?
- Is er een link naar een tekstdocument met de volledige beschrijving?
- Bevat het alternatief zowel de audio-inhoud als de visuele beschrijvingen?

### Stap 6: Beoordeel de kwaliteit
- **Audiodescriptie:** Beschrijft alle relevante visuele informatie in de pauzes?
- **Media-alternatief:** Bevat het alle dialoog, geluiden, setting-beschrijvingen, handelingen en visuele informatie?
- Is het alternatief vindbaar (direct naast of onder de video)?

---

## De 5 auditgebieden

### 1. VISUELE INFORMATIE NIET IN AUDIOTRACK

**Kernvraag:** Biedt de video visuele informatie die niet uit de audiotrack blijkt?

**Wat te controleren:**
- Tekst op het scherm (titels, namen, statistieken, grafieken)
- Handelingen die niet worden beschreven (iemand ondertekent een document, toont een voorwerp)
- Scènewisselingen die niet worden benoemd
- Gezichtsuitdrukkingen of gebaren die betekenis dragen
- Relevante achtergrond of setting

**Voorbeelden op gemeente-websites:**

| Video | Visuele info niet in audio | Audiodescriptie/alternatief nodig? |
|-------|---------------------------|-----------------------------------|
| Burgemeester spreekt in camera (talking head) | Nee, alleen pratend hoofd | Nee — alle info zit in audio |
| Instructievideo afvalscheiding met beelden van bakken | Ja, beelden van verschillende containers | Ja |
| Ondertekeningsceremonie met namen op scherm | Ja, namen/titels op scherm | Ja, tenzij namen worden genoemd |
| Raadsvergadering met presentatieslides | Ja, slides niet altijd voorgelezen | Ja |
| Promotievideo met luchtbeelden gemeente | Ja, visuele sfeerbeelden | Context-afhankelijk |

### 2. AUDIODESCRIPTIE AANWEZIG EN KWALITEIT

**Controleer als audiodescriptie wordt aangeboden:**

- Worden alle relevante visuele elementen beschreven?
- Past de beschrijving in de pauzes van de dialoog?
- Is de beschrijving in dezelfde taal als de video?
- Verstoort de beschrijving de originele audio niet?
- Beschrijft het acties, scènewisselingen, tekst op scherm?

**Wat moet audiodescriptie bevatten?**
- Beelden die essentieel zijn om de video te begrijpen
- Tekst die in beeld verschijnt, zoals namen van sprekers
- Logo's en slogans aan het begin of einde van de video, zodat duidelijk is wie de afzender is
- Relevante handelingen en scènewisselingen

**Audiodescriptie moet synchroon lopen met de video:**
- De audiodescriptie moet op het juiste moment te horen zijn, bijvoorbeeld op het moment dat een tekst in beeld verschijnt
- Als het nodig is, mag de audiodescriptie ook door het standaard geluid heen worden gemixt, zolang de video begrijpelijk blijft

```html
<!-- HTML5 video met audiodescriptie-track -->
<video controls>
  <source src="opening-gemeentehuis.mp4" type="video/mp4">
  <track kind="descriptions" src="beschrijving.vtt" srclang="nl"
         label="Audiodescriptie">
  <track kind="captions" src="ondertiteling.vtt" srclang="nl"
         label="Ondertiteling">
</video>

<!-- Alternatief: aparte video met audiodescriptie -->
<p><a href="opening-gemeentehuis-met-audiodescriptie.mp4">
   Bekijk de versie met audiodescriptie
</a></p>
```

### 3. MEDIA-ALTERNATIEF AANWEZIG EN KWALITEIT

**Controleer als een media-alternatief (tekstbeschrijving) wordt aangeboden:**

Het media-alternatief moet bevatten:
- Alle gesproken dialoog
- Beschrijvingen van geluiden
- Beschrijvingen van setting en settingwisselingen
- Beschrijvingen van handelingen en uitdrukkingen van personen
- Alle tekst die op het scherm verschijnt

```html
<!-- Link naar media-alternatief direct naast de video -->
<iframe src="https://www.youtube.com/embed/ABC123"
        title="Opening gemeentehuis Voorne aan Zee">
</iframe>
<p><a href="/media/transcript-opening-gemeentehuis.html">
   Volledige tekstbeschrijving van deze video
</a></p>
```

**Verschil met een transcript (SC 1.2.1):**

| Aspect | Transcript (SC 1.2.1) | Media-alternatief (SC 1.2.3) |
|--------|----------------------|------------------------------|
| Gesproken tekst | ✅ | ✅ |
| Niet-spraakgeluiden | ✅ | ✅ |
| Visuele beschrijvingen | ❌ Niet vereist | ✅ Vereist |
| Scène/setting | ❌ Niet vereist | ✅ Vereist |
| Handelingen personen | ❌ Niet vereist | ✅ Vereist |

**Belangrijk:** Een transcript dat alleen de audio beschrijft is **niet voldoende** als media-alternatief voor SC 1.2.3. Het moet ook alle visuele informatie bevatten.

### 4. VINDBAARHEID VAN HET ALTERNATIEF

**Regel:** Het alternatief (audiodescriptie of tekstbeschrijving) moet eenvoudig vindbaar zijn.

**Controleer:**
- Staat de link direct naast of onder de video? (G58)
- Is het duidelijk gelabeld? (bijv. "Volledige tekstbeschrijving" of "Versie met audiodescriptie")
- Is het alternatief op dezelfde pagina of via een directe link bereikbaar?
- Moet de gebruiker scrollen of zoeken om het te vinden?

### 5. UITZONDERING: MEDIA-ALTERNATIEF VOOR TEKST

Dezelfde uitzondering als bij SC 1.2.1 en 1.2.2:
- De video is zelf een alternatieve weergave van tekst die al op de pagina staat
- De video bevat niet meer informatie dan de tekst
- De video is duidelijk gelabeld als media-alternatief

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Talking head (pratend hoofd)

Een persoon spreekt in de camera zonder visuele toevoegingen.

```
Video: Burgemeester spreekt nieuwjaarsboodschap in, kijkt in de camera.
Audio: Volledige toespraak is hoorbaar.
Visuele info niet in audio: Nee (alleen pratend hoofd).
→ SC 1.2.3: PASS — geen aanvullend alternatief nodig.
```

**Let op:** Als er titels, namen of logo's in beeld verschijnen die niet worden benoemd, is dit wél visuele informatie die niet in de audio zit.

### Patroon B: Instructievideo met schermstappen

```
Video: Hoe vraag je online een parkeervergunning aan.
Audio: Voice-over legt uit welke stappen je moet nemen.
Visuele info niet in audio: Schermbeelden tonen specifieke knoppen,
  veldnamen en menu's die niet altijd worden benoemd in de voice-over.
→ SC 1.2.3: Audiodescriptie of media-alternatief nodig voor de
  schermstappen die niet worden voorgelezen.
```

### Patroon C: Ondertekenings- of ceremonie-video

```
Video: 12 partijen ondertekenen samenwerkingsovereenkomst.
Audio: Muziek, korte interviews.
Visuele info niet in audio: Namen/titels op scherm, wie ondertekent,
  welke organisatie, documenttekst.
→ SC 1.2.3: Audiodescriptie of media-alternatief nodig.
  Alternatief: tekstbeschrijving met alle partijen en hun vertegenwoordigers.
```

### Patroon D: Raadsvergadering met presentatieslides

```
Video: Raadsvergadering met PowerPoint-presentatie op scherm.
Audio: Sprekers bespreken onderwerpen, verwijzen naar slides.
Visuele info niet in audio: Slides met grafieken, tabellen, tekst die
  niet altijd wordt voorgelezen.
→ SC 1.2.3: Slides/presentatie als apart document aanbieden kan dienen
  als (gedeeltelijk) media-alternatief. Volledige notulen met verwijzing
  naar slides is het meest compleet.
```

### Patroon E: Promotie-/sfeer-video

```
Video: Drone-beelden van de gemeente met muziek.
Audio: Alleen achtergrondmuziek, geen spraak.
Let op: Dit is mogelijk video-only (SC 1.2.1) als de muziek puur
  sfeerversterkend is. Als de muziek informatief is → gesynchroniseerde media.
→ Beoordeel per geval of het onder 1.2.1 of 1.2.3 valt.
```

### Patroon F: Video met ingebedde tekst/grafieken

```
Video: Infographic-animatie over gemeentefinanciën met cijfers en grafieken.
Audio: Voice-over beschrijft de hoofdlijn maar niet alle cijfers.
Visuele info niet in audio: Specifieke bedragen, percentages, grafieklabels.
→ SC 1.2.3: Media-alternatief nodig met alle cijfers en gegevens.
```

---

## Relatie met SC 1.2.5 (Niveau AA)

**SC 1.2.3 (Niveau A):** Audiodescriptie **OF** media-alternatief
**SC 1.2.5 (Niveau AA):** Audiodescriptie is **verplicht** (transcriptie alleen is niet meer voldoende)

Omdat de Toegankelijkheidswet Niveau AA vereist, geldt in de praktijk:

| Conformiteitsniveau | Wat is voldoende? |
|--------------------|-------------------|
| Niveau A (SC 1.2.3) | Audiodescriptie OF volledig media-alternatief |
| Niveau AA (SC 1.2.5) | Audiodescriptie is verplicht |

**Praktisch advies voor gemeenten:** Omdat niveau AA verplicht is, is het verstandig direct audiodescriptie te bieden. Een media-alternatief is technisch voldoende voor SC 1.2.3 (niveau A), maar voor volledige AA-compliance is audiodescriptie ook nodig (SC 1.2.5).

**Uitzondering bij onvoldoende pauzes:** Als er in de video onvoldoende pauzes zijn om audiodescriptie in te voegen, mag de visuele informatie worden toegevoegd aan een transcriptie. Dit voldoet dan aan zowel SC 1.2.3 (niveau A) als SC 1.2.5 (niveau AA) — een transcriptie is een geaccepteerd alternatief wanneer audiodescriptie technisch niet mogelijk is.

**Audittip:** Bij het rapporteren van een FAIL op 1.2.3 kan je gemeente adviseren om direct audiodescriptie toe te voegen (dan is zowel 1.2.3 als 1.2.5 voldaan).

---

## Officiële W3C Techniques

### Sufficient Techniques

**Optie 1: Media-alternatief (tekstbeschrijving)**

| Code | Beschrijving |
|------|-------------|
| G69 | Een alternatief voor op tijd gebaseerde media aanbieden |
| G58 | Link naar het alternatief direct naast de non-text content plaatsen |

**Optie 2: Audiodescriptie**

| Code | Beschrijving |
|------|-------------|
| G78 | Een tweede, door de gebruiker selecteerbare, audiotrack met audiodescriptie |
| G173 | Een versie van de video met audiodescriptie aanbieden |
| G8 | Een video met uitgebreide audiodescriptie aanbieden |
| H96 | Het `<track>` element gebruiken voor audiodescriptie |

### Advisory Techniques

- Gebruik van het `<track kind="descriptions">` element in HTML5
- Het aanbieden van zowel audiodescriptie als een media-alternatief

### Failure Techniques

Er zijn geen specifieke failure-technieken voor SC 1.2.3 gedefinieerd. Beoordeling is gebaseerd op het ontbreken van zowel audiodescriptie als een media-alternatief wanneer visuele informatie niet in de audiotrack wordt overgebracht.

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: visuele info | audiodescriptie |
                  media-alternatief | vindbaarheid | uitzondering]
Element:         [beschrijving van het video-element]
Locatie:         [positie op pagina / URL]
Videobron:       [YouTube / Vimeo / HTML5 / extern platform]
Beoordeling:     [PASS | FAIL | N.v.t.]

Visuele info
niet in audio:   [ja/nee — beschrijf welke info ontbreekt]
Audiodescriptie: [aanwezig/afwezig]
Media-alternatief: [aanwezig/afwezig]
Kwaliteit:       [goed / onvoldoende / niet beoordeeld]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [W3C technique code]
Aanbeveling:     [concrete oplossing]
```

---

## Relatie met andere SC's in de 1.2-serie

| SC | Naam | Niveau | Focus |
|----|------|--------|-------|
| 1.2.1 | Alleen audio/video | A | Transcript voor alleen-audio/video |
| 1.2.2 | Ondertiteling (vooraf opgenomen) | A | Ondertiteling voor dove gebruikers |
| **1.2.3** | **Audiodescriptie of media-alternatief** | **A** | **Visuele info voor blinde gebruikers** |
| 1.2.4 | Ondertiteling (live) | AA | Live ondertiteling |
| 1.2.5 | Audiodescriptie (vooraf opgenomen) | AA | Audiodescriptie verplicht (strenger dan 1.2.3) |
| 1.2.6 | Gebarentaal | AAA | Gebarentolk |
| 1.2.7 | Uitgebreide audiodescriptie | AAA | Video pauzeert voor beschrijving |
| 1.2.8 | Media-alternatief | AAA | Volledige tekstbeschrijving verplicht |
| 1.2.9 | Alleen audio (live) | AAA | Transcript voor live audio |

---

## Praktische audittips

### Meest voorkomende situatie op gemeente-websites

De meeste video's op gemeente-websites zijn **talking head** video's (burgemeester of wethouder spreekt in de camera) of **korte informatieve video's** waarbij de spreker het meeste beschrijft. In deze gevallen is SC 1.2.3 vaak al voldaan zonder extra maatregelen.

**Rode vlaggen — hier is waarschijnlijk een FAIL:**
- Video's met schermopnames/tutorials zonder volledige voice-over
- Ceremoniële video's met namen/titels op het scherm
- Presentaties/raadsvergaderingen met slides die niet worden voorgelezen
- Infographic-animaties met cijfers die niet worden benoemd
- Video's met relevante acties die niet worden beschreven

### Veelgemaakte fouten

1. **Aannemen dat ondertiteling voldoende is** — Ondertiteling (SC 1.2.2) is voor dove gebruikers. SC 1.2.3 is voor blinde gebruikers. Ondertiteling beschrijft de audio, niet de visuele content.
2. **Verwarring transcript vs. media-alternatief** — Een transcript dat alleen de audio beschrijft is niet voldoende voor SC 1.2.3. Het media-alternatief moet ook visuele beschrijvingen bevatten.
3. **Visuele informatie niet herkennen** — Tekst op scherm, grafieken, handelingen worden over het hoofd gezien als "visuele informatie die niet in de audio zit".

### Aanbevelingen voor gemeenten

**Bij het maken van nieuwe video's:**
1. Laat sprekers alles wat op het scherm te zien is ook benoemen
2. Voeg tekst op het scherm altijd toe aan de gesproken tekst
3. Beschrijf handelingen die visueel worden getoond
4. Dit vermindert of elimineert de behoefte aan aparte audiodescriptie

**Bij bestaande video's waar visuele info ontbreekt in de audio:**
1. Maak een volledig media-alternatief (tekstbeschrijving) — dit is vaak eenvoudiger dan audiodescriptie
2. Plaats een link naar het media-alternatief direct naast de video
3. Label het duidelijk (bijv. "Volledige tekstbeschrijving van deze video")

**Alternatieven voor het aanbieden van audiodescriptie:**
- **Alternatieve video met audiodescriptie:** Onder de originele video een tweede versie van dezelfde video aanbieden, mét audiodescriptie
- **Los audiobestand (bijv. MP3):** Een apart geluidsbestand met de audiodescriptie dat gebruikers afzonderlijk kunnen afspelen terwijl ze de originele video bekijken
- **Audiodescriptietrack in de videospeler:** Een in-/uitschakelbare audiodescriptietrack (vergelijkbaar met ondertiteling)

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.2.3 is Niveau A:**
- Verplicht voor compliance
- In de praktijk wordt dit criterium vaak niet gecontroleerd of begrepen
- Veel gemeenten bieden ondertiteling (SC 1.2.2) maar geen audiodescriptie of media-alternatief (SC 1.2.3)
- De "of"-optie maakt het laagdrempeliger: een tekstbeschrijving is een realistisch alternatief

**Publicatiedatum:**
- Video's gepubliceerd **vóór 23 september 2020** hoeven niet te voldoen
- Video's gepubliceerd **na 23 september 2020** of met **onbekende datum** moeten voldoen

**Let op:** SC 1.2.5 (niveau AA) is ook verplicht en vereist audiodescriptie. Een transcriptie alleen is voor SC 1.2.5 niet meer voldoende.

---

## Bronnen

- **WCAG 2.2 Understanding 1.2.3:** https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html
- **WCAG 2.2 Understanding 1.2.5:** https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded.html
- **Technique G69 (Media-alternatief):** https://www.w3.org/WAI/WCAG22/Techniques/general/G69
- **Technique G58 (Link naar alternatief):** https://www.w3.org/WAI/WCAG22/Techniques/general/G58
- **Technique G78 (Tweede audiotrack):** https://www.w3.org/WAI/WCAG22/Techniques/general/G78
- **Technique G173 (Video met audiodescriptie):** https://www.w3.org/WAI/WCAG22/Techniques/general/G173
- **Technique G8 (Uitgebreide audiodescriptie):** https://www.w3.org/WAI/WCAG22/Techniques/general/G8
- **W3C WAI — Audio Description:** https://www.w3.org/WAI/media/av/description/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
