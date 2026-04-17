---
name: wcag-1-3-3-sensory-characteristics
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.3.3 (Sensory Characteristics) on Dutch government websites. Use when conducting accessibility audits to verify that instructions and references to content do not rely solely on sensory properties like shape, size, visual location, orientation, or sound. Covers instructional text, icon usage (F26), graphical symbols, word clouds, and the distinction with SC 1.4.1 (color). Relevant for gemeente websites with forms, navigation instructions, status indicators, and interactive components. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.3.3 Zintuiglijke eigenschappen — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.3.3 (Niveau A):**
Instructies die geleverd worden om content te begrijpen en te bedienen zijn niet alleen afhankelijk van zintuiglijke eigenschappen van componenten zoals vorm, omvang, visuele locatie, oriëntatie of geluid.

**Kernprincipe:** Alle bezoekers moeten toegang hebben tot instructies om content te kunnen gebruiken, ook als ze geen vorm, omvang, visuele locatie, oriëntatie of geluid kunnen waarnemen.

**Belangrijk: niet verwijderen maar aanvullen.** Het gebruik van vorm, omvang, enz. wordt niet ontmoedigd — mensen met cognitieve beperkingen hebben hier juist baat bij. De informatie moet wel worden **aangevuld** met tekstuele of programmatische identificatie, zodat het ook bruikbaar is voor mensen die deze zintuiglijke kenmerken niet kunnen waarnemen.

---

## De vijf zintuiglijke eigenschappen

| Eigenschap | Voorbeeld van fout | Goede aanvulling |
|------------|-------------------|-----------------|
| **Vorm** | "Druk op de ronde knop" | "Druk op de ronde **verzend**knop" |
| **Omvang** | "De grote tekst" | "De grote tekst **'Hoofdletters'**" |
| **Visuele locatie** | "De links in de linkerkolom" | "De links in de linkerkolom **onder de kop 'Submenu'**" |
| **Oriëntatie** | "De pijl omlaag" | "De **dalende koers** met de pijl omlaag" |
| **Geluid** | "Na de piep mag u klikken" | "Na de piep **en/of de melding 'ga verder'** mag u klikken" |

**Let op:** Verwijzing op **kleur** valt NIET onder dit criterium. Het gebruik van kleur wordt beoordeeld onder SC 1.4.1 (Gebruik van kleur). Als kleur echter wordt gebruikt in combinatie met vorm/locatie in een instructie zonder tekstuele aanvulling, kan het wél een SC 1.3.3 failure zijn.

---

## Scope

### Wel onder SC 1.3.3:

| Situatie | Voorbeeld |
|----------|-----------|
| Instructies die verwijzen naar vorm | "Klik op de ronde knop" |
| Instructies die verwijzen naar omvang | "In het grote kader staat uitleg" |
| Instructies die verwijzen naar visuele locatie | "De afbeelding in de linkerkolom" |
| Instructies die verwijzen naar oriëntatie | "De pijl omlaag" |
| Instructies die verwijzen naar geluid | "Na de piep mag u klikken" |
| Grafische symbolen die informatie overbrengen | Vinkjes, kruisjes, smileys, vraagtekens |
| Icoontjes die door hun vorm informatie overdragen | Groen vinkje, rood kruisje, vraagteken-icoon |
| Teksten in een woordenwolk | Woorden die groter/kleiner zijn op basis van belang |

### Niet onder SC 1.3.3:

| Situatie | Waarom niet | Valt onder |
|----------|------------|-----------|
| Alleen kleur als onderscheidend kenmerk | Kleur is een apart criterium | SC 1.4.1 |
| Alt-tekst bij afbeeldingen (puur) | Tekstalternatief voor niet-tekst | SC 1.1.1 |
| Fysieke hardware-instructies | Tactiele aanwijzingen toegestaan | — |

### Uitzondering: "hierboven" en "hieronder"

In sommige talen is het algemeen duidelijk dat "hierboven" verwijst naar content die direct voorafgaat en "hieronder" naar content die direct volgt. Uitdrukkingen als "kies één van de links hieronder" of "alle hierboven genoemde" mogen worden goedgekeurd wanneer:
- De content waarnaar wordt verwezen op de juiste plaats in de leesvolgorde staat (direct vóór of ná)
- De verwijzingen ondubbelzinnig zijn

---

## Beslisboom

```
Instructie of verwijzing gevonden op de pagina
│
├─ Verwijst de instructie naar een zintuiglijke eigenschap?
│  (vorm, omvang, visuele locatie, oriëntatie, geluid)
│  ├─ NEE → SC 1.3.3 is niet van toepassing
│  └─ JA ↓
│
├─ Is de instructie ALLEEN afhankelijk van de zintuiglijke eigenschap?
│  ├─ NEE (er is aanvullende tekst/semantiek) → PASS
│  └─ JA (alleen zintuiglijk) → FAIL (F14)
│
Grafisch symbool gevonden dat informatie overbrengt
│
├─ Is er een tekstuele manier om de informatie te bepalen?
│  ├─ JA → PASS
│  └─ NEE → FAIL (F26)
```

---

## Stapsgewijze auditprocedure (toetsmethode)

### Stap 1: Zoek tekstuele verwijzingen naar andere content
Kijk of op de webpagina tekstuele verwijzingen staan naar andere content binnen de pagina.

### Stap 2: Controleer verwijzingen op zintuiglijke afhankelijkheid
Controleer of de verwijzing niet alleen afhankelijk is van vorm, omvang, visuele locatie, oriëntatie of geluid.

### Stap 3: Zoek grafische symbolen
Kijk of op de webpagina ook verwijzingen staan naar grafische (= niet-tekstuele) symbolen die informatie overbrengen.

### Stap 4: Controleer alternatieven voor grafische symbolen
Controleer of er ook een andere manier is om de informatie te bepalen die het symbool overbrengt.

**Let op:** Bij stap 3 en 4 gaat het niet puur om een tekstalternatief voor een symbool (dat hoort bij SC 1.1.1). Bij SC 1.3.3 gaat het om de combinatie van instructie/verwijzing en symbool.

---

## De 5 auditgebieden

### 1. INSTRUCTIES MET VORM

**Fout:** Instructies die alleen naar de vorm van een element verwijzen.

```html
<!-- FAIL (F14): alleen verwijzing naar vorm -->
<p>Klik op de ronde knop om te verzenden.</p>
<button class="round">Verzenden</button>

<!-- PASS: vorm + tekst van het element -->
<p>Klik op de ronde knop "Verzenden" om uw aanvraag in te dienen.</p>
<button class="round">Verzenden</button>

<!-- PASS: alleen verwijzing naar tekst -->
<p>Klik op "Verzenden" om uw aanvraag in te dienen.</p>
<button>Verzenden</button>
```

### 2. INSTRUCTIES MET VISUELE LOCATIE

**Fout:** Instructies die alleen naar de positie op de pagina verwijzen.

```html
<!-- FAIL (F14): alleen verwijzing naar locatie -->
<p>Gebruik het menu aan de rechterkant voor meer informatie.</p>

<!-- PASS: locatie + beschrijving van het menu -->
<p>Gebruik het menu "Veelgestelde vragen" aan de rechterkant
   voor meer informatie.</p>

<!-- PASS: alleen verwijzing naar naam -->
<p>Gebruik het menu "Veelgestelde vragen" voor meer informatie.</p>
```

**Uitzondering "hierboven/hieronder":**
```html
<!-- PASS: "hieronder" verwijst naar direct volgende content -->
<p>Kies één van de opties hieronder:</p>
<ul>
  <li><a href="/optie-a">Optie A</a></li>
  <li><a href="/optie-b">Optie B</a></li>
</ul>
```

### 3. INSTRUCTIES MET GELUID

**Fout:** Instructies die alleen op geluid vertrouwen.

```html
<!-- FAIL (F14): alleen geluid als signaal -->
<p>Na de piep mag u op de knop "Volgende" klikken.</p>
<!-- Doven horen de piep niet -->

<!-- PASS: geluid + visueel/tekstueel signaal -->
<p>Na de piep en/of de melding "Ga verder" mag u op de knop
   "Volgende" klikken.</p>

<!-- FAIL: foutmelding alleen via geluid -->
<!-- Een formulier dat bij een fout alleen een piepje laat horen,
     zonder visuele foutmelding -->

<!-- PASS: geluid + visuele foutmelding -->
<!-- Piepje + tekst "Vul een geldig e-mailadres in" -->
```

Naast het auditieve signaal geef je ook een signaal door middel van tekst. Dit is vooral handig voor mensen die doof zijn, of blinden die het geluid uit hebben staan en alleen met een brailleleesregel werken.

### 4. GRAFISCHE SYMBOLEN (F26)

**Gangbare fout F26:** Het gebruik van alleen een grafisch symbool om informatie over te brengen. Een grafisch symbool kan zijn:
- een afbeelding van een rode cirkel met een schuine streep erdoorheen
- een smiley
- een karakter-symbool voor een vraagteken of pijl
- een vinkje of kruisje

Als een grafisch symbool wordt gebruikt om informatie over te brengen, moet een (tekst)alternatief worden aangeboden, of een ander mechanisme dat gemarkeerd wordt als alternatief voor het grafische symbool.

```html
<!-- FAIL (F26): symbolen zonder tekst voor productstatus -->
<span class="status">✓</span> Widget A
<span class="status">✗</span> Widget B
<!-- Hulpsoftware kan zonder tekstalternatieven niet bepalen
     wat de status is (wel of niet op voorraad) -->

<!-- PASS: symbool + tekst -->
<span class="status" aria-hidden="true">✓</span>
Widget A — <span>Op voorraad</span>
<span class="status" aria-hidden="true">✗</span>
Widget B — <span>Niet op voorraad</span>

<!-- FAIL (F26): navigatie-icoon zonder tekst -->
<button><img src="hamburger.svg" alt=""></button>

<!-- PASS: icoon met toegankelijke naam -->
<button aria-label="Menu openen">
  <img src="hamburger.svg" alt="">
</button>
```

**Woordenwolk:**
```html
<!-- FAIL (F26): woordenwolk waar omvang de enige informatie is -->
<div class="wordcloud">
  <span style="font-size: 3em;">Duurzaamheid</span>
  <span style="font-size: 1em;">Transport</span>
  <span style="font-size: 2em;">Woningbouw</span>
</div>
<!-- Informatie dat "Duurzaamheid" het belangrijkst is,
     is alleen via omvang beschikbaar -->

<!-- PASS: woordenwolk met verborgen aanvullende tekst -->
<div class="wordcloud">
  <span style="font-size: 3em;">
    Duurzaamheid <span class="sr-only">(meest genoemd)</span>
  </span>
  <span style="font-size: 1em;">
    Transport <span class="sr-only">(minst genoemd)</span>
  </span>
</div>
```

### 5. INSTRUCTIES MET OMVANG EN ORIËNTATIE

**Fout:** Instructies die alleen naar grootte of richting verwijzen.

```html
<!-- FAIL: alleen omvang -->
<p>In het grote kader staat een uitleg.</p>

<!-- PASS: omvang + beschrijving -->
<p>In het grote kader met de kop "Toelichting" staat een uitleg.</p>

<!-- FAIL: alleen oriëntatie -->
<p>Aandelen met een pijl omlaag zijn gedaald.</p>

<!-- PASS: oriëntatie + tekstuele beschrijving -->
<p>Aandelen met een dalende koers worden aangeduid met een pijl omlaag.</p>
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Formulieren met instructies

```html
<!-- PASS: "hieronder" + knoptekst "Verzenden" genoemd -->
<p>Vul de velden hieronder in en klik op "Verzenden".</p>

<!-- FAIL: alleen kleur + locatie, geen knoptekst -->
<p>Klik op de groene knop rechtsonder om te verzenden.</p>
```

### Patroon B: Status-iconen bij diensten

```html
<!-- FAIL: alleen icoon voor status -->
<h3>Paspoort aanvragen</h3>
<span class="status-icon green-check"></span>

<!-- PASS: icoon + tekst -->
<h3>Paspoort aanvragen</h3>
<span class="status-icon green-check" aria-hidden="true"></span>
<span>Beschikbaar</span>
```

### Patroon C: Navigatie-instructies

```html
<!-- FAIL: "Gebruik het menu aan de linkerkant" -->
<!-- Zonder te benoemen welk menu het is -->

<!-- PASS: "Gebruik het menu 'Producten en diensten'" -->
```

### Patroon D: Kaarten en plattegronden

```html
<!-- FAIL: "Klik op de rode pin op de kaart" -->
<!-- Alleen kleur + vorm -->

<!-- PASS: "Klik op de locatiemarkering 'Gemeentehuis' op de kaart" -->
```

### Patroon E: Stapsgewijze processen

```html
<!-- FAIL: alleen visuele voortgangsbalk zonder tekst -->
<div class="progress">
  <div class="step active"></div>
  <div class="step"></div>
  <div class="step"></div>
</div>

<!-- PASS: voortgangsbalk met tekst -->
<div class="progress">
  <div class="step active">Stap 1: Persoonsgegevens</div>
  <div class="step">Stap 2: Adres</div>
  <div class="step">Stap 3: Bevestiging</div>
</div>
```

### Patroon F: Foutmeldingen bij formulieren

```html
<!-- FAIL: fout alleen via geluid of visuele kleur/vorm -->
<!-- Invoerveld wordt rood omrand, geen tekst -->

<!-- PASS: visuele aanduiding + tekstuele foutmelding -->
<label for="email">E-mailadres:</label>
<input type="email" id="email" aria-describedby="email-error"
       class="error-border">
<span id="email-error" class="error-text">
  Vul een geldig e-mailadres in.
</span>
```

---

## Onderscheid met andere SC's

| SC | Relatie met 1.3.3 |
|----|------------------|
| **1.1.1** | Alt-tekst voor afbeeldingen/iconen. Bij 1.3.3 gaat het om de **instructie/verwijzing** die het symbool gebruikt, niet puur om het alt-attribuut. |
| **1.3.3** | **Instructies niet alleen afhankelijk van zintuiglijke kenmerken** |
| **1.4.1** | Kleur als enige onderscheidend kenmerk. Verwijzingen op kleur vallen onder 1.4.1, niet onder 1.3.3. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G96 | Tekstuele identificatie bieden van items die anders alleen op zintuiglijke informatie vertrouwen |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F14 | Content alleen identificeren door vorm of locatie |
| F26 | Alleen een grafisch symbool gebruiken om informatie over te brengen |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: vorm | visuele locatie | geluid |
                  grafische symbolen | omvang/oriëntatie]
Element:         [beschrijving van het element / de instructie]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL | N.v.t.]

Zintuiglijke
eigenschap:      [vorm / omvang / visuele locatie / oriëntatie / geluid]
Alleen
zintuiglijk:     [ja/nee]
Aanvullende
informatie:      [beschrijf welke aanvullende tekst/semantiek aanwezig is]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [F14 / F26 / G96]
Aanbeveling:     [concrete oplossing — niet verwijderen maar aanvullen]
```

---

## Praktische audittips

### Veelgemaakte fouten

1. **Instructies die alleen naar locatie verwijzen** — "het formulier rechts" zonder naam
2. **Status-iconen zonder tekst** — vinkjes, kruisjes, waarschuwingsdriehoeken
3. **Foutmeldingen alleen via kleur/vorm** — rode rand zonder tekstuele foutmelding
4. **Navigatie alleen via iconen** — hamburger-menu, zoek-icoon zonder label
5. **Woordenwolken** — grootte als enige indicator van belang
6. **Afbeeldingen/icoontjes die door hun vorm informatie overdragen** zonder goede alternatieve tekst

### Best practices

- **Niet verwijderen maar aanvullen** — behoud de zintuiglijke informatie maar voeg tekst toe
- Goede beschrijvende alternatieve teksten bij icoontjes
- Aanvullende (verborgen) tekstuele informatie bij woordenwolken
- Voeg bij elke instructie de naam/label van het element toe naast de zintuiglijke beschrijving

### Wie heeft er baat bij?

- **Doven en slechthorenden** die geen instructies kunnen begrijpen die afhankelijk zijn van geluid
- **Blinden en slechtzienden** die met aanvullende informatie instructies kunnen begrijpen die een afhankelijkheid hebben van vorm, omvang, enz.
- **Mensen met cognitieve beperkingen** hebben juist baat bij zintuiglijke kenmerken als aanvulling — daarom niet verwijderen maar aanvullen

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.3.3 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 1.3.3:** https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html
- **Technique G96 (Tekstuele identificatie):** https://www.w3.org/WAI/WCAG22/Techniques/general/G96
- **Failure F14 (Alleen vorm of locatie):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F14
- **Failure F26 (Alleen grafisch symbool):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F26
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
