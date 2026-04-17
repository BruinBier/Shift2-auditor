# Shift2 Auditor Data Backup

**Export Date:** 2026-03-27T17:34:02.772Z
**Backup Name:** backup-2026-03-27-17-34-02

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (7 records)
- projects.csv (14 records)
- project_notes.csv (0 records)
- findings.csv (47 records)
- finding_urls.csv (0 records)
- finding_occurrences.csv (52 records)
- sample_items.csv (33 records)
- project_scope_urls.csv (28 records)
- crawler_results.csv (2600 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (353 records)
- quick_findings.csv (111 records)
- teams.csv (1 records)
- client_projects.csv (11 records)

## Import Instructions

**IMPORTANT: Always seed base data first!**

To restore this backup:

```bash
# 1. FIRST: Seed base data (WCAG criteria + research types)
npm run db:seed

# 2. THEN: Restore your project data
npm run restore backups/backup-2026-03-27-17-34-02
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
