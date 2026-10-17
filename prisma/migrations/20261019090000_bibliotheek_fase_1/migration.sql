-- Patronenbibliotheek fase 1 (docs/bibliotheek/SPEC.md).
-- Alleen nieuwe typen en tabellen (bibliotheek_*); bestaande tabellen worden niet aangeraakt.
-- Gegenereerd met prisma migrate diff tussen het oude en het nieuwe schemabestand, zonder database.

-- CreateEnum
CREATE TYPE "Oordeel" AS ENUM ('afkeur', 'geen-afkeur', 'advies', 'twijfel');

-- CreateEnum
CREATE TYPE "Herkomst" AS ENUM ('template', 'content', 'configuratie', 'extern');

-- CreateEnum
CREATE TYPE "WcagVersie" AS ENUM ('2.0', '2.1', '2.2');

-- CreateEnum
CREATE TYPE "PatroonStatus" AS ENUM ('concept', 'vastgesteld');

-- CreateEnum
CREATE TYPE "BronStatus" AS ENUM ('gevonden', 'gedownload', 'verwerkt');

-- CreateEnum
CREATE TYPE "Rapportvorm" AS ENUM ('pdf', 'online');

-- CreateEnum
CREATE TYPE "Overeenstemming" AS ENUM ('eens', 'ander-criterium', 'te-streng', 'te-soepel');

-- CreateTable
CREATE TABLE "bibliotheek_patronen" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "omschrijving" TEXT NOT NULL DEFAULT '',
    "criteria" TEXT[],
    "oordeel" "Oordeel" NOT NULL,
    "onderbouwing" TEXT NOT NULL DEFAULT '',
    "technieken" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "herkomst" "Herkomst" NOT NULL,
    "wcag" "WcagVersie"[],
    "standaard_tekst" TEXT NOT NULL DEFAULT '',
    "advies" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PatroonStatus" NOT NULL DEFAULT 'concept',
    "vastgesteld_door" TEXT,
    "vastgesteld_op" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_patronen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliotheek_casussen" (
    "id" TEXT NOT NULL,
    "patroon_id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT,
    "js" TEXT,
    "correcte_code" TEXT NOT NULL DEFAULT '',
    "uitleg" TEXT NOT NULL DEFAULT '',
    "is_valkuil" BOOLEAN NOT NULL DEFAULT false,
    "oefensets" TEXT[],
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_casussen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliotheek_oefensets" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "pagina_css" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_oefensets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliotheek_auditors" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "rapportvorm" "Rapportvorm" NOT NULL,
    "rapport_overzicht" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_auditors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliotheek_bronnen" (
    "id" TEXT NOT NULL,
    "organisatie" TEXT NOT NULL,
    "onderdeel" TEXT NOT NULL DEFAULT '',
    "auditor_id" TEXT,
    "auditor_zeker" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT '',
    "wcag" "WcagVersie"[] DEFAULT ARRAY[]::"WcagVersie"[],
    "datum" TEXT,
    "url" TEXT NOT NULL DEFAULT '',
    "bestand" TEXT,
    "hoofdsite" BOOLEAN NOT NULL DEFAULT false,
    "cms" TEXT,
    "vertrouwelijk" BOOLEAN NOT NULL DEFAULT false,
    "status" "BronStatus" NOT NULL DEFAULT 'gevonden',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_bronnen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliotheek_rapportbevindingen" (
    "id" TEXT NOT NULL,
    "bron_id" TEXT NOT NULL,
    "patroon_id" TEXT NOT NULL,
    "casus_id" TEXT,
    "rapport_criteria" TEXT[],
    "rapport_oordeel" "Oordeel" NOT NULL,
    "rapport_samenvatting" TEXT,
    "shift2_samenvatting" TEXT,
    "citaat" TEXT NOT NULL DEFAULT '',
    "pagina" TEXT,
    "overeenstemming" "Overeenstemming" NOT NULL,
    "overeenstemming_handmatig" BOOLEAN NOT NULL DEFAULT false,
    "toelichting" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_rapportbevindingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliotheek_afbeeldingen" (
    "naam" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliotheek_afbeeldingen_pkey" PRIMARY KEY ("naam")
);

-- CreateIndex
CREATE INDEX "bibliotheek_patronen_status_idx" ON "bibliotheek_patronen"("status");

-- CreateIndex
CREATE INDEX "bibliotheek_casussen_patroon_id_idx" ON "bibliotheek_casussen"("patroon_id");

-- CreateIndex
CREATE INDEX "bibliotheek_bronnen_auditor_id_idx" ON "bibliotheek_bronnen"("auditor_id");

-- CreateIndex
CREATE INDEX "bibliotheek_rapportbevindingen_bron_id_idx" ON "bibliotheek_rapportbevindingen"("bron_id");

-- CreateIndex
CREATE INDEX "bibliotheek_rapportbevindingen_patroon_id_idx" ON "bibliotheek_rapportbevindingen"("patroon_id");

-- AddForeignKey
ALTER TABLE "bibliotheek_casussen" ADD CONSTRAINT "bibliotheek_casussen_patroon_id_fkey" FOREIGN KEY ("patroon_id") REFERENCES "bibliotheek_patronen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibliotheek_bronnen" ADD CONSTRAINT "bibliotheek_bronnen_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "bibliotheek_auditors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibliotheek_rapportbevindingen" ADD CONSTRAINT "bibliotheek_rapportbevindingen_bron_id_fkey" FOREIGN KEY ("bron_id") REFERENCES "bibliotheek_bronnen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibliotheek_rapportbevindingen" ADD CONSTRAINT "bibliotheek_rapportbevindingen_patroon_id_fkey" FOREIGN KEY ("patroon_id") REFERENCES "bibliotheek_patronen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibliotheek_rapportbevindingen" ADD CONSTRAINT "bibliotheek_rapportbevindingen_casus_id_fkey" FOREIGN KEY ("casus_id") REFERENCES "bibliotheek_casussen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

