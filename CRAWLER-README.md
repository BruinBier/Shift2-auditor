# Shift2 Accessibility Crawler System

Een complete accessibility crawler engine met 42+ geautomatiseerde tests voor WCAG compliance.

## 📋 Overzicht

Het crawler systeem bestaat uit:
- **42 accessibility tests** (uitbreidbaar naar 130+)
- **Automatische site discovery** - crawl hele websites
- **Test runner** - voert alle tests parallel uit
- **Database integratie** - slaat resultaten op per URL
- **REST API endpoints** - voor integratie met de UI

## 🏗️ Architectuur

```
lib/crawler/
├── tests.ts           # 42 accessibility test functies
├── test-runner.ts     # Test uitvoering & aggregatie
├── discovery.ts       # URL discovery & site crawling
├── crawler-engine.ts  # Hoofd crawler orchestratie
└── index.ts          # Exports

app/api/projects/[id]/
├── crawler/
│   ├── route.ts           # POST: crawl project, GET: summary
│   └── discover/route.ts  # POST: discover URLs
└── scope-urls/[urlId]/
    └── crawler/route.ts   # POST: crawl single URL, GET: results
```

## 🧪 Tests (42 geïmplementeerd)

### Kritieke Tests (WCAG Level A)
- `#48` LangAttributeMissingTest - Pagina zonder lang-attribuut
- `#50` TitleMissingTest - Pagina zonder title
- `#51` TitleEmptyTest - Lege page title
- `#64` ImgMissingAltTest - Afbeeldingen zonder alt-attribuut
- `#30` FormMissingLabelsTest - Formulieren zonder labels
- `#57` HeadingsAtLeastOneH1Test - Geen H1 heading
- `#7` IframeMissingAccessibleNameTest - Iframe zonder title
- `#23` LinkWithoutTextTest - Links zonder tekst
- `#24` EmptyLinkTest - Lege links
- `#26` TableWithoutHeadersTest - Tabellen zonder headers
- `#32` InputMissingLabelTest - Input velden zonder label
- `#33` ButtonEmptyTest - Lege buttons
- `#34` HeadingEmptyTest - Lege headings

### Overige Tests
- `#1-#22` Video/audio/iframe detectie tests
- `#27-#28` Lijst detectie (informational)
- `#35` HeadingSkipLevelTest - Heading hiërarchie fouten
- `#36` SkipLinkTest - Skip link detectie
- `#37` AriaLandmarksTest - ARIA landmarks

## 🚀 Gebruik

### Via API Endpoints

#### 1. Crawl een enkele URL
```bash
POST /api/projects/{projectId}/scope-urls/{urlId}/crawler

Response:
{
  "success": true,
  "testsRun": 42,
  "testsFound": 11,
  "crawledAt": "2025-02-01T..."
}
```

#### 2. Crawl een heel project
```bash
POST /api/projects/{projectId}/crawler
Content-Type: application/json

{
  "maxDepth": 2,
  "maxPages": 100,
  "delayMs": 1000
}

Response:
{
  "success": true,
  "totalUrls": 25,
  "urlsProcessed": 25,
  "totalIssuesFound": 143
}
```

#### 3. Discover URLs van een website
```bash
POST /api/projects/{projectId}/crawler/discover
Content-Type: application/json

{
  "startUrl": "https://example.com",
  "maxDepth": 2,
  "maxPages": 100
}

Response:
{
  "success": true,
  "addedCount": 47
}
```

#### 4. Haal crawler summary op
```bash
GET /api/projects/{projectId}/crawler

Response:
{
  "summary": {
    "totalUrls": 47,
    "crawledUrls": 25,
    "totalIssues": 143,
    "criticalIssues": 34,
    "byTest": {
      "ImgMissingAltTest": 12,
      "LinkWithoutTextTest": 8,
      ...
    }
  },
  "recentRuns": [...]
}
```

### Via Code

```typescript
import { runTests } from '@/lib/crawler/test-runner';
import { crawlProject, discoverAndAddUrls } from '@/lib/crawler/crawler-engine';

// Run tests op HTML
const html = await fetch('https://example.com').then(r => r.text());
const results = await runTests(html);

console.log(`Found ${results.testsFound} issues`);
console.log(`Critical: ${results.summary.critical}`);

// Crawl een project
const result = await crawlProject(projectId, {
  maxDepth: 2,
  maxPages: 100,
  delayMs: 1000,
});

// Discover URLs
const addedCount = await discoverAndAddUrls(projectId, 'https://example.com');
```

## 🧪 Testen

Run het test script:

```bash
npx tsx scripts/test-crawler.ts
```

Dit test het systeem met een sample HTML pagina met bekende issues.

## 📊 Database Schema

### CrawlerResult
Slaat individuele test resultaten op per URL:
```prisma
model CrawlerResult {
  id            String
  scopeUrlId    String
  testId        String
  testName      String
  found         Boolean
  count         Int
  details       String  // JSON met test-specifieke details
  createdAt     DateTime
}
```

### CrawlerRun
Houdt hele crawler sessies bij:
```prisma
model CrawlerRun {
  id              String
  projectId       String
  status          String     // running, completed, failed
  totalUrls       Int
  urlsProcessed   Int
  totalIssues     Int
  criticalIssues  Int
  startedAt       DateTime
  completedAt     DateTime?
}
```

## 🔧 Configuratie

```typescript
interface CrawlerConfig {
  maxDepth?: number;    // Default: 2
  maxPages?: number;    // Default: 100
  userAgent?: string;   // Default: 'Shift2-Auditor/1.0'
  delayMs?: number;     // Default: 1000 (1 second)
}
```

## 📈 Uitbreiding naar 130 Tests

Het huidige systeem heeft 42 tests. Om uit te breiden naar 130:

1. Voeg nieuwe test functies toe aan `lib/crawler/tests.ts`:
```typescript
export function testNewAccessibilityIssue(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  // Test logic here
  return {
    testId: '38',
    testName: 'NewAccessibilityTest',
    found: issueFound,
    count: issueCount,
    details: { ... }
  };
}
```

2. Voeg toe aan `runAllMVPTests()`:
```typescript
export function runAllMVPTests(html: string): CrawlerTestResult[] {
  return [
    // ... existing tests
    testNewAccessibilityIssue(html),
  ];
}
```

## 💡 Volgende Stappen

1. **Meer tests toevoegen** - uitbreiden naar 130 tests
2. **UI bouwen** - crawler dashboard in Next.js app
3. **Rapportage** - automatisch findings genereren vanuit crawler resultaten
4. **Screenshots** - Puppeteer integratie voor visual testing
5. **Color contrast** - Puppeteer voor computed styles
6. **Keyboard navigation** - geautomatiseerde keyboard tests

## 📝 Voorbeeld Output

```
🚀 Testing Crawler System
============================================================
✓ Total tests run: 42
✗ Issues found: 29
✓ Tests passed: 13

📊 Summary by severity:
  🔴 Critical: 11
  🟠 High: 0
  🟡 Medium: 11
  🔵 Low: 0
  ℹ️  Informational: 7
```

## 🎯 Features

- ✅ 42 accessibility tests
- ✅ Site discovery & crawling
- ✅ Database persistentie
- ✅ REST API
- ✅ TypeScript
- ✅ Cheerio HTML parsing
- ✅ WCAG 2.2 compliance
- ✅ Test aggregatie & rapportage

---

**Gemaakt door:** Claude Code & Ellen
**Versie:** 1.0.0
**Datum:** 1 februari 2025