# Shift2 Auditor Data Backup

**Export Date:** 2026-04-23T19:50:19.986Z
**Backup Name:** backup-2026-04-23-19-50-19

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (8 records)
- projects.csv (16 records)
- project_notes.csv (0 records)
- findings.csv (151 records)
- finding_urls.csv (0 records)
- finding_occurrences.csv (151 records)
- sample_items.csv (104 records)
- project_scope_urls.csv (169 records)
- crawler_results.csv (18920 records)
- crawler_runs.csv (0 records)
- criterion_assessments.csv (353 records)
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
npm run restore backups/backup-2026-04-23-19-50-19
```

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
