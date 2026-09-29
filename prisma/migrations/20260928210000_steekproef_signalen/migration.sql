-- Steekproefselectie v2, fase 4: semantische signalen.
-- Alleen een nieuwe tabel; bestaande tabellen blijven ongemoeid.

-- CreateTable
CREATE TABLE "pagina_signalen" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "sleutel" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "onderwerp_soort" TEXT NOT NULL,
    "vraag_id" TEXT NOT NULL,
    "vraag_versie" INTEGER NOT NULL,
    "aanbieder" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "antwoord" TEXT NOT NULL,
    "zekerheid" TEXT NOT NULL,
    "reden" TEXT,
    "content_hash" TEXT NOT NULL,
    "invoer" JSONB,
    "waarom" TEXT,
    "gemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagina_signalen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagina_signalen_project_id_vraag_id_idx" ON "pagina_signalen"("project_id", "vraag_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagina_signalen_project_id_sleutel_aanbieder_key" ON "pagina_signalen"("project_id", "sleutel", "aanbieder");

-- AddForeignKey
ALTER TABLE "pagina_signalen" ADD CONSTRAINT "pagina_signalen_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

