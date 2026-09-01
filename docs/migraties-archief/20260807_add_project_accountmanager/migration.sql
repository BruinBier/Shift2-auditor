-- De accountmanager per onderzoek vastleggen. Stond alleen op de
-- opdrachtgever, waardoor een afwijkende sales bij één onderzoek ook alle
-- andere onderzoeken van die klant zou wijzigen.

ALTER TABLE "projects" ADD COLUMN "accountmanager" TEXT;

-- Bestaande onderzoeken erven de accountmanager van hun opdrachtgever, zodat
-- het veld niet leeg begint.
UPDATE "projects" p
SET "accountmanager" = o."accountmanager"
FROM "client_projects" cp
JOIN "opdrachtgevers" o ON o."id" = cp."opdrachtgever_id"
WHERE p."client_project_id" = cp."id"
  AND o."accountmanager" IS NOT NULL;
