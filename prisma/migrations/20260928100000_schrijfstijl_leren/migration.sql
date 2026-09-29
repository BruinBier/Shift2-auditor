-- Leren van correcties op bevindingen. Zie writing/FRITS-WRITING-WORKFLOW.md.
--
-- Alleen toevoegingen: twee lege kolommen op findings en een nieuwe tabel. Er verandert
-- en verdwijnt niets aan bestaande gegevens.
--
-- ai_description en ai_advice: de tekst zoals Claude hem schreef. Gevuld bij het aanmaken
-- via de audit-CLI en daarna nooit meer bijgewerkt. Bestaande bevindingen blijven leeg: van
-- die bevindingen is niet meer te zien wat de oorspronkelijke tekst was, en die wordt niet
-- verzonnen.

-- AlterTable
ALTER TABLE "findings" ADD COLUMN     "ai_advice" TEXT,
ADD COLUMN     "ai_description" TEXT;

-- CreateTable
CREATE TABLE "schrijfcorrecties" (
    "id" TEXT NOT NULL,
    "bron" TEXT NOT NULL DEFAULT 'bevinding',
    "finding_id" TEXT,
    "criterium_code" TEXT,
    "origineel_description" TEXT NOT NULL,
    "origineel_advice" TEXT NOT NULL,
    "bewerkt_description" TEXT NOT NULL,
    "bewerkt_advice" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'te_analyseren',
    "analyse" JSONB,
    "wijziging_id" TEXT,
    "ingediend_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geanalyseerd_op" TIMESTAMP(3),
    "beslist_op" TIMESTAMP(3),

    CONSTRAINT "schrijfcorrecties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schrijfcorrecties_status_idx" ON "schrijfcorrecties"("status");

-- AddForeignKey
ALTER TABLE "schrijfcorrecties" ADD CONSTRAINT "schrijfcorrecties_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
