# Shift2 Auditor - Architectuur Overzicht

## 🏗️ Hoe de Applicatie In Elkaar Zit

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GEBRUIKER                                   │
│                     (Browser Interface)                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
    ┌───────────▼──────────┐   ┌─────────▼────────────┐
    │   ADMIN INTERFACE    │   │  PUBLIC REPORT       │
    │   /admin/projects    │   │  /report/[id]        │
    │                      │   │                      │
    │  • Projecten beheren│   │  • Rapportage lezen  │
    │  • Tests draaien    │   │  • 4 tabs bekijken   │
    │  • Bevindingen maken│   │  • Print/PDF export  │
    └──────────┬───────────┘   └──────────────────────┘
               │
               │
    ┌──────────▼──────────────────────────────────────┐
    │           API ROUTES (/api/...)                 │
    │                                                  │
    │  • /api/sample-items/[id]/crawler  (POST)      │
    │  • /api/tests/available            (GET)       │
    │  • /api/projects/[id]/...          (CRUD)      │
    └──────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────┐
    │         BUSINESS LOGIC LAYER                    │
    │                                                  │
    │  ┌─────────────────────────────────────────┐   │
    │  │  CRAWLER ENGINE                         │   │
    │  │  (lib/crawler/)                         │   │
    │  │                                         │   │
    │  │  • browser-crawler.ts (Puppeteer)      │   │
    │  │  • tests.ts (130+ tests)               │   │
    │  │  • test-runner.ts (orchestratie)       │   │
    │  └─────────────┬───────────────────────────┘   │
    │                │                                │
    │  ┌─────────────▼───────────────────────────┐   │
    │  │  FORMATTERS                             │   │
    │  │  (lib/formatter/)                       │   │
    │  │                                         │   │
    │  │  • multiple-same-links-formatter.ts    │   │
    │  │  • link-missing-href-formatter.ts      │   │
    │  │  • img-missing-alt-formatter.ts        │   │
    │  │  • img-alt-too-short-formatter.ts      │   │
    │  └─────────────────────────────────────────┘   │
    └──────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────┐
    │         PRISMA ORM LAYER                        │
    │                                                  │
    │  • Project mappings naar database models        │
    │  • Type safety met TypeScript                   │
    │  • Migrations management                        │
    └──────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────┐
    │         POSTGRESQL DATABASE                     │
    │                                                  │
    │  📊 Database Schema (zie hieronder)             │
    └─────────────────────────────────────────────────┘
```

## 📊 Database Schema (Belangrijkste Tabellen)

```
┌─────────────────┐
│   Project       │  (Het hoofdproject)
├─────────────────┤
│ id              │──┐
│ naam            │  │
│ code            │  │
│ status          │  │
│ ...rich text... │  │
└─────────────────┘  │
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
┌───────▼────────┐  │  ┌─────────▼────────┐   ┌─▼────────────────┐
│ SampleItem     │  │  │ CriterionAssess. │   │ Finding          │
├────────────────┤  │  ├──────────────────┤   ├──────────────────┤
│ id             │──┼──│ id               │   │ id               │
│ projectId      │  │  │ projectId        │   │ projectId        │
│ url            │  │  │ criterionId      │   │ code (SHP-3-F1)  │
│ type           │  │  │ status           │   │ title            │
│ naam           │  │  │ opmerking        │   │ impact           │
│ crawledAt      │  │  └──────────────────┘   │ beschrijving     │
└────────┬───────┘  │                         │ advies           │
         │          │                         └──────────────────┘
         │          │
    ┌────▼──────────▼─────────┐
    │   CrawlerResult         │  (Test resultaten)
    ├─────────────────────────┤
    │ id                      │
    │ sampleItemId (nullable) │
    │ scopeUrlId (nullable)   │
    │ testId                  │
    │ testName                │
    │ found (boolean)         │
    │ count                   │
    │ details (JSON)          │  ← RAW TEST DATA
    │ createdAt               │
    └─────────────────────────┘
```

## 🔄 Data Flow: Van Test Naar Database

### STAP 1: Gebruiker klikt "Run Tests"

```
┌──────────────────────────┐
│ TestResults.tsx          │
│ (UI Component)           │
│                          │
│ [Run Tests Button]  ◄────── Gebruiker klikt
└──────────┬───────────────┘
           │
           │ POST /api/sample-items/[id]/crawler
           ▼
┌──────────────────────────┐
│ route.ts                 │
│ (API Handler)            │
│                          │
│ 1. Get Sample Item       │
│ 2. Check URL             │
│ 3. Call runTests(html)   │
└──────────┬───────────────┘
           │
           ▼
```

### STAP 2: Tests Worden Uitgevoerd

```
┌──────────────────────────────────────────────────┐
│ browser-crawler.ts                               │
│                                                  │
│ 1. Launch Puppeteer browser                     │
│ 2. Navigate to URL                               │
│ 3. Wait for page load                            │
│ 4. Extract HTML                                  │
└──────────┬───────────────────────────────────────┘
           │
           │ HTML String
           ▼
┌──────────────────────────────────────────────────┐
│ test-runner.ts                                   │
│                                                  │
│ runAllMVPTests(html)                             │
│   ├─ testImgMissingAlt(html)                     │
│   ├─ testImgAltTooShort(html)                    │
│   ├─ testLinkMissingHref(html)                   │
│   ├─ testPageContainsMultipleSameLinks(html)     │
│   └─ ... 130+ andere tests                       │
└──────────┬───────────────────────────────────────┘
           │
           │ Array van CrawlerTestResult[]
           ▼
┌──────────────────────────────────────────────────┐
│ tests.ts - Individuele Test                     │
│                                                  │
│ testImgAltTooShort(html) {                       │
│   const $ = cheerio.load(html);  ◄─── Parse HTML│
│                                                  │
│   $('img[alt]').each((i, img) => {               │
│     const alt = $(img).attr('alt');              │
│     if (alt.length > 0 && alt.length <= 3) {     │
│       details.push({                             │
│         src: ...,                                │
│         alt: ...,                                │
│         altLength: ...                           │
│       });                                        │
│     }                                            │
│   });                                            │
│                                                  │
│   return {                                       │
│     testId: '10',                                │
│     testName: 'ImgAltTooShortTest',              │
│     found: count > 0,                            │
│     count: count,                                │
│     details: { images: [...] }  ◄─── JSON Object│
│   };                                             │
│ }                                                │
└──────────┬───────────────────────────────────────┘
           │
           │ Test Results
           ▼
```

### STAP 3: Resultaten Opslaan in Database

```
┌──────────────────────────────────────────────────┐
│ route.ts (vervolg)                               │
│                                                  │
│ await prisma.crawlerResult.deleteMany({          │
│   where: { sampleItemId }                        │
│ });                                              │
│                                                  │
│ await prisma.crawlerResult.createMany({          │
│   data: results.map(r => ({                      │
│     sampleItemId,                                │
│     testId: r.testId,                            │
│     testName: r.testName,                        │
│     found: r.found,                              │
│     count: r.count,                              │
│     details: JSON.stringify(r.details) ◄─────┐   │
│   }))                                        │   │
│ });                                          │   │
│                                              │   │
│ await prisma.sampleItem.update({             │   │
│   where: { id: sampleItemId },               │   │
│   data: { crawledAt: new Date() }            │   │
│ });                                          │   │
└──────────────────────────────────────────────┼───┘
                                               │
                    DATABASE                   │
                       ▼                       │
┌──────────────────────────────────────────────┼───┐
│ PostgreSQL                                   │   │
│                                              │   │
│ CrawlerResult table:                         │   │
│ ┌────────────────────────────────────────┐   │   │
│ │ id: "abc123"                           │   │   │
│ │ sampleItemId: "xyz789"                 │   │   │
│ │ testId: "10"                           │   │   │
│ │ testName: "ImgAltTooShortTest"         │   │   │
│ │ found: true                            │   │   │
│ │ count: 3                               │   │   │
│ │ details: "{\"images\":[...]}"  ◄───────────────┘
│ │ createdAt: "2026-02-07T..."            │
│ └────────────────────────────────────────┘
└─────────────────────────────────────────────┘
```

### STAP 4: Resultaten Tonen met Formatters

```
GEBRUIKER KLIKT OP TEST ROW
           │
           ▼
┌──────────────────────────────────────────────────┐
│ TestResults.tsx                                  │
│                                                  │
│ setExpandedTestId(result.id)                     │
│                                                  │
│ const details = JSON.parse(result.details)  ◄───── Van DB
└──────────┬───────────────────────────────────────┘
           │
           │ details object
           ▼
┌──────────────────────────────────────────────────┐
│ CONDITIONAL RENDERING                            │
│                                                  │
│ if (testName === 'ImgAltTooShortTest') {         │
│   formatImgAltTooShortReport(details)            │
│ }                                                │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ img-alt-too-short-formatter.ts                   │
│                                                  │
│ formatImgAltTooShortReport(details) {            │
│   return details.images.map(img => ({            │
│     bevinding: "Afbeelding met te kort alt...",  │
│     details: "De afbeelding ... heeft ...",      │
│     advies: "Vervang de alt-tekst ..."          │
│   }));                                           │
│ }                                                │
└──────────┬───────────────────────────────────────┘
           │
           │ Array van Report objects
           ▼
┌──────────────────────────────────────────────────┐
│ RENDERED UI                                      │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │ Geformatteerde Rapportage (Serieus)     │    │
│ │                                          │    │
│ │ Bevinding:                               │    │
│ │ Afbeelding met te kort alt-attribuut     │    │
│ │                                          │    │
│ │ Details:                                 │    │
│ │ De afbeelding "logo.png" heeft een alt-  │    │
│ │ attribuut van slechts 1 karakter: "x"... │    │
│ │                                          │    │
│ │ Advies:                                  │    │
│ │ Vervang de alt-tekst "x" door een...    │    │
│ └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## 🎯 Complete Flow Voorbeeld: Van Klik tot Rapport

```
1. Admin opent Sample Item pagina
   └─► GET /admin/projects/[id]/sample/[sampleId]

2. Server Component haalt data op
   └─► prisma.sampleItem.findUnique({ include: { crawlerResults: true } })

3. Pagina toont TestResults component met bestaande resultaten
   └─► <TestResults crawlerResults={crawlerResults} />

4. Admin klikt "Run Tests"
   └─► POST /api/sample-items/[sampleId]/crawler

5. API handler:
   ├─► Get sample item URL
   ├─► runCrawlerForSampleItem(sampleItem)
   │   ├─► Launch Puppeteer
   │   ├─► Navigate to URL
   │   ├─► Extract HTML
   │   └─► runAllMVPTests(html)
   │       ├─► testImgMissingAlt(html)
   │       ├─► testImgAltTooShort(html)
   │       ├─► testLinkMissingHref(html)
   │       └─► ... 130+ tests
   │
   ├─► Delete oude results (prisma.crawlerResult.deleteMany)
   ├─► Save nieuwe results (prisma.crawlerResult.createMany)
   └─► Update crawledAt timestamp

6. Response terug naar client
   └─► { success: true, testsRun: 133, testsFound: 5 }

7. Client refresht pagina
   └─► router.refresh()

8. Nieuwe test resultaten worden getoond

9. Admin klikt op een test met found=true
   └─► setExpandedTestId(result.id)

10. Details row wordt getoond:
    ├─► Raw JSON data
    └─► Geformatteerde rapportage (als formatter bestaat)
        ├─► formatMultipleSameLinksReport(details)
        ├─► formatLinkMissingHrefReport(details)
        ├─► formatImgMissingAltReport(details)
        └─► formatImgAltTooShortReport(details)
```

## 📝 Belangrijkste Concepten

### 1. **SampleItem vs ScopeUrl**
- **SampleItem**: Pagina's die in het rapport komen (steekproef)
  - Kan gecrawld worden
  - Krijgt CrawlerResults
- **ScopeUrl**: Alle URL's in de scope van het onderzoek
  - Kan ook gecrawld worden
  - Kan child URLs hebben (ontdekt via crawling)

### 2. **Test Details = JSON**
```javascript
// In database: details column (text)
"{\"images\":[{\"src\":\"/logo.png\",\"alt\":\"x\"}]}"

// In code: parsed als object
{ images: [{ src: "/logo.png", alt: "x" }] }

// In formatter: converted naar Report
{
  bevinding: "Afbeelding met te kort alt-attribuut",
  details: "De afbeelding \"logo.png\" heeft...",
  advies: "Vervang de alt-tekst \"x\" door..."
}
```

### 3. **Formatters = Optioneel**
- RAW data wordt ALTIJD getoond
- Formatter maakt het **leesbaar** voor mensen
- Niet alle tests hebben een formatter (alleen de belangrijkste)

## 🔧 Tech Stack

```
Frontend:
├─► Next.js 14 (App Router)
├─► React Server Components
├─► TypeScript
├─► Tailwind CSS
└─► Client Components voor interactiviteit

Backend:
├─► Next.js API Routes
├─► Prisma ORM
└─► PostgreSQL

Testing:
├─► Puppeteer (browser automation)
├─► Cheerio (HTML parsing)
└─► Custom test suite (130+ tests)

Formatters:
└─► Pure TypeScript functions (geen dependencies)
```

## 🎨 UI Componenten Hierarchie

```
app/admin/projects/[id]/sample/[sampleId]/page.tsx
└─► Server Component (haalt data op)
    │
    ├─► SampleItemHeader.tsx (Client)
    │
    ├─► TestResults.tsx (Client)
    │   ├─► Table met alle test resultaten
    │   ├─► Expand/collapse per test
    │   ├─► Raw JSON display
    │   └─► Geformatteerde rapportage
    │       ├─► formatMultipleSameLinksReport()
    │       ├─► formatLinkMissingHrefReport()
    │       ├─► formatImgMissingAltReport()
    │       └─► formatImgAltTooShortReport()
    │
    └─► Other tabs...
```

Dit is hoe alles samenwerkt! 🚀