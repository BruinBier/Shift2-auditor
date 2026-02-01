# Backup & Restore System

## Overzicht

Het Shift2 Auditor backup systeem beschermt je data door automatische CSV exports die veilig in git kunnen worden opgeslagen.

## 🚨 BELANGRIJK: Maak ALTIJD een backup voordat je database wijzigingen doet!

```bash
npm run backup
git add backups/
git commit -m "Backup before migration"
```

## Snelle Start

### 1. Backup maken

```bash
npm run backup
```

Dit maakt een backup in `backups/backup-YYYY-MM-DD/` met:
- Alle projecten
- Alle bevindingen
- Alle crawler resultaten
- Alle opdrachtgevers
- Alle QuickFinding templates
- ... en meer

### 2. Backup opslaan in git

```bash
git add backups/
git commit -m "Daily backup"
git push
```

### 3. Backup terugzetten (restore)

```bash
npm run restore backups/backup-2026-02-01
```

## Waarom dit systeem?

### Wat er mis kan gaan:
- ❌ `npx prisma migrate` kan data verliezen
- ❌ `npx prisma db push` kan tabellen leegmaken
- ❌ Schema wijzigingen kunnen misgaan
- ❌ Per ongeluk verkeerde data verwijderen

### Hoe dit systeem helpt:
- ✅ CSV backups zijn **human-readable**
- ✅ Werkt perfect met **git version control**
- ✅ **Klein genoeg** voor git (text compression)
- ✅ **Makkelijk te inspecteren** in Excel/Sheets
- ✅ **Volledig automatisch** te herstellen

## Best Practices

### 📅 Regelmatig Backuppen

**Dagelijks (geautomatiseerd):**
```bash
# In je .bashrc of .zshrc
alias shift2-backup='cd /path/to/shift2-auditor && npm run backup && git add backups/ && git commit -m "Daily backup" && git push'
```

**Voor elke migration:**
```bash
npm run backup
git add backups/ && git commit -m "Backup before migration"
npx prisma migrate dev --name your_migration
```

**Wekelijks:**
```bash
# Maandag ochtend voor je begint
npm run backup
git add backups/
git commit -m "Weekly backup $(date +%Y-%m-%d)"
git push
```

### 🛡️ Bescherm tegen Data Verlies

**Voor ELKE database operatie:**

1. ✅ Maak backup
2. ✅ Commit naar git
3. ✅ Push naar remote
4. ✅ DAN pas migration/push uitvoeren

```bash
# SAFE workflow
npm run backup
git add backups/ && git commit -m "Pre-migration backup" && git push
npx prisma migrate dev --name add_new_field

# UNSAFE (NIET DOEN)
npx prisma migrate dev --name add_new_field  # ❌ Geen backup!
```

## Wat wordt ge-export?

### Complete Data Export

Elke backup bevat ALLE data in CSV formaat:

| Bestand | Inhoud |
|---------|--------|
| `opdrachtgevers.csv` | Klant informatie |
| `projects.csv` | Alle projecten |
| `project_notes.csv` | Project notities |
| `findings.csv` | Alle bevindingen |
| `finding_urls.csv` | Gekoppelde URLs aan bevindingen |
| `finding_occurrences.csv` | Bevinding locaties (legacy) |
| `sample_items.csv` | Steekproef items |
| `project_scope_urls.csv` | Scope URLs |
| `crawler_results.csv` | Crawler test resultaten |
| `crawler_runs.csv` | Crawler sessies |
| `criterion_assessments.csv` | WCAG criterium beoordelingen |
| `quick_findings.csv` | Bevinding templates |
| `teams.csv` | Team informatie |
| `client_projects.csv` | Klant-project koppelingen |
| `metadata.json` | Export informatie |
| `README.md` | Backup documentatie |

## Hoe het werkt

### Export Proces

1. **Connectie** - Maakt verbinding met PostgreSQL database
2. **Query** - Haalt alle records op van elke tabel
3. **CSV Conversie** - Converteert naar CSV formaat
   - Escaped quotes
   - Proper comma handling
   - NULL values correct afgehandeld
4. **Bestand Schrijven** - Schrijft naar `backups/backup-YYYY-MM-DD/`
5. **Metadata** - Maakt metadata.json met export info
6. **README** - Genereert backup-specifieke README

### Import Proces

1. **Validatie** - Checkt of backup directory bestaat
2. **Metadata** - Leest export informatie
3. **CSV Parsing** - Parset CSV bestanden
   - Correct handling van quotes
   - Date/number conversie
   - NULL values herstellen
4. **Ordered Import** - Importeert in correcte volgorde (foreign keys!)
   - Teams, Opdrachtgevers eerst
   - Dan Projects
   - Dan Findings
   - Dan Crawler Results
5. **Duplicate Handling** - Skipt bestaande records
6. **Error Handling** - Graceful error afhandeling

## Praktische Voorbeelden

### Scenario 1: Voor een Migration

```bash
# 1. Check huidige status
git status

# 2. Maak backup
npm run backup

# 3. Bekijk wat er gebackup is
ls -la backups/backup-$(date +%Y-%m-%d)/

# 4. Commit backup
git add backups/
git commit -m "Backup before adding new feature"
git push

# 5. Nu is het veilig om migration te doen
npx prisma migrate dev --name add_new_feature

# 6. Test of alles werkt
npm run dev

# 7. Als er iets mis gaat, restore:
npm run restore backups/backup-$(date +%Y-%m-%d)
```

### Scenario 2: Data Verlies Recovery

```bash
# 1. Vind laatste backup
ls -la backups/

# 2. Bekijk metadata
cat backups/backup-2026-02-01/metadata.json

# 3. Restore
npm run restore backups/backup-2026-02-01

# 4. Verify
npm run dev
# Check in browser of data er is
```

### Scenario 3: Data Migratie naar Nieuwe Machine

```bash
# Op oude machine:
npm run backup
git add backups/ && git commit -m "Final backup" && git push

# Op nieuwe machine:
git clone your-repo
cd shift2-auditor
npm install
npm run db:seed  # Seed WCAG criteria eerst
npm run restore backups/backup-2026-02-01
```

## Troubleshooting

### ❌ "Foreign key constraint violation"

**Probleem:** Import faalt omdat foreign keys niet kloppen

**Oplossing:**
```bash
# 1. Seed de basis data eerst
npm run db:seed

# 2. Dan restore
npm run restore backups/backup-YYYY-MM-DD
```

### ❌ "Backup directory not found"

**Probleem:** Verkeerde pad opgegeven

**Oplossing:**
```bash
# Check welke backups er zijn
ls backups/

# Gebruik volledig pad
npm run restore backups/backup-2026-02-01
```

### ❌ "Records skipped during import"

**Probleem:** Sommige records bestaan al

**Oplossing:** Dit is normaal! Het systeem skipt duplicates automatisch.

### ❌ "Export is very slow"

**Probleem:** Veel data (veel crawler results)

**Oplossing:**
```bash
# Normale export duurt 30-60 seconden voor grote databases
# Dit is normaal!
```

## Geavanceerd Gebruik

### Selectieve Restore

Je kunt handmatig specifieke tabellen restoren:

```bash
# Alleen projecten herstellen
npm run restore backups/backup-2026-02-01
# Dan handmatig alleen projects.csv importeren
```

### Backup Cleanup

Oude backups opruimen (bewaar laatste 10):

```bash
# List backups (oudste eerst)
ls -t backups/ | tail -n +11

# Verwijder oude backups
ls -t backups/ | tail -n +11 | xargs -I {} rm -rf backups/{}
```

### Automated Backups met Cron

```bash
# Elke dag om 3:00 AM
0 3 * * * cd /path/to/shift2-auditor && npm run backup && git add backups/ && git commit -m "Automated daily backup" && git push
```

## Git Integratie

### .gitignore

Backups worden NIET genegeerd (bewust keuze):
```gitignore
# backups/ is NIET in .gitignore!
# Dit betekent backups worden gecommit
```

### Pre-commit Hook (Optioneel)

Automatisch backup bij elke commit:

`.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run backup
git add backups/
```

```bash
chmod +x .git/hooks/pre-commit
```

## Veelgestelde Vragen

**Q: Hoe groot worden backups?**
A: Typisch 1-5MB, afhankelijk van aantal projecten. Text files comprimeren goed in git.

**Q: Kan ik backups in .gitignore zetten?**
A: NEEN! Dan verlies je het hele doel. Backups MOETEN in git.

**Q: Hoe vaak moet ik backuppen?**
A: Minimaal voor elke database migration. Ideaal: dagelijks.

**Q: Wat als ik vergeet te backuppen?**
A: Dan heb je geen recovery option. Begin met backuppen NU!

**Q: Kan ik backups delen met teamleden?**
A: Ja! Via git krijgt iedereen automatisch alle backups.

**Q: Werkt dit met PostgreSQL versie X?**
A: Ja, het gebruikt Prisma dus versie-agnostisch.

## Emergency Checklist

Als je data verloren is:

- [ ] STOP METEEN met werken in de applicatie
- [ ] Commit NIETS meer
- [ ] Find laatste backup: `ls backups/`
- [ ] Check metadata: `cat backups/backup-*/metadata.json`
- [ ] Restore: `npm run restore backups/backup-YYYY-MM-DD`
- [ ] Verify: Start app en check data
- [ ] Maak METEEN een nieuwe backup

## Support

Voor vragen of problemen:
1. Check deze documentatie
2. Check `backups/README.md`
3. Check backup-specifieke README in backup folder
4. Contact development team

---

**Remember: Een backup die je niet hebt gemaakt, kan je niet redden!** 🛡️