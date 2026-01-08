# Rapport Export naar Standalone HTML

Deze guide legt uit hoe je rapporten exporteert naar standalone HTML bestanden die je kunt uploaden naar rapporten.shift2.nl

## Quick Start

### 1. Installeer export dependencies

```bash
npm install
```

### 2. Start de development server

```bash
npm run dev
```

Laat deze draaien in een aparte terminal!

### 3. Export een rapport

In een nieuwe terminal:

```bash
npm run export <project-id>
```

**Voorbeeld:**
```bash
npm run export b38444c8-a9ac-4beb-a9d5-b918cc0e845b
```

### 4. Vind je export

Het script maakt:
- **Map:** `exports/b38444c8-a9ac-4beb-a9d5-b918cc0e845b/`
- **Zip:** `exports/b38444c8-a9ac-4beb-a9d5-b918cc0e845b.zip`

## Wat wordt er geëxporteerd?

```
b38444c8-a9ac-4beb-a9d5-b918cc0e845b/
├── index.html                    # Hoofdpagina (= over-dit-onderzoek)
├── over-dit-onderzoek.html      # Tab 1
├── resultaten.html              # Tab 2
├── bevindingen.html             # Tab 3
├── steekproef.html              # Tab 4
├── shift2-logo.svg              # Logo
└── fonts/                       # Alle fonts
    ├── Neulis sans/
    └── Brockmann Roman Desktop/
```

## Upload naar Server

### Via FTP/SFTP:

```bash
# Unzip eerst
unzip exports/b38444c8-a9ac-4beb-a9d5-b918cc0e845b.zip -d mijn-rapport

# Upload via FTP naar:
# rapporten.shift2.nl/b38444c8-a9ac-4beb-a9d5-b918cc0e845b/
```

### Resultaat:

```
https://rapporten.shift2.nl/b38444c8-a9ac-4beb-a9d5-b918cc0e845b/
```

## Navigatie in de Exports

Elke HTML pagina heeft een navigatiemenu rechtsboven waarmee je tussen tabs kunt schakelen:
- Over dit onderzoek
- Resultaten
- Bevindingen
- Steekproef

Bij printen (PDF) verdwijnt dit menu automatisch.

## Troubleshooting

**"Server not running"**
→ Zorg dat `npm run dev` draait op http://localhost:3001

**"Fonts niet zichtbaar"**
→ Check of `public/fonts/` map bestaat met alle font bestanden

**"Logo niet zichtbaar"**
→ Check of `public/shift2-logo.svg` bestaat

**"Export hangt"**
→ Druk CTRL+C en probeer opnieuw, soms moet Puppeteer browser opnieuw starten

## Tips

- **Meerdere rapporten exporteren:**
  ```bash
  npm run export project-id-1
  npm run export project-id-2
  npm run export project-id-3
  ```

- **Custom output directory:**
  ```bash
  node scripts/export-report.js <project-id> /path/to/output
  ```

- **Project ID vinden:**
  Kijk in de URL van je rapport: `http://localhost:3001/report/[dit-is-de-project-id]`

## Automatisering voor Later

Je kunt dit later automatiseren met een UI button in de admin:

```typescript
// Admin interface → "Export naar HTML" knop
// Genereert zip bestand
// Download automatisch
```

Dit is nu handmatig via command line, maar kan later in de UI worden gebouwd.
