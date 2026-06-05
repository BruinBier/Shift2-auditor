# Shift2 Auditor Data Backup

**Export Date:** 2026-06-03T14:35:02.338Z
**Backup Name:** backup-2026-06-03-14-35-01

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (11 records)
- projects.csv (23 records)
- project_notes.csv (0 records)
- findings.csv (372 records)
- finding_urls.csv (0 records)
- finding_occurrences.csv (392 records)
- sample_items.csv (258 records)
- project_scope_urls.csv (328 records)
- crawler_results.csv (35240 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (623 records)
- quick_findings.csv (125 records)
- teams.csv (1 records)
- client_projects.csv (15 records)

## Import Instructions

**IMPORTANT: Always seed base data first!**

To restore this backup:

```bash
# 1. FIRST: Seed base data (WCAG criteria + research types)
npm run db:seed

# 2. THEN: Restore your project data
npm run restore backups/backup-2026-06-03-14-35-01
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
