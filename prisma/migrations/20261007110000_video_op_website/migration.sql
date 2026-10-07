-- Video A2-gemeenten: staat de video op de website, en op welke pagina?
-- NULL = nog niet vastgesteld. Alleen kolommen erbij; er verandert of verdwijnt niets.
ALTER TABLE "videos" ADD COLUMN "op_website" BOOLEAN;
ALTER TABLE "videos" ADD COLUMN "website_url" TEXT;
