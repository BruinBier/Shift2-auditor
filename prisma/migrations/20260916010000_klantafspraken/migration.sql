-- Wat er uit een gesprek met de klant kwam en waar je later op terugkomt.
--
-- Stond eerst als bespreekpunt in dezelfde lijst. Een bespreekpunt is een vraag die je
-- nog moet stellen; een afspraak is het antwoord waar iemand mee aan de slag gaat. Op
-- een hoop telde het dashboard lopende afspraken mee als openstaande vragen.
--
-- Bestaande bespreekpunten blijven staan waar ze staan: verhuizen is een keuze per punt
-- en niet iets wat een migratie hoort te beslissen.
CREATE TABLE "klantafspraken" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "wie" TEXT,
    "uiterlijk" TIMESTAMP(3),
    "afgesproken_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nagekomen_op" TIMESTAMP(3),
    "uitkomst" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "klantafspraken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "klantafspraken_project_id_idx" ON "klantafspraken"("project_id");

ALTER TABLE "klantafspraken" ADD CONSTRAINT "klantafspraken_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
