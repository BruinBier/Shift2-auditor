-- Beoordeling per steekproefitem per succescriterium.
-- Zonder deze tabel is een overgeslagen criterium onzichtbaar: CriterionAssessment legt de
-- status per project vast en zegt niets over de vraag of pagina 7 op 2.4.6 is nagelopen.

CREATE TYPE "SampleCheckStatus" AS ENUM ('voldoet', 'afgekeurd', 'opmerking', 'niet_aanwezig', 'niet_te_bepalen');
CREATE TYPE "SampleCheckBron" AS ENUM ('workflow', 'gesprek', 'handmatig');
CREATE TYPE "SampleCheckAkkoord" AS ENUM ('voorgesteld', 'akkoord', 'afgewezen');

CREATE TABLE "sample_criterion_checks" (
    "id" TEXT NOT NULL,
    "sample_item_id" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "status" "SampleCheckStatus" NOT NULL,
    "reden" TEXT,
    "bron" "SampleCheckBron" NOT NULL DEFAULT 'workflow',
    "akkoord" "SampleCheckAkkoord",
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_criterion_checks_pkey" PRIMARY KEY ("id")
);

-- Eén regel per sample x criterium: een nieuwe audit overschrijft de vorige beoordeling.
CREATE UNIQUE INDEX "sample_criterion_checks_sample_item_id_wcag_criterion_id_key"
    ON "sample_criterion_checks"("sample_item_id", "wcag_criterion_id");

ALTER TABLE "sample_criterion_checks"
    ADD CONSTRAINT "sample_criterion_checks_sample_item_id_fkey"
    FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sample_criterion_checks"
    ADD CONSTRAINT "sample_criterion_checks_wcag_criterion_id_fkey"
    FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
