# Shift2 Auditor Data Backup

**Export Date:** 2026-04-28T14:08:17.881Z
**Backup Name:** backup-2026-04-28-14-08-17

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (8 records)
- projects.csv (16 records)
- project_notes.csv (0 records)
- findings.csv (239 records)
- finding_urls.csv (0 records)
- finding_occurrences.csv (251 records)
- sample_items.csv (152 records)
- project_scope_urls.csv (296 records)
- crawler_results.csv (35240 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (413 records)
- quick_findings.csv (117 records)
- teams.csv (1 records)
- client_projects.csv (12 records)

## Import Instructions

**IMPORTANT: Always seed base data first!**

To restore this backup:

```bash
# 1. FIRST: Seed base data (WCAG criteria + research types)
npm run db:seed

# 2. THEN: Restore your project data
npm run restore backups/backup-2026-04-28-14-08-17
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
