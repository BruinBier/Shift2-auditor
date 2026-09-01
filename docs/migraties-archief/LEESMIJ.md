# Oude migratiegeschiedenis (gearchiveerd 1 september 2026)

**De baseline is op 1 september 2026 alsnog geslaagd.** `prisma/migrations` bevat
nu twee migraties, `_prisma_migrations` twee rijen, en `migrate diff` tussen
database en schema levert een lege migratie op. De geschiedenis speelt weer na.

De 53 migraties in deze map zijn niet meer na te spelen en staan hier voor
naslag; Prisma kijkt er niet meer naar. `opruimen-prisma-migrations.sql` is de
DELETE waarmee hun rijen uit `_prisma_migrations` zijn gehaald.

Bij de eerste poging, eerder die dag, raakte de database leeg. Alles is hersteld
met Neon point-in-time restore; er is geen data verloren. Hoe dat kwam staat
hieronder, en de vangrail ertegen is `scripts/veilige-shadow-url.js`.

## Wat er mis was aan de oude geschiedenis

- De eerste migratie (`20250127_add_research_type_explanations`) wijzigde
  `wcag_criteria`, een tabel die pas in `20260108191113` werd aangemaakt.
- Tien tabellen stonden in geen enkele migratie: `opdrachtgevers`,
  `client_projects`, `research_types`, `research_type_wcag_criteria`,
  `quick_findings`, `crawler_results`, `crawler_runs`, `project_notes`,
  `finding_urls`, `finding_attachments`.
- Twintig kolommen ontbraken eveneens, waaronder `projects.kenmerk` en
  `projects.status`.
- Zeven rijen in `_prisma_migrations` waren mislukte migraties met
  `rolled_back_at` gevuld.
- `20260210_remove_quick_findings` en `20260210_restore_quick_findings` stonden
  wel in de database maar niet meer op schijf.

Daardoor liep `prisma migrate dev` stuk op de schaduwdatabase en bood aan de
database te **resetten**. Dat is nu verholpen.

## Wat de database heeft geleegd

Gevonden in de npm-logs, in de map `npm-cache/_logs` onder %LOCALAPPDATA%. Om 13:23:03 UTC:

```
prisma migrate diff --from-schema-datasource prisma/schema.prisma
  --to-migrations prisma/migrations
  --shadow-database-url postgresql://...@ep-morning-recipe-aslm45jd.../neondb --script
```

`--to-migrations` speelt de migraties af op de **schaduwdatabase**, en Prisma
**leegt die eerst**. Daar stond de productiedatabase in: het adres was uit `.env`
gehaald met `grep -m1 '^SHADOW_DATABASE_URL\|^DATABASE_URL'`, en omdat er geen
`SHADOW_DATABASE_URL` bestond, viel grep stilzwijgend terug op `DATABASE_URL`.

Het commando faalde daarna alsnog op de kapotte geschiedenis (P3006, "the
underlying table for model wcag_criteria does not exist"). Die foutmelding leek
te gaan over de migraties, maar de database was op dat moment al leeg.

Vijf minuten later leek `prisma migrate resolve` de dader, omdat dat het eerste
commando was dat daarna draaide. Dat was het niet: beide rijen hadden
`applied_steps_count = 0`.

De npm-logs van 13:18 tot 13:29 bevatten verder alleen `migrate diff`, `status`
en `resolve` - geen `db push`, geen `reset`.

## Wat er blijvend geldt

1. **Een backup vóór elke stap die de database raakt** (`npm run backup`), en
   controleren dat er rijen in staan. Dit is de stap die op 1 september ontbrak.
2. **Nooit `--shadow-database-url` vullen met een adres uit `.env`.** Een
   schaduwdatabase is een aparte, lege database die Prisma **leegt**. Bestaat
   die niet, sla de controle dan over - draai hem niet met een andere URL.
   `scripts/veilige-shadow-url.js` breekt af als de twee samenvallen; gebruik
   dat script overal waar een shadow-URL wordt doorgegeven.
3. **`npm run db:push` is uitgeschakeld.** `prisma db push` synchroniseert het
   schema rechtstreeks en kan tabellen verwijderen. Wie het echt nodig heeft,
   draait `npx prisma db push` met de hand en weet dan wat hij doet.
4. Neon-history is 6 uur op dit Free-account. Dat venster is klein; doe
   databasewerk aan het begin van een dag, zodat er tijd is om te herstellen.
