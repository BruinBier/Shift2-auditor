# Word Template Placeholders Mapping

Dit document beschrijft alle beschikbare placeholders in het Word template voor formulieren rapporten.

## ✅ Geïmplementeerde Placeholders (20 totaal)

### Basis Project Informatie (7)

| Placeholder | Beschrijving | Voorbeeld waarde |
|-------------|--------------|------------------|
| `{projectSubject}` | Project onderwerp | "Valkenswaard" |
| `{opdrachtgeverNaam}` | Naam opdrachtgever | "A2gemeenten" |
| `{websiteUrl}` | Hoofd website URL | "https://www.valkenswaard.nl/" |
| `{version}` | Rapport versie nummer | "1.0" |
| `{reportDate}` | Rapportage datum | "28 februari 2026" |
| `{dateStart}` | Startdatum onderzoek | "9 maart 2026" |
| `{dateEnd}` | Einddatum onderzoek | "23 maart 2026" |

### WCAG & Onderzoek Informatie (4)

| Placeholder | Beschrijving | Voorbeeld waarde |
|-------------|--------------|------------------|
| `{standard}` | WCAG standaard | "WCAG 2.2" |
| `{level}` | WCAG niveau | "AA" |
| `{researchType}` | Type onderzoek | "Deelonderzoek content" |
| `{auditedByOrg}` | Organisatie die audit uitvoert | "Shift2" |

### Statistieken (1)

| Placeholder | Beschrijving | Bron |
|-------------|--------------|------|
| `{totalSampleItems}` | Aantal items in steekproef | `project.sampleItems.length` |

### Tekstuele Secties (5)

Deze placeholders worden gebruikt voor de belangrijkste tekstblokken die vaak aangepast worden:

| Placeholder | Sectie | Gebruik |
|-------------|--------|---------|
| `{managementSummary}` | Samenvatting | Resultaten samenvatting |
| `{aboutResearchText}` | Over dit onderzoek | Introductie onderzoek |
| `{scopeInfo}` | Afbakening | Scope beschrijving |
| `{sampleInfo}` | Steekproef | Steekproef beschrijving |
| `{conclusionText}` | Conclusie | Conclusie tekst (beschikbaar maar niet in huidige template) |

### Standaard Teksten (8)

Deze placeholders bevatten standaard teksten die zelden veranderen:

| Placeholder | Sectie | Gebruik |
|-------------|--------|---------|
| `{managementSummaryAdvice}` | Samenvatting | Standaard advies tekst |
| `{otherCriteriaText}` | Afbakening | Niet-beoordeelde criteria |
| `{methodologyText}` | Reikwijdte | Onderzoeksmethode beschrijving |
| `{snapshotWarningText}` | Reikwijdte | Waarschuwing momentopname |
| `{continuityAdvice1}` | Borging | Advies steekproef |
| `{continuityAdvice2}` | Borging | Advies wijzigingen |
| `{scopeExplanation}` | Scope | Scope uitleg |
| `{methodologyDetailText}` | Onderzoeksmethode | WCAG-EM beschrijving |
| `{testEnvironmentIntro}` | Testomgeving | Intro testomgeving |

### Testomgeving Tools (4)

| Placeholder | Beschrijving | Standaard waarde |
|-------------|--------------|------------------|
| `{browserChrome}` | Chrome browser versie | "Google Chrome 145" |
| `{browserFirefox}` | Firefox browser versie | "Mozilla Firefox 147" |
| `{browserEdge}` | Edge browser versie | "Microsoft Edge 145" |
| `{screenReader}` | Screenreader tool | "NVDA (Windows)" |

## Additionele Data Beschikbaar (niet in template)

Deze velden zijn beschikbaar in de API maar nog niet toegevoegd als placeholders:

- `{title}` - Project titel
- `{kenmerk}` - Project kenmerk
- `{researcherName}` - Naam onderzoeker
- `{conclusionText}` - Conclusie tekst
- `{totalFindings}` - Aantal bevindingen
- `{totalScopeUrls}` - Aantal scope URLs

## Loop Syntax (Voor Toekomstig Gebruik)

### Bevindingen Loop
```
{#findings}
{code} - {title}
Impact: {impact}
{description}
{/findings}
```

### Steekproef Items Loop
```
{#sampleItems}
{title}
URL: {url}
Type: {type}
{/sampleItems}
```

### Criteria Assessments Loop
```
{#criteriaAssessments}
{criterionNumber} - {criterionTitle}: {status}
{/criteriaAssessments}
```

## Gebruik

1. **Template bestand**: `templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx`
2. **API Endpoint**: `GET /api/reports/[id]/docx`
3. **UI Knop**: Admin project pagina → "Download formulier" knop

## Automatische Vervanging

Het script `scripts/add-placeholders-to-template.ts` maakt automatisch een template met placeholders aan vanuit het originele document. Voer uit met:

```bash
npx tsx scripts/add-placeholders-to-template.ts
```

## Verificatie

Om te controleren welke placeholders in een template zitten:

```bash
npx tsx scripts/inspect-template.ts
```