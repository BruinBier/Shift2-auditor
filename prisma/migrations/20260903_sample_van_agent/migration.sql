-- Onthoudt dat een sample door een agent is voorgesteld, ook nadat de onderzoeker
-- hem heeft goedgekeurd.
--
-- Zonder deze kolom staan "goedgekeurd voorstel" en "zelf ingevoerd" allebei op
-- voorgesteld=false, en zegt een vinkje op de steekproef-tab dus niets.
ALTER TABLE "sample_items" ADD COLUMN "van_agent" BOOLEAN NOT NULL DEFAULT false;

-- Wat nu nog openstaat als voorstel, kwam per definitie van een agent.
UPDATE "sample_items" SET "van_agent" = true WHERE "voorgesteld" = true;

-- En de zes van ZOET-01 (bo.zoetermeer.nl), de eerste steekproef die zo is
-- samengesteld. Die waren op het moment van deze migratie al goedgekeurd, dus de
-- regel hierboven slaat ze over. Ze staan er wel als voorstel in gezet.
UPDATE "sample_items" SET "van_agent" = true
WHERE "project_id" = 'f4bda4cd-7ff9-48dc-833a-256327fbc8f5';
