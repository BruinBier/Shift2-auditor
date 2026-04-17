# Word Template Handleiding

## Stap 1: Open het huidige template

Open `templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx` in Microsoft Word.

## Stap 2: Maak een backup

Sla het bestand op als: `Toegankelijkheidsonderzoek website Template - BACKUP-[DATUM].docx`

## Stap 3: Verwijder alle hardcoded content

Verwijder de volgende hardcoded content (maar behoud de structuur en koppen):

### Te verwijderen content:
- Alle voorbeeldteksten die specifiek zijn voor een project (zoals "Heerlen", "23 maart 2026", etc.)
- Alle voorbeelddata in tabellen
- Alle hardcoded bevindingen

### Te behouden:
- Alle koppen (Kop1, Kop2, Kop3, Kop4)
- Tabel structuur
- Styling en opmaak
- Inhoudsopgave veld

## Stap 4: Vervang content met placeholders

Vervang de content met de volgende placeholders (exact zoals hieronder, inclusief de accolades):

### Voorpagina:
- `{projectSubject}` - Project onderwerp
- `{reportDate}` - Rapportdatum
- `{version}` - Versie nummer
- `{auditedByOrg}` - Naam organisatie (bijv. "Shift2")

### Samenvatting sectie:
- Laat LEEG - wordt dynamisch ingevoegd door de API
- Zorg dat de kop "Samenvatting" een bookmark heeft: `_Toc_Samenvatting`

### Over het onderzoek:
- `{reportIntroHeader}` - Intro tekst (verschilt per website/formulieren)
- `{aboutResearchText}` - Over het onderzoek tekst
- `{scopeInfo}` - Reikwijdte uitleg
- `{sampleInfo}` - Steekproef uitleg
- `{testEnvironmentIntro}` - Testomgeving intro
- `{userAgents}` - Browsers en hulpmiddelen (multi-line)
- `{technologies}` - Gebruikte technologieën (multi-line)
- `{methodologyDetailText}` - Methodiek details

### Resultaten:
- `{criteriaCountText}` - Aantal criteria tekst
- Tabel met criteria - wordt volledig VERVANGEN door de API
  - Zorg dat de tabel het woord "Voldoet" bevat in de header
  - Zorg dat de tabel een voorbeeldrij heeft met code patroon (bijv. "1.1.1")

### Bevindingen:
- Laat LEEG - wordt dynamisch ingevoegd door de API

### Conclusie:
- `{conclusionText}` - Conclusie tekst (kan leeg zijn)
- `{validityText}` - Geldigheid tekst
- `{continuityAdvice1}` - Continuïteit advies deel 1
- `{continuityAdvice2}` - Continuïteit advies deel 2

## Stap 5: Controleer tabel structuur

### Criteria tabel moet hebben:
1. **Header rij** met kolommen:
   - "Succescriterium"
   - "Voldoet"
   - "Opmerkingen"

2. **Minimaal één template rij** met:
   - Code patroon (bijv. "1.1.1 Niet-tekstuele content")
   - Resultaat (bijv. "Ja")
   - Opmerkingen cel (kan leeg zijn)

De API gebruikt deze template rij om nieuwe rijen te genereren.

## Stap 6: Controleer bookmark

De "Samenvatting" kop MOET een bookmark hebben met naam: `_Toc_Samenvatting`

In Word:
1. Selecteer de "Samenvatting" kop
2. Ga naar Insert → Bookmark
3. Naam: `_Toc_Samenvatting`
4. Klik Add

## Stap 7: Controleer styles

Zorg dat de volgende styles gedefinieerd zijn:
- `Title` - voor hoofdtitel voorpagina
- `Subtitle` - voor ondertitel voorpagina
- `Kop1` - voor hoofdkoppen
- `Kop2` - voor subkoppen
- `Kop3` - voor sub-subkoppen
- `Kop4` - voor kleinste koppen
- `TableGrid` of andere tabel style

## Stap 8: Sla op

Sla het template op als:
`templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx`

## Stap 9: Test het template

1. Start de applicatie: `npm run dev`
2. Ga naar een project
3. Genereer een Word rapport
4. Controleer of alle placeholders correct zijn vervangen
5. Controleer of de styling goed is
6. Controleer of de inhoudsopgave werkt (rechtsklik → Veld bijwerken)

## Veelvoorkomende problemen

### Placeholder wordt niet vervangen:
- Controleer of de placeholder exact overeenkomt (inclusief accolades)
- Controleer of er geen extra spaties zijn
- Controleer of de placeholder niet over meerdere XML runs is verdeeld (kan gebeuren bij copy-paste)

### Tabel wordt niet gevuld:
- Controleer of de tabel het woord "Voldoet" bevat
- Controleer of de tabel een rij heeft met code patroon (1.1.1)
- Kijk in de console logs voor foutmeldingen

### Samenvatting wordt niet ingevoegd:
- Controleer of de bookmark `_Toc_Samenvatting` bestaat
- Controleer of de bookmark bij de ECHTE "Samenvatting" kop staat (niet in de inhoudsopgave)

### Styling is weg:
- De styles.xml, numbering.xml en theme/ bestanden moeten intact blijven
- Maak een nieuwe backup van het oude template voordat je verder gaat

## Placeholder overzicht

Hier is een volledige lijst van alle placeholders die de API verwacht:

| Placeholder | Type | Beschrijving |
|-------------|------|--------------|
| `{projectSubject}` | Text | Project onderwerp |
| `{opdrachtgeverNaam}` | Text | Naam opdrachtgever |
| `{websiteUrl}` | Text | Website URL (domain) |
| `{websiteName}` | Text | Website naam |
| `{reportDate}` | Text | Rapport datum |
| `{version}` | Text | Versie nummer |
| `{title}` | Text | Project titel |
| `{kenmerk}` | Text | Project kenmerk |
| `{standard}` | Text | Standaard (WCAG 2.2) |
| `{level}` | Text | Niveau (A, AA, AAA) |
| `{researchType}` | Text | Type onderzoek |
| `{researcherName}` | Text | Naam onderzoeker |
| `{dateStart}` | Text | Start datum |
| `{dateEnd}` | Text | Eind datum |
| `{auditedByOrg}` | Text | Organisatie |
| `{uniqueForms}` | Number | Aantal formulieren |
| `{totalPages}` | Number | Totaal pagina's |
| `{totalCriteria}` | Number | Totaal criteria |
| `{passedCriteria}` | Number | Geslaagde criteria |
| `{failedCriteria}` | Number | Gefaalde criteria |
| `{percentage}` | Text | Percentage |
| `{compliesFully}` | Text | Voldoet wel/niet |
| `{managementSummary}` | HTML | Samenvatting (LEEG - wordt dynamisch ingevoegd) |
| `{researcherFeedback}` | HTML | Onderzoeker feedback |
| `{reportIntroHeader}` | Text | Intro header |
| `{aboutResearchText}` | Text | Over onderzoek |
| `{scopeInfo}` | Text | Scope uitleg |
| `{sampleInfo}` | Text | Steekproef uitleg |
| `{conclusionText}` | Text | Conclusie |
| `{managementSummaryAdvice}` | Text | Advies |
| `{validityText}` | Text | Geldigheid |
| `{criteriaCountText}` | Text | Aantal criteria tekst |
| `{otherCriteriaText}` | Text | Andere criteria tekst |
| `{combinedAssessmentText}` | Text | Gecombineerde beoordeling |
| `{methodologyText}` | Text | Methodiek |
| `{snapshotWarningText}` | Text | Momentopname waarschuwing |
| `{continuityAdvice1}` | Text | Continuïteit advies 1 |
| `{continuityAdvice2}` | Text | Continuïteit advies 2 |
| `{scopeExplanation}` | Text | Scope uitleg |
| `{methodologyDetailText}` | Text | Methodiek details |
| `{testEnvironmentIntro}` | Text | Testomgeving intro |
| `{userAgents}` | Multi-line | Browsers/hulpmiddelen |
| `{technologies}` | Multi-line | Technologieën |
| `{totalFindings}` | Number | Totaal bevindingen |
| `{totalSampleItems}` | Number | Totaal steekproef items |
| `{totalScopeUrls}` | Number | Totaal scope URLs |
| `{scopeUrlsInScope}` | Array | URLs binnen scope (dynamisch) |
| `{scopeUrlsOutOfScope}` | Array | URLs buiten scope (dynamisch) |
| `{criteriaAssessments}` | Array | Criteria beoordelingen (dynamisch - vervangt tabel) |

## Tip: Eenvoudigere aanpak

Als het te complex wordt, kun je ook:

1. **Start met het automatisch gegenereerde template**: `templates/website/Toegankelijkheidsonderzoek website Template - CLEAN-NEW.docx`
2. Open dit in Word
3. Pas de styling aan (fonts, kleuren, etc.)
4. Voeg je logo toe als je dat wilt
5. Sla op en test

Dit template heeft al alle placeholders op de juiste plek staan!