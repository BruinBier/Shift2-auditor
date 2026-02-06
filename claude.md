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