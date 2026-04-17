# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Shift2 Auditor is a web application for conducting and reporting WCAG 2.2 accessibility audits. Built with Next.js 14 App Router, TypeScript, Prisma ORM with PostgreSQL, and Tailwind CSS.

## Essential Commands

```bash
# Development
npm run dev                 # Start development server (localhost:3000)
npm run build              # Production build
npm run lint               # Run ESLint

# Database
npx prisma migrate deploy  # Apply migrations (user must run manually)
npx prisma generate        # Generate Prisma client (after stopping dev server on Windows)
npm run db:studio          # Open Prisma Studio GUI
npm run db:seed            # Seed WCAG 2.2 criteria and research types

# Backup & Restore
npm run backup             # Export all data to JSON
npm run restore            # Import data from JSON backup
```

## WCAG-checklists (referentiemateriaal)

Bij het uitvoeren van WCAG-audits: gebruik de checklists in `wcag-checklists/`. Start met `wcag-checklists/Project_Instructie_WCAG_Audit.md` voor de werkwijze en het bevindingformat. Per SC is een `Checklist_SC_X_X_X.md` beschikbaar, voor sommige SC's ook `Richtlijnen_Grensgevallen_SC_X_X_X.md`. Gebruik `Voorbeelden_Bevindingen.md` voor schrijfstijl. Zie `wcag-checklists/README.md` voor het volledige overzicht.

## Audit CLI (for Claude Code use)

When the user asks you to audit a website and log findings, use `npm run cli` instead of the UI. The CLI (`scripts/audit-cli.ts`) calls the Next.js API, so the dev server must be running. All commands output JSON to stdout so you can parse results and chain calls.

```bash
# Read
npm run cli -- list-projects
npm run cli -- get-project <projectId>            # scope URLs, sample items, findings, assessments
npm run cli -- list-criteria                       # all WCAG criterion IDs + codes
npm run cli -- search-quick-findings <keyword>     # reuse finding templates

# Write
npm run cli -- create-sample-item <projectId> --title="Homepage" --url=https://... --type=structured
npm run cli -- create-finding <projectId> --criterion=<criterionId> --description="..." --advice="..." --impact=matig --sample-items=<sampleItemId1>,<sampleItemId2>
npm run cli -- create-finding-from-quick <projectId> <quickFindingId> --sample-items=<sampleItemId>
npm run cli -- set-assessment <projectId> --criterion=<criterionId> --status=failed
```

**Typical flow for "check site X, log issues":**
1. `list-projects` → find the target project
2. `get-project <id>` → read existing context (don't duplicate findings)
3. `create-sample-item` for each page you review → get `sampleItemId`s
4. `create-finding` with the `sampleItemId`s → auto-sets criterion assessment to `failed`

**Valid enum values:**
- `--impact`: `klein` | `matig` | `serieus` | `kritiek` | `onbekend`
- `--responsibility`: `redacteur` | `ontwikkelaar` | `ontwerper` | `onbekend`
- `--status` (finding): `open` | `published` | `resolved` (default `open`)
- `--status` (assessment): `passed` | `failed` | `not_present` | `unknown` | `not_tested`
- `--type` (sample): `structured` | `random` | `pdf`

**Notes:**
- Finding codes are auto-generated as `B001`, `B002`, ... per project — don't pass one.
- Linking uses `SampleItem + FindingOccurrence` (the manual/UI path), not `ScopeUrl + FindingUrl` (crawler path).
- Creating a finding with `status=open` auto-upserts the criterion's assessment to `failed` — this is existing API behavior.
- Override base URL if needed: `AUDIT_CLI_BASE_URL=http://localhost:3001 npm run cli -- ...`

## Database & Prisma Workflow

### Critical User Preferences
- **User executes all migrations manually** - Never run `npx prisma migrate dev` or `npx prisma migrate deploy` automatically
- **Use production commands** - Always suggest `npx prisma migrate deploy`, NOT `npx prisma migrate dev`
- **Manual migration creation** - When schema changes:
  1. Create directory: `prisma/migrations/YYYYMMDD_description/`
  2. Create `migration.sql` with SQL changes
  3. User will run: `npx prisma migrate deploy`
  4. User will run: `npx prisma generate` (after stopping dev server)

### Windows-Specific Issue
On Windows, `npx prisma generate` fails with EPERM error if dev server is running:
```bash
# Solution: Stop server → Generate → Restart server
Ctrl+C
npx prisma generate
npm run dev
```

### ⚠️ IMPORTANT: Schema Change Workflow (for Claude Code)

When the user asks you to modify `prisma/schema.prisma`:

1. **FIRST** - Ask the user: "Is the dev server running? If yes, stop it with Ctrl+C before I make changes"
2. **THEN** - Make schema changes and create migration files
3. **FINALLY** - Instruct user to run:
   ```bash
   npm run schema:update
   npm run dev
   ```

**DO NOT:**
- Run `npx prisma generate` yourself (will fail if dev server is running)
- Assume dev server is stopped
- Skip asking about dev server status

**Example response:**
> "I'll add the `status` field to the Project model. First, please stop the dev server (Ctrl+C in the terminal where npm run dev is running). Let me know when it's stopped and I'll make the changes."

## Architecture

### Core Data Models

**Project Hierarchy:**
- `Project` → Contains all project metadata and rich text fields for report
- `ProjectScopeUrl` → URLs in scope (can have parent/child relationship via `parentUrlId`)
- `SampleItem` → Sample pages (types: structured/random/pdf)
- `CriterionAssessment` → Status per WCAG criterion per project
- `Finding` → Issues discovered with code, impact, responsibility
- `FindingOccurrence` → Links findings to specific sample items
- `CrawlerResult` → Test results from automated crawler (linked to ScopeUrl OR SampleItem)

**Supporting Models:**
- `WCAGCriterion` → WCAG 2.2 criteria (seeded, read-only)
- `QuickFinding` → Reusable finding templates
- `ResearchType` → Research type definitions with linked WCAG criteria
- `Opdrachtgever` → Client organizations
- `ClientProject` → Client project groupings

### Application Structure

```
app/
├── admin/                      # Admin interface
│   ├── projects/[id]/          # Project editing
│   │   ├── page.tsx            # Main project page with tabs
│   │   ├── ProjectAdminTabs.tsx # Tab navigation component
│   │   ├── tabs/               # Tab content components
│   │   │   ├── SampleItems.tsx
│   │   │   ├── FindingsManagement.tsx
│   │   │   └── ...
│   │   ├── scope/[scopeId]/    # Scope URL detail pages
│   │   ├── sample/[sampleId]/  # Sample item detail pages
│   │   ├── findings/[findingId]/ # Finding detail pages
│   │   └── crawler-overview/   # Crawler results overview
│   └── bevindingen/            # Quick findings library
├── report/[id]/                # Public report view
│   ├── page.tsx
│   ├── ReportTabs.tsx
│   └── tabs/                   # 4 report tabs
│       ├── AboutResearch.tsx
│       ├── Results.tsx
│       ├── Findings.tsx
│       └── Sample.tsx
├── onderzoeken/                # Projects list view
└── api/                        # API routes (Next.js route handlers)
```

### Key Subsystems

**Crawler System** (`lib/crawler/`)
- `tests.ts` - 130+ accessibility test functions using Cheerio HTML parsing
- `test-runner.ts` - Executes all tests and aggregates results
- `crawler-engine.ts` - Orchestrates crawling for entire projects
- `browser-crawler.ts` - Puppeteer-based browser automation
- `discovery.ts` - Link discovery for recursive crawling

Tests can be run on:
- Individual scope URLs via hamburger menu
- Sample items via hamburger menu
- Entire projects via crawler overview page

**Report Calculations** (`lib/report-calculations.ts`)
- Aggregates statistics from assessments and findings
- Calculates pass/fail counts per principle and level
- Groups results by WCAG principle (Perceivable, Operable, Understandable, Robust)
- Used by report tabs for displaying metrics

**AI Integration**
- OpenAI used for generating management summaries and researcher feedback
- Endpoints: `/api/projects/[id]/generate-summary` and `/api/projects/[id]/generate-feedback`

### State Management Pattern

This app uses **server-side rendering** with Next.js Server Components:
- Most pages are Server Components that fetch data directly
- Client Components (`'use client'`) used only for:
  - Forms and interactive UI
  - Modal dialogs
  - Tabs with client-side state
  - Real-time updates via `router.refresh()`

No global state management library - uses Next.js patterns:
- Server Actions for mutations (via API routes)
- `router.refresh()` to revalidate server components after mutations

### UI Patterns

**Modal Pattern:**
- Most modals use `showModal` state + conditional rendering
- Modals typically include:
  - Close on Escape key
  - Click outside to close
  - Form submission with router.refresh()

**Tab Pattern:**
- URL query params for tab state (`?tab=steekproef`)
- Consistent styling with border-bottom highlighting

**Markdown/Rich Text:**
- `md-editor-rt` for markdown editing in forms
- `marked` library for rendering markdown to HTML
- TipTap editor for WYSIWYG in some fields

## Important Implementation Details

### Sample Items vs Scope URLs
- **Scope URLs** - URLs tested during research (can be crawled, can have child URLs discovered)
- **Sample Items** - Representative pages documented in report (structured/random/pdf types)
- Both can have crawler results attached
- Findings link to sample items via `FindingOccurrence`, not directly to scope URLs

### Crawler Results Storage
`CrawlerResult` has EITHER `scopeUrlId` OR `sampleItemId` (both nullable, one must be set):
- Results from scope crawling → `scopeUrlId`
- Results from sample item testing → `sampleItemId`

### Finding Management
Findings can be created three ways:
1. Manual creation via UI
2. From crawler results (with auto-mapping to QuickFindings if available)
3. Auto-creation endpoint that creates findings for all positive crawler tests

Finding codes follow pattern: `{PROJECT_CODE}-{VERSION}-F{NUMBER}` (e.g., "SHP-3-F5")

### Print/PDF Export
Report pages include print-specific CSS:
- Hidden navigation/buttons in print mode
- Page break controls
- Optimized typography for PDF export via browser print (Cmd/Ctrl + P)

## Common Gotchas

1. **Prisma Client Generation** - Must stop dev server on Windows before running `npx prisma generate`

2. **Date Handling** - Always use `new Date()` for timestamps, format with `toLocaleDateString('nl-NL')`

3. **Nullable URLs** - Sample items can have null URLs (for PDF type), check before crawling

4. **Assessment Status Enum** - Uses snake_case in DB: `not_present`, `not_tested`, NOT camelCase

5. **Finding Impact Values** - Dutch values: `klein`, `matig`, `serieus`, `kritiek`, `onbekend`

6. **Router Refresh** - After API mutations, always call `router.refresh()` to update server components

7. **Markdown Rendering** - Use `marked.parse()` but check if content is already HTML with regex test first

## Testing Approach

No automated tests in codebase currently. Testing is manual:
- Use Prisma Studio to inspect database
- Use browser DevTools for debugging
- Use `/api/*` endpoints directly with curl/Postman for API testing

## Dutch Language

All user-facing text is in Dutch (Nederlands):
- Database enums use Dutch values
- UI labels and messages in Dutch
- Report content in Dutch
- Comments and code can be English or Dutch