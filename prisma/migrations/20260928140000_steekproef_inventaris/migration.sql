-- Steekproefselectie v2, fase 1: kandidateninventarisatie.
-- Alleen nieuwe tabellen; bestaande tabellen blijven ongemoeid.

-- CreateTable
CREATE TABLE "steekproef_inventarissen" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'bezig',
    "start_url" TEXT NOT NULL,
    "canon_host" TEXT,
    "invoer" JSONB,
    "versies" JSONB,
    "instellingen" JSONB,
    "sitemap" JSONB,
    "uitsluitregels" JSONB,
    "externe_hosts" JSONB,
    "samenvatting" JSONB,
    "pool_hash" TEXT,
    "kandidaten_hash" TEXT,
    "fout" TEXT,
    "gestart_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "klaar_op" TIMESTAMP(3),

    CONSTRAINT "steekproef_inventarissen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventaris_kandidaten" (
    "id" TEXT NOT NULL,
    "inventaris_id" TEXT NOT NULL,
    "url_norm" TEXT NOT NULL,
    "soort" TEXT NOT NULL,
    "document_soort" TEXT,
    "bronnen" TEXT[],
    "status" TEXT NOT NULL,
    "reden" TEXT,
    "dubbel_van" TEXT,
    "http_status" INTEGER,
    "content_type" TEXT,
    "eind_url" TEXT,
    "titel" TEXT,
    "canonical" TEXT,
    "taal" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "grootte" INTEGER,
    "aanwijzingen" JSONB,
    "gevonden_op" TEXT[],
    "varianten" TEXT[],
    "ingrepen" TEXT[],
    "diepte" INTEGER NOT NULL,
    "waarschuwing" TEXT,

    CONSTRAINT "inventaris_kandidaten_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "steekproef_inventarissen_project_id_gestart_op_idx" ON "steekproef_inventarissen"("project_id", "gestart_op");

-- CreateIndex
CREATE INDEX "inventaris_kandidaten_inventaris_id_status_idx" ON "inventaris_kandidaten"("inventaris_id", "status");

-- AddForeignKey
ALTER TABLE "steekproef_inventarissen" ADD CONSTRAINT "steekproef_inventarissen_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventaris_kandidaten" ADD CONSTRAINT "inventaris_kandidaten_inventaris_id_fkey" FOREIGN KEY ("inventaris_id") REFERENCES "steekproef_inventarissen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

