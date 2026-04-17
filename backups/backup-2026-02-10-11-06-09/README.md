# Shift2 Auditor Data Backup

**Export Date:** 2026-02-10T11:06:09.153Z
**Backup Name:** backup-2026-02-10-11-06-09

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (2 records)
- projects.csv (2 records)
- project_notes.csv (0 records)
- findings.csv (8 records)
- finding_urls.csv (1 records)
- finding_occurrences.csv (7 records)
- sample_items.csv (17 records)
- project_scope_urls.csv (42 records)
- crawler_results.csv (5467 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (55 records)
- quick_findings.csv (27 records)
- teams.csv (1 records)
- client_projects.csv (2 records)

## Import Instructions

**IMPORTANT: Always seed base data first!**

To restore this backup:

```bash
# 1. FIRST: Seed base data (WCAG criteria + research types)
npm run db:seed

# 2. THEN: Restore your project data
npm run restore backups/backup-2026-02-10-11-06-09
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
