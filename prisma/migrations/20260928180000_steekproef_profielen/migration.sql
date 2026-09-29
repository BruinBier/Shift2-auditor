-- Steekproefselectie v2, fase 2: paginaprofielen (browsermeting).
-- Alleen nieuwe tabellen; bestaande tabellen blijven ongemoeid.

-- CreateTable
CREATE TABLE "steekproef_profielruns" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "inventaris_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'bezig',
    "config" JSONB,
    "versies" JSONB,
    "browser" TEXT,
    "uitleg" JSONB,
    "samenvatting" JSONB,
    "gestart_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "klaar_op" TIMESTAMP(3),

    CONSTRAINT "steekproef_profielruns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagina_profielen" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "url_norm" TEXT NOT NULL,
    "soort" TEXT NOT NULL,
    "redenen" TEXT[],
    "laag" TEXT,
    "status" TEXT NOT NULL,
    "fout" TEXT,
    "statisch" JSONB,
    "eind_url" TEXT,
    "titel" TEXT,
    "browser" TEXT,
    "omgeleid" BOOLEAN,
    "gehydrateerd" BOOLEAN,
    "cookiescherm" JSONB,
    "dichtgeklapt" INTEGER,
    "bereik" TEXT,
    "html_taal" TEXT,
    "kenmerken" JSONB,
    "gebieden" JSONB,
    "document" JSONB,
    "schermafdruk" TEXT,
    "duur_ms" INTEGER,
    "gemeten_op" TIMESTAMP(3),

    CONSTRAINT "pagina_profielen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "steekproef_profielruns_project_id_gestart_op_idx" ON "steekproef_profielruns"("project_id", "gestart_op");

-- CreateIndex
CREATE INDEX "pagina_profielen_run_id_soort_idx" ON "pagina_profielen"("run_id", "soort");

-- AddForeignKey
ALTER TABLE "steekproef_profielruns" ADD CONSTRAINT "steekproef_profielruns_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steekproef_profielruns" ADD CONSTRAINT "steekproef_profielruns_inventaris_id_fkey" FOREIGN KEY ("inventaris_id") REFERENCES "steekproef_inventarissen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagina_profielen" ADD CONSTRAINT "pagina_profielen_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "steekproef_profielruns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

