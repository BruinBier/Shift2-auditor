-- De 62 verouderde rijen uit _prisma_migrations verwijderen.
--
-- Waarom: na het baselinen staan er nog twee mappen op schijf, maar 64 rijen in
-- de database. `prisma migrate status` klaagt daar niet over (die kijkt alleen of
-- alles op schijf is toegepast, niet andersom), maar `migrate dev` speelt de hele
-- lijst na op een schaduwdatabase -- en dat is precies wat blijft stuklopen.
-- Zeven van deze rijen zijn bovendien mislukte migraties met rolled_back_at.
--
-- Wat dit NIET doet: het raakt geen enkele tabel met gegevens. `_prisma_migrations`
-- is Prisma's eigen administratie van welke migraties gedraaid hebben.
--
-- De twee baseline-rijen blijven staan; die horen bij wat er op schijf ligt.

BEGIN;

-- Eerst kijken. Dit hoort 62 te zeggen.
SELECT count(*) AS te_verwijderen
FROM _prisma_migrations
WHERE migration_name NOT IN ('20260901000000_baseline', '20260901000001_baseline_seed');

DELETE FROM _prisma_migrations
WHERE migration_name NOT IN ('20260901000000_baseline', '20260901000001_baseline_seed');

-- En daarna. Dit hoort 2 te zeggen.
SELECT count(*) AS blijft_over FROM _prisma_migrations;

COMMIT;
