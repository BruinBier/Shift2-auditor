-- Bespreekpunten voor het klantgesprek, per onderzoek.
--
-- Een vraag die je de klant nog moet stellen stond tot nu toe in Projectdetails of in een
-- notitie, en geen van beide komt ergens als actie terug. Bij WAAL-02 stond de vraag over
-- een DigiD-testomgeving in Projectdetails, met een klantgesprek op maandag 14 september
-- 2026 waar hij ter sprake moest komen. Een bespreekpunt heeft een datum "besproken op":
-- leeg is open, gevuld is afgehandeld, en niets wordt verwijderd, zodat later terug te
-- vinden is wat er wanneer met de klant is afgestemd.

CREATE TABLE "bespreekpunten" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "besproken_op" TIMESTAMP(3),
    "uitkomst" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bespreekpunten_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bespreekpunten_project_id_idx" ON "bespreekpunten"("project_id");

ALTER TABLE "bespreekpunten" ADD CONSTRAINT "bespreekpunten_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
