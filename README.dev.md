# Shift2 Auditor — Developer Guide

Aanvullende documentatie voor ontwikkelaars. De algemene projectbeschrijving en gebruikersinstructies staan in [README.md](README.md).

## Snelle start

```bash
npm install
cp .env.example .env          # pas DATABASE_URL aan
npx prisma migrate deploy     # migraties toepassen
npx prisma generate           # Prisma client genereren
npm run db:seed               # WCAG 2.2 criteria + research types seeden
npm run dev                   # http://localhost:3000
```

## Scripts

| Script | Doel |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Productie build + start |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:seed` | WCAG criteria + research types seeden |
| `npm run db:check` | Database-connectie testen |
| `npm run schema:update` | `prisma migrate deploy` + `prisma generate` |
| `npm run backup` | Alle data naar JSON exporteren |
| `npm run restore` | Data uit JSON-backup importeren |

## Schema-wijzigingen (workflow)

1. Stop de dev server (`Ctrl+C`) — op Windows faalt `prisma generate` anders met EPERM.
2. Pas `prisma/schema.prisma` aan.
3. Maak handmatig een migratie aan:
   ```
   prisma/migrations/YYYYMMDD_korte_beschrijving/migration.sql
   ```
4. Draai:
   ```bash
   npm run schema:update
   npm run dev
   ```

Gebruik **nooit** `prisma migrate dev` — dit project gebruikt alleen `migrate deploy`.

## Architectuur

### App Router structuur

```
app/
├── admin/                 # Admin interface (project management)
│   ├── projects/[id]/     # Project editor met tabs
│   └── bevindingen/       # Quick findings library
├── report/[id]/           # Publiek rapport (4 tabs)
├── onderzoeken/           # Projectenlijst
└── api/                   # Route handlers
```

### Datamodel (hoofdlijnen)

- `Project` — metadata + rich text voor rapport
- `ProjectScopeUrl` — getest binnen scope (kan hiërarchisch zijn)
- `SampleItem` — representatieve pagina (`structured` / `random` / `pdf`)
- `WCAGCriterion` — WCAG 2.2 criteria (seed, read-only)
- `CriterionAssessment` — status per criterium per project
- `Finding` + `FindingOccurrence` — bevinding + koppeling aan sample items
- `CrawlerResult` — óf `scopeUrlId` óf `sampleItemId` (één van beide verplicht)

### State management

Server Components + API routes. Geen globale store. Na mutaties: `router.refresh()`.

### Crawler (`lib/crawler/`)

- `tests.ts` — 130+ Cheerio-gebaseerde accessibility tests
- `test-runner.ts` — aggregeert testresultaten
- `crawler-engine.ts` — orkestreert project-brede crawl
- `browser-crawler.ts` — Puppeteer automation
- `discovery.ts` — link discovery

Te draaien op: losse scope URL, sample item, of heel project (crawler overview).

## Conventies

### Enums & waarden

- Assessment status (DB, snake_case): `passed`, `failed`, `not_present`, `not_tested`, `unknown`
- Finding impact (Nederlands): `klein`, `matig`, `serieus`, `kritiek`, `onbekend`
- Finding code format: `{PROJECT_CODE}-{VERSION}-F{NUMBER}` (bv. `SHP-3-F5`)

### Taal

Alle UI + rapport content is Nederlands. Code/comments mogen Engels of Nederlands zijn.

### Dates

`new Date()` voor timestamps, weergave met `toLocaleDateString('nl-NL')`.

### Markdown

`md-editor-rt` voor input, `marked.parse()` voor rendering. Test eerst of content al HTML is voordat je `marked.parse()` aanroept.

### Bevinding-beschrijvingen (stijl)

- Begin **niet** met de URL — begin met "Op de pagina..." of "In de footer..."
- Geen aparte HTML-codeblokken in `description`; elementen alleen inline noemen
- Geen em-dash (—) of en-dash (–); splits in losse zinnen of gebruik een komma

## Gotchas

1. **Prisma generate op Windows** — dev server moet gestopt zijn
2. **Sample items zonder URL** — PDF-type heeft nullable URL, check voor crawl
3. **CrawlerResult** — precies één van `scopeUrlId` / `sampleItemId` is gezet
4. **Router refresh** — na elke mutatie aanroepen om server components te herladen

## Testen

Geen geautomatiseerde tests. Handmatig via:

- Prisma Studio (`npm run db:studio`) voor DB-inspectie
- Browser DevTools
- Directe API-calls met curl / Postman

## AI endpoints

- `POST /api/projects/[id]/generate-summary` — managementsamenvatting via OpenAI
- `POST /api/projects/[id]/generate-feedback` — onderzoeker-feedback via OpenAI

`OPENAI_API_KEY` moet in `.env` staan.

## Export / PDF

Rapport gebruikt print-specifieke CSS. Voor PDF: browser print (`Ctrl/Cmd + P`). Voor DOCX: zie `scripts/` en `docxtemplater` integratie.
