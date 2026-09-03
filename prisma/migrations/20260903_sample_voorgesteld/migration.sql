-- Markeert een sample die door een agent is voorgesteld en nog niet is nagekeken.
--
-- Bestaande samples krijgen `false`: die zijn door de onderzoeker zelf ingevoerd.
-- Alleen wat de steekproef-workflow aanmaakt komt op `true` te staan.
ALTER TABLE "sample_items" ADD COLUMN "voorgesteld" BOOLEAN NOT NULL DEFAULT false;
