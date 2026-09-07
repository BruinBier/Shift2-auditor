-- Twee links naar het onderzoek in het portaal van het uitvoerende bureau.
--
-- De volledige URL en niet alleen het nummer: bij Cardan draagt de intakepagina een ander
-- nummer dan het onderzoek zelf, dus er valt niets af te leiden.
ALTER TABLE "projects" ADD COLUMN "cardan_intake_url" TEXT;
ALTER TABLE "projects" ADD COLUMN "cardan_onderzoek_url" TEXT;
