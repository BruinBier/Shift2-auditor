# Het stappenplan van 1 september — en waar het faalde

Dit is het plan zoals het toen luidde, bewaard omdat een volgende poging ervan
kan leren. **Volg het niet zonder de aanvullingen onderaan.**

## De stappen die zijn uitgevoerd

1. `powershell -File scripts/baseline-archiveren.ps1` — verplaatste de 53 oude
   migratiemappen en negen losse `.sql` naar het archief. Ging goed; raakt de
   database niet.
2. Overgeslagen: de vergelijking database-tegen-migraties, want er was geen
   tweede lege database voor de schaduwdatabase.
3. `npx prisma migrate resolve --applied 20260901000000_baseline` en hetzelfde
   voor `20260901000001_baseline_seed`. Beide meldden "marked as applied".
4. `npx prisma migrate status` → "Database schema is up to date!"

Na stap 4 bleek `public` nog maar één tabel te bevatten: `_prisma_migrations`.
Alle andere waren verdwenen.

## Wat er fout was aan dit plan

**Er was geen verse backup gemaakt.** Het plan stelde: "Er is op geen enkel
moment data in gevaar." Dat was een garantie die niet te geven viel — ze berustte
op een redenering over wat `migrate resolve` doet, niet op een controle. De
laatste backup was van de dag ervoor.

Dat het toch goed afliep, kwam door Neon point-in-time restore, en dat was geluk:
het account is Free met een venster van zes uur, en het droppen werd binnen dat
venster opgemerkt.

**Stap 2 werd overgeslagen.** Juist die stap zou hebben laten zien of de baseline
klopte tegen de werkelijke database.

## Voor een volgende poging

- Begin met `npm run backup`, en controleer dat de CSV's rijen bevatten.
- Maak in Neon een tweede, lege database voor de schaduwdatabase, zodat stap 2
  wél kan.
- Zoek eerst uit wat er de vorige keer heeft gedropt. Zie LEESMIJ.md een map
  hoger: `migrate resolve` was het aantoonbaar niet.
- Doe het aan het begin van een werkdag, zodat het herstelvenster van zes uur
  niet halverwege afloopt.
