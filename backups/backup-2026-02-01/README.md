# Shift2 Auditor Data Backup

**Export Date:** 2026-02-01T16:21:42.651Z

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (1 records)
- projects.csv (0 records)
- project_notes.csv (0 records)
- findings.csv (0 records)
- finding_urls.csv (0 records)
- finding_occurrences.csv (0 records)
- sample_items.csv (0 records)
- project_scope_urls.csv (0 records)
- crawler_results.csv (0 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (0 records)
- quick_findings.csv (10 records)
- teams.csv (0 records)
- client_projects.csv (1 records)

## Import Instructions

To restore this backup:

```bash
npm run import-data backups/backup-2026-02-01
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
