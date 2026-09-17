-- PAC-uitvoer wordt meervoud: een eigen tabel in plaats van twee velden op sample_items.
--
-- Eén bestand was te weinig. De werkafspraak in Shift2_Werkwijze_PDF.md vraagt om het
-- Summary report PLUS een Detailed report per tabblad met Failed of Warning. Het Summary
-- geeft alleen tellingen ("158 fout"), en daaruit volgt geen bevinding: 158 ontbrekende
-- tekstalternatieven vragen een ander advies dan 158 verkeerd getagde decoratieve
-- afbeeldingen. Met één veld verving de tweede afdruk de eerste en raakte juist het
-- detailscherm kwijt.
--
-- `label` zegt welk PAC-scherm het is. Vrije tekst en geen enum: PAC's tabbladen
-- verschillen per versie, en een agent moet kunnen lezen wát hij voor zich heeft.

CREATE TABLE "pac_rapporten" (
    "id" TEXT NOT NULL,
    "sample_item_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pac_rapporten_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pac_rapporten_sample_item_id_idx" ON "pac_rapporten"("sample_item_id");

ALTER TABLE "pac_rapporten" ADD CONSTRAINT "pac_rapporten_sample_item_id_fkey"
    FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Wat er al geplakt is, verhuist mee. Op ZOET-01 stond hier het Summary report van
-- Bijlage 2; dat opnieuw laten maken zou werk weggooien dat al gedaan is.
INSERT INTO "pac_rapporten" ("id", "sample_item_id", "file_name", "file_type", "file_size", "file_path", "label", "created_at")
SELECT
    gen_random_uuid()::text,
    "id",
    regexp_replace("pac_rapport_path", '^.*/', ''),
    CASE WHEN "pac_rapport_path" ILIKE '%.pdf' THEN 'application/pdf'
         WHEN "pac_rapport_path" ILIKE '%.png' THEN 'image/png'
         WHEN "pac_rapport_path" ILIKE '%.webp' THEN 'image/webp'
         ELSE 'image/jpeg' END,
    0,
    "pac_rapport_path",
    NULL,
    COALESCE("pac_rapport_op", CURRENT_TIMESTAMP)
FROM "sample_items"
WHERE "pac_rapport_path" IS NOT NULL;

ALTER TABLE "sample_items" DROP COLUMN "pac_rapport_path";
ALTER TABLE "sample_items" DROP COLUMN "pac_rapport_op";
