-- Urenlogboek: wat er in de urenapp is geschreven, als doorzoekbaar overzicht.
-- Alleen een nieuwe tabel; bestaande tabellen blijven ongemoeid.

-- CreateTable
CREATE TABLE "urenregels" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "datum" DATE NOT NULL,
    "uren" DOUBLE PRECISION NOT NULL,
    "omschrijving" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urenregels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "urenregels_datum_idx" ON "urenregels"("datum");

-- CreateIndex
CREATE INDEX "urenregels_project_id_idx" ON "urenregels"("project_id");

-- AddForeignKey
ALTER TABLE "urenregels" ADD CONSTRAINT "urenregels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
