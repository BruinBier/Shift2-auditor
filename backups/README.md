# Shift2 Auditor Data Backups

This directory contains CSV backups of all application data. These backups are safe to commit to git for version control.

## Quick Start

### Create a Backup

```bash
npm run backup
```

This creates a new backup in `backups/backup-YYYY-MM-DD/` with all your data in CSV format.

### Restore a Backup

```bash
npm run restore backups/backup-2026-02-01
```

Replace `backup-2026-02-01` with the actual backup directory name.

## Why CSV Backups?

1. **Human Readable**: You can open CSV files in Excel/Sheets to inspect your data
2. **Git Friendly**: Text files work great with git version control
3. **Safe**: Backups are separate from your database, protecting against accidental data loss
4. **Portable**: Easy to share or move between systems

## Best Practices

### Before Making Database Changes

**ALWAYS create a backup first!**

```bash
npm run backup
git add backups/
git commit -m "Backup before schema migration"
```

### Regular Backups

Create backups:
- Before running `npx prisma migrate`
- Before running `npx prisma db push`
- After completing a major project
- Weekly (good habit!)

### After Creating a Backup

Commit it to git immediately:

```bash
git add backups/
git commit -m "Weekly backup $(date +%Y-%m-%d)"
git push
```

## Backup Contents

Each backup contains:

- `metadata.json` - Export information and record counts
- `README.md` - Backup-specific documentation
- `*.csv` files - All application data:
  - opdrachtgevers.csv - Client information
  - projects.csv - All projects
  - findings.csv - All findings
  - quick_findings.csv - Finding templates
  - sample_items.csv - Sample items for projects
  - project_scope_urls.csv - Scope URLs
  - crawler_results.csv - Crawler test results
  - ... and more

## Emergency Recovery

If you lose data:

1. **Find the latest backup** in this directory
2. **Stop the application** (kill the dev server)
3. **Restore the backup**:
   ```bash
   npm run restore backups/backup-YYYY-MM-DD
   ```
4. **Restart the application**
5. **Verify** that your data is back

## Automated Backups (Optional)

You can create a git hook to automatically backup before commits:

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run backup
git add backups/
```

## File Structure

```
backups/
├── README.md (this file)
├── backup-2026-02-01/
│   ├── metadata.json
│   ├── README.md
│   ├── projects.csv
│   ├── findings.csv
│   └── ...
├── backup-2026-02-08/
│   ├── metadata.json
│   ├── README.md
│   └── ...
└── ...
```

## Notes

- Backups include ALL data, including QuickFindings templates
- Foreign key relationships are preserved during import
- Existing records are skipped during import (no duplicates)
- Large backups (>100MB) may take a few minutes to restore

## Troubleshooting

**Import fails with "Foreign key constraint":**
- Make sure you're importing the correct backup
- Try running `npm run db:seed` first to restore WCAG criteria

**Backup is very large:**
- This is normal if you have many crawler results
- Consider cleaning old crawler results periodically
- Git handles text files efficiently

**Can't find backups directory:**
- Make sure you're in the project root
- Create it with: `mkdir backups`

## Support

For issues or questions, check the main project README or contact the development team.
