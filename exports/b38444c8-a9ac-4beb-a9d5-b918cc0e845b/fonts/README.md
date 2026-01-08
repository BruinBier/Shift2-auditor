# Shift2 Fonts

This folder should contain the custom Shift2 fonts.

## Required Files

### Neulis Sans (for body text)
- `neulis-sans-regular.woff2`
- `neulis-sans-regular.woff`

### Brookmans (for headings)
- `brookmans-regular.woff2`
- `brookmans-regular.woff`

## Current Status

The font configuration has been added to:
- `/app/globals.css` - @font-face declarations
- `/tailwind.config.ts` - Font family utilities

Once the font files are added to this directory, they will be automatically loaded.

## File Formats

- `.woff2` - Primary format (best compression, modern browsers)
- `.woff` - Fallback format (older browser support)
