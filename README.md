# Shift2 Auditor

Een webapp voor het uitvoeren en rapporteren van WCAG 2.2 toegankelijkheidsonderzoeken, geïnspireerd op Cardan Auditor.

## Features

### ✅ MVP Features (Geïmplementeerd)

- **Project Management**: Maak en beheer toegankelijkheidsonderzoeken
- **WCAG 2.2 Criteria**: Volledige set van Nederlandse vertalingen
- **Steekproef**: Beheer gestructureerde, willekeurige en PDF steekproefitems
- **Criteria Assessments**: Beoordeel elk WCAG criterium (goedgekeurd/afgekeurd/niet aanwezig/onbekend/niet getest)
- **Bevindingen**: Registreer bevindingen met impact, verantwoordelijkheid en locaties
- **Rapport**: 4-tabs rapportweergave:
  - **Over dit onderzoek**: Samenvatting, feedback, scope, methode
  - **Resultaten**: Tellingen, criteria-tabel, principe-overzicht, statistieken
  - **Bevindingen**: Hiërarchische weergave met filters
  - **Steekproef**: 3 tabs voor verschillende steekproeftypes
- **Print CSS**: Geoptimaliseerd voor PDF export via browser print

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (PostgreSQL ORM)
- **Tailwind CSS**
- **PostgreSQL** (Database)

## Database Schema

### Tabellen

- `projects`: Onderzoek metadata en tekstvelden
- `project_scope_urls`: Scope URLs per onderzoek
- `sample_items`: Steekproefitems (structured/random/pdf)
- `wcag_criteria`: WCAG 2.2 criteria (geseed)
- `criterion_assessments`: Status per criterium per onderzoek
- `findings`: Bevindingen met code, impact, verantwoordelijkheid
- `finding_occurrences`: Koppeling bevinding ↔ steekproefitem

## Setup

### Vereisten

- Node.js 18+
- PostgreSQL 14+
- npm of yarn

### Installatie

1. **Clone de repository**
   ```bash
   git clone https://github.com/BruinBier/Shift2-auditor.git
   cd Shift2-auditor
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Database configureren**

   Maak een PostgreSQL database aan:
   ```bash
   createdb shift2_auditor
   ```

   Kopieer `.env.example` naar `.env`:
   ```bash
   cp .env.example .env
   ```

   Pas de `DATABASE_URL` aan in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/shift2_auditor?schema=public"
   ```

4. **Database schema pushen en seeden**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Development server starten**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Gebruik

### 1. Nieuw Onderzoek Aanmaken

- Ga naar Admin Dashboard (`/admin`)
- Klik op "Nieuw onderzoek"
- Vul basisgegevens in (titel, subject, standaard, niveau)

### 2. Steekproef Toevoegen

Gebruik de API endpoints om steekproefitems toe te voegen:

```bash
curl -X POST http://localhost:3000/api/projects/{projectId}/sample-items \
  -H "Content-Type: application/json" \
  -d '{
    "sampleType": "structured",
    "title": "Homepage",
    "url": "https://mijn.urk.nl/dashboard",
    "orderIndex": 1
  }'
```

### 3. Criteria Beoordelen

Gebruik de API om criteria te beoordelen:

```bash
curl -X PUT http://localhost:3000/api/projects/{projectId}/assessments/{criterionId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "passed",
    "notes": "Alle afbeeldingen hebben alt-tekst"
  }'
```

### 4. Bevindingen Registreren

```bash
curl -X POST http://localhost:3000/api/projects/{projectId}/findings \
  -H "Content-Type: application/json" \
  -d '{
    "findingCode": "SHP-3-F5",
    "wcagCriterionId": "{criterionId}",
    "status": "published",
    "impact": "matig",
    "responsibility": "ontwikkelaar",
    "description": "Logo heeft niet de juiste alt-tekst",
    "advice": "Pas de alt-tekst aan naar: \"Logo Urk\""
  }'
```

### 5. Rapport Bekijken

- Ga naar `/report/{projectId}` om het rapport te bekijken
- Gebruik browser print (Cmd/Ctrl + P) om naar PDF te exporteren

## API Endpoints

### Projects
- `GET /api/projects` - Alle projecten
- `POST /api/projects` - Nieuw project
- `GET /api/projects/{id}` - Project details
- `PATCH /api/projects/{id}` - Project wijzigen

### Scope
- `POST /api/projects/{id}/scope-urls` - Scope URL toevoegen
- `DELETE /api/scope-urls/{id}` - Scope URL verwijderen

### Sample Items
- `GET /api/projects/{id}/sample-items?type={type}` - Sample items ophalen
- `POST /api/projects/{id}/sample-items` - Sample item toevoegen
- `PATCH /api/sample-items/{id}` - Sample item wijzigen
- `DELETE /api/sample-items/{id}` - Sample item verwijderen

### WCAG Criteria
- `GET /api/wcag-criteria` - Alle WCAG 2.2 criteria

### Assessments
- `GET /api/projects/{id}/assessments` - Alle beoordelingen
- `PUT /api/projects/{projectId}/assessments/{criterionId}` - Beoordeling toevoegen/wijzigen

### Findings
- `GET /api/projects/{id}/findings?status=&criterion=&sample=&search=` - Bevindingen met filters
- `POST /api/projects/{id}/findings` - Bevinding toevoegen
- `GET /api/findings/{id}` - Bevinding details
- `PATCH /api/findings/{id}` - Bevinding wijzigen
- `POST /api/findings/{id}/occurrences` - Locatie toevoegen
- `DELETE /api/occurrences/{id}` - Locatie verwijderen

## Project Structuur

```
Shift2-auditor/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin interface
│   ├── report/[id]/      # Rapport pagina's
│   │   └── tabs/         # 4 rapport tabs
│   ├── onderzoeken/      # Publieke onderzoeken lijst
│   └── page.tsx          # Homepage
├── lib/
│   ├── prisma.ts         # Prisma client
│   └── report-calculations.ts  # Rapport logica
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # WCAG 2.2 seed data
└── README.md
```

## Rapport Berekeningen

### Tellingen (Over dit onderzoek)
- **Pagina's onderzocht**: Count van sample_items (excl. PDF)
- **Succescriteria**: passed / totalAssessed
- **Problemen**: Count van findings (status = open/published)

### Resultaten per criterium
- Lijst alle criteria met status
- Count van bevindingen per criterium

### Resultaten per principe
- Group by principe (Perceivable, Operable, Understandable, Robust)
- Tellingen per niveau (A, AA) en totaal

### Statistieken
- Bevindingen per status (open/published/resolved)
- Impact verdeling (kritiek/matig/klein)
- Verantwoordelijkheid (ontwikkelaar/redacteur/ontwerper)

## Filters (Bevindingen tab)

- **Zoeken**: Full-text search in description/advice/findingCode
- **Status**: Filter op open/published/resolved
- **Impact**: Filter op kritiek/matig/klein/onbekend
- **Verantwoordelijkheid**: Filter op ontwikkelaar/redacteur/ontwerper/onbekend
- **Alleen gepubliceerd**: Toggle voor alleen published findings

## Toekomstige Features (Not in MVP)

- [ ] Collaboratie/review flows
- [ ] Versiebeheer rapporten
- [ ] DOCX export
- [ ] Authentication (SSO)
- [ ] Teams & permissies
- [ ] Uitgebreide admin UI voor alle entiteiten
- [ ] Dashboard met grafieken
- [ ] Automatische WCAG test integraties

## Development

```bash
# Development server
npm run dev

# Database studio (GUI)
npm run db:studio

# Build for production
npm run build
npm start

# Linting
npm run lint
```

## License

MIT

## Credits

Ontwikkeld door Shift2, geïnspireerd op Cardan Auditor workflow.
