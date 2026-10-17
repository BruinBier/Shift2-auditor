# Opdracht voor Claude Code: fase 1

Lees eerst `CLAUDE.md` en `ARCHITECTURE.md` in de
hoofdmap, daarna `docs/bibliotheek/SPEC.md` helemaal.
Bekijk daarna de prototypes in `docs/bibliotheek/prototypes/`
en de data in `docs/bibliotheek/seed-bibliotheek.json`.

Bouw alleen **fase 1** (Bibliotheek en oefenen):

1. Onderzoek eerst hoe deze app is opgebouwd: routing,
   opslag, componenten, stijl. Sluit daarop aan.
2. Maak een kort plan en leg dat aan mij voor
   voordat je code schrijft. Noem welke open vragen
   uit SPEC.md je nu nodig hebt.
3. Prisma-modellen + migratie + seed-script in `scripts/`
   dat `seed-bibliotheek.json` importeert (69 patronen, 78 casussen,
   5 auditors, 84 bronnen, 30 rapportbevindingen).
4. Patronenbibliotheek en patroondetail met casuseditor.
5. Oefenmodus `/oefenen/:set` in een sandboxed iframe,
   gedrag zoals de prototypes.
6. Tests voor de acceptatiecriteria van fase 1.

Regels:
- Backup eerst, altijd: een branch scheidt alleen de
  code, niet de gedeelde Neon-database. Volgorde
  (SPEC.md, besluit 9): Frits draait `npm run backup`
  en Claude controleert dat de CSV's rijen hebben →
  Claude vraagt of de dev-server gestopt is en schrijft
  schema en migratie → Frits draait
  `npm run schema:update` → pas dan het seed-script.
  Op de tweede computer na `git pull` ook
  `npm run schema:update`.
- Werk voor de code op branch
  `claude/bibliotheek-fase-1` (besluit 10).
- Werk in kleine stappen en commit per stap.
- Verander geen bestaande functionaliteit zonder
  het te vragen.
- Oordelen in de seed zijn voorstellen: niet
  aanpassen, alleen importeren.
- Codeblokken in documentatie: korte regels.
