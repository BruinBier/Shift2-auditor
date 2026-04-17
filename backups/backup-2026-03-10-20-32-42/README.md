# Shift2 Auditor Data Backup

**Export Date:** 2026-03-10T20:32:42.350Z
**Backup Name:** backup-2026-03-10-20-32-42

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (4 records)
- projects.csv (6 records)
- project_notes.csv (0 records)
- findings.csv (21 records)
- finding_urls.csv (0 records)
- finding_occurrences.csv (21 records)
- sample_items.csv (40 records)
- project_scope_urls.csv (70 records)
- crawler_results.csv (8470 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (179 records)
- quick_findings.csv (140 records)
- teams.csv (1 records)
- client_projects.csv (4 records)

## Import Instructions

**IMPORTANT: Always seed base data first!**

To restore this backup:

```bash
# 1. FIRST: Seed base data (WCAG criteria + research types)
npm run db:seed

# 2. THEN: Restore your project data
npm run restore backups/backup-2026-03-10-20-32-42
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
